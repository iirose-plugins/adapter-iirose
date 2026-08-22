import type { Internal } from './base';
import { Universal } from 'koishi';
import { IIROSE_WSsend } from '../../utils/ws';
import { findUserIdByName, readJsonData, writeWJ } from '../../utils/utils';
import Like from '../../encoder/user/like/Like';
import Dislike from '../../encoder/user/like/Dislike';
import Follow from '../../encoder/user/follow/Follow';
import Unfollow from '../../encoder/user/follow/Unfollow';
import { gradeUser, cancelGradeUser } from '../../encoder/user/grade';
import getUserMomentsByUidFunction from '../../encoder/user/moments/getUserMomentsByUid';
import getSelfInfoFunction from '../../encoder/user/profile/getSelfInfo';
import updateSelfInfoFunction, { ProfileData } from '../../encoder/user/profile/updateSelfInfo';
import getUserProfileByNameFunction from '../../encoder/user/profile/getUserProfileByName';
import { getFollowAndFansPacket, parseFollowAndFans, FollowList } from '../../encoder/user/follow/followList';
import { GradeUserCallback, parseGradeUserCallback } from '../../decoder/messages/user/grade/GradeUserCallback';
import { UserMoments, parseUserMoments } from '../../decoder/messages/user/moments/UserMoments';
import { SelfInfo, parseSelfInfo } from '../../decoder/messages/user/profile/SelfInfo';
import { parseUserProfileByName, UserProfileByName } from '../../decoder/messages/user/profile/UserProfileByName';

export const userMethods = {
  sendLike(this: Internal, uid: string, message?: string)
  {
    const data = (message) ? Like(uid, message) : Like(uid);
    IIROSE_WSsend(this.bot, data);
  },

  sendDislike(this: Internal, uid: string, message?: string)
  {
    const data = (message) ? Dislike(uid, message) : Dislike(uid);
    IIROSE_WSsend(this.bot, data);
  },

  followUser(this: Internal, uid: string)
  {
    IIROSE_WSsend(this.bot, Follow(uid));
  },

  unfollowUser(this: Internal, uid: string)
  {
    IIROSE_WSsend(this.bot, Unfollow(uid));
  },

  async gradeUser(this: Internal, uid: string, score: number): Promise<GradeUserCallback | null>
  {
    const response = await this.bot.sendAndWaitForResponse(gradeUser(uid, score), '|_', true);
    if (response)
    {
      return parseGradeUserCallback(response);
    }
    return null;
  },

  async cancelGradeUser(this: Internal, uid: string): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(cancelGradeUser(uid), '|_', true);
    return response === '|_0';
  },

  async getUserMomentsByUid(this: Internal, uid: string): Promise<UserMoments | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getUserMomentsByUidFunction(uid), ':*', true);
    if (response)
    {
      return parseUserMoments(response);
    }
    return null;
  },

  async getUserByName(this: Internal, name: string): Promise<Universal.User | undefined>
  {
    const userId = await findUserIdByName(this.bot, name);
    if (userId)
    {
      return this.bot.getUser(userId);
    }
    return undefined;
  },

  async getUserListFile(this: Internal): Promise<any>
  {
    return await readJsonData(this.bot, 'wsdata/userlist.json');
  },

  async getFollowList(this: Internal, uid: string): Promise<FollowList | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getFollowAndFansPacket(uid), '|^', true);
    if (response)
    {
      return parseFollowAndFans(response);
    }
    return null;
  },

  async getSelfInfo(this: Internal): Promise<SelfInfo | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getSelfInfoFunction(), '$?', true);
    if (!response) return null;

    const info = parseSelfInfo(response);
    if (!info) return null;

    this.bot.user.name = info.username || this.bot.user.name;
    this.bot.user.avatar = info.avatar || this.bot.user.avatar;
    if (info.uid)
    {
      this.bot.selfId = info.uid;
      this.bot.userId = info.uid;
    }

    const userlist = await readJsonData(this.bot, 'wsdata/userlist.json');
    if (Array.isArray(userlist))
    {
      const index = userlist.findIndex((user: { uid?: string }) => user?.uid === info.uid);
      const selfEntry = {
        avatar: info.avatar,
        username: info.username,
        color: index >= 0 ? userlist[index].color : this.bot.config.color,
        room: index >= 0 ? userlist[index].room : this.bot.wsClient?.loginObj?.r || this.bot.config.roomId,
        uid: info.uid,
      };
      if (index >= 0)
      {
        userlist[index] = selfEntry;
      } else
      {
        userlist.push(selfEntry);
      }
      await writeWJ(this.bot, 'wsdata/userlist.json', userlist);
    }

    this.bot.logInfo('机器人自身信息已更新', info);
    return info;
  },

  async updateSelfInfo(this: Internal, profileData: ProfileData): Promise<boolean>
  {
    const response = await this.bot.sendAndWaitForResponse(updateSelfInfoFunction(profileData), '$#', true);
    return response === '$#';
  },

  async getUserProfileByName(this: Internal, username: string): Promise<UserProfileByName | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getUserProfileByNameFunction(username), '+', true);
    if (response)
    {
      return parseUserProfileByName(response, this.bot);
    }
    return null;
  },
};
