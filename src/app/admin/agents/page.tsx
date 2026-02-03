'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Bot, Plus, Pencil, Trash2, Star, Loader2, Eye, EyeOff, X } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  difyAppToken: string;
  isDefault: boolean;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difyAppToken: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAgent(null);
    setFormData({
      name: '',
      description: '',
      difyAppToken: '',
      isDefault: agents.length === 0,
    });
    setShowToken(false);
    setShowModal(true);
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      difyAppToken: agent.difyAppToken,
      isDefault: agent.isDefault,
    });
    setShowToken(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAgent(null);
  };

  const saveAgent = async () => {
    if (!formData.name.trim()) {
      alert('请填写名称');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/agents';
      const method = editingAgent ? 'PUT' : 'POST';
      const body = editingAgent
        ? { id: editingAgent.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchAgents();
        closeModal();
      } else {
        const data = await res.json();
        alert(data.error || '保存失败');
      }
    } catch (error) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('确定要删除这个智能体吗？')) return;

    try {
      const res = await fetch(`/api/admin/agents?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchAgents();
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  const setDefault = async (id: string) => {
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      });

      if (res.ok) {
        await fetchAgents();
      }
    } catch (error) {
      console.error('Failed to set default:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bot className="h-8 w-8 text-indigo-400" />
            智能体管理
          </h1>
          <p className="mt-2 text-slate-400">添加和管理 AI 助手</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          添加智能体
        </Button>
      </div>

      {/* 智能体列表 */}
      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bot className="h-16 w-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">还没有智能体</h3>
            <p className="text-slate-400 mb-6">添加你的第一个 AI 助手开始使用</p>
            <Button onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              添加智能体
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="relative overflow-hidden">
              {agent.isDefault && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-xs font-medium text-white">
                    <Star className="h-3 w-3" />
                    默认
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  {agent.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {agent.description || '暂无描述'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(agent)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    编辑
                  </Button>
                  {!agent.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefault(agent.id)}
                    >
                      <Star className="mr-1 h-3 w-3" />
                      设为默认
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteAgent(agent.id)}
                    className="text-red-400 hover:text-red-300 hover:border-red-500/50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingAgent ? '编辑智能体' : '添加智能体'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">名称 *</label>
                <Input
                  placeholder="例如：客服助手"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">描述</label>
                <Textarea
                  placeholder="描述这个智能体的用途..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Dify App Token (可选)</label>
                <div className="relative">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    placeholder="app-xxxxxxxxxx (留空则使用默认)"
                    value={formData.difyAppToken}
                    onChange={(e) => setFormData({ ...formData, difyAppToken: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  如果此智能体需要使用不同的 Dify 应用，在这里填写其 API Key
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div>
                  <p className="font-medium text-white">设为默认</p>
                  <p className="text-sm text-slate-400">新用户将自动使用此智能体</p>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={closeModal}>
                取消
              </Button>
              <Button onClick={saveAgent} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAgent ? '保存' : '添加'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
