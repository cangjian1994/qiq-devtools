import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { AlignLeft, Minimize2, Trash2, Copy, Check } from 'lucide-react';

type Lang = 'javascript' | 'typescript' | 'css' | 'html' | 'sql';

// Safe tokenizer/scanner to pre-format JS/TS single-line compressed code by adding structural newlines
const preFormatJsTs = (code: string): string => {
  // Normalize line endings to LF to prevent duplicate formatting from mixed line endings (LF/CRLF)
  code = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let result = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inRegex = false;
  
  // Track last non-whitespace char for regex heuristic
  let lastNonWhitespaceChar = '';
  let parenthesisDepth = 0;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1] || '';
    
    if (inLineComment) {
      result += char;
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }
    
    if (inBlockComment) {
      result += char;
      if (char === '*' && nextChar === '/') {
        result += '/';
        i++;
        inBlockComment = false;
      }
      continue;
    }
    
    if (inRegex) {
      result += char;
      if (char === '\\') {
        result += nextChar;
        i++;
      } else if (char === '/') {
        inRegex = false;
      }
      continue;
    }
    
    // Check comment start
    if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral) {
      if (char === '/' && nextChar === '/') {
        result += '//';
        i++;
        inLineComment = true;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        result += '/*';
        i++;
        inBlockComment = true;
        continue;
      }
      
      // Check regex start
      if (char === '/') {
        const isDivision = /^[a-zA-Z0-9_$)\u4e00-\u9fa5]$/.test(lastNonWhitespaceChar);
        if (!isDivision) {
          inRegex = true;
          result += char;
          continue;
        }
      }
    }
    
    // Handle string boundaries
    if (char === "'" && !inDoubleQuote && !inTemplateLiteral) {
      inSingleQuote = !inSingleQuote;
      result += char;
      if (!inSingleQuote) lastNonWhitespaceChar = "'";
      continue;
    }
    if (char === '"' && !inSingleQuote && !inTemplateLiteral) {
      inDoubleQuote = !inDoubleQuote;
      result += char;
      if (!inDoubleQuote) lastNonWhitespaceChar = '"';
      continue;
    }
    if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inTemplateLiteral = !inTemplateLiteral;
      result += char;
      if (!inTemplateLiteral) lastNonWhitespaceChar = '`';
      continue;
    }
    
    // Handle escape characters in strings
    if (char === '\\' && (inSingleQuote || inDoubleQuote || inTemplateLiteral)) {
      result += char + nextChar;
      i++;
      continue;
    }
    
    // Add newlines after structural characters when not in strings/regex
    if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral && !inRegex) {
      if (char === '(') {
        parenthesisDepth++;
      } else if (char === ')') {
        parenthesisDepth = Math.max(0, parenthesisDepth - 1);
      }

      if (char === ';' || char === '{') {
        // Check if there is already a newline before the next non-whitespace character
        let hasNewlineAhead = false;
        for (let k = i + 1; k < code.length; k++) {
          const nextVal = code[k];
          if (nextVal === '\n') {
            hasNewlineAhead = true;
            break;
          }
          if (nextVal.trim() !== '') {
            break;
          }
        }
        
        if (hasNewlineAhead || (char === ';' && parenthesisDepth > 0)) {
          result += char;
        } else {
          result += char === ';' ? ';\n' : '{\n';
        }
      } else if (char === '}') {
        // Check if there is already a newline after the last non-whitespace character
        let hasNewlineBehind = false;
        for (let k = result.length - 1; k >= 0; k--) {
          const prevVal = result[k];
          if (prevVal === '\n') {
            hasNewlineBehind = true;
            break;
          }
          if (prevVal.trim() !== '') {
            break;
          }
        }
        
        if (hasNewlineBehind) {
          result += '}';
        } else {
          result += '\n}';
        }
      } else {
        result += char;
      }
    } else {
      result += char;
    }
    
    if (char.trim() !== '') {
      lastNonWhitespaceChar = char;
    }
  }
  return result;
};

export const CodeFormatter: React.FC<{ theme: 'dark' | 'light' }> = ({ theme }) => {
  const [language, setLanguage] = useState<Lang>('javascript');
  const [sourceCode, setSourceCode] = useState<string>(
    `// JavaScript 示例\nfunction calculateTotal(items) {\n  let total = 0;\n  for(let i=0; i<items.length; i++) {\n    total += items[i].price * (items[i].quantity || 1);\n  }\n  return total;\n}`
  );
  const [copied, setCopied] = useState<boolean>(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleFormat = () => {
    if (language === 'sql') {
      // Custom SQL formatting
      try {
        const formatted = sourceCode
          .replace(/\s+/g, ' ')
          .replace(/\s*,\s*/g, ', ')
          .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|GROUP BY|ORDER BY|HAVING|LIMIT|AND|OR|ON|SET|VALUES|INSERT INTO|UPDATE|DELETE)\b/gi, (match) => `\n${match.toUpperCase()}`)
          .replace(/\b(UNION|ALL|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/gi, (match) => `\n\n${match.toUpperCase()}`)
          .trim();
        setSourceCode(formatted);
      } catch (e) {
        console.error(e);
      }
    } else if (language === 'javascript' || language === 'typescript') {
      // Pre-format single-line JavaScript / TypeScript to split lines before invoking Monaco formatter
      const preFormatted = preFormatJsTs(sourceCode);
      setSourceCode(preFormatted);
      
      // Delay formatting slightly to let React commit the updated text value to editor model
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument')?.run();
        }
      }, 50);
    } else {
      // Trigger Monaco's native format action for CSS / HTML
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.formatDocument')?.run();
      }
    }
  };

  const handleCompress = () => {
    let compressed = sourceCode;
    if (language === 'javascript' || language === 'typescript') {
      compressed = sourceCode
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // remove comments
        .replace(/\s+/g, ' ')
        .trim();
    } else if (language === 'css') {
      compressed = sourceCode
        .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
        .replace(/\s*([{}|:;,])\s*/g, '$1') // spaces around braces
        .replace(/\s+/g, ' ')
        .trim();
    } else if (language === 'html') {
      compressed = sourceCode
        .replace(/<!--[\s\S]*?-->/g, '') // remove comments
        .replace(/>\s+</g, '><')
        .replace(/\s+/g, ' ')
        .trim();
    } else if (language === 'sql') {
      compressed = sourceCode
        .replace(/\s+/g, ' ')
        .trim();
    }
    setSourceCode(compressed);
  };

  const handleClear = () => {
    setSourceCode('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Default code samples
  const handleLangChange = (lang: Lang) => {
    setLanguage(lang);
    if (lang === 'javascript') {
      setSourceCode(`// JavaScript 示例\nfunction calculateTotal(items) {\n  let total = 0;\n  for(let i=0; i<items.length; i++) {\n    total += items[i].price * (items[i].quantity || 1);\n  }\n  return total;\n}`);
    } else if (lang === 'typescript') {
      setSourceCode(`// TypeScript 示例\ninterface User {\n  id: number;\n  name: string;\n  role?: string;\n}\n\nfunction greetUser(user: User): string {\n  return \`Hello, \${user.name}! Role: \${user.role || 'Guest'}\`;\n}`);
    } else if (lang === 'css') {
      setSourceCode(`.card {\n  background: rgba(18, 22, 31, 0.7);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: 12px;\n  padding: 1.5rem;\n  transition: all 0.3s ease;\n}\n.card:hover {\n  border-color: #6366f1;\n}`);
    } else if (lang === 'html') {
      setSourceCode(`<!-- HTML 示例 -->\n<div class="user-profile">\n  <img src="avatar.jpg" alt="User Avatar" />\n  <h3>John Doe</h3>\n  <p class="bio">Developer & Writer</p>\n</div>`);
    } else if (lang === 'sql') {
      setSourceCode(`-- SQL 示例\nselect id, name, email, created_at from users where active = 1 order by created_at desc limit 10;`);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header flex-row justify-between items-center">
        <div>
          <h2 className="tool-title">代码美化与压缩</h2>
          <p className="tool-desc">支持 Javascript, CSS, HTML, SQL 格式美化与代码体积压缩</p>
        </div>
        <select 
          value={language} 
          onChange={(e) => handleLangChange(e.target.value as Lang)}
          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
          <option value="sql">SQL</option>
        </select>
      </div>

      <div className="editor-panel" style={{ flex: 1, minHeight: '650px' }}>
        <div className="panel-header">
          <span>编辑器控制台</span>
          <div className="flex-row gap-2">
            <button onClick={handleFormat} className="btn py-1 px-3" title="代码格式化/美化">
              <AlignLeft size={14} /> 美化代码
            </button>
            <button onClick={handleCompress} className="btn py-1 px-3" title="压缩/精简代码">
              <Minimize2 size={14} /> 压缩代码
            </button>
            <button onClick={handleClear} className="btn py-1 px-2">
              <Trash2 size={14} /> 清空
            </button>
            <button onClick={handleCopy} className="btn py-1 px-3 primary">
              {copied ? <Check size={14} /> : <Copy size={14} />} 复制代码
            </button>
          </div>
        </div>
        <div className="panel-body">
          <Editor
            height="100%"
            language={language}
            theme={theme === 'dark' ? 'vs-dark' : 'vs'}
            value={sourceCode}
            onChange={(val) => setSourceCode(val || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {copied && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>代码已复制到剪贴板！</span>
        </div>
      )}
    </div>
  );
};
