import React, { useState, useEffect } from 'react';
import { Hash, Palette, Lock, Copy, Check } from 'lucide-react';

type SubTab = 'radix' | 'password' | 'color';

export const RadixColor: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('radix');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Radix states
  const [binVal, setBinVal] = useState<string>('101010');
  const [octVal, setOctVal] = useState<string>('52');
  const [decVal, setDecVal] = useState<string>('42');
  const [hexVal, setHexVal] = useState<string>('2a');

  // Password states
  const [passLength, setPassLength] = useState<number>(16);
  const [includeNum, setIncludeNum] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeSym, setIncludeSym] = useState<boolean>(false);
  const [generatedPass, setGeneratedPass] = useState<string>('');

  // Color states
  const [colorHex, setColorHex] = useState<string>('#6366f1');
  const [colorRgb, setColorRgb] = useState<string>('rgb(99, 102, 241)');
  const [colorHsl, setColorHsl] = useState<string>('hsl(239, 84%, 67%)');

  // Radix Conversion Logic
  const handleRadixChange = (val: string, base: 2 | 8 | 10 | 16) => {
    if (base === 2) setBinVal(val);
    else if (base === 8) setOctVal(val);
    else if (base === 10) setDecVal(val);
    else if (base === 16) setHexVal(val);

    if (!val.trim()) {
      if (base !== 2) setBinVal('');
      if (base !== 8) setOctVal('');
      if (base !== 10) setDecVal('');
      if (base !== 16) setHexVal('');
      return;
    }

    try {
      const num = parseInt(val, base);
      if (isNaN(num)) return;
      if (base !== 2) setBinVal(num.toString(2));
      if (base !== 8) setOctVal(num.toString(8));
      if (base !== 10) setDecVal(num.toString(10));
      if (base !== 16) setHexVal(num.toString(16));
    } catch (e) {
      console.error(e);
    }
  };

  // Password Generation Logic
  const generatePassword = () => {
    const numbers = '0123456789';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-';
    
    let charPool = '';
    if (includeNum) charPool += numbers;
    if (includeLower) charPool += lowercase;
    if (includeUpper) charPool += uppercase;
    if (includeSym) charPool += symbols;

    if (!charPool) {
      setGeneratedPass('请勾选至少一个字符集类型！');
      return;
    }

    let password = '';
    for (let i = 0; i < passLength; i++) {
      const idx = Math.floor(Math.random() * charPool.length);
      password += charPool[idx];
    }
    setGeneratedPass(password);
  };

  useEffect(() => {
    if (activeSubTab === 'password' && !generatedPass) {
      generatePassword();
    }
  }, [activeSubTab]);

  // Color Conversion Logic
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const handleColorChange = (hex: string) => {
    setColorHex(hex);
    const rgbObj = hexToRgb(hex);
    if (rgbObj) {
      const rgbStr = `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})`;
      setColorRgb(rgbStr);
      const hslObj = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);
      const hslStr = `hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)`;
      setColorHsl(hslStr);
    }
  };

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">进制转换与开发小工具</h2>
        <p className="tool-desc">提供多进制转换、安全随机密码生成、以及颜色编码互转与调色板功能</p>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button onClick={() => setActiveSubTab('radix')} className={`tab-btn ${activeSubTab === 'radix' ? 'active' : ''}`}>
          <Hash size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 进制转换
        </button>
        <button onClick={() => setActiveSubTab('password')} className={`tab-btn ${activeSubTab === 'password' ? 'active' : ''}`}>
          <Lock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 随机密码生成
        </button>
        <button onClick={() => setActiveSubTab('color')} className={`tab-btn ${activeSubTab === 'color' ? 'active' : ''}`}>
          <Palette size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> 调色板与颜色转换
        </button>
      </div>

      <div style={{ flex: 1 }}>
        {/* Radix Converter Tab */}
        {activeSubTab === 'radix' && (
          <div className="card flex-col gap-4" style={{ maxWidth: '600px' }}>
            <h3>多进制转换 (Radix Converter)</h3>
            <div className="flex-col gap-3">
              {/* Decimal */}
              <div className="flex-row items-center gap-2">
                <span style={{ width: '80px', color: 'var(--text-secondary)' }}>10 进制 (Dec):</span>
                <input
                  type="text"
                  value={decVal}
                  onChange={(e) => handleRadixChange(e.target.value, 10)}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                  placeholder="输入十进制..."
                />
              </div>

              {/* Hexadecimal */}
              <div className="flex-row items-center gap-2">
                <span style={{ width: '80px', color: 'var(--text-secondary)' }}>16 进制 (Hex):</span>
                <input
                  type="text"
                  value={hexVal}
                  onChange={(e) => handleRadixChange(e.target.value, 16)}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                  placeholder="输入十六进制..."
                />
              </div>

              {/* Binary */}
              <div className="flex-row items-center gap-2">
                <span style={{ width: '80px', color: 'var(--text-secondary)' }}>2 进制 (Bin):</span>
                <input
                  type="text"
                  value={binVal}
                  onChange={(e) => handleRadixChange(e.target.value, 2)}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                  placeholder="输入二进制..."
                />
              </div>

              {/* Octal */}
              <div className="flex-row items-center gap-2">
                <span style={{ width: '80px', color: 'var(--text-secondary)' }}>8 进制 (Oct):</span>
                <input
                  type="text"
                  value={octVal}
                  onChange={(e) => handleRadixChange(e.target.value, 8)}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                  placeholder="输入八进制..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Password Generator Tab */}
        {activeSubTab === 'password' && (
          <div className="pane-layout">
            <div className="card flex-col gap-4" style={{ flex: 1 }}>
              <h3>密码生成配置</h3>
              
              <div className="flex-row items-center gap-3">
                <span>密码长度:</span>
                <input
                  type="range"
                  min={6}
                  max={32}
                  value={passLength}
                  onChange={(e) => setPassLength(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{passLength} 位</span>
              </div>

              <div className="flex-col gap-3">
                <label className="flex-row items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={includeLower} onChange={() => setIncludeLower(!includeLower)} />
                  <span>包含小写字母 (a-z)</span>
                </label>
                <label className="flex-row items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={includeUpper} onChange={() => setIncludeUpper(!includeUpper)} />
                  <span>包含大写字母 (A-Z)</span>
                </label>
                <label className="flex-row items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={includeNum} onChange={() => setIncludeNum(!includeNum)} />
                  <span>包含数字 (0-9)</span>
                </label>
                <label className="flex-row items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={includeSym} onChange={() => setIncludeSym(!includeSym)} />
                  <span>包含特殊符号 (!@#$等)</span>
                </label>
              </div>

              <button onClick={generatePassword} className="btn primary py-2" style={{ marginTop: '1rem' }}>
                生成密码
              </button>
            </div>

            <div className="card flex-col gap-4 justify-center" style={{ width: '350px' }}>
              <span>生成的随机密码:</span>
              <div 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  padding: '1.25rem', 
                  borderRadius: '8px', 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '1.25rem', 
                  color: 'var(--accent-primary)',
                  wordBreak: 'break-all',
                  textAlign: 'center'
                }}
              >
                {generatedPass || '点击生成按钮'}
              </div>
              {generatedPass && !generatedPass.includes('字符集') && (
                <button onClick={() => triggerCopy(generatedPass, 'pass')} className="btn">
                  {copiedText === 'pass' ? <Check size={14} /> : <Copy size={14} />} 复制密码
                </button>
              )}
            </div>
          </div>
        )}

        {/* Color Picker Tab */}
        {activeSubTab === 'color' && (
          <div className="pane-layout">
            <div className="card flex-col gap-4" style={{ width: '300px', alignItems: 'center', justifyContent: 'center' }}>
              <span>选择颜色:</span>
              <input
                type="color"
                value={colorHex}
                onChange={(e) => handleColorChange(e.target.value)}
                style={{
                  width: '120px',
                  height: '120px',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              />
              <div 
                style={{ 
                  width: '100%', 
                  height: '40px', 
                  borderRadius: '6px', 
                  background: colorHex, 
                  boxShadow: `0 4px 15px ${colorHex}50` 
                }} 
              />
            </div>

            <div className="card flex-1 flex-col gap-4">
              <h3>颜色编码转换</h3>
              <div className="flex-col gap-3">
                {/* Hex Row */}
                <div className="flex-row items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>HEX 格式:</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '2px' }}>{colorHex}</div>
                  </div>
                  <button onClick={() => triggerCopy(colorHex, 'hex')} className="btn py-1 px-3">
                    {copiedText === 'hex' ? <Check size={14} /> : <Copy size={14} />} 复制
                  </button>
                </div>

                {/* RGB Row */}
                <div className="flex-row items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>RGB 格式:</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '2px' }}>{colorRgb}</div>
                  </div>
                  <button onClick={() => triggerCopy(colorRgb, 'rgb')} className="btn py-1 px-3">
                    {copiedText === 'rgb' ? <Check size={14} /> : <Copy size={14} />} 复制
                  </button>
                </div>

                {/* HSL Row */}
                <div className="flex-row items-center justify-between">
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>HSL 格式:</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '2px' }}>{colorHsl}</div>
                  </div>
                  <button onClick={() => triggerCopy(colorHsl, 'hsl')} className="btn py-1 px-3">
                    {copiedText === 'hsl' ? <Check size={14} /> : <Copy size={14} />} 复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {copiedText && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>结果已成功复制到剪贴板！</span>
        </div>
      )}
    </div>
  );
};
