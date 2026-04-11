// 移除购物车
export default function removeFromCart(itemId: string): string
{
  return `gc-${itemId}`;
}
