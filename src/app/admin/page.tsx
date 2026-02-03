'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Bot, Activity } from 'lucide-react';

interface Stats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/conversations?type=stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '总会话数',
      value: stats.totalConversations,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: '活跃会话',
      value: stats.activeConversations,
      icon: Activity,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: '消息总数',
      value: stats.totalMessages,
      icon: MessageSquare,
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-white">仪表盘</h1>
        <p className="mt-2 text-slate-400">系统概览和统计数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-6 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg bg-gradient-to-r ${stat.gradient} p-2`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {loading ? '...' : stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快速入门指南 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-400" />
            快速入门
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="font-semibold text-white">1. 配置飞书应用</h3>
              <p className="mt-1 text-sm text-slate-400">
                在「飞书配置」页面填入飞书开放平台的 App ID 和 App Secret
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="font-semibold text-white">2. 配置 Dify</h3>
              <p className="mt-1 text-sm text-slate-400">
                在「Dify 配置」页面填入 Dify 服务的 Base URL 和 API Key
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="font-semibold text-white">3. 添加智能体</h3>
              <p className="mt-1 text-sm text-slate-400">
                在「智能体管理」页面添加一个或多个 AI 助手
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <h3 className="font-semibold text-white">4. 启动连接</h3>
              <p className="mt-1 text-sm text-slate-400">
                在「飞书配置」页面点击「启动连接」建立 WebSocket 长连接
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WebSocket 模式说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-green-400" />
            WebSocket 长连接模式
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/30">
            <p className="text-green-400 text-sm">
              ✨ 本项目使用 WebSocket 长连接模式，无需配置 Webhook 回调地址，也无需公网 IP 或域名。
              只需在飞书开放平台启用「使用长连接接收事件」即可。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
