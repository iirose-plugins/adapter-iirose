import { Session } from 'koishi';
import { BroadcastMessage } from '../decoder/messages/chat/BroadcastMessage';
import { Stock } from '../decoder/messages/system/consume/Stock';
import { BankCallback } from '../decoder/messages/system/consume/BankCallback';
import { MessageType } from '../decoder';
import type { RoomState } from '../decoder/messages/system/room/BulkDataPacket';
import type { MediaWhitelistEntry, MediaWhitelistEvent } from '../decoder/messages/admin/manage/MediaWhitelist';
import type { RoomRestrictionEvent, MuteListEntry, MuteEvent, BlacklistEvent } from '../decoder/messages/admin/manage/RoomRestriction';
import type { MailboxMessageData } from './type';

export interface Events
{
  'iirose/guild-member-refresh'(session: Session): void;
  'iirose/guild-member-switchRoom'(session: Session, data: MessageType['switchRoom']): void;
  'iirose/music-play'(session: Session, data: MessageType['music']): void;
  'iirose/selfMove'(session: Session, data: MessageType['selfMove']): void;
  'iirose/mailbox'(session: Session, data: MailboxMessageData): void;
  'iirose/roomNotice'(session: Session, data: Extract<MailboxMessageData, { type: 'roomNotice'; }>): void;
  'iirose/follower'(session: Session, data: Extract<MailboxMessageData, { type: 'follower'; }>): void;
  'iirose/like'(session: Session, data: Extract<MailboxMessageData, { type: 'like'; }>): void;
  'iirose/dislike'(session: Session, data: Extract<MailboxMessageData, { type: 'dislike'; }>): void;
  'iirose/payment'(session: Session, data: Extract<MailboxMessageData, { type: 'payment'; }>): void;
  'iirose/broadcast'(session: Session, data: BroadcastMessage): void;
  'iirose/room-state'(state: RoomState): void;
  'iirose/broadcast-ack'(remaining: number): void;
  'iirose/media-whitelist-list'(data: MediaWhitelistEntry[]): void;
  'iirose/media-whitelist-event'(data: MediaWhitelistEvent): void;
  'iirose/room-restriction'(data: RoomRestrictionEvent): void;
  'iirose/mute-list'(data: MuteListEntry[]): void;
  'iirose/mute-event'(data: MuteEvent): void;
  'iirose/blacklist-list'(data: MediaWhitelistEntry[]): void;
  'iirose/blacklist-event'(data: BlacklistEvent): void;
  'iirose/stock-update'(stockData: Stock): void;
  'iirose/bank-update'(bankData: BankCallback): void;
}
