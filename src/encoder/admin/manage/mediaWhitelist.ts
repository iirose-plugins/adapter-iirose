/**
 * 查询“限制发言&点播”白名单
 * @returns {string}
 */
export const mediaWhitelistQuery = (): string =>
{
  return '!hw["3"]';
};

/**
 * 添加“限制发言&点播”白名单
 * @param username 用户名
 * @param duration 持续时间，例如 "1h"、"1d"
 * @param intro 备注
 * @returns {string}
 */
export const mediaWhitelistAdd = (username: string, duration: string, intro: string): string =>
{
  return `!hw["4","${username}","${duration}","${intro}"]`;
};

/**
 * 移除“限制发言&点播”白名单
 * @param uid 用户UID
 * @returns {string}
 */
export const mediaWhitelistRemove = (uid: string): string =>
{
  return `!hw["1","0_${uid}"]`;
};

/**
 * 清空当前房间“限制发言&点播”白名单
 * @returns {string}
 */
export const mediaWhitelistClear = (): string =>
{
  return '!hw["2"]';
};
