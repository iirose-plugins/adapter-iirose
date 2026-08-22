import { IIROSE_Bot } from '../../../../bot/bot';

export interface BankCallback
{
  total: number;
  income: number;
  deposit: number;
  interestRate: [number, number];
  balance: number;
}

/**
 * 解析银行回调信息
 * @param message 消息
 * @param bot bot实例
 * @returns {BankCallback | undefined}
 */
export const bankCallback = (message: string, bot: IIROSE_Bot) =>
{
  if (message.substring(0, 2) === '>$')
  {
    const tmp = message.substring(2).split('"');
    const data: BankCallback = {
      total: Number(tmp[0]),
      income: Number(tmp[1]),
      deposit: Number(tmp[3].split(' ')[0]),
      interestRate: [Number(tmp[5].split(' ')[0]), Number(tmp[5].split(' ')[1])],
      balance: Number(tmp[4]),
    };

    bot.handleBankUpdate(data);
    // BankCallback
    return data;
  }
};
