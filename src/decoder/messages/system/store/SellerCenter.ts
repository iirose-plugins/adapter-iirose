export interface SellerCenter
{
  field1: number;
  field2: number;
  field3: number[];
  field4: number;
  field5: number;
}

/**
 * 解析卖家中心数据
 * @param message 消息
 * @returns {SellerCenter | null}
 */
export const parseSellerCenter = (message: string): SellerCenter | null =>
{
  if (!message.startsWith('g+'))
  {
    return null;
  }

  const parts = message.substring(2).split('>');
  const numbers = parts[1].split('#');

  if (numbers.length === 4)
  {
    const field3Parts = numbers[1].split(',');
    return {
      field1: parseInt(parts[0], 10),
      field2: parseInt(numbers[0], 10),
      field3: field3Parts.map(p => parseInt(p, 10)),
      field4: parseInt(numbers[2], 10),
      field5: parseInt(numbers[3], 10),
    };
  }

  return null;
};
