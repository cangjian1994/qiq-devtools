import React from 'react';
import { 
  Braces, 
  Code2, 
  RefreshCw, 
  Split, 
  Search, 
  Clock, 
  Radio, 
  Binary,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileCode,
  Lock,
  UserCheck,
  Hash,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';

export type ToolType = 
  | 'json-parser' 
  | 'json-to-entity' 
  | 'converter' 
  | 'diff' 
  | 'regex' 
  | 'cron' 
  | 'websocket' 
  | 'codec'
  | 'code-formatter'
  | 'crypto-symmetric'
  | 'jwt-decoder'
  | 'radix-color'
  | 'timestamp';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool, theme, setTheme }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const menuItems = [
    { id: 'json-parser', label: 'JSON 解析与格式化', icon: Braces },
    { id: 'json-to-entity', label: 'JSON 转 Entity', icon: Code2 },
    { id: 'converter', label: 'JSON 格式转换', icon: RefreshCw },
    { id: 'diff', label: '文本对比 (Diff)', icon: Split },
    { id: 'timestamp', label: '时间戳在线转换', icon: Clock },
    { id: 'regex', label: '正则表达式测试', icon: Search },
    { id: 'cron', label: 'Cron 表达式生成', icon: Calendar },
    { id: 'websocket', label: 'WebSocket 仿真测试', icon: Radio },
    { id: 'codec', label: '基础编码与解密', icon: Binary },
    { id: 'code-formatter', label: '代码美化与压缩', icon: FileCode },
    { id: 'crypto-symmetric', label: '对称加解密 (AES)', icon: Lock },
    { id: 'jwt-decoder', label: 'JWT 在线解析', icon: UserCheck },
    { id: 'radix-color', label: '进制与开发工具', icon: Hash },
  ] as const;

  return (
    <aside className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-area">
          <Sparkles className="logo-icon animate-pulse" />
          {!isCollapsed && <span className="logo-text">QiQ DevTools</span>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTool === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTool(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="nav-icon" size={20} />
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {isActive && !isCollapsed && <div className="nav-active-indicator" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: isCollapsed ? 'column' : 'row', gap: '8px', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', width: '100%' }}>
        <button 
          className="collapse-toggle-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? '切换为白天模式' : '切换为黑夜模式'}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!isCollapsed && <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{theme === 'dark' ? '白天模式' : '黑夜模式'}</span>}
        </button>
        <button 
          className="collapse-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};
