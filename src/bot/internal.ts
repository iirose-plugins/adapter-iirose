import { IIROSE_Bot } from './bot';
import * as eventType from './event';
import { Universal, User } from "koishi";
import { IIROSE_WSsend, sendAndWaitForResponsePrefixes } from '../utils/ws';
import Like from '../encoder/user/like/Like';
import Follow from '../encoder/user/follow/Follow';
import Dislike from '../encoder/user/like/Dislike';
import Unfollow from '../encoder/user/follow/Unfollow';
import mediaCard from '../encoder/messages/media_card';
import mediaData from '../encoder/messages/media_data';
import mediaOperationFunction from '../encoder/admin/media/media_operation';
import mediaExchangeFunction from '../encoder/admin/media/media_exchange';
import mediaGotoFunction from '../encoder/admin/media/media_goto';
import kickFunction from '../encoder/admin/manage/kick';
import { parseBalance } from '../decoder/messages/user/consume/Balance';
import getBalanceFunction from '../encoder/user/getBalance';
import summonDiceFunction from '../encoder/system/summonDice';
import { Forum, parseForum } from '../decoder/messages/system/forum/Forum';
import { Store, parseStore } from '../decoder/messages/system/store/Store';
import { Tasks, parseTasks } from '../decoder/messages/system/tasks/Tasks';
import cutOneFunction from '../encoder/admin/media/media_cut';
import broadcastFunction from '../encoder/messages/broadcast';
import noticeFunction from '../encoder/admin/manage/notice';
import { findUserIdByName, readJsonData, writeWJ } from '../utils/utils';
import getTasksFunction from '../encoder/system/tasks/getTasks';
import getForumFunction from '../encoder/system/forum/getForum';
import getStoreFunction from '../encoder/system/store/getStore';
import cutAllFunction from '../encoder/admin/media/media_clear';
import whiteListFunction from '../encoder/admin/manage/whiteList';
import { mediaWhitelistQuery, mediaWhitelistAdd, mediaWhitelistRemove, mediaWhitelistClear } from '../encoder/admin/manage/mediaWhitelist';
import { setSpeechRestriction, setMusicRestriction, setBothRestrictions, type RoomRestrictionLevel } from '../encoder/admin/manage/roomRestriction';
import muteFunction, { muteList as muteListFunction, unmute as unmuteFunction, clearMuteList as clearMuteListFunction } from '../encoder/admin/manage/mute';
import blackListFunction, { blackListQuery, blackListRemove, blackListClear } from '../encoder/admin/manage/blackList';
import { gradeUser, cancelGradeUser } from '../encoder/user/grade';
import getMomentsFunction from '../encoder/user/moments/getMoments';
import { Moments, parseMoments } from '../decoder/messages/user/moments/Moments';
import setMaxUserFunction from '../encoder/admin/manage/setMaxUser';
import getSelfInfoFunction from '../encoder/user/profile/getSelfInfo';
import { SelfInfo, parseSelfInfo } from '../decoder/messages/user/profile/SelfInfo';
import { Stock, stock as parseStock } from '../decoder/messages/system/consume/Stock';
import subscribeRoomFunction from '../encoder/system/room/subscribeRoom';
import addToCartFunction from '../encoder/system/store/personal/addToCart';
import unsubscribeRoomFunction from '../encoder/system/room/unsubscribeRoom';
import getSellerCenterFunction from '../encoder/system/store/getSellerCenter';
import { stockGet, stockBuy, stockSell } from '../encoder/system/consume/stock';
import { UserMoments, parseUserMoments } from '../decoder/messages/user/moments/UserMoments';
import { Leaderboard, parseLeaderboard } from '../decoder/messages/system/leaderboard/Leaderboard';
import getFavoritesFunction from '../encoder/system/store/personal/getFavorites';
import getLeaderboardFunction from '../encoder/system/leaderboard/getLeaderboard';
import { bankGet, bankDeposit, bankWithdraw } from '../encoder/system/consume/bank';
import { SellerCenter, parseSellerCenter } from '../decoder/messages/system/store/SellerCenter';
import removeFromCartFunction from '../encoder/system/store/personal/removeFromCart';
import getUserMomentsByUidFunction from '../encoder/user/moments/getUserMomentsByUid';
import getUserProfileByNameFunction from '../encoder/user/profile/getUserProfileByName';
import payment, { parsePaymentCallback, PaymentCallback } from "../encoder/user/payment";
import getFollowedStoresFunction from '../encoder/system/store/personal/getFollowedStores';
import updateSelfInfoFunction, { ProfileData } from '../encoder/user/profile/updateSelfInfo';
import { GradeUserCallback, parseGradeUserCallback } from '../decoder/messages/user/grade/GradeUserCallback';
import { parseUserProfileByName, UserProfileByName } from '../decoder/messages/user/profile/UserProfileByName';
import { BankCallback, bankCallback as parseBankCallback } from '../decoder/messages/system/consume/BankCallback';
import getCompletedOrdersFunction from '../encoder/system/store/personal/orders/getCompletedOrders';
import getAfterSaleOrdersFunction from '../encoder/system/store/personal/orders/getAfterSaleOrders';
import getMusicListFunction, { parseMusicList, MediaListItem, MEDIA_LIST_RESPONSE_PREFIX } from '../encoder/system/media/getMusicList';
import { getFollowAndFansPacket, parseFollowAndFans, FollowList } from '../encoder/user/follow/followList';
import { CHANGELOG_URL, ChangelogData, parseChangelog } from '../utils/changelog';
import { MEDIA_POSITION_RESPONSE_PREFIX, MEDIA_NO_MEDIA_RESPONSE, parseMediaPosition, isMediaSuccess } from '../decoder/messages/admin/media/MediaPosition';
import getPendingReviewOrdersFunction from '../encoder/system/store/personal/orders/getPendingReviewOrders';
import getPendingReceiptOrdersFunction from '../encoder/system/store/personal/orders/getPendingReceiptOrders';
import getPendingPaymentOrdersFunction from '../encoder/system/store/personal/orders/getPendingPaymentOrders';
import getPendingConfirmationOrdersFunction from '../encoder/system/store/personal/orders/getPendingConfirmationOrders';
import type { RoomState } from '../decoder/messages/system/room/BulkDataPacket';
import { parseMediaWhitelistList, MEDIA_WHITELIST_LIST_PREFIX, MEDIA_WHITELIST_ADD_ACK_PREFIXES, MEDIA_WHITELIST_REMOVE_ACK_PREFIXES, MEDIA_WHITELIST_CLEAR_ACK_PREFIXES, type MediaWhitelistEntry } from '../decoder/messages/admin/manage/MediaWhitelist';
import { parseMuteList, parseBlacklistList, isRoomRestrictionAck, SPEECH_RESTRICTION_PREFIX, MUSIC_RESTRICTION_PREFIX, BOTH_RESTRICTION_PREFIX, MUTE_LIST_PREFIX, MUTE_ADD_ACK_PREFIXES, MUTE_REMOVE_ACK_PREFIXES, MUTE_CLEAR_ACK_PREFIXES, BLACKLIST_LIST_PREFIX, BLACKLIST_ADD_ACK_PREFIXES, BLACKLIST_REMOVE_ACK_PREFIXES, BLACKLIST_CLEAR_ACK_PREFIXES, type MuteListEntry } from '../decoder/messages/admin/manage/RoomRestriction';

const DEFAULT_BROADCAST_LIMIT = 10;
const BROADCAST_COUNT_FILE = 'wsdata/broadcastCount.json';

export class Internal
{
  bot: IIROSE_Bot;
  constructor(bot: IIROSE_Bot) { this.bot = bot; }

  async send(data)
  {
    if (data.hasOwnProperty('private'))
    {
      this.bot.sendMessage(`private:${data.private.userId}`, data.private.message);
    } else
    {
      this.bot.sendMessage(this.bot.config.roomId, data.public.message);
    }
  }

  /**
   * 移动到指定房间
   * @param moveData
   * @returns
   */
  async moveRoom(moveData: eventType.move)
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

    // 保存旧房间信息
    this.bot.config.oldRoomId = this.bot.config.roomId;

    // 更新房间配置
    this.bot.config.roomId = roomId;
    this.bot.config.roomPassword = moveData.roomPassword;

    // 使用房间切换方法
    if (this.bot.wsClient)
    {
      await this.bot.wsClient.switchRoom();
      this.bot.loggerInfo(`移动到房间: ${roomId}`);
    }
  }

  kick(kickData: eventType.kickData)
  {
    IIROSE_WSsend(this.bot, kickFunction(kickData.username));
  }

  cutOne(cutOne?: eventType.cutOne)
  {
    (cutOne && cutOne.hasOwnProperty('id')) ? IIROSE_WSsend(this.bot, cutOneFunction(cutOne.id)) : IIROSE_WSsend(this.bot, cutOneFunction());
  }

  cutAll()
  {
    IIROSE_WSsend(this.bot, cutAllFunction());
  }

  /**
   * 快进或快退当前媒体
   * @param operation '<' 快退, '>' 快进
   * @param time 时间，例如 "1s"、"1m"、"1h"
   * @returns 移动后的播放位置秒数，失败或超时返回 null
   */
  async seekMedia(operation: '<' | '>', time: string): Promise<number | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaOperationFunction(operation, time), [MEDIA_POSITION_RESPONSE_PREFIX, MEDIA_NO_MEDIA_RESPONSE]);
    return parseMediaPosition(response ?? '');
  }

  /**
   * 跳转到指定播放位置
   * @param time 时间，例如 "1:30" 或秒数
   * @returns 移动后的播放位置秒数，失败或超时返回 null
   */
  async jumpMedia(time: string): Promise<number | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaGotoFunction(time), [MEDIA_POSITION_RESPONSE_PREFIX, MEDIA_NO_MEDIA_RESPONSE]);
    return parseMediaPosition(response ?? '');
  }

  /**
   * 交换歌单中两首媒体的位置
   * @param id1 媒体ID1，格式为 `index_length`
   * @param id2 媒体ID2，格式为 `index_length`
   */
  exchangeMedia(id1: string, id2: string)
  {
    IIROSE_WSsend(this.bot, mediaExchangeFunction(id1, id2));
  }

  /**
   * 切到下一首媒体
   * @returns 是否收到成功回执；当前无媒体时返回 false
   */
  async nextMedia(): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, cutOneFunction(), [MEDIA_POSITION_RESPONSE_PREFIX, MEDIA_NO_MEDIA_RESPONSE]);
    return isMediaSuccess(response ?? '');
  }

  /**
   * 清空当前房间媒体
   */
  clearMedia()
  {
    IIROSE_WSsend(this.bot, cutAllFunction());
  }

  setMaxUser(setMaxUser?: eventType.setMaxUser)
  {
    (setMaxUser && setMaxUser.hasOwnProperty('maxMember')) ? IIROSE_WSsend(this.bot, setMaxUserFunction(setMaxUser.maxMember)) : IIROSE_WSsend(this.bot, setMaxUserFunction());
  }

  whiteList(whiteList: eventType.whiteList)
  {
    (whiteList && whiteList.hasOwnProperty('intro')) ? IIROSE_WSsend(this.bot, whiteListFunction(whiteList.username, whiteList.time, whiteList.intro)) : IIROSE_WSsend(this.bot, whiteListFunction(whiteList.username, whiteList.time));
  }

  /**
   * 查询当前房间“限制发言&点播”白名单
   */
  async getMediaWhitelist(): Promise<MediaWhitelistEntry[] | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaWhitelistQuery(), [MEDIA_WHITELIST_LIST_PREFIX]);
    if (!response) return null;
    return parseMediaWhitelistList(response) ?? [];
  }

  /**
   * 添加“限制发言&点播”白名单
   * @param username 用户名
   * @param duration 持续时间，例如 "1h"、"1d"
   * @param intro 备注
   */
  async addMediaWhitelist(username: string, duration: string, intro: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaWhitelistAdd(username, duration, intro), MEDIA_WHITELIST_ADD_ACK_PREFIXES);
    return response !== null;
  }

  /**
   * 移除“限制发言&点播”白名单
   * @param uid 用户UID
   */
  async removeMediaWhitelist(uid: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaWhitelistRemove(uid), MEDIA_WHITELIST_REMOVE_ACK_PREFIXES);
    return response !== null;
  }

  /**
   * 清空当前房间“限制发言&点播”白名单
   */
  async clearMediaWhitelist(): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, mediaWhitelistClear(), MEDIA_WHITELIST_CLEAR_ACK_PREFIXES);
    return response !== null;
  }

  /**
   * 设置房间发言限制
   * @param level 0 所有人, 1 普通成员以上, 2 带星成员以上, 3 仅房主, 4 白名单以上, 5 仅白名单
   */
  async setRoomSpeechLevel(level: RoomRestrictionLevel): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, setSpeechRestriction(level), [SPEECH_RESTRICTION_PREFIX]);
    return isRoomRestrictionAck(response ?? '', 'speech', level);
  }

  /**
   * 设置房间点播限制
   * @param level 0 所有人, 1 普通成员以上, 2 带星成员以上, 3 仅房主, 4 白名单以上, 5 仅白名单
   */
  async setRoomMusicLevel(level: RoomRestrictionLevel): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, setMusicRestriction(level), [MUSIC_RESTRICTION_PREFIX]);
    return isRoomRestrictionAck(response ?? '', 'music', level);
  }

  /**
   * 同时设置房间发言和点播限制
   * @param level 0 所有人, 1 普通成员以上, 2 带星成员以上, 3 仅房主, 4 白名单以上, 5 仅白名单
   */
  async setRoomBothLevel(level: RoomRestrictionLevel): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, setBothRestrictions(level), [BOTH_RESTRICTION_PREFIX]);
    return isRoomRestrictionAck(response ?? '', 'both', level);
  }

  /**
   * 查询当前房间禁言列表
   */
  async getMuteList(): Promise<MuteListEntry[] | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, muteListFunction(), [MUTE_LIST_PREFIX]);
    if (!response) return null;
    return parseMuteList(response) ?? [];
  }

  /**
   * 禁言用户
   * @param type 'chat' 禁止发言, 'music' 禁止点播, 'all' 同时禁止
   */
  async muteUser(type: 'chat' | 'music' | 'all', username: string, duration: string, intro: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, muteFunction(type, username, duration, intro), MUTE_ADD_ACK_PREFIXES);
    return response !== null;
  }

  /**
   * 解除禁言
   * @param uid 用户UID
   */
  async unmuteUser(uid: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, unmuteFunction(uid), MUTE_REMOVE_ACK_PREFIXES);
    return response !== null;
  }

  /**
   * 清空当前房间禁言列表
   */
  async clearMuteList(): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, clearMuteListFunction(), MUTE_CLEAR_ACK_PREFIXES);
    return response !== null;
  }

  /**
   * 查询当前房间黑名单
   */
  async getBlacklist(): Promise<MediaWhitelistEntry[] | null>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, blackListQuery(), [BLACKLIST_LIST_PREFIX]);
    if (!response) return null;
    return parseBlacklistList(response) ?? [];
  }

  /**
   * 添加黑名单
   * @param username 用户名
   * @param duration 持续时间，例如 "30m"、"1d"
   * @param intro 备注
   */
  async addBlacklist(username: string, duration: string, intro: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, blackListFunction(username, duration, intro), BLACKLIST_ADD_ACK_PREFIXES);
    return response !== null;
  }

  /**
   * 移除黑名单
   * @param uid 用户UID
   */
  async removeBlacklist(uid: string): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, blackListRemove(uid), BLACKLIST_REMOVE_ACK_PREFIXES);
    return response !== null;
  }

  /**
   * 清空当前房间黑名单
   */
  async clearBlacklist(): Promise<boolean>
  {
    const response = await sendAndWaitForResponsePrefixes(this.bot, blackListClear(), BLACKLIST_CLEAR_ACK_PREFIXES);
    return response !== null;
  }

  broadcast(broadcast: eventType.broadcast)
  {
    IIROSE_WSsend(this.bot, broadcastFunction(broadcast.message, broadcast.color));
  }

  /**
   * 获取今日剩余广播次数
   */
  async getBroadcastRemaining(): Promise<number>
  {
    const cache = await readJsonData(this.bot, BROADCAST_COUNT_FILE);
    const today = this.getTodayDate();
    if (!cache || cache.date !== today || cache.botId !== this.bot.config.uid.trim())
    {
      return DEFAULT_BROADCAST_LIMIT;
    }
    return typeof cache.remaining === 'number' && cache.remaining >= 0
      ? Math.floor(cache.remaining)
      : DEFAULT_BROADCAST_LIMIT;
  }

  /**
   * 收到广播回执后扣减今日剩余次数
   */
  async recordBroadcastAck(): Promise<number>
  {
    const remaining = Math.max(0, await this.getBroadcastRemaining() - 1);
    await writeWJ(this.bot, BROADCAST_COUNT_FILE, {
      botId: this.bot.config.uid.trim(),
      remaining,
      date: this.getTodayDate(),
    });
    return remaining;
  }

  private getTodayDate(): string
  {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  /**
   * 发送当前房间公告
   * @param notice 公告内容
   */
  sendRoomNotice(notice: string)
  {
    IIROSE_WSsend(this.bot, noticeFunction(notice));
  }

  makeMusic(musicOrigin: eventType.musicOrigin)
  {
    this.requestMusic(musicOrigin);
  }

  /**
   * 点歌
   * @param musicOrigin 音乐信息，需要调用方先解析出直链和歌词
   */
  requestMusic(musicOrigin: eventType.musicOrigin)
  {
    const { type, name, signer, cover, link, url, duration, bitRate, color, lyrics, origin } = musicOrigin;
    IIROSE_WSsend(this.bot, mediaData(type, name, signer, cover, link, url, duration, lyrics, origin));
    const mediaCardResult = mediaCard(type, name, signer, cover, color, duration, bitRate, origin);
    IIROSE_WSsend(this.bot, mediaCardResult.data);
  }

  stockBuy(numberData: number)
  {
    IIROSE_WSsend(this.bot, stockBuy(numberData));
  }
  stockSell(numberData: number)
  {
    IIROSE_WSsend(this.bot, stockSell(numberData));
  }

  async stockGet(): Promise<Stock | null>
  {
    // 等待并获取原始响应
    const response = await this.bot.sendAndWaitForResponse(stockGet(), '>', true);
    if (response)
    {
      // 解析响应并返回
      return parseStock(response, this.bot);
    }
    return null;
  }

  async bankGet(): Promise<BankCallback | null>
  {
    // 等待并获取原始响应
    const response = await this.bot.sendAndWaitForResponse(bankGet(), '>$', true);
    if (response)
    {
      // 解析响应，如果解析失败则返回 null
      return parseBankCallback(response, this.bot) || null;
    }
    return null;
  }

  bankDeposit(amount: number)
  {
    IIROSE_WSsend(this.bot, bankDeposit(amount));
  }

  bankWithdraw(amount: number)
  {
    IIROSE_WSsend(this.bot, bankWithdraw(amount));
  }

  async payment(uid: string, money: number, message?: string): Promise<PaymentCallback | null>
  {
    const data = (message) ? payment(uid, money, message) : payment(uid, money);
    const response = await this.bot.sendAndWaitForResponse(data, '|$', true);
    if (response)
    {
      return parsePaymentCallback(response);
    }
    return null;
  }

  /**
   * 点赞用户
   * @param uid 用户uid
   * @param message 附带消息
   */
  sendLike(uid: string, message?: string)
  {
    const data = (message) ? Like(uid, message) : Like(uid);
    IIROSE_WSsend(this.bot, data);
  }

  /**
   * 点踩用户
   * @param uid 用户uid
   * @param message 附带消息
   */
  sendDislike(uid: string, message?: string)
  {
    const data = (message) ? Dislike(uid, message) : Dislike(uid);
    IIROSE_WSsend(this.bot, data);
  }

  /**
   * 关注用户
   * @param uid 用户uid
   */
  followUser(uid: string)
  {
    IIROSE_WSsend(this.bot, Follow(uid));
  }

  /**
   * 取消关注用户
   * @param uid 用户uid
   */
  unfollowUser(uid: string)
  {
    IIROSE_WSsend(this.bot, Unfollow(uid));
  }

  /**
   * 为用户打分
   * @param uid 用户uid
   * @param score 分数
   */
  async gradeUser(uid: string, score: number): Promise<GradeUserCallback | null>
  {
    const response = await this.bot.sendAndWaitForResponse(gradeUser(uid, score), '|_', true);
    if (response)
    {
      return parseGradeUserCallback(response);
    }
    return null;
  }

  /**
   * 取消为用户打分
   * @param uid 用户uid
   */
  async cancelGradeUser(uid: string): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(cancelGradeUser(uid), '|_', true);
    return response === '|_0';
  }

  /**
   * 获取用户动态
   * @param uid 用户uid
   */
  async getUserMomentsByUid(uid: string): Promise<UserMoments | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getUserMomentsByUidFunction(uid), ':*', true);
    if (response)
    {
      return parseUserMoments(response);
    }
    return null;
  }

  async getUserByName(name: string): Promise<Universal.User | undefined>
  {
    // 使用工具函数通过用户名查找用户ID
    const userId = await findUserIdByName(this.bot, name);

    // 如果找到了用户ID，则调用现有的 getUser 方法获取完整的用户信息
    if (userId)
    {
      return this.bot.getUser(userId);
    }

    // 如果未找到，则返回 undefined
    return undefined;
  }

  /**
   * 获取 userlist.json 的内容
   * @returns userlist.json 的解析后数据
   */
  async getUserListFile(): Promise<any>
  {
    return await readJsonData(this.bot, 'wsdata/userlist.json');
  }

  /**
   * 获取 roomlist.json 的内容
   * @returns roomlist.json 的解析后数据
   */
  async getRoomListFile(): Promise<any>
  {
    return await readJsonData(this.bot, 'wsdata/roomlist.json');
  }

  /**
   * 获取 roomState.json 的内容
   * @returns roomState.json 的解析后数据
   */
  async getRoomStateFile(): Promise<RoomState | null>
  {
    return await readJsonData(this.bot, 'wsdata/roomState.json') as RoomState | null;
  }

  /**
   * 获取房间地址
   * @returns {string} 房间ID
   */
  getRoomId(): string
  {
    return this.bot.config.roomId;
  }

  /**
   * 订阅房间
   * @param roomId 房间ID
   */
  subscribeRoom(roomId: string)
  {
    IIROSE_WSsend(this.bot, subscribeRoomFunction(roomId));
  }

  /**
   * 取消订阅房间
   * @param roomId 房间ID
   */
  unsubscribeRoom(roomId: string)
  {
    IIROSE_WSsend(this.bot, unsubscribeRoomFunction(roomId));
  }

  /**
   * 获取用户关注和粉丝列表
   * @param uid 用户uid
   */
  async getFollowList(uid: string): Promise<FollowList | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getFollowAndFansPacket(uid), '|^', true);
    if (response)
    {
      return parseFollowAndFans(response);
    }
    return null;
  }

  /**
   * 获取自身账号信息
   */
  async getSelfInfo(): Promise<SelfInfo | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getSelfInfoFunction(), '$?', true);
    if (response)
    {
      return parseSelfInfo(response);
    }
    return null;
  }

  /**
   * 修改自身账号信息
   * @param profileData 个人资料
   */
  async updateSelfInfo(profileData: ProfileData): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(updateSelfInfoFunction(profileData), '$#', true);
    return response === '$#';
  }

  /**
   * 查询当前频道的歌单
   */
  async getMusicList(): Promise<MediaListItem[] | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getMusicListFunction(), MEDIA_LIST_RESPONSE_PREFIX, true);
    if (response)
    {
      return parseMusicList(response);
    }
    return null;
  }

  /**
   * 查询论坛
   */
  async getForum(): Promise<Forum | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getForumFunction(), ':-', true);
    if (response)
    {
      return parseForum(response);
    }
    return null;
  }

  /**
   * 查询任务
   */
  async getTasks(): Promise<Tasks | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getTasksFunction(), ':+', true);
    if (response)
    {
      return parseTasks(response);
    }
    return null;
  }

  /**
   * 查询朋友圈
   */
  async getMoments(): Promise<Moments | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getMomentsFunction(), ':=', true);
    if (response)
    {
      return parseMoments(response);
    }
    return null;
  }

  /**
   * 查询排行榜
   */
  async getLeaderboard(): Promise<Leaderboard | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getLeaderboardFunction(), '`#', true);
    if (response)
    {
      return parseLeaderboard(response);
    }
    return null;
  }

  /**
   * 查询商店
   */
  async getStore(): Promise<Store | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getStoreFunction(), 'g-', true);
    if (response)
    {
      return parseStore(response);
    }
    return null;
  }

  /**
   * 查询卖家中心
   */
  async getSellerCenter(): Promise<SellerCenter | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getSellerCenterFunction(), 'g+', true);
    if (response)
    {
      return parseSellerCenter(response);
    }
    return null;
  }

  /**
   * 加入购物车
   * @param itemId 商品ID
   */
  async addToCart(itemId: string): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(addToCartFunction(itemId), 'gc', true);
    return response === 'gc';
  }

  /**
   * 移除购物车
   * @param itemId 商品ID
   */
  async removeFromCart(itemId: string): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(removeFromCartFunction(itemId), 'gc', true);
    return response === 'gc';
  }

  /**
   * 查询等待付款的订单
   */
  async getPendingPaymentOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingPaymentOrdersFunction(), 'gu0', true);
  }

  /**
   * 查询待收货的订单
   */
  async getPendingReceiptOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingReceiptOrdersFunction(), 'gu1', true);
  }

  /**
   * 查询等待确认的订单
   */
  async getPendingConfirmationOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingConfirmationOrdersFunction(), 'gu2', true);
  }

  /**
   * 查询等待评价的订单
   */
  async getPendingReviewOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getPendingReviewOrdersFunction(), 'gu3', true);
  }

  /**
   * 查询已完成的订单
   */
  async getCompletedOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getCompletedOrdersFunction(), 'gu4', true);
  }

  /**
   * 查询售后中的订单
   */
  async getAfterSaleOrders(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getAfterSaleOrdersFunction(), 'gu5', true);
  }

  /**
   * 查询收藏夹
   */
  async getFavorites(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getFavoritesFunction(), 'g&', true);
  }

  /**
   * 查询关注店铺
   */
  async getFollowedStores(): Promise<string | null>
  {
    return this.bot.sendAndWaitForResponse(getFollowedStoresFunction(), 'g@', true);
  }

  /**
   * 查询自身余额
   */
  async getBalance(): Promise<number | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getBalanceFunction(), '`$', true);
    if (response)
    {
      return parseBalance(response);
    }
    return null;
  }

  /**
   * 召唤骰子
   * @param diceId 骰子ID (0-7)
   */
  summonDice(diceId: number)
  {
    const data = summonDiceFunction(diceId);
    if (data)
    {
      IIROSE_WSsend(this.bot, data);
    }
  }

  /**
   * 通过用户名获取用户资料
   * @param username 用户名
   */
  async getUserProfileByName(username: string): Promise<UserProfileByName | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getUserProfileByNameFunction(username), '+', true);
    if (response)
    {
      return parseUserProfileByName(response, this.bot);
    }
    return null;
  }

  /**
   * 获取 IIROSE 版本更新日志
   */
  async getChangelog(): Promise<ChangelogData | null>
  {
    try
    {
      const raw = await this.bot.ctx.http.get<string>(CHANGELOG_URL, { responseType: 'text' });
      return parseChangelog(raw);
    } catch (error)
    {
      this.bot.loggerError('获取版本更新日志失败:', error);
      return null;
    }
  }
}

export interface InternalType
{
  moveRoom(moveData: eventType.move): Promise<void>;
  kick(kickData: eventType.kickData): void;
  cutOne(cutOne?: eventType.cutOne): void;
  cutAll(): void;
  seekMedia(operation: '<' | '>', time: string): Promise<number | null>;
  jumpMedia(time: string): Promise<number | null>;
  exchangeMedia(id1: string, id2: string): void;
  nextMedia(): Promise<boolean>;
  clearMedia(): void;
  setMaxUser(setMaxUser?: eventType.setMaxUser): void;
  whiteList(whiteList: eventType.whiteList): void;
  getMediaWhitelist(): Promise<MediaWhitelistEntry[] | null>;
  addMediaWhitelist(username: string, duration: string, intro: string): Promise<boolean>;
  removeMediaWhitelist(uid: string): Promise<boolean>;
  clearMediaWhitelist(): Promise<boolean>;
  setRoomSpeechLevel(level: RoomRestrictionLevel): Promise<boolean>;
  setRoomMusicLevel(level: RoomRestrictionLevel): Promise<boolean>;
  setRoomBothLevel(level: RoomRestrictionLevel): Promise<boolean>;
  getMuteList(): Promise<MuteListEntry[] | null>;
  muteUser(type: 'chat' | 'music' | 'all', username: string, duration: string, intro: string): Promise<boolean>;
  unmuteUser(uid: string): Promise<boolean>;
  clearMuteList(): Promise<boolean>;
  getBlacklist(): Promise<MediaWhitelistEntry[] | null>;
  addBlacklist(username: string, duration: string, intro: string): Promise<boolean>;
  removeBlacklist(uid: string): Promise<boolean>;
  clearBlacklist(): Promise<boolean>;
  broadcast(broadcast: eventType.broadcast): void;
  getBroadcastRemaining(): Promise<number>;
  recordBroadcastAck(): Promise<number>;
  sendRoomNotice(notice: string): void;
  makeMusic(musicOrigin: eventType.musicOrigin): void;
  requestMusic(musicOrigin: eventType.musicOrigin): void;
  stockBuy(numberData: number): void;
  stockSell(numberData: number): void;
  stockGet(): Promise<Stock | null>;
  bankGet(): Promise<BankCallback | null>;
  bankDeposit(amount: number): void;
  bankWithdraw(amount: number): void;
  payment(uid: string, money: number, message?: string): Promise<PaymentCallback | null>;
  sendLike(uid: string, message?: string): void;
  sendDislike(uid: string, message?: string): void;
  followUser(uid: string): void;
  unfollowUser(uid: string): void;
  gradeUser(uid: string, score: number): Promise<GradeUserCallback | null>;
  cancelGradeUser(uid: string): Promise<boolean>;
  getUserMomentsByUid(uid: string): Promise<UserMoments | null>;
  getUserByName(name: string): Promise<Universal.User | undefined>;
  getUserListFile(): Promise<any>;
  getRoomListFile(): Promise<any>;
  getRoomStateFile(): Promise<RoomState | null>;
  getRoomId(): string;
  subscribeRoom(roomId: string): void;
  unsubscribeRoom(roomId: string): void;
  getFollowList(uid: string): Promise<FollowList | null>;
  getSelfInfo(): Promise<SelfInfo | null>;
  updateSelfInfo(profileData: ProfileData): Promise<boolean>;
  getMusicList(): Promise<MediaListItem[] | null>;
  getForum(): Promise<Forum | null>;
  getTasks(): Promise<Tasks | null>;
  getMoments(): Promise<Moments | null>;
  getLeaderboard(): Promise<Leaderboard | null>;
  getStore(): Promise<Store | null>;
  getSellerCenter(): Promise<SellerCenter | null>;
  addToCart(itemId: string): Promise<boolean>;
  removeFromCart(itemId: string): Promise<boolean>;
  getPendingPaymentOrders(): Promise<string | null>;
  getPendingReceiptOrders(): Promise<string | null>;
  getPendingConfirmationOrders(): Promise<string | null>;
  getPendingReviewOrders(): Promise<string | null>;
  getCompletedOrders(): Promise<string | null>;
  getAfterSaleOrders(): Promise<string | null>;
  getFavorites(): Promise<string | null>;
  getFollowedStores(): Promise<string | null>;
  getBalance(): Promise<number | null>;
  summonDice(diceId: number): void;
  getUserProfileByName(username: string): Promise<UserProfileByName | null>;
  getChangelog(): Promise<ChangelogData | null>;
}
