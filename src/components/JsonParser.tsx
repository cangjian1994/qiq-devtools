import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { JsonTree } from './JsonTree';
import { 
  AlignLeft, 
  Minimize2, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  ArrowUpDown,
  Download,
  Upload,
  Table
} from 'lucide-react';

export const JsonParser: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const [jsonText, setJsonText] = useState<string>('{\n  "name": "QiQ DevTools",\n  "version": "1.0.0",\n  "description": "A premium developer utility suite.",\n  "features": [\n    "JSON Parser & Formatter",\n    "JSON Tree View with filtering",\n    "Text Diff editor",\n    "WebSocket simulator",\n    "Cron expression generator"\n  ],\n  "author": {\n    "name": "Antigravity",\n    "github": "https://github.com"\n  }\n}');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [jsonPath, setJsonPath] = useState<string>('');
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);
  const [copied, setCopied] = useState<boolean>(false);
  
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse JSON on text change
  useEffect(() => {
    if (!jsonText.trim()) {
      setParsedJson(null);
      setErrorMsg(null);
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      setParsedJson(parsed);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  }, [jsonText]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const showToast = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(`格式化失败: ${e.message}`);
    }
  };

  const handleCompress = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const compressed = JSON.stringify(parsed);
      setJsonText(compressed);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(`压缩失败: ${e.message}`);
    }
  };

  const handleEscape = () => {
    const escaped = jsonText
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    setJsonText(escaped);
  };

  const handleUnescape = () => {
    try {
      const unescaped = jsonText
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');
      setJsonText(unescaped);
    } catch (e: any) {
      setErrorMsg(`去转义失败: ${e.message}`);
    }
  };

  // Recursively sort object keys and array elements alphabetically
  const sortObjectKeys = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) {
      const mapped = obj.map(sortObjectKeys);
      const isPrimitiveArray = mapped.every(el => typeof el !== 'object' || el === null);
      if (isPrimitiveArray) {
        return mapped.sort((a, b) => {
          if (typeof a === 'number' && typeof b === 'number') return a - b;
          return String(a).localeCompare(String(b), 'zh-CN', { numeric: true });
        });
      }
      return mapped;
    }
    return Object.keys(obj).sort().reduce((sorted: any, key) => {
      sorted[key] = sortObjectKeys(obj[key]);
      return sorted;
    }, {});
  };

  const handleSortKeys = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const sorted = sortObjectKeys(parsed);
      setJsonText(JSON.stringify(sorted, null, 2));
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(`排序失败: ${e.message}`);
    }
  };

  const handleDownload = () => {
    if (!jsonText.trim()) return;
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const handleConvertToCsv = () => {
    try {
      const parsed = JSON.parse(jsonText);
      let arr: any[] = [];
      if (Array.isArray(parsed)) {
        arr = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        const arrays = Object.values(parsed).filter(Array.isArray);
        if (arrays.length > 0) {
          arr = arrays[0];
        } else {
          arr = [parsed];
        }
      } else {
        setErrorMsg('JSON 必须是数组或对象才能转换为 CSV');
        return;
      }

      if (arr.length === 0) {
        setErrorMsg('数据为空，无法转换为 CSV');
        return;
      }

      const headers = Array.from(new Set(arr.flatMap(obj => typeof obj === 'object' && obj !== null ? Object.keys(obj) : [])));
      if (headers.length === 0) {
        setErrorMsg('未找到可导出的字段');
        return;
      }

      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const row of arr) {
        const values = headers.map(header => {
          const val = row[header];
          if (val === undefined || val === null) return '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          const escaped = str.replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') ? `"${escaped}"` : escaped;
        });
        csvRows.push(values.join(','));
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErrorMsg(`转 CSV 失败: ${e.message}`);
    }
  };

  const queryJsonByPath = (obj: any, path: string): any => {
    if (!path.trim()) return obj;
    try {
      // Support path like author.name or features[0]
      const cleanPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
      const keys = cleanPath.split('.').filter(Boolean);
      let current = obj;
      for (const key of keys) {
        if (current === undefined || current === null) return undefined;
        current = current[key];
      }
      return current;
    } catch {
      return undefined;
    }
  };

  const handleClear = () => {
    setJsonText('');
    setParsedJson(null);
    setErrorMsg(null);
    setJsonPath('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    showToast();
  };

  const triggerExpandAll = () => {
    setExpandAll(true);
    setTimeout(() => setExpandAll(undefined), 100);
  };

  const triggerCollapseAll = () => {
    setExpandAll(false);
    setTimeout(() => setExpandAll(undefined), 100);
  };

  const handleCodeToTree = () => {
    try {
      if (!jsonText.trim()) {
        setParsedJson(null);
        setErrorMsg(null);
        return;
      }
      const parsed = JSON.parse(jsonText);
      setParsedJson(parsed);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const updateJsonAtPath = (obj: any, path: (string | number)[], newValue: any): any => {
    if (path.length === 0) return newValue;
    const [currentKey, ...restPath] = path;
    
    if (Array.isArray(obj)) {
      const idx = Number(currentKey);
      const newArr = [...obj];
      newArr[idx] = updateJsonAtPath(obj[idx], restPath, newValue);
      return newArr;
    } else if (typeof obj === 'object' && obj !== null) {
      return {
        ...obj,
        [currentKey]: updateJsonAtPath(obj[currentKey], restPath, newValue)
      };
    }
    return obj;
  };

  const handleTreeToCode = () => {
    if (displayJson !== null && displayJson !== undefined) {
      try {
        setJsonText(JSON.stringify(displayJson, null, 2));
        setErrorMsg(null);
      } catch (e: any) {
        setErrorMsg(e.message);
      }
    }
  };

  const handleTreeUpdate = (updatedSubData: any) => {
    if (jsonPath.trim()) {
      const cleanPath = jsonPath.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
      const pathKeys = cleanPath.split('.').filter(Boolean).map(k => isNaN(Number(k)) ? k : Number(k));
      const updatedRoot = updateJsonAtPath(parsedJson, pathKeys, updatedSubData);
      setParsedJson(updatedRoot);
      setJsonText(JSON.stringify(updatedRoot, null, 2));
    } else {
      setParsedJson(updatedSubData);
      setJsonText(JSON.stringify(updatedSubData, null, 2));
    }
  };

  // Keyboard shortcut listener for Ctrl + > and Ctrl + <
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '>' || e.key === '.')) {
        e.preventDefault();
        handleCodeToTree();
      }
      if (e.ctrlKey && (e.key === '<' || e.key === ',')) {
        e.preventDefault();
        handleTreeToCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [jsonText, parsedJson]);

  // Get active JSON node based on JSONPath query
  const displayJson = parsedJson ? queryJsonByPath(parsedJson, jsonPath) : null;

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">JSON 在线编辑器与解析</h2>
        <p className="tool-desc">全面的 JSON 美化压缩、转义去转义、键排序、CSV 导出、Path 节点过滤功能</p>
      </div>

      <div className="pane-layout">
        {/* Left pane: Monaco Editor */}
        <div className="editor-panel">
          <div className="panel-header">
            <span>JSON 源码输入</span>
            <div className="flex-row gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="btn py-1 px-2" title="导入本地 JSON 文件">
                <Upload size={14} /> 导入
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".json" 
                style={{ display: 'none' }} 
              />
              <button onClick={handleSortKeys} className="btn py-1 px-2" title="键按字母排序">
                <ArrowUpDown size={14} /> 排序
              </button>
              <button onClick={handleConvertToCsv} className="btn py-1 px-2" title="导出为 CSV/Excel 文件">
                <Table size={14} /> 转 CSV
              </button>
              <button onClick={handleDownload} className="btn py-1 px-2" title="保存/下载 JSON">
                <Download size={14} /> 下载
              </button>
            </div>
          </div>
          
          {/* Subheader bar for basic edit ops */}
          <div className="panel-header" style={{ background: 'var(--bg-secondary)', borderTop: 'none' }}>
            <div className="flex-row gap-2">
              <button onClick={handleFormat} className="btn py-1 px-2" style={{ background: 'var(--bg-tertiary)' }}>
                <AlignLeft size={14} /> 格式化
              </button>
              <button onClick={handleCompress} className="btn py-1 px-2" style={{ background: 'var(--bg-tertiary)' }}>
                <Minimize2 size={14} /> 压缩
              </button>
              <button onClick={handleEscape} className="btn py-1 px-2" style={{ background: 'var(--bg-tertiary)' }}>
                转义
              </button>
              <button onClick={handleUnescape} className="btn py-1 px-2" style={{ background: 'var(--bg-tertiary)' }}>
                去转义
              </button>
            </div>
            <div className="flex-row gap-2">
              <button onClick={handleClear} className="btn py-1 px-2">
                <Trash2 size={14} /> 清空
              </button>
              <button onClick={handleCopy} className="btn py-1 px-2 primary">
                {copied ? <Check size={14} /> : <Copy size={14} />} 复制
              </button>
            </div>
          </div>

          <div className="panel-body">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme={theme === 'dark' ? 'vs-dark' : 'vs'}
              value={jsonText}
              onChange={(value) => setJsonText(value || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                formatOnPaste: true,
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* Middle transition buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '0 0.5rem' }} className="hide-on-mobile">
          <button 
            id="toTree" 
            onClick={handleCodeToTree} 
            className="btn primary" 
            title="代码转视图 (Ctrl + >)"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '160px', 
              width: '38px',
              padding: '12px 4px',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.3' }}>
              <span>代</span><span>码</span><span>转</span><span>视</span><span>图</span>
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>➔</span>
          </button>
          <button 
            id="toCode" 
            onClick={handleTreeToCode} 
            className="btn secondary" 
            title="视图转代码 (Ctrl + <)"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '160px', 
              width: '38px',
              padding: '12px 4px',
              gap: '0.5rem',
              fontSize: '0.85rem',
              borderColor: 'var(--accent-primary)', 
              color: 'var(--accent-primary)'
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>◀</span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.3' }}>
              <span>视</span><span>图</span><span>转</span><span>代</span><span>码</span>
            </span>
          </button>
        </div>

        {/* Right pane: JSON tree / error preview */}
        <div className="editor-panel">
          <div className="panel-header">
            <span>可视化树状视图</span>
            {parsedJson && !errorMsg && (
              <div className="flex-row gap-2 items-center">
                <button onClick={triggerExpandAll} className="btn py-1 px-2" title="展开全部">
                  <ChevronDown size={14} />
                </button>
                <button onClick={triggerCollapseAll} className="btn py-1 px-2" title="折叠全部">
                  <ChevronUp size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Subheader bar for filtering and querying */}
          {parsedJson && !errorMsg && (
            <div className="panel-header flex-row gap-3" style={{ background: 'var(--bg-secondary)', borderTop: 'none' }}>
              {/* Keyword Filter */}
              <div className="flex-1" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="过滤关键字..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: '28px',
                    height: '28px',
                    fontSize: '0.8rem',
                    width: '100%',
                    background: 'var(--bg-tertiary)'
                  }}
                />
              </div>

              {/* JSONPath filter */}
              <div className="flex-1" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '8px', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>x.</span>
                <input
                  type="text"
                  placeholder="Path 提取 (例: author.name)..."
                  value={jsonPath}
                  onChange={(e) => setJsonPath(e.target.value)}
                  style={{
                    paddingLeft: '24px',
                    height: '28px',
                    fontSize: '0.8rem',
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="panel-body" style={{ overflow: 'auto', background: 'var(--bg-secondary)' }}>
            {errorMsg && (
              <div style={{ padding: '1rem' }}>
                <div className="alert error">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>JSON 语法错误：</strong>
                    <div style={{ fontFamily: 'var(--font-mono)', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                      {errorMsg}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!errorMsg && displayJson !== undefined && displayJson !== null && (
              <JsonTree data={displayJson} searchTerm={searchTerm} expandAll={expandAll} onUpdate={handleTreeUpdate} />
            )}

            {!errorMsg && displayJson === undefined && jsonPath && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                未找到该 Path 节点 (如 x.{jsonPath})
              </div>
            )}

            {!errorMsg && parsedJson === null && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                请输入有效的 JSON 数据进行解析
              </div>
            )}
          </div>
        </div>
      </div>

      {copied && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>内容已成功复制到剪贴板！</span>
        </div>
      )}
    </div>
  );
};
