export const MEDIA_POSITION_RESPONSE_PREFIX = ',';
export const MEDIA_NO_MEDIA_RESPONSE = '_~P';

/**
 * 解析媒体跳转/快进快退回执
 * 成功: ,<秒数>
 * 无媒体: _~P
 */
export const parseMediaPosition = (message: string): number | null =>
{
  if (!message || message === MEDIA_NO_MEDIA_RESPONSE) return null;
  if (!message.startsWith(MEDIA_POSITION_RESPONSE_PREFIX)) return null;

  const position = Number(message.slice(1));
  return Number.isFinite(position) ? position : null;
};

/**
 * 判断切歌/媒体控制是否收到成功回执
 */
export const isMediaSuccess = (message: string): boolean =>
{
  return message === MEDIA_POSITION_RESPONSE_PREFIX;
};
