import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Copy, Check, Calendar, ArrowRight, ArrowLeft, HelpCircle, AlertCircle } from 'lucide-react';

export const TimestampConverter: React.FC = () => {
  // Live Clock States
  const [liveTime, setLiveTime] = useState<Date>(new Date());
  const [clockPaused, setClockPaused] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Timestamp -> Date States
  const [tsInput, setTsInput] = useState<string>('');
  const [tsUnit, setTsUnit] = useState<'s' | 'ms'>('s');
  
  const [dtOutputLocal, setDtOutputLocal] = useState<string>('');
  const [dtOutputUtc, setDtOutputUtc] = useState<string>('');
  const [dtOutputIso, setDtOutputIso] = useState<string>('');
  const [dtOutputRfc, setDtOutputRfc] = useState<string>('');
  const [dtOutputRelative, setDtOutputRelative] = useState<string>('');

  // Date -> Timestamp States
  const [dtInput, setDtInput] = useState<string>('');
  const [tsOutputSec, setTsOutputSec] = useState<string>('');
  const [tsOutputMs, setTsOutputMs] = useState<string>('');
  const [dtError, setDtError] = useState<string | null>(null);

  // Time Offset States
  const [offsetBase, setOffsetBase] = useState<string>('');
  const [offsetOp, setOffsetOp] = useState<'+' | '-'>('+');
  const [offsetVal, setOffsetVal] = useState<string>('1');
  const [offsetUnit, setOffsetUnit] = useState<'s' | 'm' | 'h' | 'd' | 'w'>('d');
  
  const [offsetResultDate, setOffsetResultDate] = useState<string>('');
  const [offsetResultTsSec, setOffsetResultTsSec] = useState<string>('');
  const [offsetResultTsMs, setOffsetResultTsMs] = useState<string>('');

  const timerRef = useRef<any>(null);

  // Start live clock ticking
  useEffect(() => {
    if (!clockPaused) {
      timerRef.current = setInterval(() => {
        setLiveTime(new Date());
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clockPaused]);

  // Set default values on load
  useEffect(() => {
    const now = new Date();
    setTsInput(String(Math.floor(now.getTime() / 1000)));
    
    // YYYY/MM/DD HH:mm:ss format
    const formatDateTime = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    setDtInput(formatDateTime(now));
    setOffsetBase(formatDateTime(now));
  }, []);

  // Helper for copying toast
  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Convert relative time helper
  const getRelativeTime = (date: Date): string => {
    const diff = date.getTime() - Date.now();
    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const prefix = diff < 0 ? '' : '在 ';
    const suffix = diff < 0 ? '前' : '后';

    if (seconds < 10) return '刚刚';
    if (seconds < 60) return `${prefix}${seconds} 秒${suffix}`;
    if (minutes < 60) return `${prefix}${minutes} 分钟${suffix}`;
    if (hours < 24) return `${prefix}${hours} 小时${suffix}`;
    return `${prefix}${days} 天${suffix}`;
  };

  // 1. Timestamp -> Date Conversion Effect
  useEffect(() => {
    if (!tsInput.trim()) {
      setDtOutputLocal('');
      setDtOutputUtc('');
      setDtOutputIso('');
      setDtOutputRfc('');
      setDtOutputRelative('');
      return;
    }
    
    try {
      const ts = Number(tsInput);
      if (isNaN(ts)) {
        setDtOutputLocal('无效数值');
        return;
      }
      
      const mult = tsUnit === 's' ? 1000 : 1;
      const date = new Date(ts * mult);
      if (isNaN(date.getTime())) {
        setDtOutputLocal('日期无效');
        return;
      }

      const pad = (n: number) => String(n).padStart(2, '0');
      // Format local
      const localStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      setDtOutputLocal(localStr);

      // Format UTC
      const utcStr = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`;
      setDtOutputUtc(utcStr);

      // ISO and RFC
      setDtOutputIso(date.toISOString());
      setDtOutputRfc(date.toUTCString());
      setDtOutputRelative(getRelativeTime(date));
    } catch (e) {
      setDtOutputLocal('解析错误');
    }
  }, [tsInput, tsUnit]);

  // 2. Date -> Timestamp Conversion Effect
  useEffect(() => {
    if (!dtInput.trim()) {
      setTsOutputSec('');
      setTsOutputMs('');
      setDtError(null);
      return;
    }

    try {
      // replace / with - for broader compatibility
      const sanitized = dtInput.replace(/\//g, '-');
      const date = new Date(sanitized);
      
      if (isNaN(date.getTime())) {
        setDtError('日期解析失败，请检查格式');
        setTsOutputSec('');
        setTsOutputMs('');
        return;
      }

      setDtError(null);
      setTsOutputSec(String(Math.floor(date.getTime() / 1000)));
      setTsOutputMs(String(date.getTime()));
    } catch (e) {
      setDtError('转换失败');
    }
  }, [dtInput]);

  // Presets Handlers
  const applyPreset = (type: 'now' | 'startOfToday' | 'endOfToday' | 'yesterday' | 'tomorrow') => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDateTime = (date: Date) => 
      `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    
    switch (type) {
      case 'now':
        setDtInput(formatDateTime(d));
        break;
      case 'startOfToday':
        d.setHours(0, 0, 0, 0);
        setDtInput(formatDateTime(d));
        break;
      case 'endOfToday':
        d.setHours(23, 59, 59, 999);
        setDtInput(formatDateTime(d));
        break;
      case 'yesterday':
        d.setDate(d.getDate() - 1);
        setDtInput(formatDateTime(d));
        break;
      case 'tomorrow':
        d.setDate(d.getDate() + 1);
        setDtInput(formatDateTime(d));
        break;
    }
  };

  // Offset Calculator Effect
  useEffect(() => {
    if (!offsetBase.trim()) {
      setOffsetResultDate('');
      setOffsetResultTsSec('');
      setOffsetResultTsMs('');
      return;
    }

    try {
      const baseDate = new Date(offsetBase.replace(/\//g, '-'));
      if (isNaN(baseDate.getTime())) {
        setOffsetResultDate('基准日期格式有误');
        return;
      }

      const val = Number(offsetVal);
      if (isNaN(val)) {
        setOffsetResultDate('数量无效');
        return;
      }

      const multiplier = offsetOp === '+' ? 1 : -1;
      const amount = val * multiplier;

      const resultDate = new Date(baseDate.getTime());
      if (offsetUnit === 's') resultDate.setSeconds(resultDate.getSeconds() + amount);
      else if (offsetUnit === 'm') resultDate.setMinutes(resultDate.getMinutes() + amount);
      else if (offsetUnit === 'h') resultDate.setHours(resultDate.getHours() + amount);
      else if (offsetUnit === 'd') resultDate.setDate(resultDate.getDate() + amount);
      else if (offsetUnit === 'w') resultDate.setDate(resultDate.getDate() + amount * 7);

      const pad = (n: number) => String(n).padStart(2, '0');
      setOffsetResultDate(`${resultDate.getFullYear()}-${pad(resultDate.getMonth() + 1)}-${pad(resultDate.getDate())} ${pad(resultDate.getHours())}:${pad(resultDate.getMinutes())}:${pad(resultDate.getSeconds())}`);
      setOffsetResultTsSec(String(Math.floor(resultDate.getTime() / 1000)));
      setOffsetResultTsMs(String(resultDate.getTime()));
    } catch (e) {
      setOffsetResultDate('计算出错');
    }
  }, [offsetBase, offsetOp, offsetVal, offsetUnit]);

  // Common Intervals Table Data
  const intervals = [
    { label: '1 分钟', sec: 60, ms: 60000 },
    { label: '1 小时', sec: 3600, ms: 3600000 },
    { label: '1 天', sec: 86400, ms: 86400000 },
    { label: '1 周', sec: 604800, ms: 604800000 },
    { label: '30 天 (1月)', sec: 2592000, ms: 2592000000 },
    { label: '365 天 (1年)', sec: 31536000, ms: 31536000000 },
  ];

  return (
    <div className="tool-container">
      {/* Styles Injection */}
      <style>{`
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .preset-btn {
          font-size: 0.8rem;
          padding: 0.35rem 0.5rem;
          justify-content: center;
        }
        .time-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 40px;
        }
        .time-box-val {
          font-family: var(--font-mono);
          color: var(--accent-primary);
          font-size: 0.95rem;
          word-break: break-all;
        }
        .sheet-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .sheet-table th {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 0.5rem 0.75rem;
          text-align: left;
          font-weight: 500;
          border-bottom: 1px solid var(--border-color);
        }
        .sheet-table td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }
        .sheet-copy-btn {
          padding: 0.15rem 0.4rem;
          font-size: 0.75rem;
          height: 22px;
          min-width: 0;
        }
        .offset-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      `}</style>

      {/* Header */}
      <div className="tool-header">
        <h2 className="tool-title">时间戳在线转换 (Timestamp)</h2>
        <p className="tool-desc">提供实时系统时钟、双向时间戳转换、时间加减计算器以及常用开发值速查表</p>
      </div>

      <div className="flex-col gap-6">
        
        {/* Section 1: Live Ticking Clock Card */}
        <div className="card flex-row justify-between items-center flex-wrap gap-4" style={{ padding: '1.25rem' }}>
          <div className="flex-row items-center gap-4 flex-wrap">
            <div className="flex-row items-center gap-2">
              <Clock size={20} className={clockPaused ? '' : 'animate-spin-slow'} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>系统当前时间:</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              {liveTime.toLocaleString('zh-CN', { hour12: false })}
            </span>
            <div className="flex-row gap-3" style={{ fontSize: '0.9rem' }}>
              <span className="flex-row items-center gap-1">
                <span style={{ color: 'var(--text-muted)' }}>秒:</span>
                <span 
                  onClick={() => triggerCopy(String(Math.floor(liveTime.getTime() / 1000)), 'live-s')} 
                  style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer', textDecoration: 'underline' }}
                  title="点击复制秒级时间戳"
                >
                  {Math.floor(liveTime.getTime() / 1000)}
                </span>
                {copiedText === 'live-s' && <Check size={12} style={{ color: 'var(--success)' }} />}
              </span>
              <span className="flex-row items-center gap-1">
                <span style={{ color: 'var(--text-muted)' }}>毫秒:</span>
                <span 
                  onClick={() => triggerCopy(String(liveTime.getTime()), 'live-ms')} 
                  style={{ fontFamily: 'var(--font-mono)', cursor: 'pointer', textDecoration: 'underline' }}
                  title="点击复制毫秒级时间戳"
                >
                  {liveTime.getTime()}
                </span>
                {copiedText === 'live-ms' && <Check size={12} style={{ color: 'var(--success)' }} />}
              </span>
            </div>
          </div>
          <div>
            <button 
              onClick={() => setClockPaused(!clockPaused)} 
              className="btn py-1 px-3"
              style={{ color: clockPaused ? 'var(--success)' : 'var(--warning)', borderColor: clockPaused ? 'var(--success)' : 'var(--warning)' }}
            >
              {clockPaused ? <Play size={12} /> : <Pause size={12} />} {clockPaused ? '开始计时' : '暂停时钟'}
            </button>
          </div>
        </div>

        {/* Section 2: Conversions Grid */}
        <div className="pane-layout">
          
          {/* Timestamp ➔ Date Form */}
          <div className="card flex-col flex-1 gap-3">
            <h3 className="flex-row items-center gap-2">
              <ArrowRight size={16} style={{ color: 'var(--success)' }} />
              时间戳 ➔ 日期时间 (Epoch ➔ Date)
            </h3>
            
            <div className="flex-col gap-1">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>输入时间戳:</label>
              <div className="flex-row gap-2">
                <input
                  type="text"
                  value={tsInput}
                  onChange={(e) => setTsInput(e.target.value)}
                  placeholder="请输入 Unix 时间戳，例如: 1716710400"
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                />
                <select 
                  value={tsUnit} 
                  onChange={(e) => setTsUnit(e.target.value as any)}
                  style={{ padding: '0.35rem 0.5rem' }}
                >
                  <option value="s">秒 (s)</option>
                  <option value="ms">毫秒 (ms)</option>
                </select>
              </div>
            </div>

            <div className="flex-col gap-2" style={{ marginTop: '0.5rem' }}>
              <div className="flex-col gap-1">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>北京时间 (Local GMT+8):</span>
                <div className="time-box">
                  <span className="time-box-val">{dtOutputLocal || '-'}</span>
                  {dtOutputLocal && !dtOutputLocal.includes('无效') && (
                    <button onClick={() => triggerCopy(dtOutputLocal, 'dt-local')} className="btn py-0 px-2 sheet-copy-btn">
                      {copiedText === 'dt-local' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-col gap-1">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>世界协调时 (UTC):</span>
                <div className="time-box">
                  <span className="time-box-val">{dtOutputUtc || '-'}</span>
                  {dtOutputUtc && !dtOutputUtc.includes('无效') && (
                    <button onClick={() => triggerCopy(dtOutputUtc, 'dt-utc')} className="btn py-0 px-2 sheet-copy-btn">
                      {copiedText === 'dt-utc' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-col gap-1">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ISO 8601 格式:</span>
                <div className="time-box">
                  <span className="time-box-val" style={{ fontSize: '0.85rem' }}>{dtOutputIso || '-'}</span>
                  {dtOutputIso && !dtOutputIso.includes('无效') && (
                    <button onClick={() => triggerCopy(dtOutputIso, 'dt-iso')} className="btn py-0 px-2 sheet-copy-btn">
                      {copiedText === 'dt-iso' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-col gap-1">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RFC 2822 格式:</span>
                <div className="time-box">
                  <span className="time-box-val" style={{ fontSize: '0.85rem' }}>{dtOutputRfc || '-'}</span>
                  {dtOutputRfc && !dtOutputRfc.includes('无效') && (
                    <button onClick={() => triggerCopy(dtOutputRfc, 'dt-rfc')} className="btn py-0 px-2 sheet-copy-btn">
                      {copiedText === 'dt-rfc' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-col gap-1">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>相对当前时间 (Relative):</span>
                <div className="time-box" style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
                  <span className="time-box-val" style={{ color: 'var(--accent-secondary)' }}>{dtOutputRelative || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Date ➔ Timestamp Form */}
          <div className="card flex-col flex-1 gap-3">
            <h3 className="flex-row items-center gap-2">
              <ArrowLeft size={16} style={{ color: 'var(--warning)' }} />
              日期时间 ➔ 时间戳 (Date ➔ Epoch)
            </h3>
            
            <div className="flex-col gap-1">
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>输入时间文本 (本地时区):</label>
              <input
                type="text"
                value={dtInput}
                onChange={(e) => setDtInput(e.target.value)}
                placeholder="格式: YYYY/MM/DD HH:mm:ss"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <div className="preset-grid">
                <button onClick={() => applyPreset('now')} className="btn preset-btn">当前时间</button>
                <button onClick={() => applyPreset('startOfToday')} className="btn preset-btn">今天开始</button>
                <button onClick={() => applyPreset('endOfToday')} className="btn preset-btn">今天结束</button>
                <button onClick={() => applyPreset('yesterday')} className="btn preset-btn">昨天</button>
                <button onClick={() => applyPreset('tomorrow')} className="btn preset-btn">明天</button>
              </div>
            </div>

            {dtError && (
              <div className="alert error" style={{ padding: '0.5rem', marginBottom: 0, marginTop: '0.25rem' }}>
                <AlertCircle size={14} />
                <span style={{ fontSize: '0.8rem' }}>{dtError}</span>
              </div>
            )}

            <div className="flex-col gap-2" style={{ marginTop: '0.5rem' }}>
              <div className="flex-col gap-1">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>秒级时间戳 (Seconds - 10位):</span>
                <div className="time-box">
                  <span className="time-box-val" style={{ color: 'var(--warning)' }}>{tsOutputSec || '-'}</span>
                  {tsOutputSec && (
                    <button onClick={() => triggerCopy(tsOutputSec, 'ts-sec')} className="btn py-0 px-2 sheet-copy-btn">
                      {copiedText === 'ts-sec' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-col gap-1">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>毫秒级时间戳 (Milliseconds - 13位):</span>
                <div className="time-box">
                  <span className="time-box-val" style={{ color: 'var(--warning)' }}>{tsOutputMs || '-'}</span>
                  {tsOutputMs && (
                    <button onClick={() => triggerCopy(tsOutputMs, 'ts-ms')} className="btn py-0 px-2 sheet-copy-btn">
                      {copiedText === 'ts-ms' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-col gap-1" style={{ opacity: 0.7 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>标准格式参考 (GMT+8):</span>
                <div className="time-box" style={{ borderStyle: 'dashed' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>YYYY/MM/DD HH:mm:ss 或 YYYY-MM-DD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Time Offset Calculator & Cheat Sheet Table */}
        <div className="pane-layout">
          
          {/* Time Offset Calculator */}
          <div className="card flex-1 flex-col gap-3">
            <h3 className="flex-row items-center gap-2">
              <Calendar size={16} style={{ color: 'var(--accent-secondary)' }} />
              时间偏移计算器 (Date Arithmetic)
            </h3>
            
            <div className="flex-col gap-2">
              <div className="flex-col gap-1">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>基准本地时间:</span>
                <input
                  type="text"
                  value={offsetBase}
                  onChange={(e) => setOffsetBase(e.target.value)}
                  placeholder="例如: 2026/05/26 12:00:00"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="offset-row">
                <select value={offsetOp} onChange={(e) => setOffsetOp(e.target.value as any)} style={{ padding: '0.35rem 0.5rem' }}>
                  <option value="+">增加 (+)</option>
                  <option value="-">减少 (-)</option>
                </select>
                <input
                  type="number"
                  value={offsetVal}
                  onChange={(e) => setOffsetVal(e.target.value)}
                  style={{ width: '80px', textAlign: 'center' }}
                  min="0"
                />
                <select value={offsetUnit} onChange={(e) => setOffsetUnit(e.target.value as any)} style={{ padding: '0.35rem 0.5rem' }}>
                  <option value="s">秒 (Seconds)</option>
                  <option value="m">分钟 (Minutes)</option>
                  <option value="h">小时 (Hours)</option>
                  <option value="d">天 (Days)</option>
                  <option value="w">周 (Weeks)</option>
                </select>
              </div>

              <div className="flex-col gap-2" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <div className="flex-col gap-1">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>计算后的日期:</span>
                  <div className="time-box">
                    <span className="time-box-val" style={{ color: 'var(--accent-secondary)' }}>{offsetResultDate || '-'}</span>
                    {offsetResultDate && !offsetResultDate.includes('有误') && (
                      <button onClick={() => triggerCopy(offsetResultDate, 'offset-dt')} className="btn py-0 px-2 sheet-copy-btn">
                        {copiedText === 'offset-dt' ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-row gap-2">
                  <div className="flex-col flex-1 gap-1">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>秒级时间戳:</span>
                    <div className="time-box">
                      <span className="time-box-val" style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>{offsetResultTsSec || '-'}</span>
                      {offsetResultTsSec && (
                        <button onClick={() => triggerCopy(offsetResultTsSec, 'offset-sec')} className="btn py-0 px-2 sheet-copy-btn">
                          {copiedText === 'offset-sec' ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-col flex-1 gap-1">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>毫秒级时间戳:</span>
                    <div className="time-box">
                      <span className="time-box-val" style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>{offsetResultTsMs || '-'}</span>
                      {offsetResultTsMs && (
                        <button onClick={() => triggerCopy(offsetResultTsMs, 'offset-ms')} className="btn py-0 px-2 sheet-copy-btn">
                          {copiedText === 'offset-ms' ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Common Intervals Cheat Sheet */}
          <div className="card flex-1 flex-col gap-3">
            <h3 className="flex-row items-center gap-2">
              <HelpCircle size={16} style={{ color: 'var(--text-muted)' }} />
              常用时间段转换值 (Cheat Sheet)
            </h3>
            
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <table className="sheet-table">
                <thead>
                  <tr>
                    <th>时间单位</th>
                    <th>秒 (Seconds)</th>
                    <th>毫秒 (Milliseconds)</th>
                  </tr>
                </thead>
                <tbody>
                  {intervals.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</td>
                      <td>
                        <div className="flex-row justify-between items-center gap-2">
                          <span>{item.sec}</span>
                          <button onClick={() => triggerCopy(String(item.sec), `s-${idx}`)} className="btn py-0 px-1 sheet-copy-btn">
                            {copiedText === `s-${idx}` ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex-row justify-between items-center gap-2">
                          <span>{item.ms}</span>
                          <button onClick={() => triggerCopy(String(item.ms), `ms-${idx}`)} className="btn py-0 px-1 sheet-copy-btn">
                            {copiedText === `ms-${idx}` ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {copiedText && !copiedText.includes('-live') && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>转换值已成功复制到剪贴板！</span>
        </div>
      )}
    </div>
  );
};
