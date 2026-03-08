// WebSocket 登录对象类型定义
export interface LoginObj
{
  r?: string; // roomId 机器人上线的房间唯一标识
  n?: string; // username 机器人用户名
  p?: string; // hashedPassword 机器人密码md5
  st?: string; // botStatus 账号状态
  mo?: string; // signature 机器人签名
  mb?: string; // 神秘参数 作用未知
  mu?: string; // 关系到服务器给不给你媒体信息
  lr?: string; // oldRoomId 离开的房间唯一标识
  rp?: string; // roomPassword 目标房间密码
  fp?: string; // hashed username @(机器人用户名md5)

  // 游客专用
  i?: string; // 头像
  nc?: string; // 颜色
  s?: string; // 性别
  uid?: string; // 唯一标识
  li?: string; // 重复游客ID才需要
  la?: string; // 注册地址
  vc?: string; // 网页客户端版本号
}
