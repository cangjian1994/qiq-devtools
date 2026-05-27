import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Send, Trash2 } from 'lucide-react';

interface LogEntry {
  time: string;
  type: 'info' | 'send' | 'recv' | 'error';
  data: string;
}

export const WebSocketSimulator: React.FC = () => {
  const [url, setUrl] = useState<string>('wss://echo.websocket.org');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [message, setMessage] = useState<string>('{\n  "message": "Hello QiQ Tools!",\n  "timestamp": ' + Date.now() + '\n}');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const addLog = (type: LogEntry['type'], data: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0');
    setLogs(prev => [...prev, { time, type, data }]);
  };

  const handleConnect = () => {
    if (!url.trim()) return;
    
    setStatus('connecting');
    addLog('info', `正在连接到 WebSocket 地址: ${url}...`);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        addLog('info', '连接已成功建立！');
      };

      ws.onmessage = (event) => {
        addLog('recv', event.data);
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        addLog('info', `连接已断开。代码: ${event.code}, 原因: ${event.reason || '无'}`);
        wsRef.current = null;
      };

      ws.onerror = (error) => {
        addLog('error', 'WebSocket 遇到错误');
        console.error(error);
      };
    } catch (e: any) {
      setStatus('disconnected');
      addLog('error', `建立连接失败: ${e.message}`);
      wsRef.current = null;
    }
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      addLog('info', '主动关闭连接...');
      wsRef.current.close();
    }
  };

  const handleSend = () => {
    if (!wsRef.current || status !== 'connected' || !message.trim()) return;

    try {
      wsRef.current.send(message);
      addLog('send', message);
    } catch (e: any) {
      addLog('error', `发送消息失败: ${e.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">WebSocket 仿真测试</h2>
        <p className="tool-desc">轻量级 WebSocket 调试工具，支持连接、消息收发、时间戳历史日志</p>
      </div>

      <div className="flex-col gap-4">
        {/* Address Bar Card */}
        <div className="card">
          <div className="flex-row gap-3 items-center">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="wss://echo.websocket.org"
              style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
              disabled={status !== 'disconnected'}
            />
            {status === 'disconnected' ? (
              <button onClick={handleConnect} className="btn primary px-4">
                <Play size={14} /> 连接服务
              </button>
            ) : (
              <button onClick={handleDisconnect} className="btn secondary px-4" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                <Square size={14} /> 断开连接
              </button>
            )}
            
            {/* Status indicator */}
            <div className="flex-row items-center gap-1 px-2">
              <span 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: status === 'connected' ? 'var(--success)' : status === 'connecting' ? 'var(--warning)' : 'var(--text-muted)',
                  boxShadow: status === 'connected' ? '0 0 8px var(--success)' : status === 'connecting' ? '0 0 8px var(--warning)' : 'none'
                }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {status === 'connected' ? '已连接' : status === 'connecting' ? '连接中' : '未连接'}
              </span>
            </div>
          </div>
        </div>

        {/* Console & Log panes */}
        <div className="pane-layout" style={{ flex: 1, minHeight: '450px' }}>
          {/* Left panel: Compose Message */}
          <div className="editor-panel flex-col" style={{ height: '100%' }}>
            <div className="panel-header">
              <span>准备发送的消息</span>
              <button 
                onClick={handleSend} 
                className="btn py-1 px-3 primary" 
                disabled={status !== 'connected' || !message.trim()}
              >
                <Send size={12} /> 发送数据
              </button>
            </div>
            <div className="panel-body flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="在此编写消息载荷 (支持 String 或 JSON)..."
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 0,
                  resize: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                }}
              />
            </div>
          </div>

          {/* Right panel: Communication Logs */}
          <div className="editor-panel flex-col" style={{ height: '100%' }}>
            <div className="panel-header">
              <span>消息收发日志</span>
              <button onClick={clearLogs} className="btn py-1 px-2" title="清空日志">
                <Trash2 size={12} /> 清空
              </button>
            </div>
            <div 
              className="panel-body" 
              style={{ 
                background: 'var(--bg-secondary)', 
                padding: '1rem', 
                overflowY: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {logs.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  无日志记录。连接后发送消息开始测试。
                </div>
              ) : (
                logs.map((log, idx) => {
                  let badgeColor = 'var(--text-muted)';
                  let badgeText = 'INFO';
                  let logColor = 'inherit';
                  let bgColor = 'transparent';

                  if (log.type === 'send') {
                    badgeColor = 'var(--accent-primary)';
                    badgeText = 'SEND ➔';
                    logColor = '#a5b4fc';
                    bgColor = 'rgba(99, 102, 241, 0.03)';
                  } else if (log.type === 'recv') {
                    badgeColor = 'var(--success)';
                    badgeText = '◀ RECV';
                    logColor = '#86efac';
                    bgColor = 'rgba(16, 185, 129, 0.03)';
                  } else if (log.type === 'error') {
                    badgeColor = 'var(--error)';
                    badgeText = 'ERROR';
                    logColor = '#fca5a5';
                    bgColor = 'rgba(239, 68, 68, 0.05)';
                  }

                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: '6px', 
                        background: bgColor, 
                        border: '1px solid var(--border-color)',
                        wordBreak: 'break-all'
                      }}
                    >
                      <div className="flex-row justify-between items-center" style={{ marginBottom: '4px', fontSize: '0.75rem' }}>
                        <span style={{ color: badgeColor, fontWeight: 600 }}>{badgeText}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{log.time}</span>
                      </div>
                      <pre style={{ whiteSpace: 'pre-wrap', color: logColor, fontFamily: 'inherit' }}>
                        {log.data}
                      </pre>
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
