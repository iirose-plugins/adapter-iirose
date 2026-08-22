/**
 * 解析余额信息
 * @param message 消息
 * @returns {number | null}
 */
export const parseBalance = (message: string): number | null =>
{
  if (message.startsWith('`$'))
  {
    const balance = parseFloat(message.substring(2));
    if (!isNaN(balance))
    {
      return balance;
    }
  }
  return null;
};
