/**
 * 获取股票信息
 * @returns {string}
 */
export const stockGet = (): string =>
{
  return '>#';
};

/**
 * 购买股票
 * @param quantity 购买数量
 * @returns {string}
 */
export const stockBuy = (quantity: number): string =>
{
  return `>$${quantity}`;
};

/**
 * 出售股票
 * @param quantity 出售数量
 * @returns {string}
 */
export const stockSell = (quantity: number): string =>
{
  return `>@${quantity}`;
};
