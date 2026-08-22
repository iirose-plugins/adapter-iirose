import type { Internal } from './base';
import type { cutOne, musicOrigin } from '../type';
import { IIROSE_WSsend, sendAndWaitForResponsePrefixes } from '../../utils/ws';
import cutOneFunction from '../../encoder/admin/media/media_cut';
import cutAllFunction from '../../encoder/admin/media/media_clear';
import mediaOperationFunction from '../../encoder/admin/media/media_operation';
import mediaExchangeFunction from '../../encoder/admin/media/media_exchange';
import mediaGotoFunction from '../../encoder/admin/media/media_goto';
import mediaCard from '../../encoder/messages/media_card';
import mediaData from '../../encoder/messages/media_data';
import getMusicListFunction, { parseMusicList, MediaListItem, MEDIA_LIST_RESPONSE_PREFIX } from '../../encoder/system/media/getMusicList';
import { MEDIA_POSITION_RESPONSE_PREFIX, MEDIA_NO_MEDIA_RESPONSE, parseMediaPosition, isMediaSuccess } from '../../decoder/messages/admin/media/MediaPosition';

export const mediaMethods = {
  cutOne(this: Internal, cutOne?: cutOne)
  {
    (cutOne && cutOne.hasOwnProperty('id')) ? IIROSE_WSsend(this.bot, cutOneFunction(cutOne.id)) : IIROSE_WSsend(this.bot, cutOneFunction());
  },

  cutAll(this: Internal)
  {
    IIROSE_WSsend(this.bot, cutAllFunction());
  },

  async seekMedia(this: Internal, operation: '<' | '>', time: string): Promise<number | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaOperationFunction(operation, time), [MEDIA_POSITION_RESPONSE_PREFIX, MEDIA_NO_MEDIA_RESPONSE]);
    return parseMediaPosition(response ?? '');
  },

  async jumpMedia(this: Internal, time: string): Promise<number | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaGotoFunction(time), [MEDIA_POSITION_RESPONSE_PREFIX, MEDIA_NO_MEDIA_RESPONSE]);
    return parseMediaPosition(response ?? '');
  },

  exchangeMedia(this: Internal, id1: string, id2: string)
  {
    IIROSE_WSsend(this.bot, mediaExchangeFunction(id1, id2));
  },

  async nextMedia(this: Internal): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, cutOneFunction(), [MEDIA_POSITION_RESPONSE_PREFIX, MEDIA_NO_MEDIA_RESPONSE]);
    return isMediaSuccess(response ?? '');
  },

  clearMedia(this: Internal)
  {
    IIROSE_WSsend(this.bot, cutAllFunction());
  },

  makeMusic(this: Internal, musicOrigin: musicOrigin)
  {
    this.requestMusic(musicOrigin);
  },

  requestMusic(this: Internal, musicOrigin: musicOrigin)
  {
    const { type, name, signer, cover, link, url, duration, bitRate, color, lyrics, origin } = musicOrigin;
    IIROSE_WSsend(this.bot, mediaData(type, name, signer, cover, link, url, duration, lyrics, origin));
    const mediaCardResult = mediaCard(type, name, signer, cover, color, duration, bitRate, origin);
    IIROSE_WSsend(this.bot, mediaCardResult.data);
  },

  async getMusicList(this: Internal): Promise<MediaListItem[] | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getMusicListFunction(), MEDIA_LIST_RESPONSE_PREFIX, true);
    if (response)
    {
      return parseMusicList(response);
    }
    return null;
  },
};
