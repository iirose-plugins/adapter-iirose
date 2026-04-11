/**
 * 获取用户动态
 * @param uid 用户UID
 * @returns {string}
 */
export default function getUserMomentsByUid(uid: string): string
{
  // 获取用户动态
  return `:*${uid}`;
};
