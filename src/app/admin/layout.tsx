'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bot, 
  Settings, 
  Cpu 
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/feishu', label: '飞书配置', icon: MessageSquare },
  { href: '/admin/dify', label: 'Dify 配置', icon: Cpu },
  { href: '/admin/agents', label: '智能体管理', icon: Bot },
  { href: '/admin/conversations', label: '会话记录', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 侧边栏 */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Dify 飞书 Bot</h1>
              <p className="text-xs text-slate-500">管理控制台</p>
            </div>
          </div>

          {/* 导航 */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive && 'text-indigo-400')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* 底部 */}
          <div className="border-t border-slate-700/50 p-4">
            <div className="rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 border border-indigo-500/20">
              <p className="text-xs text-slate-400">
                Powered by Dify + 飞书
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="ml-64 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}
