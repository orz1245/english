import React, { useEffect, useState } from 'react';
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

  // 后台 AI 配置面板默认不向普通用户展示，仅通过 URL 参数 (?admin=1 / #admin) 或管理员快捷键 Ctrl/Cmd + Shift + A 呼出
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(false);
  const [tutorQuestion, setTutorQuestion] = useState<string>('');
  const [tutorContext, setTutorContext] = useState<string>('');

  useEffect(() => {
    syncStateFromCloud().then((res) => {
      setStorageBackend(res.storageBackend);
      setAiConfig(res.aiConfig);
      setProgress(res.progress);
    });

    const checkAdminRoute = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || window.location.hash === '#admin') {
        setIsAiModalOpen(true);
      }
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAiModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSaveAiConfig = async (newConfig: AIConfig) => {
    setAiConfig(newConfig);
    const res = await pushStateToCloud(newConfig, progress);
    setStorageBackend(res.storageBackend);
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
  };

  const handleAskTutor = (prefillQuestion: string, contextText: string) => {
    setTutorQuestion(prefillQuestion);
    setTutorContext(contextText);
    setIsTutorOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#2C2623] flex flex-col">
      {/* 顶部书房眉栏（严格还原方向一：左侧深林绿衬线体品牌名，中央平级无编号三栏导航，无多余按钮） */}
      <header className="sticky top-0 z-30 border-b border-[#E2DACB] bg-[#FBF8F3]/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="py-4">
            <span className="font-editorial text-2xl sm:text-3xl font-semibold tracking-tight text-[#234533]">
              LinguaForge
            </span>
          </div>

          {/* 平级无编号三模块导航 */}
          <nav className="flex items-stretch">
            {[
              { id: 'grammar', label: '语法解析' },
              { id: 'translation', label: '句子翻译' },
              { id: 'ielts', label: '雅思备考' },
            ].map((tab) => {
              const isActive = activeModule === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveModule(tab.id as ActiveModule)}
                  className={`relative border-l last:border-r border-[#E8E1D3] px-5 sm:px-8 py-5 text-sm sm:text-base transition-colors ${
                    isActive
                      ? 'bg-[#F6F1E7] font-semibold text-[#2C2623]'
                      : 'text-[#6E6050] hover:bg-[#F7F3EB] hover:text-[#2C2623]'
                  }`}
                >
                  <span className="font-editorial tracking-wide">{tab.label}</span>
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#B07D4F]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* 右侧留白平衡与极简释疑入口 */}
          <div className="hidden sm:flex items-center justify-end w-28">
            <button
              onClick={() => setIsTutorOpen(true)}
              className="rounded-lg border border-[#D8CEBE] bg-[#F4EFE6] px-3 py-1.5 font-editorial text-xs font-medium text-[#5C5144] transition hover:border-[#B07D4F] hover:text-[#2C2623]"
            >
              学术释疑
            </button>
          </div>
        </div>
      </header>

      {/* 主体书页内容容器 */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
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

      {/* 极简书页页脚 */}
      <footer className="border-t border-[#E8E1D3] bg-[#FBF8F3] py-5 text-center font-editorial text-xs text-[#8A7B68]">
        <div className="mx-auto max-w-6xl px-6">
          <span>LinguaForge · 英语语法解析、文学名著译注与雅思学术备考</span>
        </div>
      </footer>

      {/* 隐藏式后台 AI 配置管理面板（仅管理员通过 ?admin=1、#admin 或 Ctrl/Cmd + Shift + A 呼出） */}
      <AiConfigModal
        isOpen={isAiModalOpen}
        onClose={() => {
          setIsAiModalOpen(false);
          if (window.location.hash === '#admin') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        config={aiConfig}
        storageBackend={storageBackend}
        onSaveConfig={handleSaveAiConfig}
      />

      {/* 学术释疑侧栏 */}
      <AiTutorDrawer
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        aiConfig={aiConfig}
        initialQuestion={tutorQuestion}
        contextInfo={tutorContext}
      />
    </div>
  );
};

export default App;
