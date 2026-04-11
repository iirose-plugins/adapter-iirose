/**
 * 点踩用户
 * @param uid 用户UID
 * @param message 附带消息 (可选)
 * @returns {string}
 */
export default (uid: string, message: string = '') =>
{
  // 点踩功能
  let data = `+!${uid}`;
  if (message)
  {
    data += ` ${message}`;
  }
  return data;
};
