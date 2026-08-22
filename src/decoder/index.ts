import { mailboxMessage, MailboxMessageData } from './messages/system/mailbox/MailboxMessage';
import { BroadcastMessage, broadcastMessage } from './messages/chat/BroadcastMessage';
import { broadcastAck } from './messages/system/ack/BroadcastAck';
import { MessageDeleted, MessageDeletedData } from './messages/chat/MessageDeleted';
import { privateMessage, PrivateMessage } from './messages/chat/PrivateMessage';
import { MemberUpdateData, memberUpdate } from './messages/room/MemberUpdate';
import { publicMessage, PublicMessage } from './messages/chat/PublicMessage';
import { bulkDataPacket, UserList } from './messages/system/room/BulkDataPacket';
import type { RoomState } from './messages/system/room/BulkDataPacket';
import { musicMessage, MusicMessage } from './messages/chat/MusicMessage';
import { MediaWhitelistEntry, MediaWhitelistEvent, parseMediaWhitelistList, parseMediaWhitelistEvent } from './messages/admin/manage/MediaWhitelist';
import { RoomRestrictionEvent, MuteListEntry, MuteEvent, BlacklistEvent, parseRoomRestriction, parseMuteList, parseMuteEvent, parseBlacklistList, parseBlacklistEvent } from './messages/admin/manage/RoomRestriction';
import { bankCallback, BankCallback } from './messages/system/consume/BankCallback';
import { manyMessage, ManyMessage } from './messages/chat/ManyMessage';
import { switchRoom, SwitchRoom } from './messages/room/SwitchRoom';
import { selfMove, SelfMove } from './messages/room/SelfMove';
import { kicked } from './messages/room/Kicked';
import { comparePassword } from '../utils/password';
import { music, Music } from './messages/media/Music';
import { stock, Stock } from './messages/system/consume/Stock';
import { parseSelfStatus, SelfStatus } from './messages/user/profile/SelfStatus';
import { IIROSE_Bot } from '../bot/bot';

export const decoder = async (bot: IIROSE_Bot, msg: string): Promise<MessageType> =>
{
  const len: any = {};

  len.manyMessage = manyMessage(msg, bot);
  const bulkData = await bulkDataPacket(msg, bot);
  len.userlist = bulkData?.userList;
  len.roomState = bulkData?.roomState;
  len.selfStatus = parseSelfStatus(msg, bot.selfId);
  len.publicMessage = len.selfStatus ? undefined : publicMessage(msg);
  len.privateMessage = privateMessage(msg);
  len.memberUpdate = len.selfStatus ? undefined : memberUpdate(msg);
  // len.switchRoom = switchRoom(msg);
  len.music = music(msg);
  len.bankCallback = bankCallback(msg, bot);
  len.selfMove = selfMove(msg);
  len.kicked = kicked(msg);
  len.mailboxMessage = mailboxMessage(msg);
  len.musicMessage = musicMessage(msg);
  len.stock = stock(msg, bot);
  len.messageDeleted = MessageDeleted(bot, msg);
  len.broadcastMessage = broadcastMessage(msg);
  len.broadcastAck = broadcastAck(msg);
  len.mediaWhitelistList = parseMediaWhitelistList(msg);
  len.mediaWhitelistEvent = parseMediaWhitelistEvent(msg);
  len.roomRestriction = parseRoomRestriction(msg);
  len.muteList = parseMuteList(msg);
  len.muteEvent = parseMuteEvent(msg);
  len.blacklistList = parseBlacklistList(msg);
  len.blacklistEvent = parseBlacklistEvent(msg);

  const newObj = {};
  for (const key in len)
  {
    // 如果对象属性的值不为空，就保存该属性（如果属性的值为0 false，保存该属性。如果属性的值全部是空格，属于为空。）
    if ((len[key] === 0 || len[key] === false || len[key]) && len[key].toString().replace(/(^\s*)|(\s*$)/g, '') !== '')
    {
      if (key === 'manyMessage' || key === 'selfStatus')
      {
        newObj[key] = len[key];
      } else if (len[key].uid)
      {
        let uid = bot.ctx.config.uid;

        if (bot.config.smStart && comparePassword(bot.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
        }

        if (len[key].uid !== uid) { newObj[key] = len[key]; }
      } else
      {
        newObj[key] = len[key];
      }
    }
  }
  return newObj;
};

export interface MessageType
{
  manyMessage?: ManyMessage[];
  userlist?: UserList[];
  roomState?: RoomState;
  selfStatus?: SelfStatus;
  publicMessage?: PublicMessage;
  privateMessage?: PrivateMessage;
  memberUpdate?: MemberUpdateData;
  switchRoom?: SwitchRoom;
  music?: Music;
  bankCallback?: BankCallback;
  selfMove?: SelfMove;
  kicked?: boolean;
  mailboxMessage?: MailboxMessageData;
  musicMessage?: MusicMessage;
  stock?: Stock;
  messageDeleted?: MessageDeletedData;
  broadcastMessage?: BroadcastMessage;
  broadcastAck?: boolean;
  mediaWhitelistList?: MediaWhitelistEntry[];
  mediaWhitelistEvent?: MediaWhitelistEvent;
  roomRestriction?: RoomRestrictionEvent;
  muteList?: MuteListEntry[];
  muteEvent?: MuteEvent;
  blacklistList?: MediaWhitelistEntry[];
  blacklistEvent?: BlacklistEvent;
}
