'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cpu, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DifyConfig {
  baseUrl: string;
  apiKey: string;
}

export default function DifyConfigPage() {
  const [config, setConfig] = useState<DifyConfig>({
    baseUrl: '',
    apiKey: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.dify);
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
        body: JSON.stringify({ type: 'dify', config }),
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
        body: JSON.stringify({ type: 'dify', config }),
      });

      // 然后测试连接
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dify', action: 'test' }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ success: false, message: '测试失败' });
    } finally {
      setTesting(false);
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
          <Cpu className="h-8 w-8 text-indigo-400" />
          Dify 配置
        </h1>
        <p className="mt-2 text-slate-400">配置 Dify 服务连接信息</p>
      </div>

      {/* 配置表单 */}
      <Card>
        <CardHeader>
          <CardTitle>服务配置</CardTitle>
          <CardDescription>
            填写你的 Dify 服务地址和 API 密钥
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Base URL</label>
            <Input
              placeholder="http://your-dify-server/v1"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            />
            <p className="text-xs text-slate-500">
              Dify 服务的 API 地址，通常以 /v1 结尾
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">API Key (默认)</label>
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="app-xxxxxxxxxx"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              在 Dify 应用的「访问 API」页面获取，这是默认的 API Key，智能体可以覆盖此配置
            </p>
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
            <Button onClick={testConnection} variant="outline" disabled={testing || saving}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              测试连接
            </Button>
            <Button onClick={saveConfig} disabled={saving || testing}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存配置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle>配置说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-400">
            <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700">
              <h4 className="font-medium text-white mb-2">如何获取配置信息：</h4>
              <ol className="list-decimal list-inside space-y-2">
                <li>登录你的 Dify 服务</li>
                <li>进入需要使用的应用</li>
                <li>点击左侧「访问 API」</li>
                <li>
                  <span className="text-white">Base URL: </span>
                  通常是 <code className="text-indigo-400">http://你的服务器地址/v1</code>
                </li>
                <li>
                  <span className="text-white">API Key: </span>
                  在页面中生成或复制 API 密钥
                </li>
              </ol>
            </div>

            <div className="rounded-lg bg-indigo-500/10 p-4 border border-indigo-500/30">
              <h4 className="font-medium text-indigo-400 mb-2">💡 提示</h4>
              <p>
                这里配置的是默认的 API Key。如果你有多个 Dify 应用，可以在「智能体管理」中为每个智能体配置不同的 API Key。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
