import { h } from 'koishi';
import { IIROSE_Bot } from '../../../../bot/bot';
import { DEFAULT_AVATAR, normalizeRoomImageUrl, parseAvatar, writeWJ } from '../../../../utils/utils';
import { stockGet } from '../../../../encoder/system/consume/stock';
import { bankGet } from '../../../../encoder/system/consume/bank';

export interface UserList
{
  avatar: string;
  username: string;
  color: string;
  room: string;
  uid: string;
}

export interface RoomInfo
{
  id: string;
  name: string;
  online: number;
  description: string;
  users: string[];
  avatar?: string;
  background?: string;
  rooms?: string[];
}

export interface RoomMusicState
{
  audioUrl: string;
  pageUrl: string;
  duration: number;
  name: string;
  artist: string;
  requester: string;
  requesterGender: string;
  cover: string;
  requesterAvatar: string;
  position: number;
  lyrics: string;
}

export interface RoomState
{
  raw: string;
  music?: RoomMusicState;
}

export interface BulkDataPacketResult
{
  userList: UserList[];
  roomList: Record<string, unknown>;
  roomState?: RoomState;
}

const parseProtocolUrl = (value: string): string =>
{
  if (value.startsWith('s://'))
  {
    return `https://${value.slice(4)}`;
  }
  // 旧数据里缺失协议头的地址统一补成 https
  if (value.startsWith('://'))
  {
    return `https://${value.slice(3)}`;
  }
  return value;
};

const parseRoomState = (raw: string): RoomState | undefined =>
{
  if (!raw) return undefined;

  const fields = raw.split('>');
  if (fields.length < 9)
  {
    return { raw };
  }

  const urls = fields[0].split(/\s+/);
  const audioUrl = urls[0] || '';
  const pageUrl = urls[1] || '';

  return {
    raw,
    music: {
      audioUrl: parseProtocolUrl(audioUrl.replace(/^%1/, '')),
      pageUrl: parseProtocolUrl(pageUrl),
      duration: Number(fields[1]) || 0,
      name: fields[2] || '',
      artist: (fields[3] || '').replace(/^@\d+/, ''),
      requester: fields[4] || '',
      requesterGender: fields[5] || '',
      cover: parseProtocolUrl(fields[6] || ''),
      requesterAvatar: fields[7] || '',
      position: Number(fields[8]) || 0,
      lyrics: fields[9] || '',
    },
  };
};

const ONLINE_USER_LIST_START = /^(?:https?:\/\/\S*\/|u2scenery\/|cartoon\/|anime\/|scenery\/|couple\/|female\/|male\/|s:\/\/)/i;

/** 判断是否为 r2 直接下发的在线用户列表（无 %* 大包前缀） */
const isOnlineUserListPacket = (message: string): boolean =>
  message.length > 500 && message.includes('<') && ONLINE_USER_LIST_START.test(message);

/** 解析 r2 直接下发的在线用户列表 */
const parseOnlineUserList = async (message: string, bot: IIROSE_Bot): Promise<BulkDataPacketResult | undefined> =>
{
  const raw = message.trim().replace(/^["']/, '').replace(/["']+$/, '');
  const userList: UserList[] = [];

  for (const segment of raw.split('<'))
  {
    if (!segment.trim()) continue;
    const fields = segment.split('>');
    if (fields.length < 9 || !fields[0].includes('/')) continue;

    userList.push({
      avatar: parseAvatar(fields[0]),
      username: h.unescape(fields[2]),
      color: fields[3],
      room: fields[4],
      uid: fields[8],
    });
  }

  if (userList.length > 0)
  {
    await writeWJ(bot, 'wsdata/userlist.json', userList);
    const self = userList.find(user => user.uid === bot.selfId || user.username === bot.config.usename);
    if (self && bot.user)
    {
      bot.user.name = self.username;
      bot.user.avatar = self.avatar;
    }
  }

  return { userList, roomList: {} };
};

/**
 * 解析包含大量数据的包 (如用户列表、房间列表)
 * @param message 消息
 * @param bot bot实例
 * @returns {Promise<BulkDataPacketResult | undefined>}
 */
export const bulkDataPacket = async (message: string, bot: IIROSE_Bot): Promise<BulkDataPacketResult | undefined> =>
{
  // 检查消息是否为大包数据
  if (message.startsWith('%'))
  {
    if (bot.config.debugMode)
    {
      void writeWJ(bot, 'wsdata/message.log', message);
    }

    let rawData: string;
    let roomState: RoomState | undefined;

    if (message.startsWith('%1'))
    {
      // 新版登录大包会在全员列表前附带房间状态，状态与列表之间用 "" 分隔
      const stateDelimiterIndex = message.search(/""(?:https?:\/\/|(?:cartoon|anime|scenery|couple|female)\/)/);
      const delimiterIndex = stateDelimiterIndex !== -1 ? stateDelimiterIndex : message.indexOf('""');
      if (delimiterIndex !== -1)
      {
        roomState = parseRoomState(message.slice(0, delimiterIndex));
        rawData = message.slice(delimiterIndex + 2);
      } else
      {
        rawData = message.slice(2);
      }
    } else
    {
      // 旧格式：移除起始标记 %*"
      rawData = message.startsWith('%*"') ? message.slice(3) : message.slice(1);
    }

    // 使用 \" 作为最高层级分隔符，将数据分割成主要部分
    // parts[0] 包含用户和频道列表
    // parts[1] 包含当前房间在线用户和历史消息
    // parts[2] 包含加载信息
    const parts = rawData.split('\\"');

    let userAndRoomDataRaw = parts[0];
    // 处理纯用户列表包末尾可能出现的多余单引号
    if (userAndRoomDataRaw.endsWith("'"))
    {
      userAndRoomDataRaw = userAndRoomDataRaw.slice(0, -1);
    }
    const userList: UserList[] = [];
    const roomList = {};

    // 用户和房间数据都由 '<' 分隔
    const segments = userAndRoomDataRaw.split('<');

    // 房间ID的正则表达式
    const roomIdRegex = /^(?=.*[a-f])([a-f0-9]{10,}_?)+$/;

    for (const segment of segments)
    {
      if (!segment.trim()) continue; // 跳过空的片段

      const fields = segment.split('>');
      const candidateId = fields[0];

      // 通过特征区分是用户还是房间
      // 房间ID是特定的长十六进制字符串
      if (roomIdRegex.test(candidateId))
      {
        // 解析频道
        const idPath = candidateId.split('_');
        const roomName = fields[1] || '';

        const rawDescField = fields[5] || '';
        let description = '';
        let background = '';

        // 解析背景和简介，IIROSE 房间头像位于 desc 字段开头的图片 URL
        const imageMatch = rawDescField.match(/^(?:(?:https?|s):\/\/|:\/\/|\/\/)\S+/);
        if (imageMatch)
        {
          const imageUrl = imageMatch[0];
          background = normalizeRoomImageUrl(imageUrl);
          description = rawDescField.slice(imageUrl.length).trim().split('&&')[0].trim();
        } else
        {
          description = rawDescField.split('&&')[0].trim();
        }

        // 构建层级房间结构
        let currentLevel = roomList;
        for (let j = 0; j < idPath.length - 1; j++)
        {
          const idPart = idPath[j];
          if (!currentLevel[idPart])
          {
            // 如果父房间不存在，则创建一个占位符
            currentLevel[idPart] = {};
          }
          currentLevel = currentLevel[idPart];
        }

        const finalId = idPath[idPath.length - 1];

        // 如果父级是一个房间对象 (currentLevel)，则将子房间ID添加到其 `rooms` 列表中
        if (idPath.length > 1)
        {
          const parent = currentLevel as RoomInfo; // 此时的 currentLevel 是父级容器
          if (!parent.rooms)
          {
            parent.rooms = [];
          }
          if (!parent.rooms.includes(finalId))
          {
            parent.rooms.push(finalId);
          }
        }

        // 创建或更新当前房间对象
        // 使用 ...currentLevel[finalId] 是为了保留可能已经存在的 rooms 字段
        currentLevel[finalId] = {
          ...currentLevel[finalId],
          id: finalId,
          name: roomName,
          description: description,
          background: background,
          avatar: background || DEFAULT_AVATAR,
          users: [], // 先置空，后续统一填充
          online: 0, // 先置空，后续统一计算
        };
      }
      // 用户的第一个字段是头像路径，包含'/'；而频道的第一个字段是ID，不可能包含'/'
      else if (fields[0].includes('/'))
      {
        // 解析用户
        userList.push({
          avatar: parseAvatar(fields[0]),
          username: h.unescape(fields[2]),
          color: fields[3],
          room: fields[4],
          uid: fields[8],
        });
      }
    }

    // iirose 的在线用户列表不包含机器人自身，手动补一条，保证 getUser/selfId 可用
    const loginObj = bot.wsClient?.loginObj;
    const loginUsername = loginObj?.n;
    let self = loginUsername ? userList.find(user => user.username === loginUsername) : undefined;
    if (!self && loginUsername)
    {
      self = {
        avatar: bot.config.smStart ? bot.config.smImage || '' : bot.user?.avatar || '',
        username: loginUsername,
        color: bot.config.smStart ? bot.config.smColor || '' : bot.config.color || '',
        room: loginObj?.r || bot.config.roomId,
        uid: loginObj?.uid || (bot.config.smStart ? bot.config.smUid : bot.config.uid) || bot.config.uid,
      };
      userList.push(self);
    }

    // 后处理：将用户关联到房间
    if (Object.keys(roomList).length > 0)
    {
      // 创建一个从房间ID到房间对象的映射，方便查找
      const roomMap = new Map<string, RoomInfo>();
      function collectRooms(level: object)
      {
        for (const key in level)
        {
          const item = level[key];
          if (!item || typeof item !== 'object') continue;

          if (item.id && item.name)
          { // 判断是房间对象
            roomMap.set(item.id, item);
          }
          collectRooms(item);
        }
      }
      collectRooms(roomList);

      // 遍历用户列表，更新房间的在线人数和用户列表
      for (const user of userList)
      {
        if (user.room && roomMap.has(user.room))
        {
          const room = roomMap.get(user.room);
          room.users.push(user.uid);
          room.online++;
        }
      }
    }

    // 缓存用户列表、房间列表和房间状态，独立文件并发写入
    const writeTasks: Promise<void>[] = [];
    if (userList.length > 0)
    {
      writeTasks.push(writeWJ(bot, 'wsdata/userlist.json', userList));
    }

    if (Object.keys(roomList).length > 0)
    {
      writeTasks.push(writeWJ(bot, 'wsdata/roomlist.json', roomList));
    }

    if (roomState)
    {
      writeTasks.push(writeWJ(bot, 'wsdata/roomState.json', roomState));
    }
    if (writeTasks.length > 0)
    {
      await Promise.all(writeTasks);
    }

    // 完整报文已写盘，唤醒正在等待刷新的 getGuild/getUser
    bot.onUserListUpdated();

    // 触发一次股价查询
    bot.sendAndWaitForResponse(stockGet(), '>', false);

    // 触发一次银行信息查询
    bot.sendAndWaitForResponse(bankGet(), '>$', false);

    // 更新机器人自身信息
    if (self)
    {
      bot.user.name = self.username;
      bot.user.avatar = self.avatar;
      bot.selfId = self.uid;
      bot.userId = self.uid;
    } else
    {
      const fallback = await bot.getSelf();
      bot.user.name = fallback.name;
      bot.user.avatar = fallback.avatar;
    }

    return {
      userList,
      roomList,
      roomState,
    };
  }

  // r2 可能直接下发在线用户列表，不经过 %* 大包前缀
  if (bot.awaitingUserListRefresh && isOnlineUserListPacket(message))
  {
    const result = await parseOnlineUserList(message, bot);
    bot.onUserListUpdated();
    return result;
  }
};
