import { h, Universal } from 'koishi';

import { comparePassword } from '../../utils/password';
import { MessageType } from '..';
import { IIROSE_Bot } from '../../bot/bot';
import { clearMsg } from './clearMsg';
import { parseAvatar, readJsonData, writeWJ } from '../../utils/utils';

export const decoderMessage = async (obj: MessageType, bot: IIROSE_Bot) =>
{
  // 定义会话列表
  for (const key in obj)
  {
    switch (key)
    {
      case 'selfStatus': {
        const data = obj.selfStatus;
        if (!data) break;

        bot.user.name = data.username;
        bot.user.avatar = data.avatar;
        bot.selfId = data.uid;
        bot.userId = data.uid;
        bot.logInfo('机器人自身状态已更新', data);

        const userlist = await readJsonData(bot, 'wsdata/userlist.json');
        if (Array.isArray(userlist))
        {
          const index = userlist.findIndex((user: { uid?: string }) => user?.uid === data.uid);
          const selfEntry = {
            avatar: data.avatar,
            username: data.username,
            color: data.color || (index >= 0 ? userlist[index].color : '') || bot.config.color,
            room: data.room || (index >= 0 ? userlist[index].room : '') || bot.config.roomId,
            uid: data.uid,
          };
          if (index >= 0)
          {
            userlist[index] = selfEntry;
          } else
          {
            userlist.push(selfEntry);
          }
          await writeWJ(bot, 'wsdata/userlist.json', userlist);
        }
        break;
      }

      case 'publicMessage': {
        if (!obj.publicMessage) return;

        obj.publicMessage.message = await clearMsg(obj.publicMessage.message, bot);

        const data = obj.publicMessage;

        // 引用
        let quotePayload: Universal.Message | undefined = undefined;
        if (data.replyMessage && data.replyMessage.length > 0)
        {
          const quoteInfo = data.replyMessage[0];
          const processedQuoteContent = await clearMsg(quoteInfo.message, bot);

          const quotedSession = bot.sessionCache.findQuote({
            username: quoteInfo.username,
            content: processedQuoteContent,
          });

          if (quotedSession)
          {
            quotePayload = {
              messageId: quotedSession.event.message.id,
              content: quotedSession.content,
              timestamp: quotedSession.timestamp,
              elements: quotedSession.elements,
              user: {
                id: quotedSession.author.id,
                name: quotedSession.author.name,
                avatar: parseAvatar(quotedSession.author.avatar),
                nickname: quotedSession.author.nickname,
              },
              channel: {
                id: quotedSession.channelId,
                type: 0,
              },
              guild: {
                id: quotedSession.guildId,
              },
            };
          }
        }

        let uid = bot.ctx.config.uid;
        let guildId = bot.ctx.config.roomId;
        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
          guildId = bot.ctx.config.smRoom;
        }

        const event = {
          type: 'message',
          platform: 'iirose',
          selfId: uid,
          timestamp: Number(data.timestamp),
          user: {
            id: data.uid,
            name: data.username,
            avatar: parseAvatar(data.avatar)
          },
          message: {
            id: String(data.messageId),
            messageId: String(data.messageId),
            content: data.message,
            elements: h.parse(data.message),
            quote: quotePayload,
          },
          guild: {
            id: guildId
          },
          channel: {
            id: guildId,
            type: 0
          },
        };

        const session = bot.session(event);

        bot.sessionCache.add(session);
        bot.dispatch(session);
        break;
      }

      case 'privateMessage': {
        if (!obj.privateMessage) return;

        obj.privateMessage.message = await clearMsg(obj.privateMessage.message, bot);
        const data = obj.privateMessage;

        // 提前处理引用信息
        let quotePayload: Universal.Message | undefined = undefined;
        if (data.replyMessage && data.replyMessage.length > 0)
        {
          const quoteInfo = data.replyMessage[0];
          const processedQuoteContent = await clearMsg(quoteInfo.message, bot);

          const quotedSession = bot.sessionCache.findQuote({
            username: quoteInfo.username,
            content: processedQuoteContent,
          });

          if (quotedSession)
          {
            quotePayload = {
              messageId: quotedSession.event.message.id,
              content: quotedSession.content,
              elements: quotedSession.elements,
              timestamp: quotedSession.timestamp,
              user: {
                id: quotedSession.author.id,
                name: quotedSession.author.name,
                avatar: parseAvatar(quotedSession.author.avatar),
                nickname: quotedSession.author.nickname,
              },
              channel: {
                id: quotedSession.channelId,
                type: 1
              }
            };
          }
        }

        let uid = bot.ctx.config.uid;

        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
        }

        const event = {
          type: 'message',
          platform: 'iirose',
          selfId: uid,
          timestamp: Number(data.timestamp),
          user: {
            id: data.uid,
            name: data.username,
            avatar: parseAvatar(data.avatar)
          },
          message: {
            id: String(data.messageId),
            messageId: String(data.messageId),
            content: data.message,
            elements: h.parse(data.message),
            quote: quotePayload,
          },
          channel: {
            id: `private:${data.uid}`,
            type: 1
          },
        };

        const session = bot.session(event);

        bot.sessionCache.add(session);
        bot.dispatch(session);
        break;
      }

      case 'memberUpdate': {
        const data = obj.memberUpdate;
        if (!data) return;

        let uid = bot.ctx.config.uid;
        let guildId = bot.ctx.config.roomId;
        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
          guildId = bot.ctx.config.smRoom;
        }

        const createEvent = (type: 'guild-member-added' | 'iirose/guild-member-refresh') =>
        {
          const session = bot.session({
            type,
            platform: 'iirose',
            selfId: uid,
            timestamp: Number(data.timestamp),
            guild: { id: guildId },
            channel: {
              id: guildId,
              type: 0
            },
            user: {
              id: data.uid,
              name: data.username,
              avatar: parseAvatar(data.avatar)
            }
          });
          bot.fulllogInfo(type, session);
          if (type === 'iirose/guild-member-refresh')
          {
            bot.ctx.emit('iirose/guild-member-refresh', session);
          } else
          {
            bot.dispatch(session);
          }
        };

        const handleRefresh = (uid: string) =>
        {
          // 清理可能存在的两种计时器
          if (bot.userLeaveTimers.has(uid))
          {
            bot.userLeaveTimers.get(uid)(); // 取消计时器
            bot.userLeaveTimers.delete(uid);
          }
          if (bot.userJoinTimers.has(uid))
          {
            bot.userJoinTimers.get(uid)(); // 取消计时器
            bot.userJoinTimers.delete(uid);
          }
          createEvent('iirose/guild-member-refresh');
        };

        if (data.type === 'join')
        {
          if (bot.userLeaveTimers.has(data.uid))
          {
            // 正常刷新：先leave后join，检测到离开计时器
            handleRefresh(data.uid);
          } else
          {
            // 可能是新加入，也可能是乱序的刷新（join先于leave到达）
            // 启动一个短暂的“等待窗口”
            const joinTimer = bot.ctx.setTimeout(() =>
            {
              if (data.joinType === 'new' || data.joinType === 'reconnect')
              {
                createEvent('guild-member-added');
              }
              bot.userJoinTimers.delete(data.uid);
            }, 1000); // 等待1秒
            bot.userJoinTimers.set(data.uid, joinTimer);
          }
        } else if (data.type === 'leave')
        {
          if (bot.userJoinTimers.has(data.uid))
          {
            // 乱序刷新：先join后leave，在“等待窗口”内收到了leave事件
            handleRefresh(data.uid);
          } else
          {
            // 正常离开
            // 只有在不是因为移动房间而离开时，才启动确认离开的逻辑
            if (!data.isMove)
            {
              // 启动一个计时器，如果在指定时间内用户没有回来，就确认离开
              const leaveTimerDisposer = bot.ctx.setTimeout(() =>
              {
                // 派发确认离开事件
                const session = bot.session({
                  type: 'guild-member-removed',
                  platform: 'iirose',
                  selfId: uid,
                  timestamp: Date.now(),
                  guild: { id: guildId },
                  channel: {
                    id: guildId,
                    type: 0
                  },
                  user: {
                    id: data.uid,
                    name: data.username,
                    avatar: parseAvatar(data.avatar)
                  }
                });
                bot.dispatch(session);
                bot.fulllogInfo('guild-member-removed', session);

                // 从计时器列表中移除
                bot.userLeaveTimers.delete(data.uid);
              }, bot.config.refreshTimeout);

              // 将计时器(的disposer)存储起来，以便用户重新加入时可以取消
              bot.userLeaveTimers.set(data.uid, leaveTimerDisposer);
            } else
            {
              // 如果是切换房间，立即触发 guild-member-removed
              const session = bot.session({
                type: 'guild-member-removed',
                platform: 'iirose',
                selfId: uid,
                timestamp: Date.now(),
                guild: { id: guildId },
                channel: {
                  id: guildId,
                  type: 0
                },
                user: {
                  id: data.uid,
                  name: data.username,
                  avatar: parseAvatar(data.avatar)
                }
              });
              bot.dispatch(session);
              bot.fulllogInfo('guild-member-removed', session);
            }
          }

          // 移动事件的额外处理
          if (data.isMove)
          {
            const switchRoomData = {
              timestamp: Number(data.timestamp),
              avatar: parseAvatar(data.avatar),
              username: data.username,
              color: data.color,
              uid: data.uid,
              title: data.title,
              room: data.room,
              targetRoom: data.targetRoomId
            };

            const switchRoomEvent = {
              type: 'iirose/guild-member-switchRoom',
              platform: 'iirose',
              guildId: guildId,
              timestamp: Number(data.timestamp),
              user: {
                id: data.uid,
                name: data.username,
              },
              _data: switchRoomData
            };
            const switchRoomSession = bot.session(switchRoomEvent);
            bot.fulllogInfo('iirose/guild-member-switchRoom', switchRoomSession, switchRoomData);
            bot.ctx.emit('iirose/guild-member-switchRoom', switchRoomSession, switchRoomData);
          }
        } else if (data.type === 'refresh')
        {
          // 直接收到了刷新事件（例如通过<符号分割的复合消息）
          handleRefresh(data.uid);
        }
        break;
      }

      case 'music': {
        // 音乐
        const data = obj.music;

        const event = {
          type: 'music',
          platform: 'iirose',
          guildId: bot.config.roomId
        };
        const session = bot.session(event);
        bot.fulllogInfo('iirose/music-play', session, data);
        bot.ctx.emit('iirose/music-play', session, data);
        break;
      }


      case 'selfMove': {
        const data = obj.selfMove;

        const event = {
          type: 'selfMove',
          platform: 'iirose',
          guildId: bot.config.roomId
        };

        const session = bot.session(event);
        bot.fulllogInfo('iirose/selfMove', session, data);
        bot.ctx.emit('iirose/selfMove', session, data);
        // 自身移动房间
        break;
      }

      case 'messageDeleted': {
        const data = obj.messageDeleted;
        if (!data) return;

        let uid = bot.ctx.config.uid;
        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
        }

        // 发送 message-deleted 事件
        const session = bot.session({
          type: 'message-deleted',
          user: {
            id: data.userId,
            name: data.userId
          },
          message: {
            id: data.messageId,
            messageId: data.messageId,
            content: '',
            elements: []
          },
          timestamp: data.timestamp,
          platform: 'iirose'
        });

        session.channelId = data.channelId;
        session.selfId = uid;
        bot.fulllogInfo('message-deleted 事件', session);
        bot.dispatch(session);
        break;
      }

      case 'mailboxMessage': {
        const data = obj.mailboxMessage;
        if (!data) break;

        const session = bot.session({
          type: `iirose/${data.type}`,
          platform: 'iirose',
          guild: { id: bot.config.roomId },
          _data: data,
        });

        bot.fulllogInfo(`iirose/${data.type}`, session, data);
        // 先下发统一的信箱事件，方便插件统一监听
        bot.ctx.emit('iirose/mailbox', session, data);

        switch (data.type)
        {
          case 'roomNotice':
            bot.ctx.emit('iirose/roomNotice', session, data);
            break;
          case 'follower':
            bot.ctx.emit('iirose/follower', session, data);
            break;
          case 'like':
            bot.ctx.emit('iirose/like', session, data);
            break;
          case 'dislike':
            bot.ctx.emit('iirose/dislike', session, data);
            break;
          case 'payment':
            bot.ctx.emit('iirose/payment', session, data);
            break;
        }
        break;
      }

      case 'broadcastMessage': {
        const data = obj.broadcastMessage;
        if (!data) return;
        const processedContent = await clearMsg(data.message, bot);

        const event = {
          type: 'broadcast',
          platform: 'iirose',
          guildId: bot.config.roomId,
          timestamp: Number(data.timestamp),
          user: {
            id: data.username, // 广播消息没有提供用户ID，暂用用户名代替
            name: data.username,
          },
          message: {
            id: data.messageId,
            messageId: data.messageId,
            content: processedContent,
            elements: h.parse(processedContent),
          },
        };

        const session = bot.session(event);
        bot.fulllogInfo('iirose/broadcast', session, data);
        bot.ctx.emit('iirose/broadcast', session, data);
        break;
      }

      case 'roomState': {
        const data = obj.roomState;
        if (!data) break;
        bot.fulllogInfo('iirose/room-state', data);
        bot.ctx.emit('iirose/room-state', data);
        break;
      }

      case 'broadcastAck': {
        if (!obj.broadcastAck) break;
        const remaining = await bot.internal.recordBroadcastAck();
        bot.fulllogInfo('iirose/broadcast-ack', remaining);
        bot.ctx.emit('iirose/broadcast-ack', remaining);
        break;
      }

      case 'musicMessage': {
        const data = obj.musicMessage;
        if (!data) return;

        let uid = bot.ctx.config.uid;
        let guildId = bot.ctx.config.roomId;
        if (bot.ctx.config.smStart && comparePassword(bot.ctx.config.smPassword, 'ec3a4ac482b483ac02d26e440aa0a948d309c822'))
        {
          uid = bot.ctx.config.smUid;
          guildId = bot.ctx.config.smRoom;
        }

        const musicData = {
          type: 'iirose:music',
          name: data.musicName,
          singer: data.musicSinger,
          pic: data.musicPic,
          color: data.musicColor
        };

        const elements = h('json', { data: JSON.stringify(musicData) });
        const content = elements.toString();

        const event = {
          type: 'message',
          platform: 'iirose',
          selfId: uid,
          timestamp: Number(data.timestamp),
          user: {
            id: data.uid,
            name: data.username,
            avatar: parseAvatar(data.avatar)
          },
          message: {
            id: String(data.messageId),
            messageId: String(data.messageId),
            content,
            elements: [elements],
          },
          guild: {
            id: guildId
          },
          channel: {
            id: guildId,
            type: 0
          },
        };

        const session = bot.session(event);

        bot.sessionCache.add(session);
        bot.dispatch(session);
        break;
      }

      case 'mediaWhitelistList': {
        const data = obj.mediaWhitelistList;
        if (!data) break;
        bot.fulllogInfo('iirose/media-whitelist-list', data);
        bot.ctx.emit('iirose/media-whitelist-list', data);
        break;
      }

      case 'mediaWhitelistEvent': {
        const data = obj.mediaWhitelistEvent;
        if (!data) break;
        bot.fulllogInfo('iirose/media-whitelist-event', data);
        bot.ctx.emit('iirose/media-whitelist-event', data);
        break;
      }

      case 'roomRestriction': {
        const data = obj.roomRestriction;
        if (!data) break;
        bot.fulllogInfo('iirose/room-restriction', data);
        bot.ctx.emit('iirose/room-restriction', data);
        break;
      }

      case 'muteList': {
        const data = obj.muteList;
        if (!data) break;
        bot.fulllogInfo('iirose/mute-list', data);
        bot.ctx.emit('iirose/mute-list', data);
        break;
      }

      case 'muteEvent': {
        const data = obj.muteEvent;
        if (!data) break;
        bot.fulllogInfo('iirose/mute-event', data);
        bot.ctx.emit('iirose/mute-event', data);
        break;
      }

      case 'blacklistList': {
        const data = obj.blacklistList;
        if (!data) break;
        bot.fulllogInfo('iirose/blacklist-list', data);
        bot.ctx.emit('iirose/blacklist-list', data);
        break;
      }

      case 'blacklistEvent': {
        const data = obj.blacklistEvent;
        if (!data) break;
        bot.fulllogInfo('iirose/blacklist-event', data);
        bot.ctx.emit('iirose/blacklist-event', data);
        break;
      }

      default: {
        break;
      }
    }
  }
};
