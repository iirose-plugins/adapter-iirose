// ==UserScript==
// @name         蔷薇花园 WebSocket 记录器
// @namespace    https://github.com/shangxueink
// @version      1.0
// @description  Hook IIROSE.com 的 WebSocket，记录和解压 zlib 消息，并使 `send` 命令在顶层(top)控制台上下文可用。
// @author       shangxueink
// @license      MIT
// @match        https://iirose.com/*
// @icon         https://iirose.com/favicon.ico
// @require      https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js
// @grant        unsafeWindow
// ==/UserScript==

(function ()
{
  'use strict';

  console.log("■■■ IIROSE Websocket ■■■ 脚本已加载。正在尝试 Hook WebSocket...");

  const loggerGlobal = unsafeWindow.IIROSE_WS_LOGGER = unsafeWindow.IIROSE_WS_LOGGER || {};

  function processArrayBuffer(arrayBuffer, callback)
  {
    const view = new Uint8Array(arrayBuffer);

    if (view.length === 0)
    {
      callback(""); // 空消息
      return;
    }

    try
    {
      let text;
      if (view[0] === 1)
      {
        const decompressed = pako.inflate(view.slice(1));
        text = new TextDecoder('utf-8').decode(decompressed);
      } else
      {
        text = new TextDecoder('utf-8').decode(view);
      }
      callback(text);
    } catch (e)
    {
      console.error("■■■ IIROSE Websocket ■■■ 处理消息数据时出错:\n", e);
      const hexString = Array.from(view).map(b => b.toString(16).padStart(2, '0')).join(' ');
      callback(`■■■ IIROSE Websocket ■■■ 解码消息失败。原始数据 (十六进制): \n${hexString}`);
    }
  }

  function readData(data, callback)
  {
    if (data instanceof Blob)
    {
      const reader = new FileReader();
      reader.onload = function ()
      {
        processArrayBuffer(reader.result, callback);
      };
      reader.onerror = function ()
      {
        callback(`■■■ IIROSE Websocket ■■■ 读取 Blob 时出错: \n${reader.error}`);
      };
      reader.readAsArrayBuffer(data);
    } else if (data instanceof ArrayBuffer)
    {
      processArrayBuffer(data, callback);
    } else
    {
      callback(data); // 如果已经是字符串，则直接返回
    }
  }

  function createMethodProxy(targetObject, methodName, callback)
  {
    const originalMethod = targetObject[methodName];
    if (typeof originalMethod !== 'function')
    {
      console.warn(`■■■ IIROSE Websocket ■■■ 原始方法 '${methodName}' 未找到或不是一个函数。`);
      return;
    }

    loggerGlobal.originalSend = originalMethod.bind(targetObject);

    targetObject[methodName] = function (...args)
    {
      callback.call(this, args);
      return originalMethod.apply(this, args);
    };
    console.log(`■■■ IIROSE Websocket ■■■ 已成功 Hook 方法: ${methodName}`);
  }

  const originalEventHandlers = {};

  function safelyHookEventHandler(targetObject, propertyName, logCallback)
  {
    if (targetObject[propertyName] && targetObject[propertyName].__is_iirose_ws_logger_wrapper__)
    {
      return;
    }

    const currentHandler = targetObject[propertyName];

    if (typeof currentHandler === 'function')
    {
      if (!originalEventHandlers[propertyName])
      {
        originalEventHandlers[propertyName] = currentHandler;
      }

      const wrapper = function (event)
      {
        logCallback.call(this, event);
        return originalEventHandlers[propertyName].call(this, event);
      };
      wrapper.__is_iirose_ws_logger_wrapper__ = true;

      targetObject[propertyName] = wrapper;
      console.log(`■■■ IIROSE Websocket ■■■ 已成功替换 '${propertyName}' 的包装器。`);
    }
  }

  function hookSocket()
  {
    if (unsafeWindow.socket && typeof unsafeWindow.socket.send === 'function')
    {
      if (unsafeWindow.socket.__iirose_ws_send_hooked__)
      {
        // console.log("[IIROSE WS Logger] Socket's send method already hooked. Skipping.");
      } else
      {
        console.log("■■■ IIROSE Websocket ■■■ 已发现 WebSocket 对象。正在尝试 Hook...");
        // Hook send method
        createMethodProxy(unsafeWindow.socket, 'send', (args) =>
        {
          readData(args[0], (text) =>
          {
            if (text.length > 0)
            {
              console.log("■■■ IIROSE Websocket ■■■ 发送:\n", text);
            }
          });
        });
        unsafeWindow.socket.__iirose_ws_send_hooked__ = true;
      }

      safelyHookEventHandler(unsafeWindow.socket, 'onmessage', (event) =>
      {
        if (event && event.data)
        {
          readData(event.data, (text) =>
          {
            if (text.length > 0)
            {
              console.log("■■■ IIROSE Websocket ■■■ 收到消息:\n", text);
            }
          });
        } else
        {
          console.log("■■■ IIROSE Websocket ■■■ 收到消息 (原始事件):\n", event);
        }
      });

      safelyHookEventHandler(unsafeWindow.socket, 'onopen', (event) =>
      {
        console.log("■■■ IIROSE Websocket ■■■ 连接打开:\n", event);
      });

      safelyHookEventHandler(unsafeWindow.socket, 'onclose', (event) =>
      {
        console.log("■■■ IIROSE Websocket ■■■ 连接关闭:\n", event);
      });

      safelyHookEventHandler(unsafeWindow.socket, 'onerror', (event) =>
      {
        console.log("■■■ IIROSE Websocket ■■■ 发生错误:\n", event);
      });

      loggerGlobal.rawSocket = unsafeWindow.socket;

      // console.log("■■■ IIROSE Websocket ■■■ 当前 WebSocket 状态:", unsafeWindow.socket.readyState, "\n(0:连接中, 1:已打开, 2:正在关闭, 3:已关闭)");
    } else
    {
      // console.log("■■■ IIROSE Websocket ■■■ Socket 对象未找到或尚未准备好。正在重试...");
    }
  }

  let hookAttempts = 0;
  const maxHookAttempts = 120;
  const hookInterval = setInterval(() =>
  {
    hookSocket();
    hookAttempts++;

    if (unsafeWindow.socket && unsafeWindow.socket.__iirose_ws_send_hooked__ && unsafeWindow.socket.readyState === 1 && hookAttempts > 10)
    {
    }

    if (hookAttempts >= maxHookAttempts)
    {
      clearInterval(hookInterval);
      console.log("■■■ IIROSE Websocket ■■■ 已达到初始 Socket 发现的最大尝试次数。");
    }
  }, 500);

  document.addEventListener('DOMContentLoaded', () =>
  {
    setTimeout(() =>
    {
      hookSocket();
    }, 100);
  });
  // --- 将 send 函数暴露到当前窗口和顶层窗口 ---
  const sendFunction = function (message)
  {
    if (!loggerGlobal.originalSend)
    {
      console.error("■■■ IIROSE Websocket ■■■ WebSocket 'send' 方法尚未被 Hook 或不可用。");
      return;
    }
    if (!loggerGlobal.rawSocket || loggerGlobal.rawSocket.readyState !== 1)
    {
      console.warn("■■■ IIROSE Websocket ■■■ WebSocket 未打开 (readyState: " + (loggerGlobal.rawSocket ? loggerGlobal.rawSocket.readyState : 'N/A') + ")。消息可能不会被发送。");
    }

    console.log(`■■■ IIROSE Websocket ■■■ 手动发送: \n${message}`);
    loggerGlobal.originalSend(message);
  };

  // 挂载到当前 iframe 的 window
  unsafeWindow.send = sendFunction;

  // 尝试挂载到顶层 window
  if (unsafeWindow.top && unsafeWindow.top !== unsafeWindow)
  {
    unsafeWindow.top.send = sendFunction;
    console.log("■■■ IIROSE Websocket ■■■ 控制台命令 'send(message)' 已在顶层(top)和当前框架中可用。");
  } else
  {
    console.log("■■■ IIROSE Websocket ■■■ 控制台命令 'send(message)' 已在当前框架中可用。");
  }
  console.log("■■■ IIROSE Websocket ■■■ 示例: send(\">#\")");

})();
