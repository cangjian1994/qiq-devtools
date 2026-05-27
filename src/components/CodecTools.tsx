import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

type CodecTab = 'base64' | 'url' | 'hash';

export const CodecTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CodecTab>('base64');
  
  // Base64 state
  const [b64Raw, setB64Raw] = useState<string>('Hello, Developer! Welcome to QiQ Tools.');
  const [b64Result, setB64Result] = useState<string>('');
  
  // URL state
  const [urlRaw, setUrlRaw] = useState<string>('https://qqe2.com/search?query=json parser&lang=zh');
  const [urlResult, setUrlResult] = useState<string>('');
  
  // Hash state
  const [hashInput, setHashInput] = useState<string>('Antigravity Developer Tools');
  const [hashMd5, setHashMd5] = useState<string>('');
  const [hashSha1, setHashSha1] = useState<string>('');
  const [hashSha256, setHashSha256] = useState<string>('');

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // MD5 Implementation
  const md5 = (str: string): string => {
    const k = [
      0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
      0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
      0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
      0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
      0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
      0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
      0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
      0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
    ];
    const r = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    const s = (x: number, y: number) => (x << y) | (x >>> (32 - y));
    const add = (x: number, y: number) => {
      const lsw = (x & 0xFFFF) + (y & 0xFFFF);
      const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    };
    
    const strToWords = (str: string) => {
      const words: number[] = [];
      for (let i = 0; i < str.length * 8; i += 8) {
        words[i >> 5] |= (str.charCodeAt(i / 8) & 0xFF) << (i % 32);
      }
      return words;
    };

    const words = strToWords(str);
    const len = str.length * 8;
    words[len >> 5] |= 0x80 << (len % 32);
    words[(((len + 64) >>> 9) << 4) + 14] = len;

    let a = 0x67452301;
    let b = 0xefcdab89;
    let c = 0x98badcfe;
    let d = 0x10325476;

    for (let i = 0; i < words.length; i += 16) {
      let olda = a;
      let oldb = b;
      let oldc = c;
      let oldd = d;

      for (let j = 0; j < 64; j++) {
        let f, g;
        if (j < 16) {
          f = (b & c) | (~b & d);
          g = j;
        } else if (j < 32) {
          f = (d & b) | (~d & c);
          g = (5 * j + 1) % 16;
        } else if (j < 48) {
          f = b ^ c ^ d;
          g = (3 * j + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * j) % 16;
        }
        const temp = d;
        d = c;
        c = b;
        b = add(b, s(add(a, add(f, add(k[j], words[i + g]))), r[j]));
        a = temp;
      }

      a = add(a, olda);
      b = add(b, oldb);
      c = add(c, oldc);
      d = add(d, oldd);
    }

    const wordToHex = (n: number) => {
      let s = '';
      for (let i = 0; i < 4; i++) {
        s += ((n >> (i * 8)) & 0xFF).toString(16).padStart(2, '0');
      }
      return s;
    };
    return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  };

  // Base64 actions
  const handleB64Encode = () => {
    try {
      setB64Result(btoa(unescape(encodeURIComponent(b64Raw))));
    } catch (e: any) {
      setB64Result(`编码错误: ${e.message}`);
    }
  };

  const handleB64Decode = () => {
    try {
      setB64Raw(decodeURIComponent(escape(atob(b64Result))));
    } catch (e: any) {
      setB64Raw(`解码错误: 不合法的 Base64 编码格式 - ${e.message}`);
    }
  };

  // URL actions
  const handleUrlEncode = () => {
    try {
      setUrlResult(encodeURIComponent(urlRaw));
    } catch (e: any) {
      setUrlResult(`编码错误: ${e.message}`);
    }
  };

  const handleUrlDecode = () => {
    try {
      setUrlRaw(decodeURIComponent(urlResult));
    } catch (e: any) {
      setUrlRaw(`解码错误: ${e.message}`);
    }
  };

  // Hash actions (SHA async, MD5 sync)
  const calculateHashes = async (text: string) => {
    if (!text) {
      setHashMd5('');
      setHashSha1('');
      setHashSha256('');
      return;
    }
    
    // MD5
    setHashMd5(md5(text));

    // SHA-1
    try {
      const sha1Buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
      setHashSha1(Array.from(new Uint8Array(sha1Buffer)).map(b => b.toString(16).padStart(2, '0')).join(''));
    } catch (e) {
      setHashSha1('SHA-1 不被浏览器支持');
    }

    // SHA-256
    try {
      const sha256Buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      setHashSha256(Array.from(new Uint8Array(sha256Buffer)).map(b => b.toString(16).padStart(2, '0')).join(''));
    } catch (e) {
      setHashSha256('SHA-256 不被浏览器支持');
    }
  };

  // Sync Base64 / URL on initial loads
  useEffect(() => {
    if (activeTab === 'base64') handleB64Encode();
    if (activeTab === 'url') handleUrlEncode();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'hash') {
      calculateHashes(hashInput);
    }
  }, [hashInput, activeTab]);

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">编码与加解密</h2>
        <p className="tool-desc">常用哈希摘要计算以及 Base64/URL 编解码</p>
      </div>

      {/* Tabs list */}
      <div className="tabs-header">
        <button onClick={() => setActiveTab('base64')} className={`tab-btn ${activeTab === 'base64' ? 'active' : ''}`}>
          Base64 编解码
        </button>
        <button onClick={() => setActiveTab('url')} className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}>
          URL 编解码
        </button>
        <button onClick={() => setActiveTab('hash')} className={`tab-btn ${activeTab === 'hash' ? 'active' : ''}`}>
          哈希计算 (Hash)
        </button>
      </div>

      <div style={{ flex: 1 }}>
        {/* Base64 Tab */}
        {activeTab === 'base64' && (
          <div className="flex-col gap-4">
            <div className="pane-layout" style={{ minHeight: '350px' }}>
              <div className="editor-panel">
                <div className="panel-header"><span>原始文本 (明文)</span></div>
                <textarea 
                  value={b64Raw} 
                  onChange={(e) => setB64Raw(e.target.value)}
                  style={{ width: '100%', height: '100%', border: 'none', resize: 'none', background: 'var(--bg-secondary)', padding: '1rem' }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <button onClick={handleB64Encode} className="btn primary">
                  编码 ➔
                </button>
                <button onClick={handleB64Decode} className="btn secondary">
                  ◀ 解码
                </button>
              </div>

              <div className="editor-panel">
                <div className="panel-header"><span>Base64 编码结果</span></div>
                <textarea 
                  value={b64Result} 
                  onChange={(e) => setB64Result(e.target.value)}
                  style={{ width: '100%', height: '100%', border: 'none', resize: 'none', background: 'var(--bg-secondary)', padding: '1rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* URL Tab */}
        {activeTab === 'url' && (
          <div className="flex-col gap-4">
            <div className="pane-layout" style={{ minHeight: '350px' }}>
              <div className="editor-panel">
                <div className="panel-header"><span>未编码的 URL</span></div>
                <textarea 
                  value={urlRaw} 
                  onChange={(e) => setUrlRaw(e.target.value)}
                  style={{ width: '100%', height: '100%', border: 'none', resize: 'none', background: 'var(--bg-secondary)', padding: '1rem' }}
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <button onClick={handleUrlEncode} className="btn primary">
                  编码 ➔
                </button>
                <button onClick={handleUrlDecode} className="btn secondary">
                  ◀ 解码
                </button>
              </div>

              <div className="editor-panel">
                <div className="panel-header"><span>URL 编码结果 (UTF-8)</span></div>
                <textarea 
                  value={urlResult} 
                  onChange={(e) => setUrlResult(e.target.value)}
                  style={{ width: '100%', height: '100%', border: 'none', resize: 'none', background: 'var(--bg-secondary)', padding: '1rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Hash Tab */}
        {activeTab === 'hash' && (
          <div className="flex-col gap-4">
            <div className="card">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>输入待计算文本:</span>
              <textarea
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="在此输入文本..."
                style={{ width: '100%', height: '100px', marginTop: '0.5rem', resize: 'none' }}
              />
            </div>

            <div className="flex-col gap-3">
              {/* MD5 row */}
              <div className="card flex-row justify-between items-center" style={{ padding: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>MD5</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '4px', wordBreak: 'break-all' }}>
                    {hashMd5 || '空数据'}
                  </div>
                </div>
                {hashMd5 && (
                  <button onClick={() => triggerCopy(hashMd5, 'md5')} className="btn py-1 px-3">
                    {copiedText === 'md5' ? <Check size={14} /> : <Copy size={14} />} 复制
                  </button>
                )}
              </div>

              {/* SHA-1 row */}
              <div className="card flex-row justify-between items-center" style={{ padding: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>SHA-1</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '4px', wordBreak: 'break-all' }}>
                    {hashSha1 || '空数据'}
                  </div>
                </div>
                {hashSha1 && (
                  <button onClick={() => triggerCopy(hashSha1, 'sha1')} className="btn py-1 px-3">
                    {copiedText === 'sha1' ? <Check size={14} /> : <Copy size={14} />} 复制
                  </button>
                )}
              </div>

              {/* SHA-256 row */}
              <div className="card flex-row justify-between items-center" style={{ padding: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>SHA-256</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '4px', wordBreak: 'break-all' }}>
                    {hashSha256 || '空数据'}
                  </div>
                </div>
                {hashSha256 && (
                  <button onClick={() => triggerCopy(hashSha256, 'sha256')} className="btn py-1 px-3">
                    {copiedText === 'sha256' ? <Check size={14} /> : <Copy size={14} />} 复制
                  </button>
                )}
              </div>
            </div>
          </div>
        )}


      </div>

      {copiedText && (
        <div className="toast">
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span>结果已成功复制到剪切板！</span>
        </div>
      )}
    </div>
  );
};
