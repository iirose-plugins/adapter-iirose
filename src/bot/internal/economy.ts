import type { Internal } from './base';
import { sleep } from 'koishi';
import { waitForResponse } from '../../utils/ws/response';
import { IIROSE_WSsend } from '../../utils/ws';
import { stockGet, stockBuy, stockSell } from '../../encoder/system/consume/stock';
import { bankGet, bankDeposit, bankWithdraw } from '../../encoder/system/consume/bank';
import getBalanceFunction from '../../encoder/user/getBalance';
import payment, { parsePaymentCallback, PaymentCallback } from '../../encoder/user/payment';
import { parseBalance } from '../../decoder/messages/user/consume/Balance';
import { Stock, isStockResponse, stock as parseStock } from '../../decoder/messages/system/consume/Stock';
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
    // 仅在连接暂不可用时重试一次。
    for (let attempt = 0; attempt < 2; attempt++)
    {
      const { data, reason } = await waitForResponse(this.bot, stockGet(), ['>'], {
        stopPropagation: false,
        matches: isStockResponse,
      });
      if (data) return parseStock(data, this.bot) ?? null;

      if (attempt === 0 && (reason === 'no-socket' || reason === 'connecting' || reason === 'closed'))
      {
        await sleep(500);
        continue;
      }

      this.bot.loggerWarn(`[stockGet] 未取得股价回包（${reason}）`);
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
