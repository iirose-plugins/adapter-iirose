/**
 * 发送全站广播
 * @param message 广播内容
 * @param color 颜色
 * @returns {string}
 */
export default (message: string, color: string) =>
{
  const data = {
    t: message,
    c: color,
  };
  return `~${JSON.stringify(data)}`;
};
