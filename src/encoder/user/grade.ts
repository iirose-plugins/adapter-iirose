/**
 * 为用户打分
 * @param uid 用户uid
 * @param score 分数
 * @returns {string}
 */
export const gradeUser = (uid: string, score: number): string =>
{
  return `+_*${uid} ${score}`;
};

/**
 * 取消为用户打分
 * @param uid 用户uid
 * @returns {string}
 */
export const cancelGradeUser = (uid: string): string =>
{
  return `+_*${uid} !`;
};
