import { h } from 'koishi';
import { IIROSE_Bot } from '../bot/bot';

export async function clearMsg(msg: string, bot: IIROSE_Bot)
{
  // 处理 markdown 元素：移除开头的 `\\\\\\*\n` 前缀
  // 处理 markdown 元素：移除开头的 `&#092;&#092;&#092;*\n` (即 \\\*\n) 前缀
  // IIROSE 发送的原始消息中，反斜杠被编码为 HTML 实体
  msg = msg.replace(/^(?:&#092;){3}\*\n\s*/, '');

  // 处理 a 元素：移除开头的反斜杠
  msg = msg.replace(/\\(https*:\/\/[\s\S]+)/g, '$1');

  // 优先处理历史遗留的图片格式 `[url#e]`，将其转换为裸链接
  msg = msg.replace(/\[((https*:\/\/[\s\S]+?\.(png|jpg|jpeg|gif))(#e)*)\]/g, '$1');

  async function replaceAsync(str: string, regex: RegExp, asyncFn: (...args: any[]) => Promise<string>)
  {
    const promises: Promise<string>[] = [];
    str.replace(regex, (...args) =>
    {
      promises.push(asyncFn(...args));
      return '';
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift()!);
  }

  // 处理图片 (同步)
  const imageUrlRegex = /((?:https?:\/\/[\s\S]+?)\.(?:png|jpg|jpeg|gif)(?:#e)?)/g;
  msg = msg.replace(imageUrlRegex, (match) =>
  {
    const cleanUrl = match.replace(/#e$/, '');
    return h.image(cleanUrl).toString();
  });

  // 处理音频 (同步)
  const audioUrlRegex = /((?:https?:\/\/[\s\S]+?)\.weba)/g;
  msg = msg.replace(audioUrlRegex, (match) =>
  {
    // 将 .weba 结尾的链接转换为 audio 元素
    return h.audio(match).toString();
  });

  // 处理视频 (同步)
  const videoUrlRegex = /\[((?:https?:\/\/[\s\S]+?)\.(?:mp4|webm|ogg))\]/g;
  msg = msg.replace(videoUrlRegex, (match, url) =>
  {
    // 将 [url.mp4] 格式转换为 video 元素
    return h.video(url).toString();
  });

  // 处理 at-by-name (异步)
  // 消耗前后空格，但将空格捕获以便在替换时放回
  // 匹配一个或多个前导空格，以便在消息开头正确处理 at
  const atNameRegex = /(\s+)((?:\[\*[\s\S]+?\*\])+)(\s)/g;
  msg = await replaceAsync(msg, atNameRegex, async (raw, space1, mentionBlock, space2, offset, originalString) =>
  {
    const name = mentionBlock.slice(2, -2);
    const isMultiBlock = mentionBlock.lastIndexOf('[*') > 0;

    const user = await bot.internal.getUserByName(name);
    // 如果 at 元素位于消息开头（或只由空格开头），则不保留前面的空格
    const leadingSpace = (offset === 0 || originalString.substring(0, offset).trim() === '') ? '' : space1;

    if (user)
    {
      return `${leadingSpace}${h('at', { id: user.id, name }).toString()}${space2}`;
    }
    else if (isMultiBlock)
    {
      return `${leadingSpace}${h('at', { id: 'error', name }).toString()}${space2}`;
    }
    return raw;
  });

  // 处理 at-by-id (异步)
  const atIdRegex = /(\s+)((?:\[@[\s\S]+?@\])+)(\s)/g;
  msg = await replaceAsync(msg, atIdRegex, async (raw, space1, mentionBlock, space2, offset, originalString) =>
  {
    const id = mentionBlock.slice(2, -2);
    const isMultiBlock = mentionBlock.lastIndexOf('[@') > 0;

    const user = await bot.getUser(id);
    // 如果 at 元素位于消息开头（或只由空格开头），则不保留前面的空格
    const leadingSpace = (offset === 0 || originalString.substring(0, offset).trim() === '') ? '' : space1;

    if (user)
    {
      return `${leadingSpace}${h('at', { id, name: user.name }).toString()}${space2}`;
    }
    else if (isMultiBlock)
    {
      return `${leadingSpace}${h('at', { id: 'error', name: id }).toString()}${space2}`;
    }
    return raw;
  });

  // 处理 sharp 元素（提及频道）
  const sharpRegex = /(\s+)((?:\[_[\s\S]+?_\])+)(\s)/g;
  msg = await replaceAsync(msg, sharpRegex, async (raw, space1, mentionBlock, space2, offset, originalString) =>
  {
    // 如果 sharp 元素位于消息开头（或只由空格开头），则不保留前面的空格
    const leadingSpace = (offset === 0 || originalString.substring(0, offset).trim() === '') ? '' : space1;
    const channelId = mentionBlock.slice(2, -2);
    // 移除频道ID末尾的下划线
    const cleanChannelId = channelId.replace(/_+$/, '');
    return `${leadingSpace}${h('sharp', { id: cleanChannelId }).toString()}${space2}`;
  });

  return msg;
}
