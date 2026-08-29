/**
 * 获取用户列表
 * 正常情况下登录成功的大包会下发列表；缓存缺失用户/群组时可主动调用 r2 刷新一次。
 * @returns {string}
 */
export default () => { return 'r2'; };
