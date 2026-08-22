import type { Internal } from './base';
import type { kickData, setMaxUser, whiteList } from '../type';
import { IIROSE_WSsend, sendAndWaitForResponsePrefixes } from '../../utils/ws';
import kickFunction from '../../encoder/admin/manage/kick';
import setMaxUserFunction from '../../encoder/admin/manage/setMaxUser';
import whiteListFunction from '../../encoder/admin/manage/whiteList';
import { mediaWhitelistQuery, mediaWhitelistAdd, mediaWhitelistRemove, mediaWhitelistClear } from '../../encoder/admin/manage/mediaWhitelist';
import { setSpeechRestriction, setMusicRestriction, setBothRestrictions, type RoomRestrictionLevel } from '../../encoder/admin/manage/roomRestriction';
import muteFunction, { muteList as muteListFunction, unmute as unmuteFunction, clearMuteList as clearMuteListFunction } from '../../encoder/admin/manage/mute';
import blackListFunction, { blackListQuery, blackListRemove, blackListClear } from '../../encoder/admin/manage/blackList';
import { parseMediaWhitelistList, MEDIA_WHITELIST_LIST_PREFIX, MEDIA_WHITELIST_ADD_ACK_PREFIXES, MEDIA_WHITELIST_REMOVE_ACK_PREFIXES, MEDIA_WHITELIST_CLEAR_ACK_PREFIXES, type MediaWhitelistEntry } from '../../decoder/messages/admin/manage/MediaWhitelist';
import { parseMuteList, parseBlacklistList, isRoomRestrictionAck, SPEECH_RESTRICTION_PREFIX, MUSIC_RESTRICTION_PREFIX, BOTH_RESTRICTION_PREFIX, MUTE_LIST_PREFIX, MUTE_ADD_ACK_PREFIXES, MUTE_REMOVE_ACK_PREFIXES, MUTE_CLEAR_ACK_PREFIXES, BLACKLIST_LIST_PREFIX, BLACKLIST_ADD_ACK_PREFIXES, BLACKLIST_REMOVE_ACK_PREFIXES, BLACKLIST_CLEAR_ACK_PREFIXES, type MuteListEntry } from '../../decoder/messages/admin/manage/RoomRestriction';

export const adminMethods = {
  kick(this: Internal, kickData: kickData)
  {
    IIROSE_WSsend(this.bot, kickFunction(kickData.username));
  },

  setMaxUser(this: Internal, setMaxUser?: setMaxUser)
  {
    (setMaxUser && setMaxUser.hasOwnProperty('maxMember')) ? IIROSE_WSsend(this.bot, setMaxUserFunction(setMaxUser.maxMember)) : IIROSE_WSsend(this.bot, setMaxUserFunction());
  },

  whiteList(this: Internal, whiteList: whiteList)
  {
    (whiteList && whiteList.hasOwnProperty('intro')) ? IIROSE_WSsend(this.bot, whiteListFunction(whiteList.username, whiteList.time, whiteList.intro)) : IIROSE_WSsend(this.bot, whiteListFunction(whiteList.username, whiteList.time));
  },

  async getMediaWhitelist(this: Internal): Promise<MediaWhitelistEntry[] | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaWhitelistQuery(), [MEDIA_WHITELIST_LIST_PREFIX]);
    if (!response) return null;
    return parseMediaWhitelistList(response) ?? [];
  },

  async addMediaWhitelist(this: Internal, username: string, duration: string, intro: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaWhitelistAdd(username, duration, intro), MEDIA_WHITELIST_ADD_ACK_PREFIXES);
    return response !== null;
  },

  async removeMediaWhitelist(this: Internal, uid: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaWhitelistRemove(uid), MEDIA_WHITELIST_REMOVE_ACK_PREFIXES);
    return response !== null;
  },

  async clearMediaWhitelist(this: Internal): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaWhitelistClear(), MEDIA_WHITELIST_CLEAR_ACK_PREFIXES);
    return response !== null;
  },

  async setRoomSpeechLevel(this: Internal, level: RoomRestrictionLevel): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, setSpeechRestriction(level), [SPEECH_RESTRICTION_PREFIX]);
    return isRoomRestrictionAck(response ?? '', 'speech', level);
  },

  async setRoomMusicLevel(this: Internal, level: RoomRestrictionLevel): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, setMusicRestriction(level), [MUSIC_RESTRICTION_PREFIX]);
    return isRoomRestrictionAck(response ?? '', 'music', level);
  },

  async setRoomBothLevel(this: Internal, level: RoomRestrictionLevel): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, setBothRestrictions(level), [BOTH_RESTRICTION_PREFIX]);
    return isRoomRestrictionAck(response ?? '', 'both', level);
  },

  async getMuteList(this: Internal): Promise<MuteListEntry[] | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, muteListFunction(), [MUTE_LIST_PREFIX]);
    if (!response) return null;
    return parseMuteList(response) ?? [];
  },

  async muteUser(this: Internal, type: 'chat' | 'music' | 'all', username: string, duration: string, intro: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, muteFunction(type, username, duration, intro), MUTE_ADD_ACK_PREFIXES);
    return response !== null;
  },

  async unmuteUser(this: Internal, uid: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, unmuteFunction(uid), MUTE_REMOVE_ACK_PREFIXES);
    return response !== null;
  },

  async clearMuteList(this: Internal): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, clearMuteListFunction(), MUTE_CLEAR_ACK_PREFIXES);
    return response !== null;
  },

  async getBlacklist(this: Internal): Promise<MediaWhitelistEntry[] | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, blackListQuery(), [BLACKLIST_LIST_PREFIX]);
    if (!response) return null;
    return parseBlacklistList(response) ?? [];
  },

  async addBlacklist(this: Internal, username: string, duration: string, intro: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, blackListFunction(username, duration, intro), BLACKLIST_ADD_ACK_PREFIXES);
    return response !== null;
  },

  async removeBlacklist(this: Internal, uid: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, blackListRemove(uid), BLACKLIST_REMOVE_ACK_PREFIXES);
    return response !== null;
  },

  async clearBlacklist(this: Internal): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, blackListClear(), BLACKLIST_CLEAR_ACK_PREFIXES);
    return response !== null;
  },
};
