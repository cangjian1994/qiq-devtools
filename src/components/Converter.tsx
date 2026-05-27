import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import yaml from 'js-yaml';
import { Copy, Check } from 'lucide-react';

type Mode = 'yaml' | 'xml';

export const Converter: React.FC = () => {
  const [activeMode, setActiveMode] = useState<Mode>('yaml');
  const [jsonText, setJsonText] = useState<string>('{\n  "project": {\n    "name": "QiQ Tools",\n    "version": "1.0.0",\n    "dependencies": [\n      "react",\n      "vite"\n    ]\n  }\n}');
  const [targetText, setTargetText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [copiedTarget, setCopiedTarget] = useState<boolean>(false);

  // Prevent infinite loops when syncing editors
  const isSyncing = useRef<boolean>(false);

  // XML Helpers
  const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const jsonToXml = (obj: any, nodeName: string = 'root'): string => {
    let xml = '';
    if (obj === null) {
      return `<${nodeName} />`;
    }
    if (typeof obj !== 'object') {
      return `<${nodeName}>${escapeXml(obj.toString())}</${nodeName}>`;
    }
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        xml += jsonToXml(item, nodeName);
      });
      return xml;
    }
    xml += `<${nodeName}>`;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (Array.isArray(val)) {
          val.forEach(item => {
            xml += jsonToXml(item, key);
          });
        } else {
          xml += jsonToXml(val, key);
        }
      }
    }
    xml += `</${nodeName}>`;
    return xml;
  };

  const xmlToJson = (xmlStr: string): any => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      throw new Error(parserError[0].textContent || 'XML 语法解析错误');
    }
    const root = xmlDoc.documentElement;
    const res: any = {};
    res[root.nodeName] = nodeToJson(root);
    return res;
  };

  const nodeToJson = (node: Element): any => {
    const children = node.children;
    if (children.length === 0) {
      const text = node.textContent?.trim() || '';
      // Try to parse as boolean/number if applicable
      if (text === 'true') return true;
      if (text === 'false') return false;
      if (text && !isNaN(Number(text))) return Number(text);
      return text;
    }
    
    const obj: any = {};
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const name = child.nodeName;
      const val = nodeToJson(child);
      
      if (obj[name]) {
        if (!Array.isArray(obj[name])) {
          obj[name] = [obj[name]];
        }
        obj[name].push(val);
      } else {
        obj[name] = val;
      }
    }
    return obj;
  };

  // Convert JSON to Target (YAML / XML)
  const syncJsonToTarget = (jsonStr: string) => {
    if (!jsonStr.trim()) {
      setTargetText('');
      setErrorMsg(null);
      return;
    }
    try {
      const parsed = JSON.parse(jsonStr);
      setErrorMsg(null);
      if (activeMode === 'yaml') {
        const yamlStr = yaml.dump(parsed);
        setTargetText(yamlStr);
      } else {
        // XML Root name is usually keys of parsed if single object, or 'root'
        const keys = Object.keys(parsed);
        let xmlStr = '';
        if (keys.length === 1 && typeof parsed[keys[0]] === 'object' && parsed[keys[0]] !== null && !Array.isArray(parsed[keys[0]])) {
          xmlStr = jsonToXml(parsed[keys[0]], keys[0]);
        } else {
          xmlStr = jsonToXml(parsed, 'root');
        }
        setTargetText(`<?xml version="1.0" encoding="UTF-8"?>\n` + xmlStr);
      }
    } catch (e: any) {
      setErrorMsg(`JSON 解析失败: ${e.message}`);
    }
  };

  // Convert Target to JSON
  const syncTargetToJson = (targetStr: string) => {
    if (!targetStr.trim()) {
      setJsonText('');
      setErrorMsg(null);
      return;
    }
    try {
      setErrorMsg(null);
      if (activeMode === 'yaml') {
        const parsed = yaml.load(targetStr);
        setJsonText(JSON.stringify(parsed, null, 2));
      } else {
        const parsed = xmlToJson(targetStr);
        setJsonText(JSON.stringify(parsed, null, 2));
      }
    } catch (e: any) {
      setErrorMsg(`${activeMode === 'yaml' ? 'YAML' : 'XML'} 解析失败: ${e.message}`);
    }
  };

  // Trigger sync on activeMode change
  useEffect(() => {
    syncJsonToTarget(jsonText);
  }, [activeMode]);

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    if (isSyncing.current) return;
    isSyncing.current = true;
    syncJsonToTarget(val);
    isSyncing.current = false;
  };

  const handleTargetChange = (val: string) => {
    setTargetText(val);
    if (isSyncing.current) return;
    isSyncing.current = true;
    syncTargetToJson(val);
    isSyncing.current = false;
  };

  const copyToClipboard = (text: string, isJson: boolean) => {
    navigator.clipboard.writeText(text);
    if (isJson) {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header flex-row justify-between items-center">
        <div>
          <h2 className="tool-title">格式转换</h2>
          <p className="tool-desc">支持 JSON 与 YAML / XML 格式的实时双向转换</p>
        </div>
        <div className="flex-row gap-2" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px', background: 'var(--bg-secondary)' }}>
          <button 
            className={`btn py-1 px-3 ${activeMode === 'yaml' ? 'primary' : ''}`}
            onClick={() => setActiveMode('yaml')}
            style={{ fontSize: '0.85rem', border: 'none' }}
          >
            JSON ↔ YAML
          </button>
          <button 
            className={`btn py-1 px-3 ${activeMode === 'xml' ? 'primary' : ''}`}
            onClick={() => setActiveMode('xml')}
            style={{ fontSize: '0.85rem', border: 'none' }}
          >
            JSON ↔ XML
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="alert error">
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="pane-layout">
        {/* Left: JSON Editor */}
        <div className="editor-panel">
          <div className="panel-header">
            <span>JSON 格式</span>
            <button onClick={() => copyToClipboard(jsonText, true)} className="btn py-1 px-2">
              {copiedJson ? <Check size={14} /> : <Copy size={14} />} 复制
            </button>
          </div>
          <div className="panel-body">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={jsonText}
              onChange={(value) => handleJsonChange(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* Middle action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '0 0.5rem' }} className="hide-on-mobile">
          <button 
            onClick={() => syncJsonToTarget(jsonText)} 
            className="btn primary py-2 px-3" 
            title="JSON 转为目标格式"
            style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            转为 {activeMode.toUpperCase()} ➔
          </button>
          <button 
            onClick={() => syncTargetToJson(targetText)} 
            className="btn secondary py-2 px-3" 
            title="目标格式转为 JSON"
            style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
          >
            ◀ 转为 JSON
          </button>
        </div>

        {/* Right: Target Editor (YAML / XML) */}
        <div className="editor-panel">
          <div className="panel-header">
            <span>{activeMode === 'yaml' ? 'YAML 格式' : 'XML 格式'}</span>
            <button onClick={() => copyToClipboard(targetText, false)} className="btn py-1 px-2">
              {copiedTarget ? <Check size={14} /> : <Copy size={14} />} 复制
            </button>
          </div>
          <div className="panel-body">
            <Editor
              height="100%"
              language={activeMode}
              theme="vs-dark"
              value={targetText}
              onChange={(value) => handleTargetChange(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>

      {(copiedJson || copiedTarget) && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>格式化内容已复制到剪贴板！</span>
        </div>
      )}
    </div>
  );
};
