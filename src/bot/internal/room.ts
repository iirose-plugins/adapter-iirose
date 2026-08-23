import type { Internal } from './base';
import type { move } from '../type';
import { IIROSE_WSsend } from '../../utils/ws';
import { readJsonData } from '../../utils/utils';
import moveRoomFunction from '../../encoder/system/room/moveRoom';
import subscribeRoomFunction from '../../encoder/system/room/subscribeRoom';
import unsubscribeRoomFunction from '../../encoder/system/room/unsubscribeRoom';
import type { RoomState } from '../../decoder/messages/system/room/BulkDataPacket';

export const roomMethods = {
  async joinRoom(this: Internal, moveData: move)
  {
    const roomId = moveData.roomId;
    if (!roomId)
    {
      if (this.bot.config.roomId === roomId)
      {
        return this.bot.loggerError('移动房间失败，当前所在房间已为目标房间 ');
      }
      this.bot.config.roomId = this.bot.config.roomId;
      return this.bot.loggerError(`移动房间失败，目标房间为: ${roomId}，已经自动移动到默认房间`);
    }

    if (this.bot.config.roomId === roomId)
    {
      return this.bot.loggerError('移动房间失败，当前所在房间已为目标房间 ');
    }

    this.bot.config.oldRoomId = this.bot.config.roomId;
    this.bot.config.roomId = roomId;
    this.bot.config.roomPassword = moveData.roomPassword;

    if (this.bot.wsClient)
    {
      await this.bot.wsClient.switchRoom();
      this.bot.loggerInfo(`移动到房间: ${roomId}`);
    }
  },

  moveRoom(this: Internal, roomId: string, roomPassword?: string)
  {
    IIROSE_WSsend(this.bot, moveRoomFunction(roomId, roomPassword));
  },

  getRoomId(this: Internal): string
  {
    return this.bot.config.roomId;
  },

  async getRoomListFile(this: Internal): Promise<any>
  {
    return await readJsonData(this.bot, 'wsdata/roomlist.json');
  },

  async getRoomList(this: Internal): Promise<any>
  {
    return await readJsonData(this.bot, 'wsdata/roomlist.json');
  },

  async getRoomStateFile(this: Internal): Promise<RoomState | null>
  {
    return await readJsonData(this.bot, 'wsdata/roomState.json') as RoomState | null;
  },

  subscribeRoom(this: Internal, roomId: string)
  {
    IIROSE_WSsend(this.bot, subscribeRoomFunction(roomId));
  },

  unsubscribeRoom(this: Internal, roomId: string)
  {
    IIROSE_WSsend(this.bot, unsubscribeRoomFunction(roomId));
  },
};
