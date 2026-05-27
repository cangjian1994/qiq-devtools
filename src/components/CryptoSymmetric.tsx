import React, { useState } from 'react';
import { Lock, Unlock, Copy, Check, AlertCircle } from 'lucide-react';

export const CryptoSymmetric: React.FC = () => {
  const [sourceText, setSourceText] = useState<string>('Welcome to QiQ Symmetric Encryption Tool!');
  const [key, setKey] = useState<string>('secret123');
  const [iv, setIv] = useState<string>('initvector123');
  const [mode, setMode] = useState<'AES-CBC'>('AES-CBC');
  const [outputText, setOutputText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const deriveKey = async (passphrase: string): Promise<CryptoKey> => {
    const rawKey = new TextEncoder().encode(passphrase);
    const hashedKey = await crypto.subtle.digest('SHA-256', rawKey);
    return crypto.subtle.importKey(
      'raw',
      hashedKey,
      { name: 'AES-CBC' },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const handleEncrypt = async () => {
    if (!sourceText.trim()) return;
    if (!key.trim()) {
      setErrorMsg('密码不能为空');
      return;
    }
    try {
      const cryptoKey = await deriveKey(key);
      const data = new TextEncoder().encode(sourceText);
      const ivBuffer = new TextEncoder().encode(iv.padEnd(16, '0').slice(0, 16));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: ivBuffer },
        cryptoKey,
        data
      );
      
      const base64Cipher = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
      setOutputText(base64Cipher);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(`加密失败: ${e.message}`);
    }
  };

  const handleDecrypt = async () => {
    if (!sourceText.trim()) return;
    if (!key.trim()) {
      setErrorMsg('密码不能为空');
      return;
    }
    try {
      const cryptoKey = await deriveKey(key);
      const data = new Uint8Array(atob(sourceText).split('').map(c => c.charCodeAt(0)));
      const ivBuffer = new TextEncoder().encode(iv.padEnd(16, '0').slice(0, 16));

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv: ivBuffer },
        cryptoKey,
        data
      );

      const decryptedText = new TextDecoder().decode(decrypted);
      setOutputText(decryptedText);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(`解密失败: 请检查密文、密码或初始向量(IV)是否正确。错误: ${e.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    setSourceText(outputText);
    setOutputText('');
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">对称加解密 (AES)</h2>
        <p className="tool-desc">提供本地高强度的 AES 256 位对称算法加密与解密服务</p>
      </div>

      <div className="flex-col gap-4">
        {/* Settings bar */}
        <div className="card flex-row gap-4 items-center flex-wrap">
          <div className="flex-row items-center gap-2">
            <span>算法模式:</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as 'AES-CBC')} style={{ padding: '0.4rem 0.6rem' }}>
              <option value="AES-CBC">AES-CBC (256-bit)</option>
            </select>
          </div>
          
          <div className="flex-row items-center gap-2 flex-1 min-w-[200px]">
            <span>密码 Key:</span>
            <input 
              type="text" 
              value={key} 
              onChange={(e) => setKey(e.target.value)} 
              placeholder="加密密钥..."
              style={{ flex: 1 }}
            />
          </div>

          <div className="flex-row items-center gap-2 flex-1 min-w-[200px]">
            <span>偏移量 IV:</span>
            <input 
              type="text" 
              value={iv} 
              onChange={(e) => setIv(e.target.value)} 
              placeholder="16 字节 IV..."
              style={{ flex: 1 }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="alert error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Inputs/Outputs */}
        <div className="pane-layout" style={{ minHeight: '350px' }}>
          {/* Input text */}
          <div className="editor-panel">
            <div className="panel-header">
              <span>输入内容 (明文 / 密文)</span>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="在此输入需要加密的明文，或解密的 Base64 密文..."
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                resize: 'none',
                background: 'var(--bg-secondary)',
                padding: '1rem',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {/* Actions Column */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <button onClick={handleEncrypt} className="btn primary">
              <Lock size={14} /> 加密 ➔
            </button>
            <button onClick={handleDecrypt} className="btn secondary">
              <Unlock size={14} /> ◀ 解密
            </button>
            <button onClick={handleSwap} className="btn" title="将结果复制到输入框进行二次处理">
              交换上下值
            </button>
          </div>

          {/* Output text */}
          <div className="editor-panel">
            <div className="panel-header">
              <span>加解密结果</span>
              {outputText && (
                <button onClick={handleCopy} className="btn py-0 px-2" style={{ height: '24px', fontSize: '0.75rem', padding: '0 6px' }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />} 复制结果
                </button>
              )}
            </div>
            <textarea
              value={outputText}
              readOnly
              placeholder="计算结果将在此处展示..."
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                resize: 'none',
                background: 'var(--bg-secondary)',
                padding: '1rem',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
        </div>
      </div>

      {copied && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>结果已成功复制到剪贴板！</span>
        </div>
      )}
    </div>
  );
};
