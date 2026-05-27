import React, { useState, useEffect } from 'react';
import { AlertCircle, Info } from 'lucide-react';

export const RegexTester: React.FC = () => {
  const [pattern, setPattern] = useState<string>('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
  const [flags, setFlags] = useState({
    g: true,
    i: true,
    m: false,
    s: false,
  });
  const [testText, setTestText] = useState<string>(
    'Contact us at support@qqe2.com or sales@example.org for inquiries. \nAlso, admin@test.net is another contact.'
  );
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFlagChange = (flagKey: keyof typeof flags) => {
    setFlags(prev => ({
      ...prev,
      [flagKey]: !prev[flagKey]
    }));
  };

  useEffect(() => {
    if (!pattern) {
      setMatchResults([]);
      setErrorMsg(null);
      return;
    }

    try {
      const flagStr = 
        (flags.g ? 'g' : '') + 
        (flags.i ? 'i' : '') + 
        (flags.m ? 'm' : '') + 
        (flags.s ? 's' : '');
      
      const regex = new RegExp(pattern, flagStr);
      const results: any[] = [];
      let match;
      
      if (flags.g) {
        regex.lastIndex = 0;
        let iterations = 0;
        while ((match = regex.exec(testText)) !== null) {
          results.push(match);
          if (match[0].length === 0) {
            regex.lastIndex++; // Prevent infinite loops on zero-width matches
          }
          iterations++;
          if (iterations > 1000) break; // safeguard
        }
      } else {
        match = regex.exec(testText);
        if (match) results.push(match);
      }
      
      setMatchResults(results);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(e.message);
      setMatchResults([]);
    }
  }, [pattern, flags, testText]);

  const renderHighlightedText = () => {
    if (!pattern || matchResults.length === 0) {
      return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>{testText}</pre>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    matchResults.forEach((match, index) => {
      const start = match.index;
      const end = start + match[0].length;

      // Unmatched segment before
      if (start > lastIndex) {
        elements.push(testText.substring(lastIndex, start));
      }

      // Matched highlighted segment
      elements.push(
        <span 
          key={index} 
          className="regex-match"
          title={`匹配: ${match[0]}\n位置: ${start}-${end}`}
        >
          {match[0]}
        </span>
      );

      lastIndex = end;
    });

    if (lastIndex < testText.length) {
      elements.push(testText.substring(lastIndex));
    }

    return (
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', lineHeight: '1.6' }}>
        {elements.length > 0 ? elements : testText}
      </pre>
    );
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">正则表达式测试</h2>
        <p className="tool-desc">实时编译、高亮匹配，并列出所有匹配子组及捕获信息</p>
      </div>

      <div className="flex-col gap-4">
        {/* Pattern input card */}
        <div className="card">
          <div className="flex-col gap-3">
            <div className="flex-row items-center gap-2">
              <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="在此输入正则表达式，如: [a-z]+"
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}
              />
              <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/</span>
              
              {/* Flags selection */}
              <div className="flex-row gap-3 items-center px-2">
                <label className="flex-row items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={flags.g}
                    onChange={() => handleFlagChange('g')}
                  />
                  <span title="全局匹配 (global)">g</span>
                </label>
                <label className="flex-row items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={flags.i}
                    onChange={() => handleFlagChange('i')}
                  />
                  <span title="不区分大小写 (ignoreCase)">i</span>
                </label>
                <label className="flex-row items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={flags.m}
                    onChange={() => handleFlagChange('m')}
                  />
                  <span title="多行模式 (multiline)">m</span>
                </label>
                <label className="flex-row items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={flags.s}
                    onChange={() => handleFlagChange('s')}
                  />
                  <span title="单行模式 / .匹配换行 (dotAll)">s</span>
                </label>
              </div>
            </div>

            {errorMsg && (
              <div className="alert error py-2" style={{ margin: 0 }}>
                <AlertCircle size={16} />
                <span>正则表达式错误: {errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Core Workspace Grid */}
        <div className="pane-layout">
          {/* Left panel: Input Test Text */}
          <div className="editor-panel" style={{ height: '400px' }}>
            <div className="panel-header">
              <span>测试文本 (Test Text)</span>
            </div>
            <div className="panel-body">
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="请输入要进行匹配测试的文本..."
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 0,
                  resize: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                }}
              />
            </div>
          </div>

          {/* Right panel: Live Highlights */}
          <div className="editor-panel" style={{ height: '400px' }}>
            <div className="panel-header">
              <span>匹配高亮 (Highlighted Result)</span>
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                共 {matchResults.length} 个匹配
              </span>
            </div>
            <div className="panel-body" style={{ padding: '1rem', overflow: 'auto', background: 'var(--bg-secondary)' }}>
              {renderHighlightedText()}
            </div>
          </div>
        </div>

        {/* Match results breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>捕获组明细 (Capture Groups)</span>
          </h3>

          {matchResults.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>暂无匹配的捕获数据</div>
          ) : (
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.5rem' }}>匹配序号</th>
                    <th style={{ padding: '0.5rem' }}>匹配位置</th>
                    <th style={{ padding: '0.5rem' }}>完全匹配内容</th>
                    <th style={{ padding: '0.5rem' }}>捕获子组 (Sub-groups)</th>
                  </tr>
                </thead>
                <tbody>
                  {matchResults.map((match, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.5rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>#{idx + 1}</td>
                      <td style={{ padding: '0.5rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{match.index}..{match.index + match[0].length}</td>
                      <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>{match[0]}</td>
                      <td style={{ padding: '0.5rem' }}>
                        {match.slice(1).map((sub: string, subIdx: number) => (
                          <div key={subIdx} style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>${subIdx + 1}:</span>{' '}
                            <span style={{ color: '#f472b6' }}>{sub !== undefined ? `"${sub}"` : 'null'}</span>
                          </div>
                        ))}
                        {match.length <= 1 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>无子组</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
