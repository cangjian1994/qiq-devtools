import React, { useState, useEffect } from 'react';
import { JsonTree } from './JsonTree';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const JwtDecoder: React.FC = () => {
  const [token, setToken] = useState<string>(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlcyI6WyJhZG1pbiIsImRldmVsb3BlciJdLCJpc0FjdGl2ZSI6dHJ1ZX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  );
  
  const [headerJson, setHeaderJson] = useState<any>(null);
  const [payloadJson, setPayloadJson] = useState<any>(null);
  const [signatureHex, setSignatureHex] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const decodeBase64Url = (str: string): string => {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  };

  useEffect(() => {
    if (!token.trim()) {
      setHeaderJson(null);
      setPayloadJson(null);
      setSignatureHex('');
      setErrorMsg(null);
      return;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      setErrorMsg('无效的 JWT 格式: JWT Token 必须包含由句点 (.) 分割的三个部分');
      setHeaderJson(null);
      setPayloadJson(null);
      setSignatureHex('');
      return;
    }

    try {
      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));
      
      setHeaderJson(header);
      setPayloadJson(payload);
      setSignatureHex(parts[2]);
      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg(`JWT 解析失败: 错误的 Base64 编码或无效的 JSON 内容 (${e.message})`);
      setHeaderJson(null);
      setPayloadJson(null);
      setSignatureHex('');
    }
  }, [token]);

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h2 className="tool-title">JWT 在线解析</h2>
        <p className="tool-desc">解码并分析 JSON Web Token 的 Header、Payload 和 Signature 数据</p>
      </div>

      <div className="pane-layout">
        {/* Left Side: Input Token */}
        <div className="editor-panel">
          <div className="panel-header">
            <span>输入 JWT Token</span>
          </div>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="在此处粘贴您的 JWT Token (e.g. eyJhbGciOi...)"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              resize: 'none',
              background: 'var(--bg-secondary)',
              padding: '1rem',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-mono)',
              wordBreak: 'break-all'
            }}
          />
        </div>

        {/* Right Side: Decoded Results */}
        <div className="flex-col flex-1 gap-4" style={{ height: '600px', overflowY: 'auto' }}>
          {errorMsg ? (
            <div className="alert error" style={{ margin: 0 }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="card flex-col gap-2" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.95rem' }}>HEADER: ALGORITHM & TOKEN TYPE</span>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  {headerJson && <JsonTree data={headerJson} />}
                </div>
              </div>

              {/* Payload Card */}
              <div className="card flex-col gap-2" style={{ borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>PAYLOAD: DATA</span>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  {payloadJson && <JsonTree data={payloadJson} />}
                </div>
              </div>

              {/* Signature Card */}
              <div className="card flex-col gap-2" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={16} /> SIGNATURE: VERIFICATION
                </span>
                <div 
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '6px', 
                    padding: '12px', 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    wordBreak: 'break-all'
                  }}
                >
                  {signatureHex || '无签名值'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
