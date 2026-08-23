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
    await this.moveRoom(moveData.roomId, moveData.roomPassword);
  },

  async moveRoom(this: Internal, roomId: string, roomPassword?: string)
  {
    if (!roomId)
    {
      return this.bot.loggerError('移动房间失败，未提供目标房间 ID');
    }

    if (this.bot.config.roomId === roomId)
    {
      return this.bot.loggerError('移动房间失败，当前已在目标房间');
    }

    const previousRoomId = this.bot.config.roomId;
    const previousRoomPassword = this.bot.config.roomPassword;

    this.bot.config.oldRoomId = previousRoomId;
    this.bot.config.roomId = roomId;
    this.bot.config.roomPassword = roomPassword;

    const response = await this.bot.sendAndWaitForResponse(
      moveRoomFunction(roomId, roomPassword),
      'm',
      true,
    );

    if (response !== 'm')
    {
      this.bot.config.oldRoomId = undefined;
      this.bot.config.roomId = previousRoomId;
      this.bot.config.roomPassword = previousRoomPassword;
      return this.bot.loggerError(`移动房间失败，目标房间: ${roomId}，回执: ${response ?? '超时'}`);
    }

    if (this.bot.wsClient)
    {
      await this.bot.wsClient.switchRoom();
      this.bot.loggerInfo(`移动到房间: ${roomId}`);
    }
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
