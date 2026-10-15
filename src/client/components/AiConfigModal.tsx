import React, { useState } from 'react';
import { Check, RefreshCw, Send, Settings, X } from 'lucide-react';
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

/**
 * 后台系统参数配置面板（仅管理员通过 ?admin=1、#admin 或快捷键 Ctrl/Cmd + Shift + A 呼出，前台界面完全隐藏）
 */
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
        message: `代理连通正常 (${res.latencyMs}ms) · ${res.model}`,
        detail: res.reply,
      });
    } else {
      setTestResult({
        ok: false,
        message: '代理连通未通过',
        detail: res.error || '请核对 Base URL、API Key 与模型标识',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C2623]/40 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#D8CEBE] bg-[#FBF8F3] p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E2DACB] pb-4">
          <div className="flex items-center gap-2.5">
            <Settings className="h-5 w-5 text-[#8C5A2B]" />
            <div>
              <h2 className="font-editorial text-lg font-semibold text-[#2C2623]">
                后台服务配置 <span className="font-normal text-[#6E6050]">/ Backend AI & Storage Settings</span>
              </h2>
              <p className="text-xs text-[#7A6B58]">
                管理员专用配置面板（持久化引擎：{storageBackend.toUpperCase()}）
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#7A6B58] hover:bg-[#EFE6D5] hover:text-[#2C2623]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5C5144]">服务商预设 / Provider</label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AI_PROVIDER_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`rounded-lg border p-2.5 text-left transition ${
                    draft.providerId === preset.id
                      ? 'border-[#B07D4F] bg-[#EFE6D5] text-[#2C2623]'
                      : 'border-[#E2DACB] bg-[#F4EFE6] text-[#5C5144] hover:border-[#C8B9A6]'
                  }`}
                >
                  <div className="text-xs font-semibold">{preset.name}</div>
                  <div className="mt-0.5 truncate text-[10px] text-[#8A7B68]">{preset.defaultModel}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#5C5144]">Base URL</label>
              <input
                type="text"
                value={draft.baseUrl}
                onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="mt-1 w-full rounded-lg border border-[#D8CEBE] bg-[#F4EFE6] px-3 py-2 text-xs text-[#2C2623] focus:border-[#B07D4F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5144]">API Key</label>
              <input
                type="password"
                value={draft.apiKey}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                placeholder="留空则使用 Worker 环境变量 DEFAULT_AI_API_KEY"
                className="mt-1 w-full rounded-lg border border-[#D8CEBE] bg-[#F4EFE6] px-3 py-2 text-xs text-[#2C2623] focus:border-[#B07D4F] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-[#5C5144]">模型标识 / Model</label>
              <input
                type="text"
                list="preset-models"
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#D8CEBE] bg-[#F4EFE6] px-3 py-2 text-xs text-[#2C2623] focus:border-[#B07D4F] focus:outline-none"
              />
              <datalist id="preset-models">
                {activePreset.models.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="flex justify-between text-xs font-semibold text-[#5C5144]">
                <span>Temperature</span>
                <span>{draft.temperature}</span>
              </label>
              <input
                type="range"
                min={0}
                max={1.2}
                step={0.1}
                value={draft.temperature}
                onChange={(e) => setDraft({ ...draft, temperature: parseFloat(e.target.value) })}
                className="mt-2.5 w-full accent-[#8C5A2B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5C5144]">数据同步标识 / Sync ID</label>
              <input
                type="text"
                value={learnerId}
                onChange={(e) => setLearnerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#D8CEBE] bg-[#F4EFE6] px-3 py-2 text-xs text-[#2C2623] focus:border-[#B07D4F] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C5144]">系统提示词 / System Prompt</label>
            <textarea
              rows={2}
              value={draft.customSystemPrompt}
              onChange={(e) => setDraft({ ...draft, customSystemPrompt: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[#D8CEBE] bg-[#F4EFE6] p-3 text-xs text-[#2C2623] focus:border-[#B07D4F] focus:outline-none"
            />
          </div>

          {testResult && (
            <div
              className={`rounded-lg border p-3 text-xs ${
                testResult.ok
                  ? 'border-[#8AB09B] bg-[#E3ECE6] text-[#234533]'
                  : 'border-[#CFA096] bg-[#F2E5DF] text-[#8E3F30]'
              }`}
            >
              <div className="font-semibold">{testResult.message}</div>
              {testResult.detail && <div className="mt-1">{testResult.detail}</div>}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[#E2DACB] pt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8CEBE] bg-[#F4EFE6] px-3.5 py-2 text-xs font-medium text-[#2C2623] hover:border-[#B07D4F]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? '检测中...' : '连通检测'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#D8CEBE] px-4 py-2 text-xs text-[#5C5144]"
              >
                关闭
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E5641] px-4 py-2 text-xs font-medium text-[#FBF8F3] hover:bg-[#234533]"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{saving ? '保存中...' : '保存配置'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 学术答疑侧栏 (Inquiry Drawer) — 仅呈现纯粹的语法/翻译/雅思释疑，无任何后台设置入口
// ============================================================================

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIConfig;
  initialQuestion: string;
  contextInfo: string;
}

export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  isOpen,
  onClose,
  aiConfig,
  initialQuestion,
  contextInfo,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: '请输入需进一步辨析的语法结构、词义搭配或译文句式。',
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
      setMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: err instanceof Error ? err.message : '服务暂不可用。',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-[#DFD7C8] bg-[#FBF8F3] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#E2DACB] px-5 py-4">
        <h3 className="font-editorial text-lg font-semibold text-[#2C2623]">
          学术释疑 <span className="font-normal text-[#6E6050]">/ Inquiry</span>
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-[#7A6B58] hover:bg-[#EFE6D5] hover:text-[#2C2623]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {contextInfo && (
        <div className="border-b border-[#E2DACB] bg-[#F4EFE6] px-4 py-2 text-xs text-[#5C5144] line-clamp-2 font-editorial italic">
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
              className={`max-w-[88%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#2E5641] text-[#FBF8F3]'
                  : 'border border-[#E2DACB] bg-[#F4EFE6] text-[#2C2623]'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-[#7A6B58] px-2">正在检索与推演...</div>}
      </div>

      <form onSubmit={handleSend} className="border-t border-[#E2DACB] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入语法或译文问题..."
            className="flex-1 rounded-lg border border-[#D8CEBE] bg-[#F4EFE6] px-3.5 py-2 text-xs text-[#2C2623] placeholder-[#9C8F7E] focus:border-[#B07D4F] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-[#2E5641] px-4 py-2 text-xs font-medium text-[#FBF8F3] hover:bg-[#234533] disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
