import React, { useState, useEffect } from 'react';
import { ChevronRight, Copy, Check } from 'lucide-react';

interface JsonTreeProps {
  data: any;
  searchTerm?: string;
  expandAll?: boolean;
  onUpdate?: (newData: any) => void;
}

// Immutable JSON update helper at a specific key path
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

// Immutable JSON key rename helper at a specific key path
const renameJsonKeyAtPath = (obj: any, path: (string | number)[], newKey: string): any => {
  if (path.length === 0) return obj;
  
  const parentPath = path.slice(0, -1);
  const oldKey = path[path.length - 1];
  
  const updateParent = (currentObj: any, p: (string | number)[]): any => {
    if (p.length === 0) {
      if (typeof currentObj === 'object' && currentObj !== null && !Array.isArray(currentObj)) {
        const res: any = {};
        for (const k in currentObj) {
          if (k === oldKey) {
            res[newKey] = currentObj[k];
          } else {
            res[k] = currentObj[k];
          }
        }
        return res;
      }
      return currentObj;
    }
    
    const [curr, ...rest] = p;
    if (Array.isArray(currentObj)) {
      const idx = Number(curr);
      const newArr = [...currentObj];
      newArr[idx] = updateParent(currentObj[idx], rest);
      return newArr;
    } else if (typeof currentObj === 'object' && currentObj !== null) {
      return {
        ...currentObj,
        [curr]: updateParent(currentObj[curr], rest)
      };
    }
    return currentObj;
  };
  
  return updateParent(obj, parentPath);
};

export const JsonTree: React.FC<JsonTreeProps> = ({ data, searchTerm = '', expandAll, onUpdate }) => {
  const [expandTrigger, setExpandTrigger] = useState<number>(0);
  const [collapseTrigger, setCollapseTrigger] = useState<number>(0);

  useEffect(() => {
    if (expandAll === true) {
      setExpandTrigger(prev => prev + 1);
    } else if (expandAll === false) {
      setCollapseTrigger(prev => prev + 1);
    }
  }, [expandAll]);

  const handleNodeUpdate = (path: (string | number)[], newValue: any) => {
    if (onUpdate) {
      const updated = updateJsonAtPath(data, path, newValue);
      onUpdate(updated);
    }
  };

  const handleKeyRename = (path: (string | number)[], newKey: string) => {
    if (onUpdate) {
      const updated = renameJsonKeyAtPath(data, path, newKey);
      onUpdate(updated);
    }
  };

  return (
    <div className="json-tree-container">
      <TreeNode
        value={data}
        isLast={true}
        searchTerm={searchTerm.toLowerCase()}
        expandTrigger={expandTrigger}
        collapseTrigger={collapseTrigger}
        depth={0}
        path={[]}
        onNodeUpdate={handleNodeUpdate}
        onKeyRename={handleKeyRename}
      />
    </div>
  );
};

interface TreeNodeProps {
  name?: string;
  value: any;
  isLast: boolean;
  searchTerm: string;
  expandTrigger: number;
  collapseTrigger: number;
  depth: number;
  path: (string | number)[];
  onNodeUpdate: (path: (string | number)[], newValue: any) => void;
  onKeyRename: (path: (string | number)[], newKey: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  name,
  value,
  isLast,
  searchTerm,
  expandTrigger,
  collapseTrigger,
  depth,
  path,
  onNodeUpdate,
  onKeyRename,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(depth > 2);
  const [copied, setCopied] = useState(false);
  
  // Editing states
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [keyInput, setKeyInput] = useState(name || '');
  const [isEditingVal, setIsEditingVal] = useState(false);
  const [valInput, setValInput] = useState(typeof value === 'string' ? value : JSON.stringify(value));

  useEffect(() => {
    if (expandTrigger > 0) {
      setIsCollapsed(false);
    }
  }, [expandTrigger]);

  useEffect(() => {
    if (collapseTrigger > 0) {
      setIsCollapsed(true);
    }
  }, [collapseTrigger]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchTerm ? (
            <span key={i} className="tree-highlight">{part}</span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleKeySubmit = () => {
    setIsEditingKey(false);
    if (name !== undefined && keyInput !== name && keyInput.trim()) {
      onKeyRename(path, keyInput.trim());
    }
  };

  const handleValSubmit = () => {
    setIsEditingVal(false);
    try {
      let parsedVal;
      // Try parsing value if it matches boolean, number, null or object
      if (valInput === 'true') parsedVal = true;
      else if (valInput === 'false') parsedVal = false;
      else if (valInput === 'null') parsedVal = null;
      else if (!isNaN(Number(valInput)) && valInput.trim() !== '') parsedVal = Number(valInput);
      else {
        try {
          parsedVal = JSON.parse(valInput);
        } catch {
          parsedVal = valInput;
        }
      }
      onNodeUpdate(path, parsedVal);
    } catch (e) {
      console.error(e);
    }
  };

  const renderKey = () => {
    if (name === undefined) return null;
    
    if (isEditingKey) {
      return (
        <span style={{ marginRight: '4px' }}>
          "
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onBlur={handleKeySubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleKeySubmit()}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '3px',
              padding: '0 4px',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              width: '80px',
              height: '18px',
              outline: 'none'
            }}
            autoFocus
          />
          "
          <span style={{ color: 'var(--text-secondary)' }}>: </span>
        </span>
      );
    }

    return (
      <span 
        className="tree-key"
        title="双击编辑键名"
        onDoubleClick={(e) => { e.stopPropagation(); setIsEditingKey(true); }}
      >
        "{highlightText(name)}"
        <span style={{ color: 'var(--text-secondary)' }}>: </span>
      </span>
    );
  };

  const matchesSearch = (val: any): boolean => {
    if (!searchTerm) return true;
    const str = JSON.stringify(val).toLowerCase();
    return str.includes(searchTerm);
  };

  if (searchTerm && !matchesSearch(value) && (name === undefined || !name.toLowerCase().includes(searchTerm))) {
    return null;
  }

  // Handle Object / Array
  if (typeof value === 'object' && value !== null) {
    const isArray = Array.isArray(value);
    const keys = Object.keys(value);
    const isEmpty = keys.length === 0;
    const openBrace = isArray ? '[' : '{';
    const closeBrace = isArray ? ']' : '}';

    if (isEmpty) {
      return (
        <div className="tree-node" style={{ marginLeft: depth > 0 ? '1.5rem' : '0' }}>
          {renderKey()}
          <span style={{ color: 'var(--text-secondary)' }}>{openBrace}{closeBrace}{isLast ? '' : ','}</span>
        </div>
      );
    }

    return (
      <div className="tree-node" style={{ marginLeft: depth > 0 ? '1.5rem' : '0' }}>
        <span 
          className={`tree-node-toggle ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronRight size={14} />
        </span>
        
        <span onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
          {renderKey()}
          <span style={{ color: 'var(--text-secondary)' }}>{openBrace}</span>
        </span>

        {isCollapsed ? (
          <span 
            onClick={() => setIsCollapsed(false)} 
            style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', marginLeft: '0.5rem' }}
          >
            {keys.length} items ... {closeBrace}{isLast ? '' : ','}
          </span>
        ) : (
          <>
            <button 
              className="copy-node-btn" 
              onClick={handleCopy} 
              title="复制此节点"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px',
                marginLeft: '8px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: 'none',
                transform: 'none',
                verticalAlign: 'middle'
              }}
            >
              {copied ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
            </button>
            
            <div className="tree-children">
              {keys.map((key, index) => (
                <TreeNode
                  key={key}
                  name={key}
                  value={value[key]}
                  isLast={index === keys.length - 1}
                  searchTerm={searchTerm}
                  expandTrigger={expandTrigger}
                  collapseTrigger={collapseTrigger}
                  depth={depth + 1}
                  path={[...path, isArray ? Number(key) : key]}
                  onNodeUpdate={onNodeUpdate}
                  onKeyRename={onKeyRename}
                />
              ))}
            </div>
            
            <div style={{ marginLeft: '0.2rem', color: 'var(--text-secondary)' }}>
              {closeBrace}{isLast ? '' : ','}
            </div>
          </>
        )}
      </div>
    );
  }

  // Primitive value rendering
  let valElem = null;
  
  if (isEditingVal) {
    valElem = (
      <input
        type="text"
        value={valInput}
        onChange={(e) => setValInput(e.target.value)}
        onBlur={handleValSubmit}
        onKeyDown={(e) => e.key === 'Enter' && handleValSubmit()}
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--accent-primary)',
          borderRadius: '3px',
          padding: '0 4px',
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          minWidth: '60px',
          height: '18px',
          outline: 'none'
        }}
        autoFocus
      />
    );
  } else {
    if (typeof value === 'string') {
      valElem = <span className="tree-val-string" onDoubleClick={() => setIsEditingVal(true)} title="双击编辑内容">"{highlightText(value)}"</span>;
    } else if (typeof value === 'number') {
      valElem = <span className="tree-val-number" onDoubleClick={() => setIsEditingVal(true)} title="双击编辑内容">{highlightText(value.toString())}</span>;
    } else if (typeof value === 'boolean') {
      valElem = <span className="tree-val-boolean" onDoubleClick={() => setIsEditingVal(true)} title="双击编辑内容">{value ? 'true' : 'false'}</span>;
    } else if (value === null) {
      valElem = <span className="tree-val-null" onDoubleClick={() => setIsEditingVal(true)} title="双击编辑内容">null</span>;
    } else {
      valElem = <span onDoubleClick={() => setIsEditingVal(true)} title="双击编辑内容">{value.toString()}</span>;
    }
  }

  return (
    <div className="tree-node" style={{ marginLeft: depth > 0 ? '1.5rem' : '0' }}>
      {renderKey()}
      {valElem}
      <span style={{ color: 'var(--text-secondary)' }}>{isLast ? '' : ','}</span>
      {!isEditingVal && (
        <button 
          className="copy-node-btn-hover" 
          onClick={handleCopy} 
          title="复制值"
          style={{
            background: 'transparent',
            border: 'none',
            padding: '2px',
            marginLeft: '8px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            boxShadow: 'none',
            transform: 'none',
            verticalAlign: 'middle',
            opacity: 0.3
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
        >
          {copied ? <Check size={11} style={{ color: 'var(--success)' }} /> : <Copy size={11} />}
        </button>
      )}
    </div>
  );
};
