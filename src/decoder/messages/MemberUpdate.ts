export interface MemberUpdateData
{
  type: 'join' | 'leave' | 'refresh'; // 增加 refresh 类型
  // 公共字段
  timestamp: string;
  avatar: string;
  username: string;
  uid: string;
  // join 事件专用
  joinType?: 'new' | 'reconnect';
  // leave 事件专用
  isMove?: boolean;
  targetRoomId?: string;
  // move 事件的额外信息
  color?: string;
  title?: string;
  room?: string;
}

/**
 * 解析单个成员更新消息。
 * @param message 原始的 websocket 消息字符串。
 * @returns 一个结构化的成员更新对象，如果消息不是成员更新，则返回 void。
 */
const parseSingleMemberUpdate = (message: string): MemberUpdateData | void =>
{
  const parts = message.split('>');
  if (parts.length < 10) return;

  // 基本用户信息在这些消息中是一致的
  const timestamp = parts[0].slice(1); // 移除开头的 "
  const avatar = parts[1];
  const username = parts[2];
  const uid = parts[8];
  const lastPart = parts[parts.length - 1];

  // 用户加入（一个新用户进入房间或重连）
  // 标识符: parts[3] === "'1"
  // e.g. >>15fdcb9b634621'n''' (新加入)
  // e.g. >>15fdcb9b634621'd''' (重连)
  if (parts[3] === "'1")
  {
    let status = '';
    // 从后向前遍历，找到最后一个不是 "'" 的字符
    for (let i = lastPart.length - 1; i >= 0; i--)
    {
      if (lastPart[i] !== "'")
      {
        status = lastPart[i];
        break;
      }
    }

    if (status === 'n' || status === 'd')
    {
      return {
        type: 'join',
        timestamp,
        avatar,
        username,
        uid,
        joinType: status === 'n' ? 'new' : 'reconnect',
      };
    }
  }

  // 用户离开或刷新
  // 标识符: parts[3] === "'3" 且消息以 ">>2" 结尾
  const secondToLastPart = parts[parts.length - 2];
  if (parts[3] === "'3" && secondToLastPart === '' && lastPart === '2')
  {
    return {
      type: 'leave', // 离开和刷新都被视为离开事件。刷新会触发一个离开事件，然后是一个加入事件。
      timestamp,
      avatar,
      username,
      uid,
      isMove: false
    };
  }

  // 用户移动（用户离开当前房间去往另一个房间）
  // 标识符: parts[3] 以 "'2" 开头, 结尾为 "3" + targetRoomId
  // e.g. "1...>'2...>...>...>>3..."
  const moveRoomIdMarker = "'2";
  if (parts[3].startsWith(moveRoomIdMarker))
  {
    const targetRoomIdFromPart3 = parts[3].slice(moveRoomIdMarker.length);
    const moveEndMarker = '3';
    if (lastPart.startsWith(moveEndMarker))
    {
      const targetRoomIdFromLastPart = lastPart.slice(moveEndMarker.length);
      // 验证房间 ID 是否一致
      if (targetRoomIdFromPart3 === targetRoomIdFromLastPart)
      {
        return {
          type: 'leave', // "移动" 本质上是离开当前房间，所以我们下发 leave 事件
          timestamp,
          avatar,
          username,
          uid,
          isMove: true, // 附带 isMove 标志
          targetRoomId: targetRoomIdFromPart3, // 和目标房间 ID
          color: parts[5],
          title: parts[9],
          room: parts[10]
        };
      }
    }
  }
};

/**
 * 解析来自 websocket 的成员更新消息。
 * 处理加入、离开、刷新和移动事件。
 * @param message 原始的 websocket 消息字符串。
 * @returns 一个结构化的成员更新对象，如果消息不是成员更新，则返回 void。
 */
export const memberUpdate = (message: string): MemberUpdateData | void =>
{
  return parseSingleMemberUpdate(message);
};
