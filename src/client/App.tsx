import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Cloud,
  Database,
  GitBranch,
  GraduationCap,
  Languages,
  MessageSquare,
  Settings,
  Sparkles,
} from 'lucide-react';
import { AiConfigModal, AiTutorDrawer } from './components/AiConfigModal';
import { GrammarModule } from './components/GrammarModule';
import { IeltsModule } from './components/IeltsModule';
import { TranslationModule } from './components/TranslationModule';
import {
  DEFAULT_AI_CONFIG,
  DEFAULT_USER_PROGRESS,
  loadLocalAIConfig,
  loadLocalProgress,
  pushStateToCloud,
  syncStateFromCloud,
} from './services/api';
import { AIConfig, UserProgress } from './types';

type ActiveModule = 'grammar' | 'translation' | 'ielts';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('grammar');
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => loadLocalAIConfig() || DEFAULT_AI_CONFIG);
  const [progress, setProgress] = useState<UserProgress>(() => loadLocalProgress() || DEFAULT_USER_PROGRESS);
  const [storageBackend, setStorageBackend] = useState<string>('d1');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(false);
  const [tutorQuestion, setTutorQuestion] = useState<string>('');
  const [tutorContext, setTutorContext] = useState<string>('');

  useEffect(() => {
    syncStateFromCloud().then((res) => {
      setStorageBackend(res.storageBackend);
      setAiConfig(res.aiConfig);
      setProgress(res.progress);
      setLastSyncedAt(res.updatedAt);
    });
  }, []);

  const handleSaveAiConfig = async (newConfig: AIConfig) => {
    setAiConfig(newConfig);
    const res = await pushStateToCloud(newConfig, progress);
    setStorageBackend(res.storageBackend);
    setLastSyncedAt(res.updatedAt);
  };

  const handleMarkCompleted = async (category: 'grammar' | 'translation' | 'ielts', itemId: string) => {
    const nextProgress: UserProgress = { ...progress };
    if (category === 'grammar' && !nextProgress.completedGrammarIds.includes(itemId)) {
      nextProgress.completedGrammarIds = [...nextProgress.completedGrammarIds, itemId];
      nextProgress.totalPracticeCount += 1;
    } else if (category === 'translation' && !nextProgress.completedTranslationIds.includes(itemId)) {
      nextProgress.completedTranslationIds = [...nextProgress.completedTranslationIds, itemId];
      nextProgress.totalPracticeCount += 1;
    } else if (category === 'ielts' && !nextProgress.completedIeltsIds.includes(itemId)) {
      nextProgress.completedIeltsIds = [...nextProgress.completedIeltsIds, itemId];
      nextProgress.totalPracticeCount += 1;
    }
    setProgress(nextProgress);
    const res = await pushStateToCloud(aiConfig, nextProgress);
    setStorageBackend(res.storageBackend);
    setLastSyncedAt(res.updatedAt);
  };

  const handleAskTutor = (prefillQuestion: string, contextText: string) => {
    setTutorQuestion(prefillQuestion);
    setTutorContext(contextText);
    setIsTutorOpen(true);
  };

  const totalMastered =
    progress.completedGrammarIds.length +
    progress.completedTranslationIds.length +
    progress.completedIeltsIds.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 顶部全局导航栏 */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          {/* 品牌 Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">LinguaForge</span>
                <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                  Cloudflare Workers
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                可视化句法拆解 · 文学影视分级翻译 · 雅思四科 AI 精研平台
              </p>
            </div>
          </div>

          {/* 三大核心模块切换 Tab */}
          <nav className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5">
            <button
              onClick={() => setActiveModule('grammar')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeModule === 'grammar'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>1. 英语语法拆解</span>
            </button>

            <button
              onClick={() => setActiveModule('translation')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeModule === 'translation'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <Languages className="h-4 w-4" />
              <span>2. 文学影视翻译</span>
            </button>

            <button
              onClick={() => setActiveModule('ielts')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeModule === 'ielts'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>3. 雅思四科专训</span>
            </button>
          </nav>

          {/* 右侧：持久化状态 + AI 配置管理 + 随堂答疑 */}
          <div className="flex items-center gap-2.5">
            <div
              className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300"
              title={lastSyncedAt ? `最近云端同步时间：${lastSyncedAt}` : 'Cloudflare 边缘持久化已就绪'}
            >
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span>存储：{storageBackend.toUpperCase()}</span>
              <span className="text-slate-600">|</span>
              <span className="text-indigo-300 font-semibold">已掌握 {totalMastered} 项</span>
            </div>

            <button
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-500/50 hover:bg-slate-800"
            >
              <Settings className="h-3.5 w-3.5 text-indigo-400" />
              <span>AI 配置 ({aiConfig.model})</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  aiConfig.apiKey ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                title={aiConfig.apiKey ? '已配置自定义 API Key' : '当前使用服务端默认密钥或离线启发式引擎'}
              />
            </button>

            <button
              onClick={() => setIsTutorOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:from-indigo-500 hover:to-purple-500"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>AI 答疑助教</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容容器 */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {activeModule === 'grammar' && (
          <GrammarModule
            aiConfig={aiConfig}
            completedIds={progress.completedGrammarIds}
            onMarkCompleted={(id) => handleMarkCompleted('grammar', id)}
            onAskTutor={handleAskTutor}
          />
        )}

        {activeModule === 'translation' && (
          <TranslationModule
            aiConfig={aiConfig}
            completedIds={progress.completedTranslationIds}
            onMarkCompleted={(id) => handleMarkCompleted('translation', id)}
            onAskTutor={handleAskTutor}
          />
        )}

        {activeModule === 'ielts' && (
          <IeltsModule
            aiConfig={aiConfig}
            completedIds={progress.completedIeltsIds}
            onMarkCompleted={(id) => handleMarkCompleted('ielts', id)}
            onAskTutor={handleAskTutor}
          />
        )}
      </main>

      {/* 底部架构与持久化信息栏 */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 sm:flex-row">
          <span>
            LinguaForge · 兼容 Cloudflare Workers Runtime (Static Assets + D1/KV Persistence + OpenAI Proxy)
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Cloud className="h-3.5 w-3.5" />
              配置 OpenAI / DeepSeek / 通义千问代理密钥
            </button>
          </div>
        </div>
      </footer>

      {/* AI 配置管理弹窗 */}
      <AiConfigModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        config={aiConfig}
        storageBackend={storageBackend}
        onSaveConfig={handleSaveAiConfig}
      />

      {/* AI 全局答疑侧边抽屉 */}
      <AiTutorDrawer
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        aiConfig={aiConfig}
        initialQuestion={tutorQuestion}
        contextInfo={tutorContext}
        onOpenAiSettings={() => {
          setIsTutorOpen(false);
          setIsAiModalOpen(true);
        }}
      />
    </div>
  );
};

export default App;
