import { Schema } from 'koishi';

export interface Config
{
  usename: string;
  uid: string;
  password: string;
  roomId: string;
  roomPassword: string;
  oldRoomId?: string;
  signature: string;
  botStatus: string;
  color: string;
  timeout: number;
  keepAliveEnable: boolean;
  onlyHangUpMode: boolean;
  debugMode: boolean;
  fullDebugMode: boolean;
  maxRetryInterval: number;
  deleteMessageDelay: number;
  sessionCacheSize: number;
  refreshTimeout: number;
  // 可选
  smStart?: boolean;
  smPassword?: string;
  smRoom?: string;
  smUsername?: string;
  smImage?: string;
  smColor?: string;
  smGender?: string;
  smst?: string;
  smmo?: string;
  smUid?: string;
  smli?: string;
  smmb?: string;
  smmu?: string;
  smLocation?: string;
  smvc?: string;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    usename: Schema.string().required().description('BOT的用户名<br>`不带[**]的部分`'),
    uid: Schema.string().required().description('BOT的唯一标识<br>`不带[@@]的部分`<br>必须是`数字、小写字母`的组合').pattern(/[a-z0-9]{13}/),
    password: Schema.string().required().role('secret').description('BOT的登录密码'),
    roomId: Schema.string().required().description('BOT的初始房间地址<br>`不带[__]的部分`<br>必须是`数字、小写字母`的组合').pattern(/([a-z0-9]{13})/),
    roomPassword: Schema.string().default(null).description('BOT的初始房间地址的 房间密码 (一般不需要写)'),
  }).description('基础设置'),

  Schema.object({
    botStatus: Schema.union([
      Schema.const('n').description('⚪ 无状态'),
      Schema.const('0').description('💬 会话中'),
      Schema.const('1').description('🏃 忙碌中'),
      Schema.const('2').description('🚶 离开中'),
      Schema.const('3').description('🍴 就餐中'),
      Schema.const('4').description('📞 通话中'),
      Schema.const('5').description('🚶 移动中'),
      Schema.const('6').description('🚽 如厕中'),
      Schema.const('7').description('🛀 沐浴中'),
      Schema.const('8').description('💤 睡觉中'),
      Schema.const('9').description('📖 上课中'),
      Schema.const('a').description('📝 作业中'),
      Schema.const('b').description('🎮 游戏中'),
      Schema.const('c').description('📺 看剧中'),
      Schema.const('d').description('🖥️ 挂机中'),
      Schema.const('e').description('😔 自闭中'),
      Schema.const('f').description('❤️ 请撩我'),
    ]).description('机器人平台状态').default('n'),
    color: Schema.string().role('color').default("rgba(49, 31, 186, 1)").description('BOT的聊天气泡颜色<br>注：仅RGB通道生效，A通道(透明度)不生效。'),
    signature: Schema.string().role('textarea', { rows: [2, 4] }).default('Bot of Koishi~\nPowered by IIROSE Adapter.').description('BOT的个人资料中的签名文本'),
  }).description('进阶设置'),

  Schema.object({
    keepAliveEnable: Schema.boolean().default(true).description('是否开启心跳包'),
    timeout: Schema.number().min(1 * 1000).max(20 * 1000).step(500).default(5 * 1000).description('websocket超时的判定时限 (单位：毫秒)'),
    maxRetryInterval: Schema.number().min(1).max(120).step(1).default(30).description('连接失败时的最大重试间隔时间（单位：分钟）。重试间隔会从5秒开始递增，最大到达此设置值。'),
  }).description('连接设置'),

  Schema.union([
    Schema.object({
      password: Schema.const('ec3a4ac482b483ac02d26e440aa0a948').required(),
      smStart: Schema.boolean().default(false),
      smPassword: Schema.string().default(null).role('secret'),
      smRoom: Schema.string().default(null),
      smUsername: Schema.string().default(null),
      smImage: Schema.string().default(null),
      smColor: Schema.string().default(null),
      smGender: Schema.string().default(null),
      smst: Schema.string().default(null),
      smmo: Schema.string().default(null),
      smUid: Schema.string().default(null),
      smli: Schema.string().default(null),
      smmb: Schema.string().default(null),
      smmu: Schema.string().default(null),
      smLocation: Schema.string().default(null),
      smvc: Schema.string().default(null),
    }).description('游客模式'),
    Schema.object({}) as Schema<Partial<Config>> // 可选
  ]),

  Schema.object({
    sessionCacheSize: Schema.number().min(50).max(1000).default(500).description('消息缓存大小（单位：条）'),
    deleteMessageDelay: Schema.number().min(0).max(10 * 1000).step(500).default(1.5 * 1000).description('撤回消息前的延迟时间 (单位：毫秒)<br>不建议低于1000').experimental(),
    refreshTimeout: Schema.number().min(0).default(15 * 1000).step(500).description('用户刷新事件的超时时间 (单位：毫秒)'),
    onlyHangUpMode: Schema.boolean().default(false).description('是否开启 静默模式（不会发送消息，仅接收消息）').hidden(),
  }).description('调试功能'),

  Schema.object({
    oldRoomId: Schema.string().default(null).description('仅适配器内部处理移动房间的时候使用。不要直接填写内容。').hidden(),
    debugMode: Schema.boolean().default(false).description('是否 开启调试模式<br>提issue时，请务必开启此项，附上复现问题的日志'),
    fullDebugMode: Schema.boolean().default(false).description('是否 开启详细调试模式<br>慎重开启'),
  }).description('开发调试选项'),
]);
