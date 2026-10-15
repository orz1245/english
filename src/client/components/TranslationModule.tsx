import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookMarked,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Film,
  HelpCircle,
  History,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { TRANSLATION_ITEMS } from '../data/courseData';
import { fetchPracticeHistory, gradeTranslationWithAI, savePracticeRecord } from '../services/api';
import { AIConfig, PracticeRecord, TranslationDifficulty, TranslationFeedback, TranslationItem } from '../types';

interface TranslationModuleProps {
  aiConfig: AIConfig;
  completedIds: string[];
  onMarkCompleted: (id: string) => void;
  onAskTutor: (prefillQuestion: string, contextText: string) => void;
}

export const TranslationModule: React.FC<TranslationModuleProps> = ({
  aiConfig,
  completedIds,
  onMarkCompleted,
  onAskTutor,
}) => {
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | TranslationDifficulty>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'literature' | 'film'>('all');
  const [selectedId, setSelectedId] = useState<string>(TRANSLATION_ITEMS[0].id);
  const [userDraft, setUserDraft] = useState<string>('');
  const [showHints, setShowHints] = useState<boolean>(true);
  const [showReference, setShowReference] = useState<boolean>(false);
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<TranslationFeedback | null>(null);
  const [feedbackMode, setFeedbackMode] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<PracticeRecord[]>([]);

  const filteredItems = useMemo(() => {
    return TRANSLATION_ITEMS.filter((item) => {
      if (difficultyFilter !== 'all' && item.difficulty !== difficultyFilter) return false;
      if (sourceFilter !== 'all' && item.sourceType !== sourceFilter) return false;
      return true;
    });
  }, [difficultyFilter, sourceFilter]);

  const currentItem: TranslationItem = useMemo(() => {
    return filteredItems.find((i) => i.id === selectedId) || filteredItems[0] || TRANSLATION_ITEMS[0];
  }, [filteredItems, selectedId]);

  useEffect(() => {
    fetchPracticeHistory('translation').then(setHistoryList);
  }, []);

  const handleSelectItem = (item: TranslationItem) => {
    setSelectedId(item.id);
    setUserDraft('');
    setShowReference(false);
    setFeedback(null);
    setFeedbackMode(null);
    setGradeError(null);
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  };

  const handleSubmitTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDraft.trim()) return;
    setIsGrading(true);
    setGradeError(null);

    try {
      const res = await gradeTranslationWithAI(
        {
          chinese: currentItem.chinese,
          referenceEnglish: currentItem.referenceEnglish,
          userTranslation: userDraft.trim(),
          sourceTitle: currentItem.workTitle,
          sourceWork: `${currentItem.workTitleEn} (${currentItem.year}) - ${currentItem.creator}`,
        },
        aiConfig
      );

      setFeedback(res.data);
      setFeedbackMode(res.mode === 'live' ? `AI 深度精批 (${res.model})` : '本地启发式评分（配置 API Key 可解锁深度纠错）');
      setShowReference(true);
      onMarkCompleted(currentItem.id);

      const saved = await savePracticeRecord({
        module: 'translation',
        itemId: currentItem.id,
        title: `${currentItem.workTitle} · ${currentItem.difficultyLabel}`,
        userInput: userDraft.trim(),
        score: res.data.overallScore,
        feedback: res.data as unknown as Record<string, unknown>,
      });
      setHistoryList((prev) => [saved, ...prev.slice(0, 19)]);
    } catch (err) {
      setGradeError(err instanceof Error ? err.message : '翻译批改请求失败');
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部难度分级与体裁筛选栏 */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">难度分级：</span>
          {[
            { id: 'all', label: '全部难度' },
            { id: 'beginner', label: '初级 · 简单句与并列句' },
            { id: 'intermediate', label: '中级 · 复合从句与非谓语' },
            { id: 'advanced', label: '高级 · 文学修辞与长难句' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDifficultyFilter(tab.id as 'all' | TranslationDifficulty)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                difficultyFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">素材来源：</span>
          {[
            { id: 'all', label: '全部' },
            { id: 'literature', label: '文学名著' },
            { id: 'film', label: '经典影视' },
          ].map((src) => (
            <button
              key={src.id}
              onClick={() => setSourceFilter(src.id as 'all' | 'literature' | 'film')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                sourceFilter === src.id
                  ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>
      </div>

      {/* 主体左右布局 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 左侧：分级题库列表与历史练习记录 */}
        <div className="lg:col-span-4 space-y-5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-300">
                精选文学与影视原句 ({filteredItems.length})
              </h3>
              <span className="text-xs text-slate-500">已练 {completedIds.length} 句</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const isSelected = item.id === currentItem.id;
                const isDone = completedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left rounded-xl border p-3.5 transition ${
                      isSelected
                        ? 'border-indigo-500/80 bg-indigo-950/40 shadow-md'
                        : 'border-slate-800/90 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                        {item.sourceType === 'literature' ? (
                          <BookMarked className="h-3 w-3" />
                        ) : (
                          <Film className="h-3 w-3" />
                        )}
                        {item.workTitle}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.difficulty === 'beginner'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : item.difficulty === 'intermediate'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {item.difficulty === 'beginner'
                            ? '初级'
                            : item.difficulty === 'intermediate'
                            ? '中级'
                            : '高级'}
                        </span>
                        {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-200 line-clamp-2">{item.chinese}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {item.workTitleEn} ({item.year})
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 云端持久化历史批改记录 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <History className="h-3.5 w-3.5 text-indigo-400" />
              最近翻译批改记录（已同步云端）
            </h4>
            {historyList.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">暂无批改记录，完成右侧翻译提交后将自动持久化保存。</p>
            ) : (
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {historyList.slice(0, 8).map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-lg border border-slate-800/90 bg-slate-950/70 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200 truncate">{rec.title}</span>
                      {rec.score !== null && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-300">
                          {rec.score} 分
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-serif italic text-slate-400 line-clamp-1">“{rec.userInput}”</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：出处背景介绍 + 翻译训练与 AI 批改工作台 */}
        <div className="lg:col-span-8 space-y-6">
          {/* 作品出处与文化背景卡片 */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/25 via-slate-900/90 to-slate-900/90 p-6 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-0.5 text-xs font-semibold text-amber-200">
                    {currentItem.sourceType === 'literature' ? (
                      <>
                        <BookMarked className="h-3.5 w-3.5" /> 文学原著经典
                      </>
                    ) : (
                      <>
                        <Film className="h-3.5 w-3.5" /> 影视剧经典台词
                      </>
                    )}
                  </span>
                  <span className="text-xs font-medium text-indigo-300">{currentItem.difficultyLabel}</span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-white">
                  {currentItem.workTitle}{' '}
                  <span className="font-serif text-base font-normal italic text-slate-300">
                    {currentItem.workTitleEn} ({currentItem.year})
                  </span>
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  创作者：{currentItem.creator} · 场景/角色：{currentItem.characterOrScene}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
              <p className="text-xs leading-relaxed text-slate-300">
                <strong className="text-amber-300">【作品与出处背景】</strong>
                {currentItem.sourceIntro}
              </p>
            </div>

            {/* 待翻译中文原句 */}
            <div className="mt-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">请将以下句子译为英文：</span>
              <p className="mt-2 rounded-xl border border-slate-700/80 bg-slate-950 px-5 py-4 text-base sm:text-lg font-medium leading-relaxed text-white shadow-inner">
                “{currentItem.chinese}”
              </p>
            </div>

            {/* 句法提示与核心词汇胶囊 */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowHints((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {showHints ? '收起句法与词汇提示' : '展开句法与词汇提示'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowReference((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  {showReference ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showReference ? '隐藏原著参考译文' : '提前查看原著译文'}
                </button>
              </div>

              {showHints && (
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-indigo-300">核心句法结构要求：</span>
                    <p className="mt-0.5 text-xs text-slate-300">{currentItem.grammarFocus}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentItem.vocabHints.map((v, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs"
                      >
                        <span className="font-mono font-semibold text-emerald-300">{v.word}</span>
                        <span className="mx-1.5 text-slate-500">{v.pos}</span>
                        <span className="text-slate-300">{v.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 用户翻译输入与提交 */}
            <form onSubmit={handleSubmitTranslation} className="mt-5 space-y-3">
              <textarea
                rows={3}
                value={userDraft}
                onChange={(e) => setUserDraft(e.target.value)}
                placeholder="在此输入你的英文译文，尝试运用上方提示的句式与词汇结构..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 p-4 font-serif text-base text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onAskTutor(
                      `我正在翻译《${currentItem.workTitle}》中的句子：“${currentItem.chinese}”。我的草稿是：“${
                        userDraft || '（尚未动笔）'
                      }”。请帮我分析一下这句中译英应该如何确立主干句型？`,
                      `原著英文参考：${currentItem.referenceEnglish}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  请求 AI 助教提供翻译思路
                </button>

                <button
                  type="submit"
                  disabled={isGrading || !userDraft.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isGrading ? 'AI 正在对比原著批改...' : '提交译文并获取 AI 批改'}
                </button>
              </div>
              {gradeError && <p className="text-xs text-rose-400">{gradeError}</p>}
            </form>
          </div>

          {/* 原著/原片标准译文与文学赏析 */}
          {showReference && (
            <div className="animate-fade-in-up rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  原著 / 原片经典英文原句
                </span>
                <button
                  onClick={() => handleSpeak(currentItem.referenceEnglish)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
                >
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                  朗读原句
                </button>
              </div>
              <p className="mt-2 font-serif text-lg font-medium italic text-white">
                “{currentItem.referenceEnglish}”
              </p>
              {currentItem.alternativeEnglish && (
                <p className="mt-1.5 text-xs text-slate-400">
                  常见高分同义译法：<span className="font-serif italic text-slate-300">{currentItem.alternativeEnglish}</span>
                </p>
              )}
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs leading-relaxed text-slate-300">
                <strong className="text-emerald-300">【文学修辞与句法赏析】</strong>
                {currentItem.literaryNote}
              </div>
            </div>
          )}

          {/* AI 翻译批改报告 */}
          {feedback && (
            <div className="animate-fade-in-up rounded-2xl border border-indigo-500/40 bg-slate-900/95 p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-indigo-600/25 border border-indigo-400/50">
                    <span className="text-xl font-extrabold text-indigo-300">{feedback.overallScore}</span>
                    <span className="text-[10px] text-indigo-200">综合得分</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-400" />
                      AI 翻译批改与母语润色报告
                    </h3>
                    {feedbackMode && <p className="text-xs text-slate-400 mt-0.5">{feedbackMode}</p>}
                  </div>
                </div>

                {/* 三维指标评分条 */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: '语义准确度', val: feedback.dimensions.accuracy, color: 'text-emerald-300' },
                    { label: '语法规范度', val: feedback.dimensions.grammar, color: 'text-sky-300' },
                    { label: '地道文学感', val: feedback.dimensions.idiomaticity, color: 'text-amber-300' },
                  ].map((dim) => (
                    <div key={dim.label} className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-center">
                      <div className={`text-sm font-bold ${dim.color}`}>{dim.val} / 100</div>
                      <div className="text-[11px] text-slate-400">{dim.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-sm leading-relaxed text-slate-200">{feedback.commentary}</p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-4">
                  <h4 className="text-xs font-semibold text-emerald-300">译文亮点 (Strengths)</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                    {feedback.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-4">
                  <h4 className="text-xs font-semibold text-amber-300">进阶修改建议 (Improvements)</h4>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                    {feedback.improvements.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400">→</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4">
                <span className="text-xs font-semibold text-indigo-300">AI 升格润色参考版本：</span>
                <p className="mt-1.5 font-serif text-base italic text-white">“{feedback.polishedVersion}”</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
