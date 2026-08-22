import type { Internal } from './base';
import { IIROSE_WSsend } from '../../utils/ws';
import getForumFunction from '../../encoder/system/forum/getForum';
import getTasksFunction from '../../encoder/system/tasks/getTasks';
import getMomentsFunction from '../../encoder/user/moments/getMoments';
import getLeaderboardFunction from '../../encoder/system/leaderboard/getLeaderboard';
import summonDiceFunction from '../../encoder/system/summonDice';
import getUserListFunction from '../../encoder/system/GetUserList';
import { CHANGELOG_URL, ChangelogData, parseChangelog } from '../../utils/changelog';
import { Forum, parseForum } from '../../decoder/messages/system/forum/Forum';
import { Tasks, parseTasks } from '../../decoder/messages/system/tasks/Tasks';
import { Moments, parseMoments } from '../../decoder/messages/user/moments/Moments';
import { Leaderboard, parseLeaderboard } from '../../decoder/messages/system/leaderboard/Leaderboard';

export const systemMethods = {
  requestUserList(this: Internal)
  {
    IIROSE_WSsend(this.bot, getUserListFunction());
  },

  async getForum(this: Internal): Promise<Forum | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getForumFunction(), ':-', true);
    if (response)
    {
      return parseForum(response);
    }
    return null;
  },

  async getTasks(this: Internal): Promise<Tasks | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getTasksFunction(), ':+', true);
    if (response)
    {
      return parseTasks(response);
    }
    return null;
  },

  async getMoments(this: Internal): Promise<Moments | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getMomentsFunction(), ':=', true);
    if (response)
    {
      return parseMoments(response);
    }
    return null;
  },

  async getLeaderboard(this: Internal): Promise<Leaderboard | null>
  {
    const response = await this.bot.sendAndWaitForResponse(getLeaderboardFunction(), '`#', true);
    if (response)
    {
      return parseLeaderboard(response);
    }
    return null;
  },

  summonDice(this: Internal, diceId: number)
  {
    const data = summonDiceFunction(diceId);
    if (data)
    {
      IIROSE_WSsend(this.bot, data);
    }
  },

  async getChangelog(this: Internal): Promise<ChangelogData | null>
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
  },
};
