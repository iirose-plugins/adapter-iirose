export const MAX_USER_QUERY_PREFIX = 'am6';
export const MAX_USER_SET_ACK_PREFIX = '_~)6';
export const MAX_GUEST_QUERY_PREFIX = 'am7';
export const MAX_GUEST_SET_ACK_PREFIX = '_~)7';
export const MIN_IMPRESSION_QUERY_PREFIX = 'am8';
export const MIN_IMPRESSION_SET_ACK_PREFIX = '_~)8';

export interface RoomLimitValue
{
  limit: number | null;
}

const parseLimitValue = (raw: string): number | null =>
{
  return raw ? Number(raw) : null;
};

const parseRoomLimit = (
  message: string,
  queryPrefix: string,
  setAckPrefix: string,
): RoomLimitValue | undefined =>
{
  if (message.startsWith(queryPrefix))
  {
    return { limit: parseLimitValue(message.slice(queryPrefix.length)) };
  }

  if (message.startsWith(setAckPrefix))
  {
    return { limit: parseLimitValue(message.slice(setAckPrefix.length)) };
  }
};

/**
 * 解析房间最大人数回执
 */
export const parseMaxUserLimit = (message: string): RoomLimitValue | undefined =>
{
  return parseRoomLimit(message, MAX_USER_QUERY_PREFIX, MAX_USER_SET_ACK_PREFIX);
};

/**
 * 解析房间最大游客人数回执
 */
export const parseMaxGuestLimit = (message: string): RoomLimitValue | undefined =>
{
  return parseRoomLimit(message, MAX_GUEST_QUERY_PREFIX, MAX_GUEST_SET_ACK_PREFIX);
};

/**
 * 解析房间最低印象门槛回执
 */
export const parseMinImpressionLimit = (message: string): RoomLimitValue | undefined =>
{
  return parseRoomLimit(message, MIN_IMPRESSION_QUERY_PREFIX, MIN_IMPRESSION_SET_ACK_PREFIX);
};
