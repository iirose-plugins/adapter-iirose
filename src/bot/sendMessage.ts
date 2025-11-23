
import { Context, MessageEncoder, h } from 'koishi';

import { } from '@koishijs/assets';

import { cacheSentMessage, ensureNewlineBefore, rgbaToHex, transformUrl, Unknown_User_Name } from '../utils/utils';
import PrivateMessage from '../encoder/messages/PrivateMessage';
import PublicMessage from '../encoder/messages/PublicMessage';
import { IIROSE_WSsend } from '../utils/ws';
import { IIROSE_Bot } from './bot';

export class IIROSE_BotMessageEncoder extends MessageEncoder<Context, IIROSE_Bot>
{
  private outDataOringin: string = '';
  private outDataOringinObj: string = '';
  private currentMessageId: string = '';
  private audioSent: boolean = false;
  private isMarkdown: boolean = false;

  private resetState(): void
  {
    this.outDataOringin = '';
    this.outDataOringinObj = '';
    this.currentMessageId = '';
    this.audioSent = false;
    this.isMarkdown = false;
  }

  async flush(): Promise<void>
  {
    if (this.bot.config.onlyHangUpMode) { return; }

    // 如果已经发送了音频消息且没有其他内容，则不发送额外消息
    if (this.audioSent && this.outDataOringin.length <= 0)
    {
      this.resetState();
      return;
    }

    if (this.outDataOringin.length <= 0)
    {
      this.resetState();
      return;
    }

    // 清理消息末尾多余的换行符
    this.outDataOringin = this.outDataOringin.replace(/\n+$/, '');
    if (this.outDataOringin.length <= 0)
    {
      this.resetState();
      return;
    }

    // 如果是 Markdown 消息，添加前缀
    if (this.isMarkdown)
    {
      this.outDataOringin = `\\\\\\*\n${this.outDataOringin}`;
    }

    // 在实际发送消息时生成消息ID和消息对象
    if (this.channelId.startsWith('private:'))
    {
      const result = PrivateMessage(this.channelId.split(':')[1], this.outDataOringin, rgbaToHex(this.bot.config.color));
      this.currentMessageId = result.messageId;
      this.outDataOringinObj = result.data;
    } else
    {
      const result = PublicMessage(this.outDataOringin, rgbaToHex(this.bot.config.color));
      this.currentMessageId = result.messageId;
      this.outDataOringinObj = result.data;
    }

    await IIROSE_WSsend(this.bot, this.outDataOringinObj);

    if (this.currentMessageId)
    {
      this.results.push({ id: this.currentMessageId });
      await cacheSentMessage(this.bot, this.channelId, this.currentMessageId, this.outDataOringin);
    }

    this.resetState();
  }

  // 获取消息ID
  getMessageId(): string
  {
    return this.currentMessageId;
  }

  async visit(element: h): Promise<void>
  {
    const { type, attrs, children } = element;
    switch (type)
    {
      case 'video': {
        let url = attrs.link || attrs.url || attrs.src;

        // 如果是 https 协议，直接使用
        if (url.startsWith('http'))
        {
          // 直接使用 
        } else
        {
          // 使用 assets 服务转存非 https 协议的资源
          const transformedUrl = await transformUrl(this.bot, h.video(url).toString());
          if (transformedUrl)
          {
            url = transformedUrl;
          } else
          {
            this.outDataOringin = ensureNewlineBefore(this.outDataOringin);
            this.outDataOringin += '[视频转存失败]';
            this.outDataOringin += '\n';
            break;
          }
        }

        // 直接发送视频链接
        this.outDataOringin = ensureNewlineBefore(this.outDataOringin);
        this.outDataOringin += `[${url}]`;
        this.outDataOringin += '\n';
        break;
      }

      case 'audio': {
        let url = attrs.link || attrs.url || attrs.src;

        // 如果是 https 协议，直接使用
        if (url.startsWith('http'))
        {
          // 直接使用 
        } else
        {
          // 使用 assets 服务转存非 https 协议的资源
          const transformedUrl = await transformUrl(this.bot, h.audio(url).toString());
          if (transformedUrl)
          {
            url = transformedUrl;
          } else
          {
            this.outDataOringin += '[音频转存失败]';
            break;
          }
        }

        // 确保URL以.weba结尾，IIROSE平台需要此后缀才能正确识别为语音消息
        if (!url.endsWith('.weba'))
        {
          if (url.includes('?'))
          {
            url += `&iiroseaudio=.weba`;
          } else
          {
            url += `?iiroseaudio=.weba`;
          }
        }

        let audioMessage: string;
        let audioMessageId: string;
        if (this.channelId.startsWith('private:'))
        {
          const result = PrivateMessage(this.channelId.split(':')[1], url, rgbaToHex(this.bot.config.color));
          audioMessage = result.data;
          audioMessageId = result.messageId;
        } else
        {
          const result = PublicMessage(url, rgbaToHex(this.bot.config.color));
          audioMessage = result.data;
          audioMessageId = result.messageId;
        }

        if (audioMessage)
        {
          await IIROSE_WSsend(this.bot, audioMessage);
          // 标记已发送音频消息，防止flush时发送空格消息
          this.audioSent = true;
          if (audioMessageId)
          {
            this.results.push({ id: audioMessageId });
            await cacheSentMessage(this.bot, this.channelId, audioMessageId, url);
          }
        }
        break;
      }

      case 'image':
      case 'img': {
        let url = attrs.src;

        // 如果是 https 协议，直接使用
        if (url.startsWith('http'))
        {
          this.outDataOringin = ensureNewlineBefore(this.outDataOringin);
          this.outDataOringin += `[${url}#e]`;
          this.outDataOringin += '\n';
          break;
        }
        // 使用 assets 服务转存非 https 协议的资源
        const transformedUrl = await transformUrl(this.bot, h.image(url).toString());
        if (transformedUrl)
        {
          this.outDataOringin = ensureNewlineBefore(this.outDataOringin);
          this.outDataOringin += `[${transformedUrl}#e]`;
          this.outDataOringin += '\n';
        } else
        {
          this.outDataOringin = ensureNewlineBefore(this.outDataOringin);
          this.outDataOringin += '[图片转存失败]';
          this.outDataOringin += '\n';
        }
        break;
      }

      case 'quote': {
        let quoteId = attrs.id;
        if (!quoteId)
        {
          const messageKeys = this.bot.getMessageKeys();
          quoteId = messageKeys[messageKeys.length - 1];
        }

        const messData = await this.bot.getMessage('', quoteId);

        if (messData)
        {
          this.outDataOringin = `${messData.content} (_hr) ${messData.user.name}_${Math.round(new Date().getTime() / 1e3)} (hr_) ` + this.outDataOringin;
        } else
        {
          this.bot.loggerWarn(`[Quote处理] 未找到消息ID: ${quoteId}`);
        }
        break;
      }

      case 'text': {
        if (this.outDataOringin.length > 0)
        {
          this.outDataOringin += `${attrs.content}`;
        } else
        {
          this.outDataOringin += `${attrs.content}`;
        }
        break;
      }

      case 'i18n': {
        try
        {
          const path = attrs?.path;
          if (path && this.bot.ctx.i18n)
          {
            const locales = this.bot.ctx.i18n.fallback([]);
            try
            {
              const text = this.bot.ctx.i18n.render(locales, [path], attrs || {});
              if (text && typeof text === 'string')
              {
                this.outDataOringin += text;
                break;
              }
            } catch (e)
            {
              // i18n解析失败，使用fallback
            }
          }
          this.outDataOringin += `[${path || 'i18n'}]`;
        } catch (error)
        {
          this.outDataOringin += `[${attrs?.path || 'i18n'}]`;
        }
        break;
      }

      case 'at': {
        if (attrs.hasOwnProperty('name'))
        {
          this.outDataOringin += ` [*${attrs.name}*] `;
        } else if (attrs.hasOwnProperty('roomId') || attrs.hasOwnProperty('roomid'))
        {
          this.outDataOringin += ` [_${attrs.roomId}_] `;
        } else if (attrs.hasOwnProperty('id'))
        {
          const userId = `${attrs.id}`.toLowerCase();
          const user = await this.bot.getUser(userId);
          const name = user?.name;
          if (!name || name == Unknown_User_Name)
          {
            this.outDataOringin += ` [@${userId}@] `;
          } else
          {
            this.outDataOringin += ` [*${name}*] `;
          }
        }
        break;
      }

      case 'sharp': {
        // 提及频道
        let channelId = `${attrs.id}`.toLowerCase();
        // 如果 id 不在 attrs 中，尝试从子元素获取
        if (!channelId && children.length > 0)
        {
          channelId = children.map(c => c.attrs.content).join('');
        }

        if (channelId)
        {
          this.outDataOringin += ` [_${channelId.replace(/^private:/, '')}_] `;
        }
        return; // 阻止后续对子节点的重复渲染
      }

      case 'a': {
        // 链接
        let url = attrs.href;
        if (!url && children.length > 0)
        {
          url = children.map(c => c.attrs.content).join('');
        }

        if (url)
        {
          this.outDataOringin += `\\${url}`;
        }
        return; // 阻止后续对子节点的重复渲染
      }

      case 'b':
      case 'strong': {
        this.isMarkdown = true;
        this.outDataOringin += '**';
        await this.render(children);
        this.outDataOringin += '**';
        return;
      }

      case 'i':
      case 'em': {
        this.isMarkdown = true;
        this.outDataOringin += '*';
        await this.render(children);
        this.outDataOringin += '*';
        return;
      }

      case 'u':
      case 'ins': {
        this.isMarkdown = true;
        this.outDataOringin += '__';
        await this.render(children);
        this.outDataOringin += '__';
        return;
      }

      case 's':
      case 'del': {
        this.isMarkdown = true;
        this.outDataOringin += '~~';
        await this.render(children);
        this.outDataOringin += '~~';
        return;
      }

      case 'spl': {
        this.isMarkdown = true;
        this.outDataOringin += '||';
        await this.render(children);
        this.outDataOringin += '||';
        return;
      }

      case 'code': {
        this.isMarkdown = true;
        this.outDataOringin += '`';
        await this.render(children);
        this.outDataOringin += '`';
        return;
      }

      case 'iirose:markdown':
      case 'markdown': {
        this.isMarkdown = true;
        break;
      }

      case 'br': {
        this.outDataOringin += '\n';
        break;
      }

      case 'message': {
        await this.flush();
        await this.render(children);
        return;
      }

      case 'p':
      case '':
      default: {
        break;
      }
    }
    await this.render(children);

    // p元素 处理完子元素后需要添加换行符
    if (type === 'p' && this.outDataOringin.length > 0)
    {
      this.outDataOringin += '\n';
    }
  }

  async render(elements: h[]): Promise<void>
  {
    for (const element of elements)
    {
      await this.visit(element);
    }
  }
}
