import React, { useState, useEffect } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  ArrowUpDown, 
  Search, 
  Download, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

interface DiffNode {
  type: 'unchanged' | 'added' | 'deleted' | 'modified';
  key: string;
  value?: any;
  oldValue?: any;
  children?: DiffNode[];
  isArray?: boolean;
}

interface DiffChange {
  type: 'added' | 'deleted' | 'unchanged';
  value: string;
  lineA?: number;
  lineB?: number;
}

interface DiffGroup {
  type: 'unchanged' | 'changed';
  items: DiffChange[];
  startIndex: number;
}

const groupSequenceDiff = (diffs: DiffChange[]): DiffGroup[] => {
  const groups: DiffGroup[] = [];
  if (diffs.length === 0) return groups;

  let currentGroup: DiffGroup = {
    type: diffs[0].type === 'unchanged' ? 'unchanged' : 'changed',
    items: [diffs[0]],
    startIndex: 0
  };

  for (let idx = 1; idx < diffs.length; idx++) {
    const item = diffs[idx];
    const isUnchanged = item.type === 'unchanged';
    const groupType = isUnchanged ? 'unchanged' : 'changed';

    if (currentGroup.type === groupType) {
      currentGroup.items.push(item);
    } else {
      groups.push(currentGroup);
      currentGroup = {
        type: groupType,
        items: [item],
        startIndex: idx
      };
    }
  }
  groups.push(currentGroup);
  return groups;
};

export const DiffTool: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'json' | 'list'>('text');
  
  // Text Diff States
  const [originalText, setOriginalText] = useState<string>('{\n  "name": "QiQ DevTools",\n  "version": "1.0.0",\n  "status": "active",\n  "author": "Antigravity"\n}');
  const [modifiedText, setModifiedText] = useState<string>('{\n  "name": "QiQ DevTools Pro",\n  "version": "1.1.0",\n  "status": "active",\n  "license": "MIT",\n  "author": "Antigravity AI"\n}');
  const [language, setLanguage] = useState<string>('json');
  const [copiedOriginal, setCopiedOriginal] = useState<boolean>(false);
  const [copiedModified, setCopiedModified] = useState<boolean>(false);

  // JSON Diff States
  const [jsonA, setJsonA] = useState<string>('{\n  "name": "QiQ Tools",\n  "active": true,\n  "tags": ["hardware", "developer"],\n  "author": {\n    "name": "Sarah",\n    "age": 28\n  }\n}');
  const [jsonB, setJsonB] = useState<string>('{\n  "name": "QiQ Tools Pro",\n  "active": true,\n  "tags": ["hardware", "tools", "developer"],\n  "author": {\n    "name": "Sarah",\n    "age": 30,\n    "role": "Lead"\n  },\n  "newField": "Hello"\n}');
  const [diffResult, setDiffResult] = useState<DiffNode | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Text List Diff States
  const [listTextA, setListTextA] = useState<string>(
    'apple\nbanana\ncherry\ndate\nelderberry\nfig\ngrape\nhoney\niron\njackfruit\nkiwi\nlemon\nmango\nnectar'
  );
  const [listTextB, setListTextB] = useState<string>(
    'banana\ncherry\ncoconut\ndate\nfig\ngrapefruit\ngrape\nhoney\niron\njackfruit\nkiwi\nlemon\nmango\norange'
  );
  const [splitChar, setSplitChar] = useState<'\n' | ',' | 'space' | 'custom'>('\n');
  const [customSplitChar, setCustomSplitChar] = useState<string>(';');
  const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
  const [ignoreCase, setIgnoreCase] = useState<boolean>(false);
  const [ignoreEmpty, setIgnoreEmpty] = useState<boolean>(true);
  const [compareMode, setCompareMode] = useState<'sequence' | 'set'>('sequence');

  // Results
  const [diffSequenceResult, setDiffSequenceResult] = useState<DiffChange[]>([]);
  const [listSetDiffResult, setListSetDiffResult] = useState<{
    onlyA: string[];
    onlyB: string[];
    inBoth: string[];
    union: string[];
  }>({ onlyA: [], onlyB: [], inBoth: [], union: [] });

  const [listResultActiveTab, setListResultActiveTab] = useState<'onlyA' | 'onlyB' | 'both' | 'union'>('onlyA');
  const [resultSearchQuery, setResultSearchQuery] = useState<string>('');
  
  // Track folded state for groups of identical lines.
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const handleEditorDidMount = (editor: any) => {
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    originalEditor.onDidChangeModelContent(() => {
      setOriginalText(originalEditor.getValue());
    });

    modifiedEditor.onDidChangeModelContent(() => {
      setModifiedText(modifiedEditor.getValue());
    });
  };

  const handleClear = () => {
    if (activeSubTab === 'text') {
      setOriginalText('');
      setModifiedText('');
    } else if (activeSubTab === 'json') {
      setJsonA('');
      setJsonB('');
      setDiffResult(null);
      setJsonError(null);
    } else {
      setListTextA('');
      setListTextB('');
      setDiffSequenceResult([]);
      setListSetDiffResult({ onlyA: [], onlyB: [], inBoth: [], union: [] });
    }
  };

  const copyToClipboard = (text: string, isOriginal: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOriginal) {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedModified(true);
      setTimeout(() => setCopiedModified(false), 2000);
    }
  };

  // Compute JSON Diff recursively
  const computeJsonDiff = (a: any, b: any, key: string = ''): DiffNode => {
    if (JSON.stringify(a) === JSON.stringify(b)) {
      return { type: 'unchanged', key, value: a };
    }
    
    if (typeof a !== typeof b || a === null || b === null || Array.isArray(a) !== Array.isArray(b)) {
      return { type: 'modified', key, oldValue: a, value: b };
    }
    
    if (Array.isArray(a)) {
      const children: DiffNode[] = [];
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        if (i >= a.length) {
          children.push({ type: 'added', key: `[${i}]`, value: b[i] });
        } else if (i >= b.length) {
          children.push({ type: 'deleted', key: `[${i}]`, value: a[i] });
        } else {
          children.push(computeJsonDiff(a[i], b[i], `[${i}]`));
        }
      }
      return { type: 'modified', key, children, isArray: true };
    }
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      const allKeys = Array.from(new Set([...keysA, ...keysB])).sort();
      const children: DiffNode[] = [];
      
      for (const k of allKeys) {
        if (!keysA.includes(k)) {
          children.push({ type: 'added', key: k, value: b[k] });
        } else if (!keysB.includes(k)) {
          children.push({ type: 'deleted', key: k, value: a[k] });
        } else {
          children.push(computeJsonDiff(a[k], b[k], k));
        }
      }
      return { type: 'modified', key, children };
    }
    
    return { type: 'modified', key, oldValue: a, value: b };
  };

  const handleCompareJson = () => {
    if (!jsonA.trim() || !jsonB.trim()) {
      setJsonError('请在左右侧均输入有效的 JSON 字符串');
      return;
    }
    try {
      const objA = JSON.parse(jsonA);
      let objB;
      try {
        objB = JSON.parse(jsonB);
      } catch (e: any) {
        setJsonError(`右侧 JSON 语法错误: ${e.message}`);
        return;
      }
      setJsonError(null);
      const diff = computeJsonDiff(objA, objB, 'Root');
      setDiffResult(diff);
    } catch (e: any) {
      setJsonError(`左侧 JSON 语法错误: ${e.message}`);
    }
  };

  // Auto trigger JSON Compare on active tab JSON load
  useEffect(() => {
    if (activeSubTab === 'json') {
      handleCompareJson();
    }
  }, [activeSubTab, jsonA, jsonB]);

  // List Compare Logic
  const handleSwapListInputs = () => {
    const temp = listTextA;
    setListTextA(listTextB);
    setListTextB(temp);
  };

  const handleCopySetResult = (items: string[]) => {
    navigator.clipboard.writeText(items.join('\n'));
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const handleDownloadSetResult = (items: string[], filename: string) => {
    const blob = new Blob([items.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSequencePatch = () => {
    const patch = diffSequenceResult
      .map(item => {
        const sign = item.type === 'added' ? '+' : item.type === 'deleted' ? '-' : ' ';
        return `${sign} ${item.value}`;
      })
      .join('\n');
    const blob = new Blob([patch], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'text_diff.patch';
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleGroup = (startIndex: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [startIndex]: !prev[startIndex]
    }));
  };

  const expandAllGroups = (groups: DiffGroup[]) => {
    const next: Record<number, boolean> = {};
    groups.forEach(g => {
      if (g.type === 'unchanged') {
        next[g.startIndex] = true;
      }
    });
    setExpandedGroups(next);
  };

  const collapseAllGroups = () => {
    setExpandedGroups({});
  };

  const computeListDiff = () => {
    let splitter: string | RegExp = '\n';
    if (splitChar === ',') splitter = ',';
    else if (splitChar === 'space') splitter = /\s+/;
    else if (splitChar === 'custom') splitter = customSplitChar || ';';

    let itemsA = listTextA.split(splitter);
    let itemsB = listTextB.split(splitter);

    if (trimWhitespace) {
      itemsA = itemsA.map(i => i.trim());
      itemsB = itemsB.map(i => i.trim());
    }

    if (ignoreEmpty) {
      itemsA = itemsA.filter(i => i !== '');
      itemsB = itemsB.filter(i => i !== '');
    }

    if (compareMode === 'set') {
      const norm = (s: string) => ignoreCase ? s.toLowerCase() : s;
      const normSetB = new Set(itemsB.map(norm));
      const normSetA = new Set(itemsA.map(norm));
      
      const onlyA: string[] = [];
      const onlyB: string[] = [];
      const inBoth: string[] = [];
      
      const uniqueA = Array.from(new Set(itemsA));
      const uniqueB = Array.from(new Set(itemsB));

      for (const item of uniqueA) {
        if (normSetB.has(norm(item))) {
          inBoth.push(item);
        } else {
          onlyA.push(item);
        }
      }
      
      for (const item of uniqueB) {
        if (!normSetA.has(norm(item))) {
          onlyB.push(item);
        }
      }

      const union = Array.from(new Set([...uniqueA, ...uniqueB]));

      setListSetDiffResult({ onlyA, onlyB, inBoth, union });
      setResultSearchQuery('');
    } else {
      const n = itemsA.length;
      const m = itemsB.length;
      
      const dp: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
      
      const equals = (x: string, y: string) => {
        return ignoreCase ? x.toLowerCase() === y.toLowerCase() : x === y;
      };

      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (equals(itemsA[i - 1], itemsB[j - 1])) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }

      const result: DiffChange[] = [];
      let i = n, j = m;
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && equals(itemsA[i - 1], itemsB[j - 1])) {
          result.unshift({
            type: 'unchanged',
            value: itemsB[j - 1],
            lineA: i,
            lineB: j
          });
          i--;
          j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
          result.unshift({
            type: 'added',
            value: itemsB[j - 1],
            lineB: j
          });
          j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
          result.unshift({
            type: 'deleted',
            value: itemsA[i - 1],
            lineA: i
          });
          i--;
        }
      }
      setDiffSequenceResult(result);
      setExpandedGroups({});
    }
  };

  useEffect(() => {
    if (activeSubTab === 'list') {
      computeListDiff();
    }
  }, [activeSubTab, listTextA, listTextB, splitChar, customSplitChar, trimWhitespace, ignoreCase, ignoreEmpty, compareMode]);

  const getActiveList = (): string[] => {
    switch (listResultActiveTab) {
      case 'onlyA': return listSetDiffResult.onlyA;
      case 'onlyB': return listSetDiffResult.onlyB;
      case 'both': return listSetDiffResult.inBoth;
      case 'union': return listSetDiffResult.union;
      default: return [];
    }
  };

  const currentActiveList = getActiveList();
  const filteredActiveList = currentActiveList.filter((item: string) => 
    item.toLowerCase().includes(resultSearchQuery.toLowerCase())
  );

  const diffGroups = groupSequenceDiff(diffSequenceResult);

  return (
    <div className="tool-container">
      {/* Styles Injection */}
      <style>{`
        .list-diff-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-mono);
          font-size: 0.875rem;
        }
        .list-diff-table th {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-weight: 500;
          text-align: left;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }
        .list-diff-table td {
          padding: 0.4rem 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          vertical-align: top;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .list-diff-row-deleted {
          background: rgba(239, 68, 68, 0.08);
          color: #fca5a5;
        }
        .list-diff-row-added {
          background: rgba(16, 185, 129, 0.08);
          color: #86efac;
        }
        .list-diff-row-unchanged {
          color: var(--text-secondary);
        }
        .list-diff-line-num {
          width: 60px;
          color: var(--text-muted);
          text-align: right;
          border-right: 1px solid var(--border-color);
          user-select: none;
          padding-right: 0.5rem !important;
        }
        .list-diff-sign {
          width: 30px;
          text-align: center;
          user-select: none;
          font-weight: bold;
        }
        .list-diff-fold-row:hover td {
          background: var(--bg-tertiary) !important;
          color: var(--accent-primary) !important;
          opacity: 0.9;
        }
        .set-result-item {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .set-result-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Header and subtabs */}
      <div className="tool-header flex-row justify-between items-center">
        <div>
          <h2 className="tool-title">数据对比中心 (Diff)</h2>
          <p className="tool-desc">支持代码文本逐行比对、JSON 结构性比对以及数据列表项集合/序列比对</p>
        </div>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px', background: 'var(--bg-secondary)', display: 'flex' }}>
          <button 
            className={`btn py-1 px-3 ${activeSubTab === 'text' ? 'primary' : ''}`}
            onClick={() => setActiveSubTab('text')}
            style={{ fontSize: '0.85rem', border: 'none' }}
          >
            文本行对比
          </button>
          <button 
            className={`btn py-1 px-3 ${activeSubTab === 'json' ? 'primary' : ''}`}
            onClick={() => setActiveSubTab('json')}
            style={{ fontSize: '0.85rem', border: 'none' }}
          >
            JSON 结构对比
          </button>
          <button 
            className={`btn py-1 px-3 ${activeSubTab === 'list' ? 'primary' : ''}`}
            onClick={() => setActiveSubTab('list')}
            style={{ fontSize: '0.85rem', border: 'none' }}
          >
            文本/数据列表对比
          </button>
        </div>
      </div>

      {activeSubTab === 'text' && (
        /* Tab 1: Text Diff Pane */
        <div className="flex-col flex-1 gap-3">
          <div className="flex-row justify-between items-center">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
            >
              <option value="text">纯文本 (Text)</option>
              <option value="json">JSON</option>
              <option value="javascript">JavaScript / TS</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="xml">XML</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
            <button onClick={handleClear} className="btn py-1 px-2">
              <Trash2 size={14} /> 清空
            </button>
          </div>
          <div className="pane-layout" style={{ flex: 1, minHeight: '650px' }}>
            <div className="editor-panel" style={{ height: '100%' }}>
              <div className="panel-header">
                <div className="flex-row justify-between" style={{ width: '100%' }}>
                  <div className="flex-row items-center gap-4">
                    <span>左：原始文本 (Original)</span>
                    <button 
                      onClick={() => copyToClipboard(originalText, true)} 
                      className="btn py-0 px-2"
                      style={{ fontSize: '0.75rem', height: '24px', padding: '0 6px' }}
                    >
                      {copiedOriginal ? <Check size={12} /> : <Copy size={12} />} 复制
                    </button>
                  </div>
                  <div className="flex-row items-center gap-4">
                    <button 
                      onClick={() => copyToClipboard(modifiedText, false)} 
                      className="btn py-0 px-2"
                      style={{ fontSize: '0.75rem', height: '24px', padding: '0 6px' }}
                    >
                      {copiedModified ? <Check size={12} /> : <Copy size={12} />} 复制
                    </button>
                    <span>右：修改后文本 (Modified)</span>
                  </div>
                </div>
              </div>
              <div className="panel-body">
                <DiffEditor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  original={originalText}
                  modified={modifiedText}
                  onMount={handleEditorDidMount}
                  options={{
                    originalEditable: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    automaticLayout: true,
                    renderSideBySide: true,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'json' && (
        /* Tab 2: JSON Diff Pane */
        <div className="flex-col flex-1 gap-4">
          <div className="pane-layout" style={{ minHeight: '400px', height: '400px' }}>
            <div className="editor-panel" style={{ height: '100%' }}>
              <div className="panel-header"><span>JSON 数据 A (源)</span></div>
              <div className="panel-body">
                <Editor
                  height="100%"
                  language="json"
                  theme="vs-dark"
                  value={jsonA}
                  onChange={(val: string | undefined) => setJsonA(val || '')}
                  options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <button onClick={handleCompareJson} className="btn primary py-2 px-3">
                <RefreshCw size={14} className="animate-spin-slow" /> 对比 A/B
              </button>
              <button onClick={handleClear} className="btn secondary py-1 px-3">
                清空数据
              </button>
            </div>

            <div className="editor-panel" style={{ height: '100%' }}>
              <div className="panel-header"><span>JSON 数据 B (对比)</span></div>
              <div className="panel-body">
                <Editor
                  height="100%"
                  language="json"
                  theme="vs-dark"
                  value={jsonB}
                  onChange={(val: string | undefined) => setJsonB(val || '')}
                  options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
                />
              </div>
            </div>
          </div>

          {jsonError && (
            <div className="alert error">
              <AlertCircle size={16} />
              <span>{jsonError}</span>
            </div>
          )}

          {/* Results tree */}
          <div className="card flex-col flex-1" style={{ overflowY: 'auto', maxHeight: '350px' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '1rem' }}>
              JSON 差异树结构 (Git Diff 风格)
            </h3>
            <div 
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.875rem', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px', 
                padding: '1rem',
                overflowX: 'auto'
              }}
            >
              {diffResult ? (
                <DiffTreeNode node={diffResult} isLast={true} depth={0} />
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>输入两组 JSON 后自动生成对比分析</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'list' && (
        /* Tab 3: List Diff Pane */
        <div className="flex-col flex-1 gap-4">
          <div className="pane-layout" style={{ minHeight: '400px', height: '400px' }}>
            <div className="editor-panel" style={{ height: '100%' }}>
              <div className="panel-header">
                <span>数据列表 A</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  共 {listTextA.split(splitChar === 'space' ? /\s+/ : splitChar === 'custom' ? (customSplitChar || ';') : splitChar).filter(i => ignoreEmpty ? i.trim() !== '' : true).length} 项
                </span>
              </div>
              <div className="panel-body">
                <Editor
                  height="100%"
                  language="text"
                  theme="vs-dark"
                  value={listTextA}
                  onChange={(val: string | undefined) => setListTextA(val || '')}
                  options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <button onClick={handleSwapListInputs} className="btn secondary py-1 px-3" title="交换 A/B 数据">
                <ArrowUpDown size={14} /> 交换 A/B
              </button>
              <button onClick={handleClear} className="btn py-1 px-3">
                <Trash2 size={14} /> 清空数据
              </button>
            </div>

            <div className="editor-panel" style={{ height: '100%' }}>
              <div className="panel-header">
                <span>数据列表 B</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  共 {listTextB.split(splitChar === 'space' ? /\s+/ : splitChar === 'custom' ? (customSplitChar || ';') : splitChar).filter(i => ignoreEmpty ? i.trim() !== '' : true).length} 项
                </span>
              </div>
              <div className="panel-body">
                <Editor
                  height="100%"
                  language="text"
                  theme="vs-dark"
                  value={listTextB}
                  onChange={(val: string | undefined) => setListTextB(val || '')}
                  options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
                />
              </div>
            </div>
          </div>

          {/* Config bar */}
          <div className="card flex-row justify-between items-center gap-4 flex-wrap" style={{ padding: '1rem' }}>
            <div className="flex-row items-center gap-2">
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>分割字符:</span>
              <select 
                value={splitChar} 
                onChange={(e) => setSplitChar(e.target.value as any)}
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value="\n">按行分割</option>
                <option value=",">英文逗号 ( , )</option>
                <option value="space">空格/空白符</option>
                <option value="custom">自定义字符</option>
              </select>
              {splitChar === 'custom' && (
                <input 
                  type="text" 
                  value={customSplitChar} 
                  onChange={(e) => setCustomSplitChar(e.target.value)} 
                  style={{ width: '50px', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                  placeholder=";"
                />
              )}
            </div>

            <div className="flex-row items-center gap-2">
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>比对模式:</span>
              <select 
                value={compareMode} 
                onChange={(e) => setCompareMode(e.target.value as any)}
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value="sequence">序列比对 (保留顺序/相同行可折叠)</option>
                <option value="set">集合比对 (忽略顺序与重复)</option>
              </select>
            </div>

            <div className="flex-row items-center gap-4 flex-wrap">
              <label className="flex-row items-center gap-1" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={trimWhitespace} 
                  onChange={(e) => setTrimWhitespace(e.target.checked)} 
                />
                <span>去除首尾空格</span>
              </label>
              <label className="flex-row items-center gap-1" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={ignoreCase} 
                  onChange={(e) => setIgnoreCase(e.target.checked)} 
                />
                <span>忽略大小写</span>
              </label>
              <label className="flex-row items-center gap-1" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={ignoreEmpty} 
                  onChange={(e) => setIgnoreEmpty(e.target.checked)} 
                />
                <span>过滤空元素</span>
              </label>
            </div>
          </div>

          {/* Results Area */}
          {compareMode === 'sequence' ? (
            /* Sequence Diff UI */
            <div className="card flex-col flex-1" style={{ minHeight: '300px' }}>
              <div className="flex-row justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem' }}>比对结果 (文本序列差异)</h3>
                <div className="flex-row gap-2">
                  {diffSequenceResult.length > 0 && (
                    <>
                      <button onClick={() => expandAllGroups(diffGroups)} className="btn py-1 px-2" style={{ fontSize: '0.8rem' }}>
                        全部展开
                      </button>
                      <button onClick={collapseAllGroups} className="btn py-1 px-2" style={{ fontSize: '0.8rem' }}>
                        全部折叠
                      </button>
                      <button onClick={handleDownloadSequencePatch} className="btn primary py-1 px-2" style={{ fontSize: '0.8rem' }}>
                        <Download size={12} /> 下载 Diff 补丁
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '550px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                {diffSequenceResult.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>暂无比对数据，请输入后自动分析</div>
                ) : (
                  <table className="list-diff-table">
                    <thead>
                      <tr>
                        <th className="list-diff-line-num">A 行号</th>
                        <th className="list-diff-line-num">B 行号</th>
                        <th className="list-diff-sign">#</th>
                        <th>数据内容</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diffGroups.flatMap((group) => {
                        const isFolded = group.type === 'unchanged' && group.items.length > 5 && !expandedGroups[group.startIndex];
                        
                        if (isFolded) {
                          return (
                            <tr 
                              key={`fold-${group.startIndex}`} 
                              className="list-diff-fold-row" 
                              onClick={() => toggleGroup(group.startIndex)}
                            >
                              <td colSpan={4} style={{ textAlign: 'center', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '0.6rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div className="flex-row items-center justify-center gap-2">
                                  <ChevronDown size={14} style={{ color: 'var(--accent-primary)' }} />
                                  <span>已折叠 {group.items.length} 行相同数据 (点击展开)</span>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        const rows = group.items.map((item, idx) => {
                          const rowClass = 
                            item.type === 'added' ? 'list-diff-row-added' :
                            item.type === 'deleted' ? 'list-diff-row-deleted' :
                            'list-diff-row-unchanged';
                          
                          const sign = item.type === 'added' ? '+' : item.type === 'deleted' ? '-' : '';
                          
                          return (
                            <tr key={`${group.startIndex}-${idx}`} className={rowClass}>
                              <td className="list-diff-line-num">{item.lineA || ''}</td>
                              <td className="list-diff-line-num">{item.lineB || ''}</td>
                              <td className="list-diff-sign">{sign}</td>
                              <td>{item.value}</td>
                            </tr>
                          );
                        });

                        if (group.type === 'unchanged' && group.items.length > 5 && expandedGroups[group.startIndex]) {
                          const collapseHeader = (
                            <tr 
                              key={`unfold-${group.startIndex}`} 
                              className="list-diff-fold-row" 
                              onClick={() => toggleGroup(group.startIndex)}
                            >
                              <td colSpan={4} style={{ textAlign: 'center', background: 'var(--bg-tertiary)', color: 'var(--accent-primary)', padding: '0.4rem', fontSize: '0.8rem', opacity: 0.8, borderBottom: '1px solid var(--border-color)' }}>
                                <div className="flex-row items-center justify-center gap-2">
                                  <ChevronUp size={12} />
                                  <span>收起 {group.items.length} 行相同数据</span>
                                </div>
                              </td>
                            </tr>
                          );
                          return [collapseHeader, ...rows];
                        }

                        return rows;
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            /* Set Diff UI */
            <div className="card flex-col flex-1" style={{ minHeight: '300px' }}>
              <div className="flex-row justify-between items-center flex-wrap gap-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <div className="flex-row gap-2 flex-wrap" style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px', background: 'var(--bg-secondary)' }}>
                  <button 
                    className={`btn py-1 px-3 ${listResultActiveTab === 'onlyA' ? 'primary' : ''}`}
                    onClick={() => setListResultActiveTab('onlyA')}
                    style={{ fontSize: '0.8rem', border: 'none' }}
                  >
                    仅在 A 中 ({listSetDiffResult.onlyA.length})
                  </button>
                  <button 
                    className={`btn py-1 px-3 ${listResultActiveTab === 'onlyB' ? 'primary' : ''}`}
                    onClick={() => setListResultActiveTab('onlyB')}
                    style={{ fontSize: '0.8rem', border: 'none' }}
                  >
                    仅在 B 中 ({listSetDiffResult.onlyB.length})
                  </button>
                  <button 
                    className={`btn py-1 px-3 ${listResultActiveTab === 'both' ? 'primary' : ''}`}
                    onClick={() => setListResultActiveTab('both')}
                    style={{ fontSize: '0.8rem', border: 'none' }}
                  >
                    两者共有 ({listSetDiffResult.inBoth.length})
                  </button>
                  <button 
                    className={`btn py-1 px-3 ${listResultActiveTab === 'union' ? 'primary' : ''}`}
                    onClick={() => setListResultActiveTab('union')}
                    style={{ fontSize: '0.8rem', border: 'none' }}
                  >
                    并集结果 ({listSetDiffResult.union.length})
                  </button>
                </div>

                <div className="flex-row items-center gap-2">
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="搜索结果项..." 
                      value={resultSearchQuery}
                      onChange={(e) => setResultSearchQuery(e.target.value)}
                      style={{ padding: '0.35rem 0.5rem 0.35rem 28px', fontSize: '0.8rem', width: '180px' }}
                    />
                  </div>
                  <button 
                    onClick={() => handleCopySetResult(currentActiveList)} 
                    className="btn py-1 px-2"
                    style={{ fontSize: '0.8rem' }}
                    disabled={currentActiveList.length === 0}
                  >
                    <Copy size={12} /> 复制列表
                  </button>
                  <button 
                    onClick={() => handleDownloadSetResult(currentActiveList, `${listResultActiveTab}_list.txt`)} 
                    className="btn primary py-1 px-2"
                    style={{ fontSize: '0.8rem' }}
                    disabled={currentActiveList.length === 0}
                  >
                    <Download size={12} /> 导出
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {filteredActiveList.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                    {resultSearchQuery ? '没有找到匹配的元素' : '该列表中没有元素'}
                  </div>
                ) : (
                  <div>
                    {filteredActiveList.map((item: string, idx: number) => (
                      <div key={idx} className="set-result-item">
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{item}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {(copiedOriginal || copiedModified) && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>文本已成功复制到剪贴板！</span>
        </div>
      )}
    </div>
  );
};

// Recursive Diff Tree Renderer
interface DiffTreeNodeProps {
  node: DiffNode;
  isLast: boolean;
  depth: number;
}

const DiffTreeNode: React.FC<DiffTreeNodeProps> = ({ node, isLast, depth }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatPrimitive = (val: any): string => {
    if (val === null) return 'null';
    if (typeof val === 'string') return `"${val}"`;
    return String(val);
  };

  const getPrimitiveClass = (val: any): string => {
    if (typeof val === 'string') return 'tree-val-string';
    if (typeof val === 'number') return 'tree-val-number';
    if (typeof val === 'boolean') return 'tree-val-boolean';
    return 'tree-val-null';
  };

  // UNCHANGED node
  if (node.type === 'unchanged') {
    if (node.value !== null && typeof node.value === 'object') {
      const isArr = Array.isArray(node.value);
      const keys = Object.keys(node.value);
      const open = isArr ? '[' : '{';
      const close = isArr ? ']' : '}';

      if (keys.length === 0) {
        return (
          <div style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
            "{node.key}": {open}{close}{isLast ? '' : ','}
          </div>
        );
      }

      return (
        <div style={{ paddingLeft: '1.25rem' }}>
          <span 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            "{node.key}": {open}
          </span>
          {isCollapsed ? (
            <span onClick={() => setIsCollapsed(false)} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', cursor: 'pointer' }}>
              {' '}{keys.length} items ... {close}{isLast ? '' : ','}
            </span>
          ) : (
            <>
              <div>
                {keys.map((k, idx) => {
                  const childNode: DiffNode = {
                    type: 'unchanged',
                    key: k,
                    value: node.value[k]
                  };
                  return <DiffTreeNode key={k} node={childNode} isLast={idx === keys.length - 1} depth={depth + 1} />;
                })}
              </div>
              <div>{close}{isLast ? '' : ','}</div>
            </>
          )}
        </div>
      );
    }

    return (
      <div style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
        "{node.key}": <span className={getPrimitiveClass(node.value)}>{formatPrimitive(node.value)}</span>{isLast ? '' : ','}
      </div>
    );
  }

  // ADDED node
  if (node.type === 'added') {
    return (
      <div 
        style={{ 
          background: 'rgba(16, 185, 129, 0.12)', 
          borderLeft: '3px solid var(--success)', 
          paddingLeft: '0.5rem', 
          color: '#86efac',
          display: 'flex',
          gap: '0.5rem'
        }}
      >
        <span>+</span>
        <span>
          "{node.key}": {typeof node.value === 'object' && node.value !== null 
            ? JSON.stringify(node.value) 
            : <span className={getPrimitiveClass(node.value)} style={{ color: 'inherit' }}>{formatPrimitive(node.value)}</span>
          }{isLast ? '' : ','}
        </span>
      </div>
    );
  }

  // DELETED node
  if (node.type === 'deleted') {
    return (
      <div 
        style={{ 
          background: 'rgba(239, 68, 68, 0.12)', 
          borderLeft: '3px solid var(--error)', 
          paddingLeft: '0.5rem', 
          color: '#fca5a5',
          textDecoration: 'line-through',
          display: 'flex',
          gap: '0.5rem'
        }}
      >
        <span>-</span>
        <span>
          "{node.key}": {typeof node.value === 'object' && node.value !== null 
            ? JSON.stringify(node.value) 
            : <span className={getPrimitiveClass(node.value)} style={{ color: 'inherit' }}>{formatPrimitive(node.value)}</span>
          }{isLast ? '' : ','}
        </span>
      </div>
    );
  }

  // MODIFIED nested structure
  if (node.type === 'modified') {
    if (node.children) {
      const open = node.isArray ? '[' : '{';
      const close = node.isArray ? ']' : '}';

      return (
        <div style={{ paddingLeft: '1.25rem' }}>
          <span 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            style={{ cursor: 'pointer', color: 'var(--accent-secondary)' }}
          >
            "{node.key}": {open}
          </span>
          {isCollapsed ? (
            <span onClick={() => setIsCollapsed(false)} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', cursor: 'pointer' }}>
              {' '}{node.children.length} changes ... {close}{isLast ? '' : ','}
            </span>
          ) : (
            <>
              <div>
                {node.children.map((child, idx) => (
                  <DiffTreeNode key={child.key} node={child} isLast={idx === node.children!.length - 1} depth={depth + 1} />
                ))}
              </div>
              <div>{close}{isLast ? '' : ','}</div>
            </>
          )}
        </div>
      );
    }

    // Primitive values modified
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Deleted old value */}
        <div 
          style={{ 
            background: 'rgba(239, 68, 68, 0.12)', 
            borderLeft: '3px solid var(--error)', 
            paddingLeft: '0.5rem', 
            color: '#fca5a5',
            textDecoration: 'line-through',
            display: 'flex',
            gap: '0.5rem'
          }}
        >
          <span>-</span>
          <span>
            "{node.key}": <span className={getPrimitiveClass(node.oldValue)} style={{ color: 'inherit' }}>{formatPrimitive(node.oldValue)}</span>,
          </span>
        </div>
        
        {/* Added new value */}
        <div 
          style={{ 
            background: 'rgba(16, 185, 129, 0.12)', 
            borderLeft: '3px solid var(--success)', 
            paddingLeft: '0.5rem', 
            color: '#86efac',
            display: 'flex',
            gap: '0.5rem'
          }}
        >
          <span>+</span>
          <span>
            "{node.key}": <span className={getPrimitiveClass(node.value)} style={{ color: 'inherit' }}>{formatPrimitive(node.value)}</span>{isLast ? '' : ','}
          </span>
        </div>
      </div>
    );
  }

  return null;
};
