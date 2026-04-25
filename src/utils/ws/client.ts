import { Context, Universal } from 'koishi';
import { IIROSE_Bot } from '../../bot/bot';
import { LoginObj } from './types';
import { prepareConnection, createLoginObj } from './connection';
import { setupMessageHandler } from './message';
import { startHeartbeat } from './heartbeat';
import { IIROSE_WSsend } from './send';
import { startEventsServer, stopEventsServer } from '../utils';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export class WsClient
{
  private event: (() => boolean)[] = [];
  private ctx: Context;
  private bot: IIROSE_Bot;
  private isStarting: boolean = false;
  private isStarted: boolean = false;
  private disposed: boolean = false;

  live: (() => void) | null = null;
  private reconnectTimer: (() => void) | null = null;
  private retryCount: number = 0;

  loginObj: LoginObj;

  firstLogin: boolean = false;
  loginSuccess: boolean = false;
  isReconnecting: boolean = false;

  constructor(ctx: Context, bot: IIROSE_Bot)
  {
    this.ctx = ctx;
    this.bot = bot;

    this.isStarting = false;
    this.isStarted = false;
    this.disposed = false;
    this.live = null;
    this.reconnectTimer = null;
    this.event = [];
  }

  setDisposing(disposing: boolean)
  {
    this.disposed = disposing;
  }

  /**
   * 准备ws通信
   */
  async prepare(): Promise<WebSocket>
  {
    const socket = await prepareConnection(
      this.ctx,
      this.bot,
      () => this.disposed
    );

    this.bot.socket = socket;
    this.loginObj = createLoginObj(this.bot);

    socket.addEventListener('open', async () =>
    {
      this.bot.loggerInfo('正在登录中...');

      try
      {
        const loginPack = '*' + JSON.stringify(this.loginObj);
        await IIROSE_WSsend(this.bot, loginPack);

        this.event = startEventsServer(this.bot);

        if (this.live)
        {
          this.live();
          this.live = null;
        }

        if (this.bot.config.keepAliveEnable)
        {
          this.startHeartbeat();
        }
      } catch (error)
      {
        this.bot.loggerError('登录包发送失败:', error);
        if (socket.readyState === 1)
        {
          socket.close();
        }
      }
    });

    return socket;
  }

  /**
   * 接受ws通信
   */
  accept()
  {
    this.firstLogin = false;
    this.loginSuccess = false;
    this.isReconnecting = false;

    setupMessageHandler(this.bot, this.loginObj, () =>
    {
      this.firstLogin = true;
      this.loginSuccess = true;
    });
  }

  /**
   * 开始ws通信
   */
  async start()
  {
    if (this.disposed)
    {
      return;
    }

    if (this.isStarting || this.isStarted)
    {
      return;
    }

    this.isStarting = true;

    try
    {
      if (this.bot.status !== Universal.Status.RECONNECT)
      {
        this.bot.status = Universal.Status.CONNECT;
      }

      this.cleanup();

      this.bot.socket = await this.prepare();

      if (!this.bot.socket)
      {
        throw new Error('WebSocket连接创建失败');
      }

      this.accept();
      this.setupEventListeners();
      this.isStarted = true;
    } catch (error)
    {
      if (!this.disposed)
      {
        this.bot.loggerError('WebSocket启动失败:', error);
      }
      this.isStarted = false;

      if (!this.disposed)
      {
        throw error;
      }
    } finally
    {
      this.isStarting = false;
    }
  }

  /**
   * 清理连接和定时器
   */
  private cleanup()
  {
    if (this.live)
    {
      this.live();
      this.live = null;
    }

    if (this.reconnectTimer)
    {
      this.reconnectTimer();
      this.reconnectTimer = null;
    }

    if (this.event.length > 0)
    {
      stopEventsServer(this.event);
      this.event = [];
    }

    if (this.bot.socket)
    {
      this.bot.socket.removeEventListener('open', () => { });
      this.bot.socket.removeEventListener('message', () => { });
      this.bot.socket.removeEventListener('close', () => { });
      this.bot.socket.removeEventListener('error', () => { });

      if (this.bot.socket.readyState === 1 || this.bot.socket.readyState === 0)
      {
        this.bot.socket.close();
      }
      this.bot.socket = undefined;
    }
  }

  /**
   * 设置WebSocket事件监听器
   */
  private setupEventListeners()
  {
    if (!this.bot.socket) return;

    this.bot.socket.addEventListener('error', (error) =>
    {
      this.bot.loggerError('WebSocket 连接错误:', error);
      if (!this.disposed)
      {
        this.handleConnectionLoss();
      }
    });

    this.bot.socket.addEventListener('close', async (event) =>
    {
      const code = event.code;

      if (
        this.bot.status == Universal.Status.RECONNECT ||
        this.bot.status == Universal.Status.DISCONNECT ||
        this.bot.status == Universal.Status.OFFLINE ||
        code == 1000 ||
        this.disposed
      )
      {
        if (!this.isReconnecting)
        {
          this.bot.logInfo("websocket停止：正常关闭，不重连");
        }
        return;
      }

      if (this.isReconnecting)
      {
        return;
      }

      this.bot.loggerWarn(`websocket异常关闭，代码: ${code}`);
      this.handleConnectionLoss();
    });
  }

  /**
   * 启动心跳保活机制
   */
  private startHeartbeat()
  {
    if (this.live)
    {
      this.live();
    }

    this.live = startHeartbeat(
      this.ctx,
      this.bot,
      () => this.disposed,
      () => this.handleConnectionLoss()
    );
  }

  /**
   * 处理连接丢失，执行重连逻辑
   */
  private handleConnectionLoss()
  {
    if (this.isReconnecting || this.disposed)
    {
      return;
    }

    if (!this.bot.config.silentRetry || this.bot.config.debugMode)
    {
      this.bot.loggerWarn(`检测到连接丢失，准备重连 实例: ${this.bot.user?.id}`);
    }

    this.isReconnecting = true;
    this.isStarting = false;
    this.isStarted = false;
    this.bot.status = Universal.Status.RECONNECT;

    this.cleanup();

    const delayMs = this.calculateRetryDelay();
    const delaySec = Math.round(delayMs / 1000);

    this.reconnectTimer = this.ctx.setTimeout(async () =>
    {
      if (this.disposed)
      {
        this.isReconnecting = false;
        return;
      }

      try
      {
        if (!this.bot.config.silentRetry || this.bot.config.debugMode)
        {
          this.bot.loggerInfo(`开始重连 实例: ${this.bot.user?.id}`);
        }
        this.bot.status = Universal.Status.CONNECT;

        await this.start();
        this.isReconnecting = false;
        this.retryCount = 0;
      } catch (error)
      {
        if (!this.disposed)
        {
          if (!this.bot.config.silentRetry || this.bot.config.debugMode)
          {
            this.bot.loggerError(`重连失败 实例: ${this.bot.user?.id}:`, error);
          }
          this.isReconnecting = false;
          this.retryCount++;

          this.ctx.setTimeout(() =>
          {
            if (!this.disposed)
            {
              this.handleConnectionLoss();
            }
          }, 100);
        } else
        {
          this.isReconnecting = false;
        }
      }
    }, delayMs);

    if (!this.bot.config.silentRetry || this.bot.config.debugMode)
    {
      this.bot.loggerInfo(`将在${delaySec}秒后尝试重连...`);
    }
  }

  /**
   * 计算重试延迟
   */
  private calculateRetryDelay(): number
  {
    const baseDelay = 5000;
    const increment = 5000;
    const maxDelay = this.bot.config.maxRetryInterval * 60 * 1000;

    const delay = baseDelay + (this.retryCount * increment);
    return Math.min(delay, maxDelay);
  }

  /**
   * 关闭ws通信
   */
  async stop()
  {
    this.setDisposing(true);

    if (!this.isReconnecting)
    {
      this.bot.status = Universal.Status.DISCONNECT;
    }

    this.isStarting = false;
    this.isStarted = false;

    if (this.live)
    {
      this.live();
      this.live = null;
    }

    if (this.reconnectTimer)
    {
      this.reconnectTimer();
      this.reconnectTimer = null;
    }

    if (this.event.length > 0)
    {
      stopEventsServer(this.event);
      this.event = [];
    }

    if (this.bot.socket)
    {
      this.bot.socket.removeEventListener('open', () => { });
      this.bot.socket.removeEventListener('message', () => { });
      this.bot.socket.removeEventListener('close', () => { });
      this.bot.socket.removeEventListener('error', () => { });

      if (this.bot.socket.readyState === 1 || this.bot.socket.readyState === 0)
      {
        this.bot.socket.close(1000, 'Plugin disposing');
      }
      this.bot.socket = undefined;
    }
  }

  /**
   * 切换房间
   */
  async switchRoom()
  {
    const wasReconnecting = this.isReconnecting;

    this.isReconnecting = true;
    this.isStarting = false;
    this.isStarted = false;

    this.cleanup();
    try
    {
      await this.start();
    } catch (error)
    {
      this.bot.loggerError('房间切换失败:', error);
      throw error;
    } finally
    {
      this.isReconnecting = wasReconnecting;
    }
  }
}
