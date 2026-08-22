import { Context, Bot, Fragment, Universal, Logger, Session } from 'koishi';

import { readJsonData, findRoomInGuild, flattenRooms, findUserNameById, Unknown_User_Name, Unknown_Guild_Name, Unknown_Channel_Name } from '../utils/utils';
import { IIROSE_BotMessageEncoder } from './sendMessage';
import { IIROSE_WSsend, WsClient } from '../utils/ws';
import { Internal, InternalType } from './internal';
import { comparePassword } from '../utils/password';
import { SendOptions } from '@satorijs/protocol';
import { SessionCache } from '../utils/sessionCache';
import kick from '../encoder/admin/manage/kick';
import mute from '../encoder/admin/manage/mute';
import { Stock } from '../decoder/messages/system/consume/Stock';
import { BankCallback } from '../decoder/messages/system/consume/BankCallback';
import { Config } from '../config';

export class IIROSE_Bot extends Bot<Context>
{
  static MessageEncoder = IIROSE_BotMessageEncoder;

  platform: string = 'iirose';
  socket: WebSocket | undefined = undefined;
  public messageIdResolvers: ((messageId: string) => void)[] = [];
  public responseQueue: {
    resolver: (data: string | null) => void;
    timer: () => void;
  }[] = [];

  public responseListeners = new Map<string, { listener: (data: string) => void, stopPropagation: boolean; }>();

  static inject = ['assets'];

  public wsClient: WsClient;
  public readonly config: Config;
  public sessionCache: SessionCache;
  private isStarting: boolean = false;
  private isStarted: boolean = false;
  private disposed: boolean = false;
  private userInfoTimeout: (() => void) | null = null;
  private lastStockData: Stock | null = null;
  private lastBankData: BankCallback | null = null;
  public logger: Logger;
  public userLeaveTimers = new Map<string, () => void>();
  public userJoinTimers = new Map<string, () => void>();

  constructor(public ctx: Context, config: Config)
  {
    super(ctx, {}, 'iirose-bot');

    this.platform = 'iirose';
    this.config = config;
    this.logger = new Logger(`DEV:adapter-iirose`);
    this.sessionCache = new SessionCache(config.sessionCacheSize);

    // 重置状态
    this.isStarting = false;
    this.isStarted = false;
    this.disposed = false;
    this.userInfoTimeout = null;

    this.wsClient = new WsClient(ctx, this);

    if (this.config.smStart && comparePassword(this.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
    {
      this.selfId = this.config.smUid;
      this.userId = this.config.smUid;
    } else
    {
      this.selfId = this.config.uid;
      this.userId = this.config.uid;
    }
  }

  public loggerError(message: any, ...args: any[]): void
  {
    this.ctx.logger.error(`[${this.config.uid}]`, message, ...args);
  }

  public loggerInfo(message: any, ...args: any[]): void
  {
    this.ctx.logger.info(`[${this.config.uid}]`, message, ...args);
  }

  public loggerWarn(message: any, ...args: any[]): void
  {
    this.ctx.logger.warn(`[${this.config.uid}]`, message, ...args);
  }

  public logInfo(message: any, ...args: any[]): void
  {
    if (this.config.debugMode)
    {
      this.logger.info(`[${this.config.uid}]`, message, ...args);
    }
  }

  public fulllogInfo(message: any, ...args: any[]): void
  {
    if (this.config.fullDebugMode)
    {
      this.logger.info(`[${this.config.uid}]`, message, ...args);
    }
  }

  setDisposing(disposing: boolean)
  {
    this.disposed = disposing;
    // 将停用状态传递给 WebSocket 客户端
    if (this.wsClient && this.wsClient.setDisposing)
    {
      this.wsClient.setDisposing(disposing);
    }
  }

  async start()
  {

    // 检查是否正在停用
    if (this.disposed)
    {
      return;
    }

    // 防止重复启动
    if (this.isStarting || this.isStarted)
    {
      return;
    }

    this.isStarting = true;

    try
    {
      // 设置为连接中状态
      this.status = Universal.Status.CONNECT;

      // 启动 WebSocket 连接
      await this.wsClient.start();

      this.isStarted = true;

    } catch (error)
    {
      // 如果插件正在停用，不记录错误
      if (!this.disposed)
      {
        this.loggerError('机器人启动失败:', error);
      } else
      {
      }
      this.isStarted = false;
    } finally
    {
      this.isStarting = false;
    }
  }

  async stop()
  {
    // 如果已经停止，直接返回
    if (this.disposed)
    {
      return;
    }

    // 立即设置停用状态
    this.setDisposing(true);

    // 重置状态
    this.isStarting = false;
    this.isStarted = false;

    // 立即清理定时器
    if (this.userInfoTimeout)
    {
      this.userInfoTimeout();
      this.userInfoTimeout = null;
    }

    // 清理所有用户离开计时器
    this.userLeaveTimers.forEach(dispose => dispose());
    this.userLeaveTimers.clear();

    // 清理所有用户加入计时器
    this.userJoinTimers.forEach(dispose => dispose());
    this.userJoinTimers.clear();

    // 立即下线
    this.offline();

    const session = this.session({
      type: 'login-removed',
      platform: this.platform,
      selfId: this.selfId,
    });
    this.dispatch(session);
    this.fulllogInfo('login-removed', session);

    // 停止 WebSocket 连接
    if (this.wsClient)
    {
      // 使用 Promise.race 限制等待时间
      await Promise.race([
        this.wsClient.stop(),
        new Promise(resolve => this.ctx.setTimeout(() => resolve(undefined), 500)) // 最多等待500ms
      ]);
    }
  }

  async sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {
    if (!channelId)
    {
      return [];
    }
    const encoder = new IIROSE_BotMessageEncoder(this, channelId, guildId, options);
    const messages = await encoder.send(content);
    return messages.map(m => m.id);
  }

  async sendPrivateMessage(userId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {
    return this.sendMessage(`private:${userId}`, content);
  }

  online()
  {
    super.online();
    // 派发 login-updated 事件
    const session = this.session({
      type: 'login-updated',
      platform: this.platform,
      selfId: this.selfId,
    });
    this.dispatch(session);
    this.fulllogInfo('login-updated', session);
  }

  async getSelf(): Promise<Universal.User>
  {
    const user = await this.getUser(this.selfId);
    if (user.name !== Unknown_User_Name)
    {
      return user;
    }

    // userlist 缺失或 selfId 不一致时，用登录名回退，避免 WebUI 显示 Unknown User
    const username = this.wsClient?.loginObj?.n || (this.config.smStart ? this.config.smUsername : this.config.usename);
    return {
      id: this.selfId,
      name: username || this.user?.name || Unknown_User_Name,
      avatar: this.user?.avatar,
    };
  }

  /**
   * 发送一个WebSocket请求并等待对应的响应
   * @param payload 要发送的数据
   * @param timeout 超时时间 (毫秒)
   * @returns 返回一个Promise，该Promise会解析为响应字符串，或在超时/失败时解析为null
   */
  public requestResponse(payload: string, timeout?: number): Promise<string | null>
  {
    const effectiveTimeout = timeout ?? this.config.timeout;

    return new Promise((resolve) =>
    {
      IIROSE_WSsend(this, payload);

      const timer = this.ctx.setTimeout(() =>
      {
        // 超时，从队列中移除，null
        const index = this.responseQueue.findIndex(p => p.timer === timer);
        if (index > -1)
        {
          this.responseQueue.splice(index, 1);
        }
        resolve(null);
      }, effectiveTimeout);

      this.responseQueue.push({
        resolver: (data) =>
        {
          timer(); // 取消计时器
          resolve(data);
        },
        timer,
      });
    });
  }

  /**
   * 处理一个进入的响应，并将其分发到响应队列中的第一个等待者
   * @param data 响应数据
   * @returns 如果消息被处理，则返回true
   */
  public handleResponse(data: string): boolean
  {
    const request = this.responseQueue.shift();
    if (request)
    {
      request.timer(); // 取消计时器
      request.resolver(data);
      return true;
    }
    return false;
  }

  /**
   * 发送一个WebSocket消息并等待一个具有特定前缀的响应
   * @param payload 要发送的数据
   * @param responsePrefix 期望的响应前缀
   * @param stopPropagation 是否在匹配到响应后停止消息的进一步传播，默认为 true
   * @param timeout 超时时间 (毫秒)
   * @returns 返回一个Promise，该Promise会解析为响应字符串，或在超时时解析为null
   */
  public sendAndWaitForResponse(payload: string, responsePrefix: string, stopPropagation: boolean = true, timeout?: number): Promise<string | null>
  {
    const effectiveTimeout = timeout ?? this.config.timeout;

    return new Promise((resolve) =>
    {
      const dispose = this.ctx.setTimeout(() =>
      {
        this.responseListeners.delete(responsePrefix);
        resolve(null); // 超时，解析为 null
      }, effectiveTimeout);

      this.responseListeners.set(responsePrefix, {
        listener: (data: string) =>
        {
          dispose(); // 取消计时器
          this.responseListeners.delete(responsePrefix); // clean up after resolving
          resolve(data);
        },
        stopPropagation: stopPropagation
      });

      IIROSE_WSsend(this, payload);
    });
  }

  async getUser(userId: string): Promise<Universal.User>
  {
    const userlist = await readJsonData(this, 'wsdata/userlist.json');
    if (!userlist)
    {
      return { id: userId, name: Unknown_User_Name };
    }
    const user = userlist.find(u => u.uid === userId);
    if (!user)
    {
      return { id: userId, name: Unknown_User_Name };
    }
    return {
      id: user.uid,
      name: user.username,
      avatar: user.avatar,
    };
  }

  async getGuildMember(guildId: string, userId: string): Promise<Universal.GuildMember>
  {
    const user = await this.getUser(userId);
    //  返回基础用户信息
    return {
      ...user,
      // roles: [],
    };
  }

  async getGuildMemberList(guildId: string, next?: string): Promise<Universal.List<Universal.GuildMember>>
  {
    const userlist = await readJsonData(this, 'wsdata/userlist.json');
    if (!userlist) return { data: [] };

    const members = userlist
      .filter(u => u.room === guildId)
      .map(u => ({
        id: u.uid,
        name: u.username,
        avatar: u.avatar,
      }));

    return { data: members };
  }

  async getGuild(guildId: string): Promise<Universal.Guild>
  {
    const roomlist = await readJsonData(this, 'wsdata/roomlist.json');
    if (!roomlist) return { id: guildId, name: Unknown_Guild_Name };

    const guild = findRoomInGuild(roomlist, guildId);
    if (!guild) return { id: guildId, name: Unknown_Guild_Name };

    return {
      id: guild.id,
      name: guild.name,
    };
  }

  async getGuildList(next?: string): Promise<Universal.List<Universal.Guild>>
  {
    // 机器人所在群组列表，只有一个：当前聊天室
    const currentRoomId = this.config.roomId;
    const guild = await this.getGuild(currentRoomId);
    return { data: [guild] };
  }

  async getFriendList(next?: string): Promise<Universal.List<Universal.User>>
  {
    // 没有好友的概念
    return null;
  }

  async handleFriendRequest(messageId: string, approve: boolean, comment?: string): Promise<void>
  {
    // 所有用户都可以直接私聊
  }

  async getChannel(channelId: string): Promise<Universal.Channel>
  {
    if (channelId.startsWith('private:'))
    {
      const userId = channelId.substring(8);
      const user = await this.getUser(userId);
      return {
        id: channelId,
        name: user.name,
        type: Universal.Channel.Type.DIRECT,
      };
    }

    const roomId = channelId;
    const roomlist = await readJsonData(this, 'wsdata/roomlist.json');
    if (!roomlist) return { id: roomId, name: Unknown_Channel_Name, type: Universal.Channel.Type.TEXT };

    const room = findRoomInGuild(roomlist, roomId);
    if (!room) return { id: roomId, name: Unknown_Channel_Name, type: Universal.Channel.Type.TEXT };

    return {
      id: room.id,
      name: room.name,
      type: Universal.Channel.Type.TEXT,
    };
  }

  async getChannelList(guildId: string): Promise<Universal.List<Universal.Channel>>
  {
    const roomlist = await readJsonData(this, 'wsdata/roomlist.json');
    if (!roomlist) return { data: [] };

    // 查找对应的社区（Guild）
    const guildData = findRoomInGuild(roomlist, guildId);
    if (!guildData) return { data: [] };

    // 将该社区下的所有房间（包括子房间）扁平化
    const channels = flattenRooms(guildData).map(room => ({
      id: room.id,
      name: room.name,
      type: Universal.Channel.Type.TEXT,
    }));

    return { data: channels };
  }

  async getMessage(channelId: string, messageId: string): Promise<Universal.Message>
  {
    const session = this.sessionCache.findById(messageId);
    if (session)
    {
      return {
        id: session.messageId,
        messageId: session.messageId,
        content: session.content,
        channel: {
          id: session.channelId,
          type: session.channelId.startsWith('private:') ? Universal.Channel.Type.DIRECT : Universal.Channel.Type.TEXT,
        },
        guild: session.guildId ? { id: session.guildId } : undefined,
        user: session.author,
        timestamp: session.timestamp,
        quote: session.quote,
      };
    }
    return undefined;
  }

  getMessageKeys(): string[]
  {
    return this.sessionCache.getAllMessageIds();
  }

  /**
   * 获取频道消息列表
   * @param channelId 频道 ID
   * @param next 分页令牌，未指定时视为从最新消息向前获取（本实现中忽略此参数）
   * @param direction 消息获取方向，可以为 'before' | 'after' | 'around'
   * @returns 消息列表
   */
  async getMessageList(channelId: string, next?: string, direction: 'before' | 'after' | 'around' = 'before'): Promise<Universal.List<Universal.Message>>
  {
    // 从缓存中获取所有消息
    const allSessions = this.sessionCache.getAllMessageIds().map(id => this.sessionCache.findById(id)).filter(Boolean) as Session[];

    // 过滤出指定频道的消息
    const channelSessions = allSessions.filter(session => session.channelId === channelId);

    // 根据方向排序消息
    let sortedSessions: Session[];
    if (direction === 'after')
    {
      // 按时间正序（从旧到新）
      sortedSessions = [...channelSessions].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    } else
    {
      // 默认按时间倒序（从新到旧）
      sortedSessions = [...channelSessions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    // 转换为消息格式
    const messages = sortedSessions.map(session => ({
      id: session.messageId,
      messageId: session.messageId,
      content: session.content,
      channel: {
        id: session.channelId,
        type: session.channelId.startsWith('private:') ? Universal.Channel.Type.DIRECT : Universal.Channel.Type.TEXT,
      },
      guild: session.guildId ? { id: session.guildId } : undefined,
      user: {
        id: session.userId,
        name: session.username,
      },
      timestamp: session.timestamp,
      quote: session.quote,
    }));

    return { data: messages };
  }

  async kickGuildMember(guildId: string, userId: string, permanent?: boolean): Promise<void>
  {
    // 从 userlist.json 获取用户名
    const userName = await findUserNameById(this, userId);

    // 如果成功获取用户名，则执行踢出操作
    if (userName)
    {
      await IIROSE_WSsend(this, kick(userName));
    } else
    {
      this.loggerWarn(`无法找到用户ID: ${userId} 对应的用户名，无法执行踢出操作。`);
    }
  }

  async muteGuildMember(guildId: string, userId: string, duration: number, reason?: string): Promise<void>
  {
    // 从 userlist.json 获取用户名
    const userName = await findUserNameById(this, userId);

    // 如果成功获取用户名，则执行禁言操作
    if (userName)
    {
      let time: string;

      // 永久禁言
      if ((duration / 1000) > 99999)
      {
        time = '&';
      } else
      {
        time = String(duration / 1000);
      }

      if (reason == undefined)
      {
        reason = '';
      }

      await IIROSE_WSsend(this, mute('all', userName, time, reason));
    } else
    {
      this.loggerWarn(`无法找到用户ID: ${userId} 对应的用户名，无法执行禁言操作。`);
    }
  }

  async deleteMessage(channelId: string, messageId: string | string[]): Promise<void>
  {
    try
    {
      await new Promise(resolve => this.ctx.setTimeout(() => resolve(undefined), this.config.deleteMessageDelay));

      // 如果是数组，逐个撤回
      if (Array.isArray(messageId))
      {
        for (const id of messageId)
        {
          await this.deleteSingleMessage(channelId, id);
        }
      } else
      {
        // 单个消息撤回
        await this.deleteSingleMessage(channelId, messageId);
      }
    } catch (error)
    {
      this.loggerError('删除消息失败:', error);
    }
  }

  // 撤回单个消息
  private async deleteSingleMessage(channelId: string, messageId: string): Promise<boolean>
  {
    try
    {
      // 根据频道类型确定撤回命令格式
      let deleteCommand: string;
      if (channelId.startsWith('private:'))
      {
        const userId = channelId.split(":")[1];
        deleteCommand = `v0*${userId}#${messageId}`;
      } else
      {
        deleteCommand = `v0#${messageId}`;
      }

      this.logInfo(`[撤回消息开始] 频道: ${channelId}, 消息ID: ${messageId}`);

      if (this.socket && this.socket.readyState === WebSocket.OPEN)
      {
        await IIROSE_WSsend(this, deleteCommand);
        return true;
      } else
      {
        this.loggerWarn('WebSocket连接未就绪，无法撤回消息');
        return false;
      }
    } catch (error)
    {
      this.loggerError(`撤回消息失败 (channelId: ${channelId}, messageId: ${messageId}):`, error);
      return false;
    }
  }

  internal: InternalType = new Internal(this);

  public handleStockUpdate(newStockData: Stock)
  {
    if (JSON.stringify(this.lastStockData) !== JSON.stringify(newStockData))
    {
      this.lastStockData = newStockData;
      this.logInfo('iirose/stock-update', newStockData);
      this.ctx.emit('iirose/stock-update', newStockData);
    }
  }

  public handleBankUpdate(newBankData: BankCallback)
  {
    if (JSON.stringify(this.lastBankData) !== JSON.stringify(newBankData))
    {
      this.lastBankData = newBankData;
      this.logInfo('iirose/bank-update', newBankData);
      this.ctx.emit('iirose/bank-update', newBankData);
    }
  }
}
