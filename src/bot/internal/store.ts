import type { Internal } from './base';
import getStoreFunction from '../../encoder/system/store/getStore';
import getSellerCenterFunction from '../../encoder/system/store/getSellerCenter';
import addToCartFunction from '../../encoder/system/store/personal/addToCart';
import removeFromCartFunction from '../../encoder/system/store/personal/removeFromCart';
import getFavoritesFunction from '../../encoder/system/store/personal/getFavorites';
import getFollowedStoresFunction from '../../encoder/system/store/personal/getFollowedStores';
import getPendingPaymentOrdersFunction from '../../encoder/system/store/personal/orders/getPendingPaymentOrders';
import getPendingReceiptOrdersFunction from '../../encoder/system/store/personal/orders/getPendingReceiptOrders';
import getPendingConfirmationOrdersFunction from '../../encoder/system/store/personal/orders/getPendingConfirmationOrders';
import getPendingReviewOrdersFunction from '../../encoder/system/store/personal/orders/getPendingReviewOrders';
import getCompletedOrdersFunction from '../../encoder/system/store/personal/orders/getCompletedOrders';
import getAfterSaleOrdersFunction from '../../encoder/system/store/personal/orders/getAfterSaleOrders';
import { Store, parseStore } from '../../decoder/messages/system/store/Store';
import { SellerCenter, parseSellerCenter } from '../../decoder/messages/system/store/SellerCenter';

export const storeMethods = {
  async getStore(this: Internal): Promise<Store | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getStoreFunction(), 'g-', true);
    if (response)
    {
      return parseStore(response);
    }
    return null;
  },

  async getSellerCenter(this: Internal): Promise<SellerCenter | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getSellerCenterFunction(), 'g+', true);
    if (response)
    {
      return parseSellerCenter(response);
    }
    return null;
  },

  async addToCart(this: Internal, itemId: string): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(addToCartFunction(itemId), 'gc', true);
    return response === 'gc';
  },

  async removeFromCart(this: Internal, itemId: string): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(removeFromCartFunction(itemId), 'gc', true);
    return response === 'gc';
  },

  async getPendingPaymentOrders(this: Internal): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingPaymentOrdersFunction(), 'gu0', true);
  },

  async getPendingReceiptOrders(this: Internal): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingReceiptOrdersFunction(), 'gu1', true);
  },

  async getPendingConfirmationOrders(this: Internal): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingConfirmationOrdersFunction(), 'gu2', true);
  },

  async getPendingReviewOrders(this: Internal): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingReviewOrdersFunction(), 'gu3', true);
  },

  async getCompletedOrders(this: Internal): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getCompletedOrdersFunction(), 'gu4', true);
  },

  async getAfterSaleOrders(this: Internal): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getAfterSaleOrdersFunction(), 'gu5', true);
  },

  async getFavorites(this: Internal): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getFavoritesFunction(), 'g&', true);
  },

  async getFollowedStores(this: Internal): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getFollowedStoresFunction(), 'g@', true);
  },
};
