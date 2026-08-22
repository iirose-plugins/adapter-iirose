/**
 * 将用户加入黑名单
 * @param username 用户名
 * @param time 持续时间
 * @param intro 原因 (可选)
 * @returns {string}
 */
export default (username: string, time: string, intro?: string) =>
{
  return `!h4["4","${username}","${time}","${intro || 'undefined'}"]`;
};

/**
 * 查询黑名单列表
 * 发送: !h4["3"]
 * 收到: a2username>$uid>expireAt>intro
 */
export const blackListQuery = (): string =>
{
  return '!h4["3"]';
};

/**
 * 移除黑名单
 * 发送: !h4["1","0_uid"]
 */
export const blackListRemove = (uid: string): string =>
{
  return `!h4["1","0_${uid}"]`;
};

/**
 * 清空黑名单
 * 发送: !h4["2"]
 */
export const blackListClear = (): string =>
{
  return '!h4["2"]';
};
