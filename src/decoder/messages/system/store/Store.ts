export interface StoreItem
{
  id: string;
  image: string;
  name: string;
  unknown_0: string;
  unknown_1: string;
  description: string;
  tags: string;
  unknown_2: string;
  timestamp: string;
  unknown_3: string;
  price: string;
  color: string;
  type: string;
  owner: string;
  ownerData: string;
  unknown_4: string;
  unknown_5: string;
  unknown_6: string;
}

export interface Store
{
  items: StoreItem[];
}

/**
 * 解析商店数据
 * @param message 消息
 * @returns {Store | null}
 */
export const parseStore = (message: string): Store | null =>
{
  if (!message.startsWith('g-'))
  {
    return null;
  }

  const content = message.substring(2);
  if (!content) return { items: [] };

  const items: StoreItem[] = content.split('<').map(itemString =>
  {
    const parts = itemString.split('>');
    return {
      id: parts[0],
      image: parts[1],
      name: parts[2],
      unknown_0: parts[3],
      unknown_1: parts[4],
      description: parts[5],
      tags: parts[6],
      unknown_2: parts[7],
      timestamp: parts[8],
      unknown_3: parts[9],
      price: parts[10],
      color: parts[11],
      type: parts[12],
      owner: parts[13],
      ownerData: parts[14],
      unknown_4: parts[15],
      unknown_5: parts[16],
      unknown_6: parts[17],
    };
  });

  return { items };
};
