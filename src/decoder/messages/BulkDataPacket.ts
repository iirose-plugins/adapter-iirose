import { h } from 'koishi';
import { IIROSE_Bot } from '../../bot/bot';
import { parseAvatar, writeWJ } from '../../utils/utils';
import { stockGet } from '../../encoder/system/consume/stock';
import { bankGet } from '../../encoder/system/consume/bank';

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
  background?: string;
  rooms?: string[];
}

/**
 * 解析包含大量数据的包 (如用户列表、房间列表)
 * @param message 消息
 * @param bot bot实例
 * @returns {Promise<UserList[] | undefined>}
 */
export const bulkDataPacket = async (message: string, bot: IIROSE_Bot): Promise<UserList[] | undefined> =>
{
  // 检查消息是否为大包数据
  if (message.startsWith('%'))
  {
    if (bot.config.debugMode)
    {
      await writeWJ(bot, 'wsdata/message.log', message);
    }

    // 移除起始标记 %*"
    const rawData = message.substring(3);

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

        // 解析背景和简介
        if (rawDescField.startsWith('s://') || rawDescField.startsWith('://'))
        {
          const firstSpaceIndex = rawDescField.indexOf(' ');
          const protocol = rawDescField.startsWith('s://') ? 'https' : 'http';

          if (firstSpaceIndex !== -1)
          {
            const urlPart = rawDescField.substring(rawDescField.startsWith('s://') ? 4 : 3, firstSpaceIndex);
            background = `${protocol}://${urlPart}`;
            description = rawDescField.substring(firstSpaceIndex + 1).split('&&')[0].trim();
          } else
          {
            const urlPart = rawDescField.substring(rawDescField.startsWith('s://') ? 4 : 3);
            background = `${protocol}://${urlPart}`;
          }
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
          if (item.id && item.name)
          { // 判断是房间对象
            roomMap.set(item.id, item);
          } else if (typeof item === 'object' && item !== null)
          { // 判断是嵌套的层级
            collectRooms(item);
          }
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

    // 缓存用户列表
    if (userList.length > 0)
    {
      await writeWJ(bot, 'wsdata/userlist.json', userList);
    }

    // 缓存房间列表
    if (Object.keys(roomList).length > 0)
    {
      await writeWJ(bot, 'wsdata/roomlist.json', roomList);
    }

    // 触发一次股价查询
    bot.sendAndWaitForResponse(stockGet(), '>', false);

    // 触发一次银行信息查询
    bot.sendAndWaitForResponse(bankGet(), '>$', false);

    // 异步更新机器人自身信息
    (async () =>
    {
      try
      {
        const self = await bot.getSelf();
        if (self)
        {
          bot.user.name = self.name;
          bot.user.avatar = self.avatar;
          bot.selfId = self.id;
          bot.userId = self.id;
        } else
        {
          bot.loggerWarn('更新机器人信息失败，未能从 userlist.json 中找到自身数据。请稍后重试。');
        }
      } catch (error)
      {
        bot.loggerError('更新机器人信息时出错:', error);
      }
    })();

    // 返回用户列表
    return userList;
  }
};
