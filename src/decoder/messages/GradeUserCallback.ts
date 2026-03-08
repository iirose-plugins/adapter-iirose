export interface GradeUserCallback
{
  score: number;
  multiplier: number;
}

/**
 * 解析用户评分回调
 * @param message 消息
 * @returns {GradeUserCallback | null}
 */
export const parseGradeUserCallback = (message: string): GradeUserCallback | null =>
{
  if (message.startsWith('|_'))
  {
    const parts = message.substring(2).split('#');
    if (parts.length === 2)
    {
      const score = parseInt(parts[0], 10);
      const multiplier = parseFloat(parts[1]);
      if (!isNaN(score) && !isNaN(multiplier))
      {
        return { score, multiplier };
      }
    }
  }
  return null;
};
