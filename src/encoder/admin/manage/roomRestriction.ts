/**
 * 房间权限等级
 * 0: 所有人
 * 1: 普通成员以上
 * 2: 带星成员以上
 * 3: 仅房主
 * 4: 白名单以上
 * 5: 仅白名单
 */
export type RoomRestrictionLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * 设置房间发言限制
 * 发送: !h1["N"]
 * 收到: _~!N
 */
export const setSpeechRestriction = (level: RoomRestrictionLevel): string =>
{
  return `!h1["${level}"]`;
};

/**
 * 设置房间点播限制
 * 发送: !h2["N"]
 * 收到: _~@N
 */
export const setMusicRestriction = (level: RoomRestrictionLevel): string =>
{
  return `!h2["${level}"]`;
};

/**
 * 同时设置发言和点播限制
 * 发送: !h0["N"]
 * 收到: _~#NN
 */
export const setBothRestrictions = (level: RoomRestrictionLevel): string =>
{
  return `!h0["${level}"]`;
};
