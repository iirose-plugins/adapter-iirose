import { IIROSE_Bot } from '../../../../bot/bot';

export interface Stock
{
  unitPrice: number;
  totalStock: number;
  personalStock: number;
  totalMoney: number;
  personalMoney: number;
}

/**
 * 解析股票信息
 * @param message 消息
 * @param bot bot实例
 * @returns {Stock | null}
 */
export const stock = (message: string, bot: IIROSE_Bot) =>
{
  if (message.substring(0, 1) === '>')
  {
    const list = message.substring(1).split('>')[0].split('"');
    if (list.length === 5)
    {

      const data: Stock = {
        unitPrice: Number(Number(list[2]).toFixed(4)),
        totalStock: Number(list[0]),
        personalStock: Number(list[3]),
        totalMoney: Number(Number(list[1]).toFixed(4)),
        personalMoney: Number(list[4]),
      };

      bot.handleStockUpdate(data);
      return (data);
    }
    return null;
  }
};
