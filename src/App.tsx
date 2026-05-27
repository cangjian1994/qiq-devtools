import { useState, useEffect } from 'react';
import { Sidebar, type ToolType } from './components/Sidebar';
import { JsonParser } from './components/JsonParser';
import { JsonToEntity } from './components/JsonToEntity';
import { Converter } from './components/Converter';
import { DiffTool } from './components/DiffTool';
import { RegexTester } from './components/RegexTester';
import { CronGenerator } from './components/CronGenerator';
import { WebSocketSimulator } from './components/WebSocketSimulator';
import { CodecTools } from './components/CodecTools';
import { CodeFormatter } from './components/CodeFormatter';
import { CryptoSymmetric } from './components/CryptoSymmetric';
import { JwtDecoder } from './components/JwtDecoder';
import { RadixColor } from './components/RadixColor';
import { TimestampConverter } from './components/TimestampConverter';

function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('json-parser');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('devtools_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('devtools_theme', theme);
  }, [theme]);

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'json-parser':
        return <JsonParser theme={theme} />;
      case 'json-to-entity':
        return <JsonToEntity theme={theme} />;
      case 'converter':
        return <Converter theme={theme} />;
      case 'diff':
        return <DiffTool theme={theme} />;
      case 'timestamp':
        return <TimestampConverter />;
      case 'regex':
        return <RegexTester />;
      case 'cron':
        return <CronGenerator />;
      case 'websocket':
        return <WebSocketSimulator />;
      case 'codec':
        return <CodecTools />;
      case 'code-formatter':
        return <CodeFormatter theme={theme} />;
      case 'crypto-symmetric':
        return <CryptoSymmetric />;
      case 'jwt-decoder':
        return <JwtDecoder />;
      case 'radix-color':
        return <RadixColor />;
      default:
        return <JsonParser theme={theme} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        theme={theme} 
        setTheme={setTheme} 
      />
      <main style={{ flex: 1, display: 'flex', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        {renderActiveTool()}
      </main>
    </div>
  );
}

export default App;
