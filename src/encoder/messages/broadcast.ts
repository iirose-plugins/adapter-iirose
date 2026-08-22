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
    v: 0,
  };
  return `~${JSON.stringify(data)}`;
};
