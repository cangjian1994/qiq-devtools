import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check } from 'lucide-react';

type SupportedLang = 'typescript' | 'go' | 'java' | 'csharp' | 'rust' | 'javascript' | 'php';

export const JsonToEntity: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('{\n  "id": 1001,\n  "name": "Widget",\n  "active": true,\n  "tags": ["hardware", "tools"],\n  "dimensions": {\n    "width": 12.5,\n    "height": 8.0,\n    "depth": 3.2\n  },\n  "warehouse": {\n    "location": "Aisle 4",\n    "manager": {\n      "name": "Sarah",\n      "email": "sarah@example.com"\n    }\n  }\n}');
  const [activeLang, setActiveLang] = useState<SupportedLang>('typescript');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // JS Object serialization helper
  const toJsObject = (val: any, indent: string = '  '): string => {
    if (val === null) return 'null';
    if (typeof val === 'string') return `"${val.replace(/"/g, '\\"')}"`;
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      const items = val.map(item => toJsObject(item, indent + '  ')).join(`,\n${indent}`);
      return `[\n${indent}${items}\n${indent.slice(2)}]`;
    }
    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) return '{}';
      const pairs = keys.map(key => {
        const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
        const formattedKey = validIdentifier ? key : `"${key}"`;
        return `${formattedKey}: ${toJsObject(val[key], indent + '  ')}`;
      }).join(`,\n${indent}`);
      return `{\n${indent}${pairs}\n${indent.slice(2)}}`;
    }
    return 'null';
  };

  // PHP Array serialization helper
  const toPhpArray = (val: any, indent: string = '  '): string => {
    if (val === null) return 'null';
    if (typeof val === 'string') return `"${val.replace(/"/g, '\\"')}"`;
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      const items = val.map(item => toPhpArray(item, indent + '  ')).join(`,\n${indent}`);
      return `[\n${indent}${items}\n${indent.slice(2)}]`;
    }
    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) return '[]';
      const pairs = keys.map(key => `"${key}" => ${toPhpArray(val[key], indent + '  ')}`).join(`,\n${indent}`);
      return `[\n${indent}${pairs}\n${indent.slice(2)}]`;
    }
    return 'null';
  };

  // Core conversion logic
  const generateEntities = (jsonStr: string, lang: SupportedLang) => {
    try {
      const parsed = JSON.parse(jsonStr);
      setErrorMsg(null);

      // Handle JS Object & PHP Array directly
      if (lang === 'javascript') {
        setGeneratedCode(`const root = ${toJsObject(parsed)};`);
        return;
      }
      if (lang === 'php') {
        setGeneratedCode(`$root = ${toPhpArray(parsed)};`);
        return;
      }
      
      const extraTypes: string[] = [];
      const rootName = 'Root';
      
      const getTypeName = (key: string) => {
        return capitalize(key.replace(/[^a-zA-Z0-9]/g, ''));
      };

      const inferType = (val: any, keyName: string): string => {
        if (val === null) return 'any';
        if (typeof val === 'string') return 'string';
        if (typeof val === 'number') return 'number';
        if (typeof val === 'boolean') return 'boolean';
        
        if (Array.isArray(val)) {
          if (val.length === 0) return 'any[]';
          const elementTypes = Array.from(new Set(val.map(item => inferType(item, keyName))));
          const combinedType = elementTypes.length === 1 ? elementTypes[0] : 'any';
          return `${combinedType}[]`;
        }
        
        if (typeof val === 'object') {
          const typeName = getTypeName(keyName);
          generateObjectStruct(val, typeName);
          return typeName;
        }
        return 'any';
      };

      const generateObjectStruct = (obj: any, typeName: string) => {
        const keys = Object.keys(obj);
        
        if (lang === 'typescript') {
          let code = `interface ${typeName} {\n`;
          keys.forEach(key => {
            const propType = inferType(obj[key], key);
            code += `  ${key}: ${propType};\n`;
          });
          code += `}`;
          extraTypes.push(code);
        } else if (lang === 'go') {
          let code = `type ${typeName} struct {\n`;
          keys.forEach(key => {
            const propType = inferType(obj[key], key);
            let goType = propType;
            if (propType === 'number') goType = 'float64';
            else if (propType === 'string') goType = 'string';
            else if (propType === 'boolean') goType = 'bool';
            else if (propType.endsWith('[]')) {
              const base = propType.replace('[]', '');
              let goBase = base;
              if (base === 'number') goBase = 'float64';
              else if (base === 'string') goBase = 'string';
              else if (base === 'boolean') goBase = 'bool';
              goType = `[]${goBase}`;
            }
            code += `\t${getTypeName(key)} ${goType} \`json:"${key}"\`\n`;
          });
          code += `}`;
          extraTypes.push(code);
        } else if (lang === 'java') {
          let code = `public class ${typeName} {\n`;
          keys.forEach(key => {
            const propType = inferType(obj[key], key);
            let javaType = propType;
            if (propType === 'number') javaType = 'double';
            else if (propType === 'string') javaType = 'String';
            else if (propType === 'boolean') javaType = 'boolean';
            else if (propType.endsWith('[]')) {
              const base = propType.replace('[]', '');
              let javaBase = base;
              if (base === 'number') javaBase = 'Double';
              else if (base === 'string') javaBase = 'String';
              else if (base === 'boolean') javaBase = 'Boolean';
              javaType = `List<${javaBase}>`;
            }
            code += `    private ${javaType} ${key};\n`;
          });
          code += '\n';
          keys.forEach(key => {
            const propType = inferType(obj[key], key);
            let javaType = propType;
            if (propType === 'number') javaType = 'double';
            else if (propType === 'string') javaType = 'String';
            else if (propType === 'boolean') javaType = 'boolean';
            else if (propType.endsWith('[]')) {
              const base = propType.replace('[]', '');
              let javaBase = base;
              if (base === 'number') javaBase = 'Double';
              else if (base === 'string') javaBase = 'String';
              else if (base === 'boolean') javaBase = 'Boolean';
              javaType = `List<${javaBase}>`;
            }
            const capKey = getTypeName(key);
            code += `    public ${javaType} get${capKey}() {\n        return this.${key};\n    }\n\n`;
            code += `    public void set${capKey}(${javaType} ${key}) {\n        this.${key} = ${key};\n    }\n\n`;
          });
          code += `}`;
          extraTypes.push(code);
        } else if (lang === 'csharp') {
          let code = `public class ${typeName}\n{\n`;
          keys.forEach(key => {
            const propType = inferType(obj[key], key);
            let csType = propType;
            if (propType === 'number') csType = 'double';
            else if (propType === 'string') csType = 'string';
            else if (propType === 'boolean') csType = 'bool';
            else if (propType.endsWith('[]')) {
              const base = propType.replace('[]', '');
              let csBase = base;
              if (base === 'number') csBase = 'double';
              else if (base === 'string') csBase = 'string';
              else if (base === 'boolean') csBase = 'bool';
              csType = `List<${csBase}>`;
            }
            code += `    public ${csType} ${getTypeName(key)} { get; set; }\n`;
          });
          code += `}`;
          extraTypes.push(code);
        } else if (lang === 'rust') {
          let code = `#[derive(Debug, Serialize, Deserialize)]\npub struct ${typeName} {\n`;
          keys.forEach(key => {
            const propType = inferType(obj[key], key);
            let rustType = propType;
            if (propType === 'number') rustType = 'f64';
            else if (propType === 'string') rustType = 'String';
            else if (propType === 'boolean') rustType = 'bool';
            else if (propType.endsWith('[]')) {
              const base = propType.replace('[]', '');
              let rustBase = base;
              if (base === 'number') rustBase = 'f64';
              else if (base === 'string') rustBase = 'String';
              else if (base === 'boolean') rustBase = 'bool';
              rustType = `Vec<${rustBase}>`;
            }
            code += `    pub ${key}: ${rustType},\n`;
          });
          code += `}`;
          extraTypes.push(code);
        }
      };

      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setGeneratedCode('// 无法从空数组中生成实体结构');
          return;
        }
        inferType(parsed, rootName);
      } else {
        generateObjectStruct(parsed, rootName);
      }

      setGeneratedCode(extraTypes.reverse().join('\n\n'));
    } catch (e: any) {
      setErrorMsg(`JSON 语法解析失败: ${e.message}`);
    }
  };

  useEffect(() => {
    generateEntities(jsonInput, activeLang);
  }, [jsonInput, activeLang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">JSON 转 Entity</h2>
        <p className="tool-desc">一键将 JSON 对象转换为 TypeScript, Go, Java, C#, Rust 实体类及 JS 对象/PHP 数组</p>
      </div>

      <div className="pane-layout">
        {/* Left Side: JSON Input */}
        <div className="editor-panel">
          <div className="panel-header">
            <span>JSON 输入数据</span>
            {errorMsg && (
              <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{errorMsg}</span>
            )}
          </div>
          <div className="panel-body">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={jsonInput}
              onChange={(value) => setJsonInput(value || '')}
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

        {/* Right Side: Entity Output */}
        <div className="editor-panel">
          <div className="panel-header" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <div className="flex-row gap-2">
              <button 
                onClick={() => setActiveLang('typescript')} 
                className={`tab-btn py-1 px-2 ${activeLang === 'typescript' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', border: 'none' }}
              >
                TS Interface
              </button>
              <button 
                onClick={() => setActiveLang('go')} 
                className={`tab-btn py-1 px-2 ${activeLang === 'go' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', border: 'none' }}
              >
                Go Struct
              </button>
              <button 
                onClick={() => setActiveLang('java')} 
                className={`tab-btn py-1 px-2 ${activeLang === 'java' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', border: 'none' }}
              >
                Java Class
              </button>
              <button 
                onClick={() => setActiveLang('csharp')} 
                className={`tab-btn py-1 px-2 ${activeLang === 'csharp' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', border: 'none' }}
              >
                C# Class
              </button>
              <button 
                onClick={() => setActiveLang('rust')} 
                className={`tab-btn py-1 px-2 ${activeLang === 'rust' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', border: 'none' }}
              >
                Rust Struct
              </button>
              <button 
                onClick={() => setActiveLang('javascript')} 
                className={`tab-btn py-1 px-2 ${activeLang === 'javascript' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', border: 'none' }}
              >
                JS Object
              </button>
              <button 
                onClick={() => setActiveLang('php')} 
                className={`tab-btn py-1 px-2 ${activeLang === 'php' ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', border: 'none' }}
              >
                PHP Array
              </button>
            </div>
            <button onClick={handleCopy} className="btn py-1 px-2 primary" style={{ fontSize: '0.8rem', padding: '4px 8px', marginLeft: '12px' }}>
              {copied ? <Check size={12} /> : <Copy size={12} />} 复制代码
            </button>
          </div>
          <div className="panel-body">
            <Editor
              height="100%"
              language={
                activeLang === 'go' ? 'go' 
                : activeLang === 'csharp' ? 'csharp' 
                : activeLang === 'rust' ? 'rust' 
                : activeLang === 'php' ? 'php' 
                : 'typescript'
              }
              theme="vs-dark"
              value={generatedCode}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>

      {copied && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>代码已成功复制到剪贴板！</span>
        </div>
      )}
    </div>
  );
};
