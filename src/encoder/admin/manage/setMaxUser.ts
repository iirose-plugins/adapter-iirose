/**
 * 查询房间最大人数
 * 发送: !h6["0"]
 * 收到: am6 或 am6<数量>
 */
export const maxUserQuery = (): string =>
{
  return '!h6["0"]';
};

/**
 * 设置房间最大人数
 * 发送: !h6["1<数量>"]
 * 收到: _~)6<数量>
 */
export const maxUserSet = (count: number): string =>
{
  return `!h6["1${count}"]`;
};

/**
 * 恢复房间最大人数为不限制
 * 发送: !h6["1"]
 * 收到: _~)6
 */
export const maxUserReset = (): string =>
{
  return '!h6["1"]';
};
