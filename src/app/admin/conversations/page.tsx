'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, User, Clock, ChevronRight, X, Loader2 } from 'lucide-react';
import { getAgents } from '@/lib/config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  feishuUserId: string;
  feishuUserName: string | null;
  agentId: string;
  status: string;
  createdAt: string;
  lastActiveAt: string;
  messages: Message[];
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [agents, setAgents] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 获取会话列表
      const convRes = await fetch('/api/admin/conversations');
      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data);
      }

      // 获取智能体列表用于显示名称
      const agentRes = await fetch('/api/admin/agents');
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        const agentMap: Record<string, string> = {};
        agentData.forEach((a: { id: string; name: string }) => {
          agentMap[a.id] = a.name;
        });
        setAgents(agentMap);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/conversations?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="h-8 w-8 text-indigo-400" />
          会话记录
        </h1>
        <p className="mt-2 text-slate-400">查看用户与 AI 助手的对话历史</p>
      </div>

      {/* 会话列表 */}
      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-16 w-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">还没有会话记录</h3>
            <p className="text-slate-400">当用户与 Bot 对话后，会话记录将显示在这里</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 会话列表 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>最近会话</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700/50">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversationDetail(conv.id)}
                    className={`w-full p-4 text-left hover:bg-slate-800/50 transition-colors flex items-center gap-4 ${
                      selectedConversation?.id === conv.id ? 'bg-slate-800/50' : ''
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white truncate">
                          {conv.feishuUserName || conv.feishuUserId.slice(0, 8) + '...'}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            conv.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-slate-600/20 text-slate-400'
                          }`}
                        >
                          {conv.status === 'active' ? '进行中' : '已结束'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-indigo-400">
                          {agents[conv.agentId] || '未知智能体'}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(conv.lastActiveAt)}
                        </span>
                      </div>
                      {conv.messages && conv.messages[0] && (
                        <p className="text-sm text-slate-400 truncate mt-1">
                          {conv.messages[0].content}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-500" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 会话详情 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>对话详情</CardTitle>
                {selectedConversation && (
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedConversation ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <MessageSquare className="h-12 w-12 mb-4" />
                  <p>选择一个会话查看详情</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
