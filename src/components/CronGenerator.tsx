import React, { useState, useEffect } from 'react';
import { Clock, Info, Copy, Check } from 'lucide-react';

type TabType = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'week';

export const CronGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('second');
  const [cronExpression, setCronExpression] = useState<string>('* * * * * ?');
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // States for each field
  const [second, setSecond] = useState({ type: '*', start: 0, interval: 1, specific: [] as number[], from: 0, to: 59 });
  const [minute, setMinute] = useState({ type: '*', start: 0, interval: 1, specific: [] as number[], from: 0, to: 59 });
  const [hour, setHour] = useState({ type: '*', start: 0, interval: 1, specific: [] as number[], from: 0, to: 23 });
  const [day, setDay] = useState({ type: '*', start: 1, interval: 1, specific: [] as number[], from: 1, to: 31 });
  const [month, setMonth] = useState({ type: '*', start: 1, interval: 1, specific: [] as number[], from: 1, to: 12 });
  const [week, setWeek] = useState({ type: '?', start: 1, interval: 1, specific: [] as number[], from: 1, to: 7 });

  const buildFieldString = (field: any, isWeek: boolean = false) => {
    const defaultVal = isWeek ? '?' : '*';
    if (field.type === '*') return defaultVal;
    if (field.type === '?') return '?';
    if (field.type === 'range') return `${field.from}-${field.to}`;
    if (field.type === 'interval') return `${field.start}/${field.interval}`;
    if (field.type === 'specific') {
      if (field.specific.length === 0) return defaultVal;
      return [...field.specific].sort((a, b) => a - b).join(',');
    }
    return defaultVal;
  };

  // Compile fields into cron expression
  useEffect(() => {
    const secStr = buildFieldString(second);
    const minStr = buildFieldString(minute);
    const hourStr = buildFieldString(hour);
    
    // Day of Month and Day of Week logic: in Quartz, one of them must be '?'
    let dayStr = buildFieldString(day);
    let weekStr = buildFieldString(week, true);

    if (dayStr !== '?' && weekStr !== '?') {
      // If both are modified, prioritize day of month or set default
      if (activeTab === 'week') {
        dayStr = '?';
      } else {
        weekStr = '?';
      }
    }

    const monthStr = buildFieldString(month);
    
    const expression = `${secStr} ${minStr} ${hourStr} ${dayStr} ${monthStr} ${weekStr}`;
    setCronExpression(expression);
  }, [second, minute, hour, day, month, week, activeTab]);

  // Compute next 5 runs
  useEffect(() => {
    const calculateNextRuns = () => {
      const parts = cronExpression.split(' ');
      if (parts.length < 6) return;

      const [secExp, minExp, hourExp, dayExp, monthExp, weekExp] = parts;

      const matchField = (val: number, expr: string): boolean => {
        if (expr === '*' || expr === '?') return true;
        if (expr.includes('/')) {
          const [start, step] = expr.split('/').map(Number);
          return val >= start && (val - start) % step === 0;
        }
        if (expr.includes('-')) {
          const [start, end] = expr.split('-').map(Number);
          return val >= start && val <= end;
        }
        if (expr.includes(',')) {
          return expr.split(',').map(Number).includes(val);
        }
        return Number(expr) === val;
      };

      const runs: string[] = [];
      let current = new Date();
      current.setMilliseconds(0);

      let iterations = 0;
      // Safeguard iteration limit
      while (runs.length < 5 && iterations < 30000) {
        iterations++;
        current.setSeconds(current.getSeconds() + 1);

        const s = current.getSeconds();
        const m = current.getMinutes();
        const h = current.getHours();
        const d = current.getDate();
        const M = current.getMonth() + 1;
        const w = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

        if (!matchField(s, secExp)) continue;
        if (!matchField(m, minExp)) continue;
        if (!matchField(h, hourExp)) continue;
        if (!matchField(d, dayExp)) continue;
        if (!matchField(M, monthExp)) continue;

        // Quartz Day of Week: 1=Sun, 2=Mon, ..., 7=Sat
        const quartzW = w + 1;
        if (!matchField(quartzW, weekExp)) continue;

        runs.push(current.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }));
      }

      setNextRuns(runs.length > 0 ? runs : ['无法估算执行时间，请检查表达式配置']);
    };

    calculateNextRuns();
  }, [cronExpression]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cronExpression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateField = (tab: TabType, updates: any) => {
    if (tab === 'second') setSecond(prev => ({ ...prev, ...updates }));
    else if (tab === 'minute') setMinute(prev => ({ ...prev, ...updates }));
    else if (tab === 'hour') setHour(prev => ({ ...prev, ...updates }));
    else if (tab === 'day') setDay(prev => ({ ...prev, ...updates }));
    else if (tab === 'month') setMonth(prev => ({ ...prev, ...updates }));
    else if (tab === 'week') setWeek(prev => ({ ...prev, ...updates }));
  };

  const getFieldState = (tab: TabType) => {
    if (tab === 'second') return second;
    if (tab === 'minute') return minute;
    if (tab === 'hour') return hour;
    if (tab === 'day') return day;
    if (tab === 'month') return month;
    return week;
  };

  const renderTabContent = () => {
    const field = getFieldState(activeTab);
    const maxVal = activeTab === 'hour' ? 23 : activeTab === 'day' ? 31 : activeTab === 'month' ? 12 : activeTab === 'week' ? 7 : 59;
    const minVal = (activeTab === 'day' || activeTab === 'month' || activeTab === 'week') ? 1 : 0;

    const toggleSpecific = (val: number) => {
      const idx = field.specific.indexOf(val);
      let newSpecific = [...field.specific];
      if (idx > -1) {
        newSpecific.splice(idx, 1);
      } else {
        newSpecific.push(val);
      }
      updateField(activeTab, { specific: newSpecific, type: 'specific' });
    };

    return (
      <div className="flex-col gap-4">
        {/* Radio Option 1: Wildcard */}
        <label className="flex-row gap-2 items-center cursor-pointer">
          <input
            type="radio"
            name="cron-type"
            checked={field.type === '*'}
            onChange={() => updateField(activeTab, { type: '*' })}
          />
          <span>每{activeTab === 'second' ? '秒' : activeTab === 'minute' ? '分' : activeTab === 'hour' ? '小时' : activeTab === 'day' ? '天' : activeTab === 'month' ? '月' : '周'} (通配符 *)</span>
        </label>

        {/* Day of Week special case: Question mark */}
        {(activeTab === 'day' || activeTab === 'week') && (
          <label className="flex-row gap-2 items-center cursor-pointer">
            <input
              type="radio"
              name="cron-type"
              checked={field.type === '?'}
              onChange={() => updateField(activeTab, { type: '?' })}
            />
            <span>不指定值 (问号 ?)</span>
          </label>
        )}

        {/* Radio Option 2: Range */}
        <label className="flex-row gap-2 items-center cursor-pointer">
          <input
            type="radio"
            name="cron-type"
            checked={field.type === 'range'}
            onChange={() => updateField(activeTab, { type: 'range' })}
          />
          <div className="flex-row gap-2 items-center">
            <span>周期：从</span>
            <input
              type="number"
              min={minVal}
              max={maxVal}
              value={field.from}
              onChange={(e) => updateField(activeTab, { from: parseInt(e.target.value) || minVal, type: 'range' })}
              style={{ width: '60px', padding: '2px 4px', height: '24px' }}
            />
            <span>至</span>
            <input
              type="number"
              min={minVal}
              max={maxVal}
              value={field.to}
              onChange={(e) => updateField(activeTab, { to: parseInt(e.target.value) || maxVal, type: 'range' })}
              style={{ width: '60px', padding: '2px 4px', height: '24px' }}
            />
            <span>{activeTab === 'second' ? '秒' : activeTab === 'minute' ? '分' : activeTab === 'hour' ? '时' : activeTab === 'day' ? '日' : activeTab === 'month' ? '月' : '周'}</span>
          </div>
        </label>

        {/* Radio Option 3: Interval */}
        <label className="flex-row gap-2 items-center cursor-pointer">
          <input
            type="radio"
            name="cron-type"
            checked={field.type === 'interval'}
            onChange={() => updateField(activeTab, { type: 'interval' })}
          />
          <div className="flex-row gap-2 items-center">
            <span>从第</span>
            <input
              type="number"
              min={minVal}
              max={maxVal}
              value={field.start}
              onChange={(e) => updateField(activeTab, { start: parseInt(e.target.value) || minVal, type: 'interval' })}
              style={{ width: '60px', padding: '2px 4px', height: '24px' }}
            />
            <span>{activeTab === 'second' ? '秒' : activeTab === 'minute' ? '分' : activeTab === 'hour' ? '时' : activeTab === 'day' ? '日' : activeTab === 'month' ? '月' : '周'}开始， 每</span>
            <input
              type="number"
              min={1}
              max={maxVal}
              value={field.interval}
              onChange={(e) => updateField(activeTab, { interval: parseInt(e.target.value) || 1, type: 'interval' })}
              style={{ width: '60px', padding: '2px 4px', height: '24px' }}
            />
            <span>{activeTab === 'second' ? '秒' : activeTab === 'minute' ? '分' : activeTab === 'hour' ? '时' : activeTab === 'day' ? '日' : activeTab === 'month' ? '月' : '周'}执行一次</span>
          </div>
        </label>

        {/* Radio Option 4: Specific Checklist */}
        <div className="flex-col gap-2">
          <label className="flex-row gap-2 items-center cursor-pointer">
            <input
              type="radio"
              name="cron-type"
              checked={field.type === 'specific'}
              onChange={() => updateField(activeTab, { type: 'specific' })}
            />
            <span>指定特定值：</span>
          </label>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '6px',
              paddingLeft: '1.5rem',
              marginTop: '0.25rem'
            }}
          >
            {Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i).map(num => (
              <label 
                key={num} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  color: field.specific.includes(num) && field.type === 'specific' ? 'var(--accent-primary)' : 'inherit'
                }}
              >
                <input
                  type="checkbox"
                  checked={field.specific.includes(num) && field.type === 'specific'}
                  onChange={() => toggleSpecific(num)}
                />
                <span>{activeTab === 'week' ? ['','日','一','二','三','四','五','六'][num] : num}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">Cron 表达式生成</h2>
        <p className="tool-desc">可视化配置 Quartz / Unix 表达式，实时估算未来的执行时间</p>
      </div>

      <div className="flex-col gap-6">
        {/* Expression Display Card */}
        <div className="card" style={{ padding: '1rem 1.5rem' }}>
          <div className="flex-row justify-between items-center">
            <div className="flex-row gap-4 items-center">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>生成的表达式:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '2px' }}>
                {cronExpression}
              </span>
            </div>
            <button onClick={handleCopy} className="btn primary py-1 px-4">
              {copied ? <Check size={16} /> : <Copy size={16} />} 复制表达式
            </button>
          </div>
        </div>

        {/* Tab Selection panel & detail config */}
        <div className="pane-layout">
          <div className="card flex-1 flex-col gap-4">
            <div className="tabs-header" style={{ marginBottom: '0.5rem' }}>
              <button onClick={() => setActiveTab('second')} className={`tab-btn ${activeTab === 'second' ? 'active' : ''}`}>秒 (Seconds)</button>
              <button onClick={() => setActiveTab('minute')} className={`tab-btn ${activeTab === 'minute' ? 'active' : ''}`}>分 (Minutes)</button>
              <button onClick={() => setActiveTab('hour')} className={`tab-btn ${activeTab === 'hour' ? 'active' : ''}`}>时 (Hours)</button>
              <button onClick={() => setActiveTab('day')} className={`tab-btn ${activeTab === 'day' ? 'active' : ''}`}>日 (DayOfMonth)</button>
              <button onClick={() => setActiveTab('month')} className={`tab-btn ${activeTab === 'month' ? 'active' : ''}`}>月 (Months)</button>
              <button onClick={() => setActiveTab('week')} className={`tab-btn ${activeTab === 'week' ? 'active' : ''}`}>周 (DayOfWeek)</button>
            </div>
            <div style={{ minHeight: '400px' }}>
              {renderTabContent()}
            </div>
          </div>

          {/* Right side: Execution Estimate */}
          <div className="card" style={{ width: '320px', flexShrink: 0 }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
              <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>近 5 次执行时间估算</span>
            </h3>
            <div className="flex-col gap-3">
              {nextRuns.map((run, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.9rem', 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    background: 'var(--bg-secondary)',
                    borderLeft: '3px solid var(--accent-primary)'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>{idx + 1}.</span>
                  {run}
                </div>
              ))}
            </div>
            <div className="flex-row gap-2 mt-4 items-start" style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-primary)' }} />
              <span>本估算遵循 standard Quartz 调度算法（其中周 1 表示星期日，7 表示星期六）</span>
            </div>
          </div>
        </div>
      </div>

      {copied && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>Cron 表达式已成功复制！</span>
        </div>
      )}
    </div>
  );
};
