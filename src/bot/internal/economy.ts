import type { Internal } from './base';
import { sleep } from 'koishi';
import { IIROSE_WSsend } from '../../utils/ws';
import { stockGet, stockBuy, stockSell } from '../../encoder/system/consume/stock';
import { bankGet, bankDeposit, bankWithdraw } from '../../encoder/system/consume/bank';
import getBalanceFunction from '../../encoder/user/getBalance';
import payment, { parsePaymentCallback, PaymentCallback } from '../../encoder/user/payment';
import { parseBalance } from '../../decoder/messages/user/consume/Balance';
import { Stock, stock as parseStock } from '../../decoder/messages/system/consume/Stock';
import { BankCallback, bankCallback as parseBankCallback } from '../../decoder/messages/system/consume/BankCallback';

export const economyMethods = {
  stockBuy(this: Internal, numberData: number)
  {
    IIROSE_WSsend(this.bot, stockBuy(numberData));
  },

  stockSell(this: Internal, numberData: number)
  {
    IIROSE_WSsend(this.bot, stockSell(numberData));
  },

  async stockGet(this: Internal): Promise<Stock | null>
  {
    // 登录握手期间 socket 可能还不存在或处于 CONNECTING：
    // sendAndWaitForResponse 会立即失败（不再白等一个超时），所以这里短等后重试一次。
    for (let attempt = 0; attempt < 2; attempt++)
    {
      const response = await this.bot.sendAndWaitForResponse(stockGet(), '>', false);
      if (response)
      {
        const parsed = parseStock(response, this.bot);
        if (!parsed) this.bot.loggerWarn('[stockGet] 股价回包无法解析:', JSON.stringify(response));
        return parsed ?? null;
      }

      const skipReason = this.bot.lastResponseSkipReason;
      if (attempt === 0 && skipReason)
      {
        await sleep(500);
        continue;
      }

      this.bot.loggerWarn(`[stockGet] 未取得股价回包（${skipReason ?? 'timeout'}）`);
      return null;
    }
    return null;
  },

  async bankGet(this: Internal): Promise<BankCallback | null>
  {
    const response = await this.bot.sendAndWaitForResponse(bankGet(), '>$', true);
    if (response)
    {
      return parseBankCallback(response, this.bot) || null;
    }
    return null;
  },

  bankDeposit(this: Internal, amount: number)
  {
    IIROSE_WSsend(this.bot, bankDeposit(amount));
  },

  bankWithdraw(this: Internal, amount: number)
  {
    IIROSE_WSsend(this.bot, bankWithdraw(amount));
  },

  async payment(this: Internal, uid: string, money: number, message?: string): Promise<PaymentCallback | null>
  {
    const data = (message) ? payment(uid, money, message) : payment(uid, money);
    const response = await this.bot.sendAndWaitForResponse(data, '|$', true);
    if (response)
    {
      return parsePaymentCallback(response);
    }
    return null;
  },

  async getBalance(this: Internal): Promise<number | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getBalanceFunction(), '`$', true);
    if (response)
    {
      return parseBalance(response);
    }
    return null;
  },
};
