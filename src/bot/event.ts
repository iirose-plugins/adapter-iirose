import { Fragment, Session } from 'koishi';
import type { MailboxMessageData } from '../decoder/messages/MailboxMessage';
import { BroadcastMessage } from '../decoder/messages/BroadcastMessage';
import { Stock } from '../decoder/messages/Stock';
import { BankCallback } from '../decoder/messages/BankCallback';
import { MessageType } from '../decoder';
import type { RoomState } from '../decoder/messages/BulkDataPacket';
import { IIROSE_Bot } from './bot';
export type { MailboxMessageData };

export interface kickData
{
  username: string;
}

export interface cutOne
{
  id?: string;
}

export interface setMaxUser
{
  maxMember: number;
}

export interface whiteList
{
  username: string;
  time: string;
  intro?: string;
}

export interface broadcast
{
  message: string;
  color: string;
}

export interface move
{
  roomId: string;
  roomPassword?: string;
}

export interface EventsCallBackOrigin
{
  type: string;
  userId?: string;
  username?: string;
  timestamp?: number;
  author?: {
    userId: string;
    avatar: string;
    username: string;
  };
  platform: 'iirose';
  guildId?: string;
  selfId?: string;
  bot?: IIROSE_Bot;
  channelId?: string;
  send: (data: {
    public?: {
      message: Fragment;
    };
    private?: {
      message: Fragment;
      userId: string;
    };
  }) => void;
  data?: any;
}

export interface musicOrigin
{
  type: 'music' | 'video';
  name: string;
  signer: string;
  cover: string;
  link: string;
  url: string;
  duration: number;
  bitRate: number;
  color: string;
  lyrics: string;
  origin: 'netease' | 'bilibili' | 'null' | 'undefined' | null;
}

export interface StockGet
{
  (stockData: Stock): void;
}

export interface StockSession extends Stock
{
  send?: (data: {
    public?: {
      message: Fragment;
    };
    private?: {
      message: Fragment;
      userId: string;
    };
  }) => void;
  bot?: IIROSE_Bot;
}

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
  'iirose/stock-update'(stockData: Stock): void;
  'iirose/bank-update'(bankData: BankCallback): void;
}
