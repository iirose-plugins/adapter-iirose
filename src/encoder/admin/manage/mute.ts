/**
 * 禁言用户
 * @param type 禁言类型: 'chat' (聊天), 'music' (点歌), 'all' (聊天和点歌)
 * @param username 用户名
 * @param time 持续时间
 * @param intro 原因
 * @returns {string}
 */
export default (type: 'chat' | 'music' | 'all', username: string, time: string, intro: string) =>
{
  const typeMap: any = {
    chat: '41',
    music: '42',
    all: '43',
  };

  return `!h3["${typeMap[type]}","${username}","${time}","${intro}"]`;
};

/**
 * 查询禁言列表
 * 发送: !h3["3"]
 * 收到: a2username>$uid>expireAt>intro>type
 */
export const muteList = (): string =>
{
  return '!h3["3"]';
};

/**
 * 解除禁言
 * 发送: !h3["1","0_uid"]
 * 收到: q#roomId>type
 */
export const unmute = (uid: string): string =>
{
  return `!h3["1","0_${uid}"]`;
};

/**
 * 清空禁言列表
 * 发送: !h3["2"]
 * 收到: q#roomId>type、_~F、_~*
 */
export const clearMuteList = (): string =>
{
  return '!h3["2"]';
};
