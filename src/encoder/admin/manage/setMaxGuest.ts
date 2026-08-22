/**
 * 查询房间最大游客人数
 * 发送: !h7["0"]
 * 收到: am7 或 am7<数量>
 */
export const maxGuestQuery = (): string =>
{
  return '!h7["0"]';
};

/**
 * 设置房间最大游客人数
 * 发送: !h7["1<数量>"]
 * 收到: _~)7<数量>
 */
export const maxGuestSet = (count: number): string =>
{
  return `!h7["1${count}"]`;
};

/**
 * 恢复房间最大游客人数为不限制
 * 发送: !h7["1"]
 * 收到: _~)7
 */
export const maxGuestReset = (): string =>
{
  return '!h7["1"]';
};
