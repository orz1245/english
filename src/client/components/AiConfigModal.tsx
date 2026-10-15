import React, { useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Key,
  MessageSquare,
  RefreshCw,
  Send,
  Server,
  Settings,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { AI_PROVIDER_PRESETS } from '../data/courseData';
import { askAITutor, getUserId, setUserId, testAIProxyConnection } from '../services/api';
import { AIConfig } from '../types';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  storageBackend: string;
  onSaveConfig: (newConfig: AIConfig, newLearnerId?: string) => Promise<void>;
}

export const AiConfigModal: React.FC<AiConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  storageBackend,
  onSaveConfig,
}) => {
  const [draft, setDraft] = useState<AIConfig>(config);
  const [learnerId, setLearnerId] = useState<string>(getUserId());
  const [testing, setTesting] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    detail?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    const preset = AI_PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDraft((prev) => ({
      ...prev,
      providerId: preset.id,
      providerName: preset.name,
      baseUrl: preset.baseUrl,
      model: preset.defaultModel,
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testAIProxyConnection(draft);
    setTesting(false);
    if (res.ok) {
      setTestResult({
        ok: true,
        message: `Worker 代理连通成功 (${res.latencyMs}ms) · 模型 ${res.model}`,
        detail: `响应内容：“${res.reply}”`,
      });
    } else {
      setTestResult({
        ok: false,
        message: '代理连通测试未通过',
        detail: res.error || '请检查 Base URL、API Key 或模型名称是否正确',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (learnerId.trim()) {
      setUserId(learnerId.trim());
    }
    await onSaveConfig(draft, learnerId.trim());
    setSaving(false);
    onClose();
  };

  const activePreset =
    AI_PROVIDER_PRESETS.find((p) => p.id === draft.providerId) || AI_PROVIDER_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                AI 服务配置管理 & Cloudflare 云端持久化
              </h2>
              <p className="text-xs text-slate-400">
                所有 AI 请求均通过 Cloudflare Worker `/api/ai/chat` 后端安全代理转发，兼容任意 OpenAI 格式接口
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {/* 1. 云端同步 ID 与存储引擎状态 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                <Cloud className="h-4 w-4" />
                Cloudflare 持久化标识 (Learner Sync ID)
              </span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                当前存储引擎：{storageBackend.toUpperCase()}
              </span>
            </div>
            <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={learnerId}
                onChange={(e) => setLearnerId(e.target.value)}
                placeholder="输入自定义学习者 ID 以跨设备同步 D1/KV 数据..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-400 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">
                在不同设备使用相同 ID 即可从 D1 / KV 恢复进度与配置
              </span>
            </div>
          </div>

          {/* 2. 服务商预设快速切换 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              选择 OpenAI 兼容服务商预设
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AI_PROVIDER_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`rounded-xl border p-2.5 text-left transition ${
                    draft.providerId === preset.id
                      ? 'border-indigo-500 bg-indigo-950/50 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{preset.name}</div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-500">{preset.defaultModel}</div>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">{activePreset.description}</p>
          </div>

          {/* 3. Base URL 与 API Key */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Server className="h-3.5 w-3.5 text-indigo-400" />
                API Base URL (OpenAI 兼容地址)
              </label>
              <input
                type="text"
                value={draft.baseUrl}
                onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Key className="h-3.5 w-3.5 text-amber-400" />
                API Key (支持留空以使用 Worker 默认密钥)
              </label>
              <input
                type="password"
                value={draft.apiKey}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                placeholder="sk-..."
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 4. 模型名称、Temperature 与 Max Tokens */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">模型名称 (Model)</label>
              <input
                type="text"
                list="preset-models"
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder="gpt-4o-mini / deepseek-chat"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
              />
              <datalist id="preset-models">
                {activePreset.models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                  Temperature
                </span>
                <span className="font-mono text-indigo-300">{draft.temperature}</span>
              </label>
              <input
                type="range"
                min={0}
                max={1.2}
                step={0.1}
                value={draft.temperature}
                onChange={(e) => setDraft({ ...draft, temperature: parseFloat(e.target.value) })}
                className="mt-3 w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">最大输出 Tokens</label>
              <input
                type="number"
                min={256}
                max={8192}
                step={256}
                value={draft.maxTokens}
                onChange={(e) => setDraft({ ...draft, maxTokens: Number(e.target.value) || 2000 })}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 5. 自定义系统提示词 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300">
              全局 AI 助教角色设定 (System Prompt)
            </label>
            <textarea
              rows={2}
              value={draft.customSystemPrompt}
              onChange={(e) => setDraft({ ...draft, customSystemPrompt: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {/* 测试结果反馈 */}
          {testResult && (
            <div
              className={`rounded-xl border p-3.5 text-xs ${
                testResult.ok
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                  : 'border-rose-500/40 bg-rose-950/30 text-rose-200'
              }`}
            >
              <div className="font-bold">{testResult.message}</div>
              {testResult.detail && <div className="mt-1 opacity-90">{testResult.detail}</div>}
            </div>
          )}

          {/* 底部操作按钮 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? '正在通过 Worker 代理测试...' : '测试 Worker 代理连接'}
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-indigo-500"
              >
                <CheckCircle2 className="h-4 w-4" />
                {saving ? '正在同步至云端...' : '保存配置并同步云端'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 全局上下文 AI 学习答疑抽屉 (AiTutorDrawer)
// ============================================================================

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIConfig;
  initialQuestion: string;
  contextInfo: string;
  onOpenAiSettings: () => void;
}

export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  isOpen,
  onClose,
  aiConfig,
  initialQuestion,
  contextInfo,
  onOpenAiSettings,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; mode?: string }>>([
    {
      role: 'assistant',
      text: '你好！我是你的专属 AI 语法与雅思导师。无论是长难句成分拆解、文学名著翻译润色，还是雅思听说读写四科备考疑问，都可以随时向我提问。',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (initialQuestion) {
      setInput(initialQuestion);
    }
  }, [initialQuestion]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await askAITutor(q, contextInfo, aiConfig);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply,
          mode: res.mode === 'live' ? res.model : '离线启发式演示模式',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `请求出错：${err instanceof Error ? err.message : '请检查 AI 配置'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white">AI 随堂答疑导师</h3>
            <p className="text-[11px] text-slate-400">
              当前模型：{aiConfig.model} ({aiConfig.providerName})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenAiSettings}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
          >
            切换模型
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {contextInfo && (
        <div className="border-b border-slate-800/80 bg-indigo-950/30 px-4 py-2 text-[11px] text-indigo-200 line-clamp-2">
          <strong>已关联上下文：</strong>
          {contextInfo}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-800 bg-slate-950 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
              {m.mode && (
                <div className="mt-1.5 border-t border-slate-800 pt-1 text-[10px] text-slate-500">
                  来源：{m.mode}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-indigo-300 animate-pulse px-2">
            Worker 正在通过代理请求大模型解答...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="border-t border-slate-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入语法、翻译或雅思备考疑问..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
