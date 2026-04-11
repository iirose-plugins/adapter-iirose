/**
 * 移动到指定房间
 * @param roomId 房间ID
 * @param password 房间密码 (可选)
 * @returns {string}
 */
export default (roomId: string, password?: string) =>
{
  return `m${roomId}${(password) ? '>' + password : ''}`;
};
