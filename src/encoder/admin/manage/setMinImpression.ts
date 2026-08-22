/**
 * 查询房间最低印象门槛
 * 发送: !h8["0"]
 * 收到: am8 或 am8<分数>
 */
export const minImpressionQuery = (): string =>
{
  return '!h8["0"]';
};

/**
 * 设置房间最低印象门槛
 * 发送: !h8["1<分数>"]
 * 收到: _~)8<分数>
 */
export const minImpressionSet = (score: number): string =>
{
  return `!h8["1${score}"]`;
};

/**
 * 恢复房间最低印象门槛为默认及格线以上
 * 发送: !h8["1"]
 * 收到: _~)8
 */
export const minImpressionReset = (): string =>
{
  return '!h8["1"]';
};
