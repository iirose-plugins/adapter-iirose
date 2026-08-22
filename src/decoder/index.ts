import { mailboxMessage, MailboxMessageData } from './messages/MailboxMessage';
import { BroadcastMessage, broadcastMessage } from './messages/BroadcastMessage';
import { broadcastAck } from './messages/BroadcastAck';
import { MessageDeleted, MessageDeletedData } from './messages/MessageDeleted';
import { privateMessage, PrivateMessage } from './messages/PrivateMessage';
import { MemberUpdateData, memberUpdate } from './messages/MemberUpdate';
import { publicMessage, PublicMessage } from './messages/PublicMessage';
import { bulkDataPacket, UserList } from './messages/BulkDataPacket';
import type { RoomState } from './messages/BulkDataPacket';
import { musicMessage, MusicMessage } from './messages/MusicMessage';
import { MediaWhitelistEntry, MediaWhitelistEvent, parseMediaWhitelistList, parseMediaWhitelistEvent } from './messages/MediaWhitelist';
import { RoomRestrictionEvent, MuteListEntry, MuteEvent, BlacklistEvent, parseRoomRestriction, parseMuteList, parseMuteEvent, parseBlacklistList, parseBlacklistEvent } from './messages/RoomRestriction';
import { bankCallback, BankCallback } from './messages/BankCallback';
import { manyMessage, ManyMessage } from './messages/ManyMessage';
import { switchRoom, SwitchRoom } from './messages/SwitchRoom';
import { selfMove, SelfMove } from './messages/SelfMove';
import { comparePassword } from '../utils/password';
import { music, Music } from './messages/Music';
import { stock, Stock } from './messages/Stock';
import { IIROSE_Bot } from '../bot/bot';

export const decoder = async (bot: IIROSE_Bot, msg: string): Promise<MessageType> =>
{
  const len: any = {};

  len.manyMessage = manyMessage(msg, bot);
  const bulkData = await bulkDataPacket(msg, bot);
  len.userlist = bulkData?.userList;
  len.roomState = bulkData?.roomState;
  len.publicMessage = publicMessage(msg);
  len.privateMessage = privateMessage(msg);
  len.memberUpdate = memberUpdate(msg);
  // len.switchRoom = switchRoom(msg);
  len.music = music(msg);
  len.bankCallback = bankCallback(msg, bot);
  len.selfMove = selfMove(msg);
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
      if (key === 'manyMessage')
      {
        newObj[key] = len[key];
      }

      if (len[key].uid)
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
  publicMessage?: PublicMessage;
  privateMessage?: PrivateMessage;
  memberUpdate?: MemberUpdateData;
  switchRoom?: SwitchRoom;
  music?: Music;
  bankCallback?: BankCallback;
  selfMove?: SelfMove;
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
