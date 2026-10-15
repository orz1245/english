import React, { useEffect, useMemo, useState } from 'react';
import { BookMarked, Check, Eye, EyeOff, Film, Send, Sparkles, Volume2 } from 'lucide-react';
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
  const [showReference, setShowReference] = useState<boolean>(false);
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<TranslationFeedback | null>(null);
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
    setGradeError(null);
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-GB';
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
      setGradeError(err instanceof Error ? err.message : '译文评定未成功');
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="space-y-6 animate-soft-reveal">
      {/* 顶部：难度分级与素材体裁筛选 */}
      <div className="editorial-card rounded-xl p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium tracking-wider text-[#7A6B58] mr-1">
            难度分级 / Level
          </span>
          {[
            { id: 'all', label: '全部' },
            { id: 'beginner', label: '初级 · 基础句式' },
            { id: 'intermediate', label: '中级 · 复合从句' },
            { id: 'advanced', label: '高级 · 文学修辞' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDifficultyFilter(tab.id as 'all' | TranslationDifficulty)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                difficultyFilter === tab.id
                  ? 'border-[#B07D4F] bg-[#EFE6D5] font-semibold text-[#2C2623]'
                  : 'border-[#DFD7C8] bg-[#FBF8F3] text-[#5C5144] hover:border-[#C8B9A6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tracking-wider text-[#7A6B58]">体裁 / Source</span>
          {[
            { id: 'all', label: '全部' },
            { id: 'literature', label: '文学名著' },
            { id: 'film', label: '经典影视' },
          ].map((src) => (
            <button
              key={src.id}
              onClick={() => setSourceFilter(src.id as 'all' | 'literature' | 'film')}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                sourceFilter === src.id
                  ? 'border-[#2E5641] bg-[#E3ECE6] font-semibold text-[#234533]'
                  : 'border-[#DFD7C8] bg-[#FBF8F3] text-[#5C5144] hover:border-[#C8B9A6]'
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>
      </div>

      {/* 选句条目栏 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filteredItems.map((item) => {
          const isSelected = item.id === currentItem.id;
          const isDone = completedIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleSelectItem(item)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs transition ${
                isSelected
                  ? 'border-[#B07D4F] bg-[#EFE6D5] font-semibold text-[#2C2623] shadow-sm'
                  : 'border-[#DFD7C8] bg-[#F4EFE6] text-[#5C5144] hover:bg-[#EFE9DC]'
              }`}
            >
              {item.sourceType === 'literature' ? (
                <BookMarked className="h-3.5 w-3.5 text-[#8C5A2B]" />
              ) : (
                <Film className="h-3.5 w-3.5 text-[#4A6A70]" />
              )}
              <span>{item.workTitle}</span>
              <span className="text-[11px] text-[#8A7B68]">({item.year})</span>
              {isDone && <Check className="h-3 w-3 text-[#2E5641]" />}
            </button>
          );
        })}
      </div>

      {/* 双栏书页主体 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 左栏（5列）：文学译注 / Literary Notes（严格还原方向一设计图样式） */}
        <div className="lg:col-span-5 editorial-card rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="border-b border-[#E2DACB] pb-4">
              <div className="flex items-center justify-between">
                <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#2C2623]">
                  文学译注 <span className="font-normal text-[#6E6050]">/ Literary Notes</span>
                </h2>
                <span className="rounded border border-[#C9A67E] bg-[#EFE6D5] px-2 py-0.5 text-[11px] font-medium text-[#7A4E24]">
                  {currentItem.difficultyLabel}
                </span>
              </div>
              <p className="mt-1.5 font-editorial text-sm italic text-[#5C5144]">
                {currentItem.creator} · {currentItem.workTitleEn} {currentItem.workTitle} ({currentItem.year})
              </p>
            </div>

            {/* 待译原句 */}
            <div className="space-y-2 border-b border-[#E2DACB] pb-5">
              <p className="font-editorial text-lg sm:text-xl leading-relaxed text-[#2C2623]">
                {currentItem.chinese}
              </p>
              <p className="text-right font-editorial text-xs italic text-[#8A7B68]">
                —— {currentItem.characterOrScene}
              </p>
            </div>

            {/* 出处背景 */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold tracking-wider text-[#6E6050]">
                作品背景 / Context
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-[#4A4238]">
                {currentItem.sourceIntro}
              </p>
            </div>

            {/* 词汇美学 / Vocabulary Highlights 内框 */}
            <div className="editorial-inset-box rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#DFD7C8] pb-2.5">
                <h3 className="font-editorial text-base font-semibold text-[#2C2623]">
                  词汇美学 <span className="font-normal text-[#6E6050]">/ Vocabulary Highlights</span>
                </h3>
                <span className="text-xs text-[#B07D4F]">✦</span>
              </div>

              <div className="space-y-3">
                {currentItem.vocabHints.map((v, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
                    <span className="mt-1.5 inline-block h-2 w-2.5 shrink-0 rounded-sm bg-[#B07D4F]" />
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-editorial font-semibold text-base text-[#2C2623]">
                        {v.word}
                      </span>
                      <span className="text-[11px] italic text-[#8A7B68]">{v.pos}</span>
                      <span className="text-[#B8A994]">┈┈┈┈▸</span>
                      <span className="text-[#4A4238]">{v.meaning}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E2DACB] pt-3 text-xs text-[#5C5144]">
                <span className="font-semibold text-[#2C2623]">句法结构：</span>
                {currentItem.grammarFocus}
              </div>
            </div>
          </div>

          {/* 最近归档记录 */}
          {historyList.length > 0 && (
            <div className="border-t border-[#E2DACB] pt-4 space-y-2">
              <span className="text-xs font-semibold tracking-wider text-[#6E6050]">
                近期记录 / Recent Records
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {historyList.slice(0, 4).map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between rounded border border-[#E2DACB] bg-[#FBF8F3] px-3 py-1.5 text-xs"
                  >
                    <span className="font-editorial italic text-[#4A4238] truncate mr-2">
                      “{rec.userInput}”
                    </span>
                    {rec.score !== null && (
                      <span className="shrink-0 font-semibold text-[#2E5641]">{rec.score} 分</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右栏（7列）：译文练习与评定 / Translation Practice & Evaluation */}
        <div className="lg:col-span-7 editorial-card rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2DACB] pb-3">
              <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#2C2623]">
                译文练习 <span className="font-normal text-[#6E6050]">/ Translation Practice</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowReference((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-md border border-[#D8CEBE] bg-[#FBF8F3] px-2.5 py-1 text-xs text-[#5C5144] transition hover:border-[#B07D4F]"
              >
                {showReference ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{showReference ? '隐藏原著译文' : '对照原著译文'}</span>
              </button>
            </div>

            {/* 译文输入表单 */}
            <form onSubmit={handleSubmitTranslation} className="space-y-4">
              <div className="rounded-xl editorial-card-inner p-4">
                <textarea
                  rows={4}
                  value={userDraft}
                  onChange={(e) => setUserDraft(e.target.value)}
                  placeholder="在此撰写英文译文..."
                  className="w-full bg-transparent font-editorial text-lg text-[#2C2623] placeholder-[#A69988] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onAskTutor(
                      `请解析《${currentItem.workTitle}》原句“${currentItem.chinese}”的中译英句式构建思路。`,
                      `参考原句：${currentItem.referenceEnglish}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9A67E] bg-[#EFE6D5] px-3.5 py-2 text-xs font-medium text-[#6E4B28] transition hover:bg-[#E5D7C0]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>句法提示</span>
                </button>

                <button
                  type="submit"
                  disabled={isGrading || !userDraft.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2E5641] px-5 py-2 text-xs font-medium text-[#FBF8F3] shadow-sm transition hover:bg-[#234533] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isGrading ? '正在评定...' : '提交译文'}</span>
                </button>
              </div>
              {gradeError && <p className="text-xs text-[#9E473B]">{gradeError}</p>}
            </form>

            {/* 原著经典英文对照 */}
            {showReference && (
              <div className="animate-soft-reveal rounded-xl editorial-card-inner p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-2">
                  <span className="text-xs font-semibold tracking-wider text-[#2E5641]">
                    原著经典原文 / Original Text
                  </span>
                  <button
                    onClick={() => handleSpeak(currentItem.referenceEnglish)}
                    className="inline-flex items-center gap-1 text-xs text-[#5C5144] hover:text-[#2C2623]"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-[#B07D4F]" />
                    <span>朗读</span>
                  </button>
                </div>
                <p className="font-editorial text-xl italic text-[#2C2623] leading-relaxed">
                  “{currentItem.referenceEnglish}”
                </p>
                {currentItem.alternativeEnglish && (
                  <p className="text-xs text-[#6E6050]">
                    变体译法：<span className="font-editorial italic text-[#3D352E]">{currentItem.alternativeEnglish}</span>
                  </p>
                )}
                <p className="border-t border-[#E5DEC9] pt-2.5 text-xs leading-relaxed text-[#4A4238]">
                  <strong className="text-[#7A4E24]">修辞按语：</strong>
                  {currentItem.literaryNote}
                </p>
              </div>
            )}

            {/* 译文评定报告 */}
            {feedback && (
              <div className="animate-soft-reveal rounded-xl editorial-inset-box p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DFD7C8] pb-3">
                  <div>
                    <h3 className="font-editorial text-lg font-semibold text-[#2C2623]">
                      译文评定 <span className="font-normal text-[#6E6050]">/ Evaluation</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {[
                      { label: '语义准确', val: feedback.dimensions.accuracy },
                      { label: '语法规范', val: feedback.dimensions.grammar },
                      { label: '文学修辞', val: feedback.dimensions.idiomaticity },
                    ].map((dim) => (
                      <div
                        key={dim.label}
                        className="rounded border border-[#D8CEBE] bg-[#FBF8F3] px-2.5 py-1 text-center"
                      >
                        <div className="font-editorial text-sm font-bold text-[#2C2623]">{dim.val}</div>
                        <div className="text-[10px] text-[#6E6050]">{dim.label}</div>
                      </div>
                    ))}
                    <div className="rounded border border-[#8AB09B] bg-[#E3ECE6] px-3 py-1 text-center">
                      <div className="font-editorial text-base font-bold text-[#234533]">
                        {feedback.overallScore}
                      </div>
                      <div className="text-[10px] text-[#2E5641]">总评</div>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-[#3D352E]">{feedback.commentary}</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E2DACB] bg-[#FBF8F3] p-3.5 space-y-1.5">
                    <span className="text-xs font-semibold text-[#2E5641]">可取之处 / Strengths</span>
                    <ul className="space-y-1 text-xs text-[#4A4238]">
                      {feedback.strengths.map((s, idx) => (
                        <li key={idx}>• {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-[#E2DACB] bg-[#FBF8F3] p-3.5 space-y-1.5">
                    <span className="text-xs font-semibold text-[#8C5A2B]">修订建议 / Revisions</span>
                    <ul className="space-y-1 text-xs text-[#4A4238]">
                      {feedback.improvements.map((imp, idx) => (
                        <li key={idx}>• {imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-[#D8CEBE] bg-[#FBF8F3] p-3.5">
                  <span className="text-xs font-semibold text-[#6E6050]">润色参考 / Polished Version：</span>
                  <p className="mt-1 font-editorial text-base italic text-[#2C2623]">
                    “{feedback.polishedVersion}”
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
