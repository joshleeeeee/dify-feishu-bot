'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Eye, EyeOff, CheckCircle, XCircle, Loader2, Wifi, WifiOff } from 'lucide-react';

interface FeishuConfig {
  appId: string;
  appSecret: string;
}

interface ConnectionStatus {
  connected: boolean;
  message: string;
}

export default function FeishuConfigPage() {
  const [config, setConfig] = useState<FeishuConfig>({
    appId: '',
    appSecret: '',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false, message: '未知' });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/config?type=status');
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data.feishu);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchStatus();
    
    // 定期刷新状态
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setConfig({
          appId: data.feishu.appId || '',
          appSecret: data.feishu.appSecret || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'feishu', config }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: data.message || '保存成功' });
      } else {
        setTestResult({ success: false, message: data.error || '保存失败' });
      }
    } catch (error) {
      setTestResult({ success: false, message: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // 先保存配置
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'feishu', config }),
      });

      // 然后测试连接
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'feishu', action: 'test' }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ success: false, message: '测试失败' });
    } finally {
      setTesting(false);
    }
  };

  const startConnection = async () => {
    setConnecting(true);
    setTestResult(null);
    try {
      // 先保存配置
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'feishu', config }),
      });

      // 启动连接
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'feishu', action: 'connect' }),
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message });
      
      // 刷新状态
      setTimeout(fetchStatus, 2000);
    } catch (error) {
      setTestResult({ success: false, message: '启动连接失败' });
    } finally {
      setConnecting(false);
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
          <MessageSquare className="h-8 w-8 text-indigo-400" />
          飞书配置
        </h1>
        <p className="mt-2 text-slate-400">配置飞书开放平台应用凭证（使用 WebSocket 长连接）</p>
      </div>

      {/* 连接状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connectionStatus.connected ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-slate-400" />
            )}
            连接状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-3 rounded-lg p-4 ${
            connectionStatus.connected
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-slate-700/50 border border-slate-600'
          }`}>
            <div className={`h-3 w-3 rounded-full ${
              connectionStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
            }`} />
            <span className={connectionStatus.connected ? 'text-green-400' : 'text-slate-400'}>
              {connectionStatus.message}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 配置表单 */}
      <Card>
        <CardHeader>
          <CardTitle>应用凭证</CardTitle>
          <CardDescription>
            在{' '}
            <a
              href="https://open.feishu.cn/app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              飞书开放平台
            </a>
            {' '}创建应用后获取这些信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* App ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">App ID</label>
            <Input
              placeholder="cli_xxxxxxxxxx"
              value={config.appId}
              onChange={(e) => setConfig({ ...config, appId: e.target.value })}
            />
          </div>

          {/* App Secret */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">App Secret</label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                placeholder="••••••••••••••••"
                value={config.appSecret}
                onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-lg p-4 ${
                testResult.success
                  ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              {testResult.message}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-4 pt-4">
            <Button onClick={testConnection} variant="outline" disabled={testing || saving || connecting}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              测试凭证
            </Button>
            <Button onClick={saveConfig} variant="outline" disabled={saving || testing || connecting}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存配置
            </Button>
            <Button onClick={startConnection} disabled={connecting || testing || saving}>
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Wifi className="mr-2 h-4 w-4" />
              启动连接
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-400">
            <div className="rounded-lg bg-indigo-500/10 p-4 border border-indigo-500/30">
              <h4 className="font-medium text-indigo-400 mb-2">✨ WebSocket 长连接模式</h4>
              <p>
                本项目使用飞书 SDK 的 <strong>WebSocket 长连接模式</strong>，相比传统 Webhook 有以下优势：
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>无需公网 IP 或域名</li>
                <li>无需配置 Webhook URL</li>
                <li>开发测试无需内网穿透</li>
                <li>自动处理解密和签名验证</li>
              </ul>
            </div>

            <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700">
              <h4 className="font-medium text-white mb-2">配置步骤：</h4>
              <ol className="list-decimal list-inside space-y-2">
                <li>登录 <a href="https://open.feishu.cn/app" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">飞书开放平台</a>，进入应用管理</li>
                <li>创建或选择一个企业自建应用</li>
                <li>在「凭证与基础信息」中获取 App ID 和 App Secret</li>
                <li>在「权限管理」中添加权限：<code className="text-indigo-400">im:message</code>（接收消息）、<code className="text-indigo-400">im:message:send_as_bot</code>（发送消息）</li>
                <li>在「事件订阅」中，启用 <strong>使用长连接接收事件</strong></li>
                <li>发布应用版本</li>
                <li>在本页面填入凭证，点击「启动连接」</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
