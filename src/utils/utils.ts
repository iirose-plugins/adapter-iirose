import { Context, h } from 'koishi';
import { decode as unescapeHtml } from './entities';

import { clearMsg } from '../decoder/clearMsg';
import { IIROSE_Bot } from '../bot/bot';

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export const Unknown_User_Name: string = "Unknown User";
export const Unknown_Guild_Name: string = "Unknown Guild";
export const Unknown_Channel_Name: string = "Unknown Channel";

/**
 * 颜色转换函数：将rgba格式转换为十六进制格式
 * @param rgba - rgba格式的颜色字符串或十六进制格式的颜色字符串
 * @returns 六位十六进制格式的颜色字符串（不包含#）
 */
export function rgbaToHex(rgba: string): string
{
  // 如果已经是十六进制格式，直接返回
  if (/^[0-9a-fA-F]{6}$/.test(rgba))
  {
    return rgba;
  }

  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match)
  {
    return '66ccff'; // 默认颜色
  }

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  // 忽略alpha通道，只使用RGB

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `${rHex}${gHex}${bHex}`;
}

/**
 * 生成消息ID
 * @returns 12位随机字符串作为消息ID
 */
export function generateMessageId(): string
{
  return Math.random().toString().substring(2, 14);
}

/**
 * 解析用户头像URL
 * @param avatar 原始头像字符串
 * @returns {string} 完整的头像URL
 */
export const parseAvatar = (avatar: string): string =>
{
  if (!avatar) return '';
  if (avatar.startsWith('http'))
  {
    return avatar;
  }
  return `http://s.iirose.com/images/icon/${avatar}.jpg`;
};

export const startEventsServer = (bot: IIROSE_Bot) =>
{
  let event: (() => boolean)[] = [];


  // 发音频视频的果然还是直接sendMessage.ts里面改好...
  // system那边真的有东西有用吗
  // user也是！！
  // 摸了摸了))
  return event;
};

export const stopEventsServer = (event: (() => boolean)[]) =>
{
  event.forEach((element: () => boolean) =>
  {
    element();
  });
};

/**
 * 将数据写入到 wsdata 目录下的指定 JSON 文件中
 * @param bot IIROSE_Bot 实例
 * @param relativePath 文件路径 (例如 'wsdata/userlist.json')
 * @param data 要写入的数据对象
 */
export const writeWJ = async (bot: IIROSE_Bot, relativePath: string, data: any): Promise<void> =>
{
  try
  {
    const instanceDataDir = path.join(bot.ctx.baseDir, 'data', 'adapter-iirose', bot.config.uid.trim());
    const filePath = path.join(instanceDataDir, relativePath);

    // 确保目标目录存在
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    bot.logInfo(`[iirose-writeWJ] 数据已更新至: ${filePath}`);
  } catch (error)
  {
    bot.logger.error(`[iirose-writeWJ] 写入 ${relativePath} 失败:`, error);
  }
};

/**
 * 从实例的数据目录中安全地读取和解析JSON文件。
 * @param bot IIROSE_Bot 实例
 * @param filename 相对于实例数据目录的文件路径 (e.g., 'wsdata/userlist.json')
 * @returns 解析后的JSON数据，如果文件不存在或解析失败则返回 null
 */
export const readJsonData = async (bot: IIROSE_Bot, filename: string): Promise<any> =>
{
  try
  {
    const instanceDataDir = path.join(bot.ctx.baseDir, 'data', 'adapter-iirose', bot.config.uid.trim());
    const filePath = path.join(instanceDataDir, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error)
  {
    // 如果文件不存在，这是正常情况，不需要报错
    if (error.code === 'ENOENT')
    {
      return null;
    }
    // 其他错误（如JSON解析失败）则需要记录
    bot.logger.error(`[iirose-readJsonData] 读取或解析 ${filename} 失败:`, error);
    return null;
  }
};

/**
 * 在嵌套的房间数据中递归查找指定的房间。
 * @param guildData 嵌套的房间数据对象
 * @param roomId 要查找的房间ID
 * @returns 找到的房间信息对象，未找到则返回 null
 */
export const findRoomInGuild = (guildData: any, roomId: string): any =>
{
  if (!guildData || typeof guildData !== 'object')
  {
    return null;
  }

  for (const key in guildData)
  {
    const room = guildData[key];
    if (room && room.id === roomId)
    {
      return room;
    }
    // 如果当前值是一个对象，就递归进去查找
    if (typeof room === 'object')
    {
      const found = findRoomInGuild(room, roomId);
      if (found)
      {
        return found;
      }
    }
  }

  return null;
};

/**
 * 将一个社区（Guild）下的所有层级嵌套的房间扁平化为一个房间列表。
 * @param guildData 嵌套的房间数据对象
 * @returns 扁平化后的房间信息数组
 */
export const flattenRooms = (guildData: any): any[] =>
{
  const allRooms = [];

  function recurse(data: any)
  {
    if (!data || typeof data !== 'object')
    {
      return;
    }

    for (const key in data)
    {
      const room = data[key];
      // 检查一个对象是否是房间信息对象（有id和name属性）
      if (room && room.id && room.name)
      {
        allRooms.push(room);
      }
      // 如果当前值是一个对象，就递归进去
      if (typeof room === 'object')
      {
        recurse(room);
      }
    }
  }

  recurse(guildData);
  return allRooms;
};

/**
 * 根据用户 ID 从 userlist.json 查找用户名
 * @param bot IIROSE_Bot 实例
 * @param userId 用户 ID
 * @returns 匹配的用户名，如果找不到则返回 undefined
 */
export const findUserNameById = async (bot: IIROSE_Bot, userId: string): Promise<string | undefined> =>
{
  const userlist = await readJsonData(bot, 'wsdata/userlist.json');
  if (!userlist) return undefined;

  const user = userlist.find(u => u.uid === userId);
  return user ? user.username : undefined;
};

/**
 * 根据用户名从 userlist.json 查找用户 ID
 * @param bot IIROSE_Bot 实例
 * @param username 用户名
 * @returns 匹配的用户 ID，如果找不到则返回 undefined
 */
export const findUserIdByName = async (bot: IIROSE_Bot, username: string): Promise<string | undefined> =>
{
  const userlist = await readJsonData(bot, 'wsdata/userlist.json');
  if (!userlist) return undefined;

  const user = userlist.find(u => u.username === username);
  return user ? user.uid : undefined;
};

export async function getMediaMetadata(url: string, ctx: Context)
{
  try
  {
    const { data, type } = await ctx.http.file(url);
    const buffer = Buffer.from(data);
    const musicMetadata = await import('music-metadata');
    const metadata = await musicMetadata.parseBuffer(buffer, type, { duration: true });
    const { common, format } = metadata;

    return {
      title: common.title || ['未知', '佚名', '欸~', '无名', '不敢相信自己的小耳朵', '欸~~', '插件么有给我歌曲名字欸'][Math.floor(Math.random() * 7)],
      artist: common.artist || ['未知', '佚名', '欸~', '无名', '不敢相信自己的小耳朵', '欸~~', '插件么有给我音乐家的名字欸'][Math.floor(Math.random() * 7)],
      album: common.album || ['群星', '佚名', '欸~', '无名', '不敢相信自己的小耳朵', '欸~~', '插件么有给我专辑的名字欸'][Math.floor(Math.random() * 7)],
      duration: format.duration || 0,
      bitrate: format.bitrate || 0,
      picture: common.picture?.[0] ? {
        format: common.picture[0].format,
        data: Buffer.from(common.picture[0].data).toString('base64') // 如果你想用作封面图
      } : 'https://www.loliapi.com/acg/'
    };
  } catch (error)
  {
    ctx.logger('iirose').warn(`获取媒体元数据失败: ${url}`, error);
    return {
      title: ['未知', '佚名', '欸~', '无名', '不敢相信自己的小耳朵', '欸~~', '插件么有给我歌曲名字欸'][Math.floor(Math.random() * 7)],
      artist: ['未知', '佚名', '欸~', '无名', '不敢相信自己的小耳朵', '欸~~', '插件么有给我音乐家的名字欸'][Math.floor(Math.random() * 7)],
      album: ['群星', '佚名', '欸~', '无名', '不敢相信自己的小耳朵', '欸~~', '插件么有给我专辑的名字欸'][Math.floor(Math.random() * 7)],
      duration: 0,
      bitrate: 0,
      picture: 'https://www.loliapi.com/acg/'
    };
  }
}

/**
 * @description 缓存发出的消息
 * @param bot bot实例
 * @param channelId 频道id
 * @param messageId 消息id
 * @param content 消息内容
 */
export async function cacheSentMessage(bot: IIROSE_Bot, channelId: string, messageId: string, content: string): Promise<void>
{
  if (!bot.sessionCache) return;

  // 缓存前也需要对消息进行处理
  const processedContent = await clearMsg(content, bot);

  const event: any = {
    type: 'message',
    platform: 'iirose',
    selfId: bot.selfId,
    timestamp: Date.now(),
    user: {
      id: bot.user.id,
      name: bot.user.name,
      avatar: parseAvatar(bot.user.avatar),
    },
    message: {
      id: messageId,
      messageId: messageId,
      content: processedContent,
      elements: h.parse(processedContent),
    },
    channel: {
      id: channelId,
      type: channelId.startsWith('private:') ? 1 : 0,
    },
  };

  if (!channelId.startsWith('private:'))
  {
    event.guild = { id: channelId };
  }

  const session = bot.session(event);
  bot.sessionCache.add(session);
}

/**
 * 确保在添加内容前有换行符
 * 用于图文消息里的图片和文字之间的换行
 */
export function ensureNewlineBefore(text: string): string
{
  if (text.length > 0 && !text.endsWith('\n'))
  {
    return text + '\n';
  }
  return text;
}

/**
 * 获取图片并将其转换为Base64编码的Data URI
 * @param bot IIROSE_Bot 实例
 * @param url 图片的URL
 * @returns 返回一个Promise，解析为Base64编码的Data URI字符串，或在失败时返回null
 */
export async function getImageAsBase64(bot: IIROSE_Bot, url: string): Promise<string | null>
{
  if (!url) return null;

  try
  {
    const { data, type } = await bot.ctx.http.file(url);

    const buffer = Buffer.from(data);
    const base64 = buffer.toString('base64');

    const mimeType = type || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error)
  {
    bot.logger.warn(`获取或转换图片失败: ${url}`, error);
    return null;
  }
}

/**
 * 安全地转换媒体元素URL。
 * @param bot IIROSE_Bot 实例
 * @param elementString 媒体元素的字符串表示，例如 `<img src="..."/>`
 * @returns 转换后的 URL。如果转换失败或 assets 服务不可用，则返回 null。
 */
export async function transformUrl(bot: IIROSE_Bot, elementString: string): Promise<string | null>
{
  // 检查 assets 服务是否存在
  if (!bot.ctx.assets)
  {
    bot.loggerWarn('Assets service is not available, skipping transformation.');
    return null;
  }

  try
  {
    const transformedContent = await bot.ctx.assets.transform(elementString);
    // 从转存后的内容中提取 URL
    const urlMatch = transformedContent.match(/src="([^"]+)"/);
    if (urlMatch && urlMatch[1])
    {
      return unescapeHtml(urlMatch[1]);
    } else
    {
      bot.loggerWarn(`Could not extract URL from transformed content: ${transformedContent}`);
      return null;
    }
  } catch (error)
  {
    bot.loggerError('Asset transformation failed:', error);
    return null;
  }
}