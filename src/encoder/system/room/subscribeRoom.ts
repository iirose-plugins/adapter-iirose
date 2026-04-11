/**
 * 订阅房间
 * @param roomId 房间ID
 * @returns {string}
 */
export default (roomId: string): string =>
{
  return `=^v$1${roomId}`;
};
