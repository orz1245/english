import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  Mic,
  PenTool,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import {
  IELTS_LISTENING_ITEMS,
  IELTS_READING_ITEMS,
  IELTS_SPEAKING_TOPICS,
  IELTS_WRITING_PROMPTS,
} from '../data/courseData';
import { evaluateIeltsWithAI, savePracticeRecord } from '../services/api';
import { AIConfig, IeltsEvaluationResult } from '../types';

interface IeltsModuleProps {
  aiConfig: AIConfig;
  completedIds: string[];
  onMarkCompleted: (id: string) => void;
  onAskTutor: (prefillQuestion: string, contextText: string) => void;
}

type IeltsSkillTab = 'listening' | 'reading' | 'writing' | 'speaking';

export const IeltsModule: React.FC<IeltsModuleProps> = ({
  aiConfig,
  completedIds,
  onMarkCompleted,
  onAskTutor,
}) => {
  const [activeSkill, setActiveSkill] = useState<IeltsSkillTab>('listening');

  // ==================== 1. 听力状态 ====================
  const [selectedListenId, setSelectedListenId] = useState<string>(IELTS_LISTENING_ITEMS[0].id);
  const [listenAnswers, setListenAnswers] = useState<Record<number, string>>({});
  const [listenSubmitted, setListenSubmitted] = useState<boolean>(false);
  const [showAudioScript, setShowAudioScript] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<boolean>(false);

  // ==================== 2. 阅读状态 ====================
  const [selectedReadId, setSelectedReadId] = useState<string>(IELTS_READING_ITEMS[0].id);
  const [readingChoices, setReadingChoices] = useState<Record<string, 'TRUE' | 'FALSE' | 'NOT GIVEN'>>({});
  const [readingChecked, setReadingChecked] = useState<boolean>(false);

  // ==================== 3. 写作状态 ====================
  const [selectedWriteId, setSelectedWriteId] = useState<string>(IELTS_WRITING_PROMPTS[0].id);
  const [essayDraft, setEssayDraft] = useState<string>('');
  const [showModelEssay, setShowModelEssay] = useState<boolean>(false);
  const [writingEval, setWritingEval] = useState<IeltsEvaluationResult | null>(null);
  const [writingEvalMode, setWritingEvalMode] = useState<string | null>(null);
  const [isEvaluatingWriting, setIsEvaluatingWriting] = useState<boolean>(false);

  // ==================== 4. 口语状态 ====================
  const [selectedSpeakId, setSelectedSpeakId] = useState<string>(IELTS_SPEAKING_TOPICS[0].id);
  const [speakingDraft, setSpeakingDraft] = useState<string>('');
  const [speakingEval, setSpeakingEval] = useState<IeltsEvaluationResult | null>(null);
  const [speakingEvalMode, setSpeakingEvalMode] = useState<string | null>(null);
  const [isEvaluatingSpeaking, setIsEvaluatingSpeaking] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(120);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!timerRunning) return;
    const t = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [timerRunning]);

  const currentListen =
    IELTS_LISTENING_ITEMS.find((i) => i.id === selectedListenId) || IELTS_LISTENING_ITEMS[0];
  const currentRead =
    IELTS_READING_ITEMS.find((i) => i.id === selectedReadId) || IELTS_READING_ITEMS[0];
  const currentWrite =
    IELTS_WRITING_PROMPTS.find((i) => i.id === selectedWriteId) || IELTS_WRITING_PROMPTS[0];
  const currentSpeak =
    IELTS_SPEAKING_TOPICS.find((i) => i.id === selectedSpeakId) || IELTS_SPEAKING_TOPICS[0];

  const handlePlayListeningTTS = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(currentListen.audioScript);
    utter.lang = currentListen.accent.includes('US') ? 'en-US' : 'en-GB';
    utter.rate = speechRate;
    utter.onstart = () => setIsSpeakingAudio(true);
    utter.onend = () => setIsSpeakingAudio(false);
    utter.onerror = () => setIsSpeakingAudio(false);
    window.speechSynthesis.speak(utter);
  };

  const handleStopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingAudio(false);
  };

  const handleCheckListening = async () => {
    setListenSubmitted(true);
    setShowAudioScript(true);
    onMarkCompleted(currentListen.id);
    const correctCount = currentListen.blanks.filter(
      (b) => (listenAnswers[b.index] || '').trim().toLowerCase() === b.answer.toLowerCase()
    ).length;
    await savePracticeRecord({
      module: 'ielts_listening',
      itemId: currentListen.id,
      title: `雅思听力：${currentListen.title}`,
      userInput: JSON.stringify(listenAnswers),
      score: Math.round((correctCount / currentListen.blanks.length) * 100),
      feedback: { correctCount, total: currentListen.blanks.length },
    });
  };

  const handleCheckReading = async () => {
    setReadingChecked(true);
    onMarkCompleted(currentRead.id);
    const correctCount = currentRead.questions.filter(
      (q) => readingChoices[q.id] === q.answer
    ).length;
    await savePracticeRecord({
      module: 'ielts_reading',
      itemId: currentRead.id,
      title: `雅思阅读：${currentRead.title}`,
      userInput: JSON.stringify(readingChoices),
      score: Math.round((correctCount / currentRead.questions.length) * 100),
      feedback: { correctCount, total: currentRead.questions.length },
    });
  };

  const handleEvaluateWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayDraft.trim()) return;
    setIsEvaluatingWriting(true);
    try {
      const res = await evaluateIeltsWithAI(
        {
          skill: `IELTS Writing - ${currentWrite.taskType}`,
          promptTitle: currentWrite.title,
          promptQuestion: currentWrite.question,
          userResponse: essayDraft.trim(),
          referenceAnswer: currentWrite.band85Model,
        },
        aiConfig
      );
      setWritingEval(res.data);
      setWritingEvalMode(res.mode === 'live' ? `AI 考官精批 (${res.model})` : '本地启发式预估（配置 API Key 可解锁逐段改写）');
      onMarkCompleted(currentWrite.id);
      await savePracticeRecord({
        module: 'ielts_writing',
        itemId: currentWrite.id,
        title: `雅思写作：${currentWrite.title}`,
        userInput: essayDraft.trim(),
        score: res.data.overallBand,
        feedback: res.data as unknown as Record<string, unknown>,
      });
    } finally {
      setIsEvaluatingWriting(false);
    }
  };

  const handleEvaluateSpeaking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speakingDraft.trim()) return;
    setIsEvaluatingSpeaking(true);
    try {
      const res = await evaluateIeltsWithAI(
        {
          skill: `IELTS Speaking - ${currentSpeak.part}`,
          promptTitle: currentSpeak.topic,
          promptQuestion: currentSpeak.cueCardPrompt || currentSpeak.topic,
          userResponse: speakingDraft.trim(),
          referenceAnswer: currentSpeak.questions[0]?.sampleAnswer,
        },
        aiConfig
      );
      setSpeakingEval(res.data);
      setSpeakingEvalMode(res.mode === 'live' ? `AI 口语考官评分 (${res.model})` : '本地启发式预估（配置 API Key 可获取地道口语润色）');
      onMarkCompleted(currentSpeak.id);
      await savePracticeRecord({
        module: 'ielts_speaking',
        itemId: currentSpeak.id,
        title: `雅思口语：${currentSpeak.topic}`,
        userInput: speakingDraft.trim(),
        score: res.data.overallBand,
        feedback: res.data as unknown as Record<string, unknown>,
      });
    } finally {
      setIsEvaluatingSpeaking(false);
    }
  };

  const essayWordCount = essayDraft.trim() ? essayDraft.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* 顶部四科切换导航栏 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            id: 'listening',
            title: '雅思听力 Listening',
            sub: '场景精听 · 干扰项陷阱 · 同义替换',
            icon: Headphones,
            color: 'from-sky-600/25 to-slate-900 border-sky-500/40 text-sky-300',
          },
          {
            id: 'reading',
            title: '雅思阅读 Reading',
            sub: 'T/F/NG 逻辑 · 剑雅同义词网 · 长难句',
            icon: BookOpen,
            color: 'from-emerald-600/25 to-slate-900 border-emerald-500/40 text-emerald-300',
          },
          {
            id: 'writing',
            title: '雅思写作 Writing',
            sub: 'Task 1/2 范文升格 · 四维 Band 精批',
            icon: PenTool,
            color: 'from-indigo-600/25 to-slate-900 border-indigo-500/40 text-indigo-300',
          },
          {
            id: 'speaking',
            title: '雅思口语 Speaking',
            sub: 'Part 1-3 题库 · 计时模考 · 地道习语',
            icon: Mic,
            color: 'from-amber-600/25 to-slate-900 border-amber-500/40 text-amber-300',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSkill === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSkill(tab.id as IeltsSkillTab)}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                isActive
                  ? `bg-gradient-to-br ${tab.color} shadow-lg ring-1 ring-white/15`
                  : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5" />
                {isActive && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
                    当前科目
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="text-sm font-bold text-white">{tab.title}</div>
                <div className="mt-0.5 text-[11px] opacity-80">{tab.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* 科目 1：雅思听力 (Listening) */}
      {/* =================================================================== */}
      {activeSkill === 'listening' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              高频听力场景训练 ({IELTS_LISTENING_ITEMS.length})
            </h3>
            {IELTS_LISTENING_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedListenId(item.id);
                  setListenAnswers({});
                  setListenSubmitted(false);
                  setShowAudioScript(false);
                  handleStopTTS();
                }}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  item.id === currentListen.id
                    ? 'border-sky-500/80 bg-sky-950/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-300">{item.section}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                    {item.accent}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-bold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.scenario}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-sky-400">
                    {currentListen.section} · {currentListen.accent}
                  </span>
                  <h2 className="mt-1 text-lg font-bold text-white">{currentListen.title}</h2>
                  <p className="mt-1 text-xs text-slate-400">{currentListen.scenario}</p>
                </div>

                {/* TTS 语音播控面板 */}
                <div className="flex items-center gap-2">
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(Number(e.target.value))}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value={0.85}>0.85x 慢速精听</option>
                    <option value={0.95}>1.0x 标准考场语速</option>
                    <option value={1.15}>1.15x 进阶倍速</option>
                  </select>

                  {!isSpeakingAudio ? (
                    <button
                      onClick={handlePlayListeningTTS}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                    >
                      <Play className="h-3.5 w-3.5" />
                      播放听力音频
                    </button>
                  ) : (
                    <button
                      onClick={handleStopTTS}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                    >
                      <Square className="h-3.5 w-3.5" />
                      停止播放
                    </button>
                  )}
                </div>
              </div>

              {/* 笔记填空题干 */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Complete the notes below (Write ONE WORD AND/OR A NUMBER for each answer):
                  </span>
                  <button
                    onClick={() => setShowAudioScript((prev) => !prev)}
                    className="text-xs text-sky-400 hover:underline"
                  >
                    {showAudioScript ? '隐藏听力原文' : '查看听力原文 Script'}
                  </button>
                </div>

                <div className="space-y-3 text-sm text-slate-200">
                  {currentListen.blanks.map((blank) => {
                    const userVal = listenAnswers[blank.index] || '';
                    const isCorrect =
                      listenSubmitted && userVal.trim().toLowerCase() === blank.answer.toLowerCase();
                    return (
                      <div
                        key={blank.index}
                        className="rounded-xl border border-slate-800/90 bg-slate-900/70 p-3.5 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-300">
                            Question #{blank.index + 1}
                          </span>
                          {listenSubmitted && (
                            <span
                              className={`text-xs font-bold ${
                                isCorrect ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isCorrect ? '✓ 回答正确' : `✗ 标准答案：${blank.answer}`}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={userVal}
                          onChange={(e) =>
                            setListenAnswers((prev) => ({ ...prev, [blank.index]: e.target.value }))
                          }
                          placeholder={`填入第 ${blank.index + 1} 空答案...`}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
                        />
                        {listenSubmitted && (
                          <div className="rounded-lg bg-slate-950/80 p-2.5 text-xs space-y-1">
                            <p className="text-sky-300">
                              <strong>原文定位：</strong>“{blank.synonymCue}”
                            </p>
                            <p className="text-amber-300">
                              <strong>干扰项与陷阱解析：</strong>{blank.distractorTrap}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleCheckListening}
                    className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                  >
                    核对答案并查看干扰项解析
                  </button>
                </div>
              </div>

              {showAudioScript && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4">
                  <span className="text-xs font-semibold text-sky-300">听力录音原文 (Transcript)：</span>
                  <p className="mt-1.5 font-serif text-sm leading-relaxed text-slate-200">
                    {currentListen.audioScript}
                  </p>
                </div>
              )}

              {/* 场景核心词汇表 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {currentListen.coreVocab.map((v, i) => (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="font-mono text-sm font-bold text-sky-300">{v.word}</div>
                    <div className="text-[11px] text-slate-500">{v.phonetic}</div>
                    <div className="mt-1 text-xs text-slate-300">{v.meaning}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 科目 2：雅思阅读 (Reading) */}
      {/* =================================================================== */}
      {activeSkill === 'reading' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-xl space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {currentRead.topic}
              </span>
              <h2 className="mt-1 text-xl font-bold text-white">{currentRead.title}</h2>
            </div>

            {/* 阅读学术篇章原文 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <span className="text-xs font-semibold text-slate-400">Academic Reading Passage Excerpt:</span>
              <p className="mt-2 font-serif text-base leading-relaxed text-slate-100">
                {currentRead.passageExcerpt}
              </p>
            </div>

            {/* 剑雅核心同义替换对照表 + 长难句精析 */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  剑雅核心同义替换矩阵 (Paraphrase Matrix)
                </h3>
                <div className="space-y-2.5">
                  {currentRead.paraphrasePairs.map((pair, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif font-semibold text-emerald-300">{pair.passageExpr}</span>
                        <span className="text-slate-500">⇔</span>
                        <span className="font-serif text-amber-300">{pair.questionExpr}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{pair.type}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    篇章核心长难句拆解
                  </h3>
                  <button
                    onClick={() =>
                      onAskTutor(
                        `请进一步讲解雅思阅读长难句：“${currentRead.longSentenceAnalysis.sentence}”中的分词结构与主从逻辑。`,
                        currentRead.passageExcerpt
                      )
                    }
                    className="text-xs text-indigo-300 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="h-3 w-3" /> AI 深度追问
                  </button>
                </div>
                <p className="font-serif text-xs italic text-white">
                  “{currentRead.longSentenceAnalysis.sentence}”
                </p>
                <p className="text-xs text-slate-300">{currentRead.longSentenceAnalysis.translation}</p>
                <p className="text-xs text-indigo-200/90 leading-relaxed">
                  {currentRead.longSentenceAnalysis.breakdown}
                </p>
              </div>
            </div>

            {/* TRUE / FALSE / NOT GIVEN 逻辑辨析训练 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  TRUE / FALSE / NOT GIVEN 考官逻辑精练
                </h3>
                <button
                  onClick={handleCheckReading}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  提交并查看逻辑判定解析
                </button>
              </div>

              <div className="space-y-3">
                {currentRead.questions.map((q, i) => {
                  const chosen = readingChoices[q.id];
                  const isCorrect = readingChecked && chosen === q.answer;
                  return (
                    <div key={q.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                      <p className="text-sm text-slate-100">
                        <span className="font-bold text-emerald-400 mr-2">{i + 1}.</span>
                        {q.statement}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {(['TRUE', 'FALSE', 'NOT GIVEN'] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setReadingChoices((prev) => ({ ...prev, [q.id]: opt }))}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                              chosen === opt
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}

                        {readingChecked && (
                          <span
                            className={`ml-auto text-xs font-bold ${
                              isCorrect ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isCorrect ? `✓ 正确 (${q.answer})` : `✗ 正确答案：${q.answer}`}
                          </span>
                        )}
                      </div>
                      {readingChecked && (
                        <p className="rounded-lg bg-slate-950 p-3 text-xs leading-relaxed text-slate-300">
                          <strong className="text-emerald-300">【判定依据】</strong>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 科目 3：雅思写作 (Writing) */}
      {/* =================================================================== */}
      {activeSkill === 'writing' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              大小作文精选命题 ({IELTS_WRITING_PROMPTS.length})
            </h3>
            {IELTS_WRITING_PROMPTS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedWriteId(item.id);
                  setEssayDraft('');
                  setWritingEval(null);
                  setShowModelEssay(false);
                }}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  item.id === currentWrite.id
                    ? 'border-indigo-500/80 bg-indigo-950/40'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                  {item.taskType}
                </span>
                <p className="mt-2 text-sm font-bold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.question}</p>
              </button>
            ))}

            {/* Band 6 vs Band 8.5 语料升格对比卡片 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Band 6.0 → Band 8.5 句式与词汇升格对照
              </h4>
              {currentWrite.upgradeHighlights.map((up, idx) => (
                <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1.5">
                  <div className="text-rose-300 line-through opacity-80">Band 6: {up.band6}</div>
                  <div className="font-serif font-semibold text-emerald-300">Band 8.5: {up.band85}</div>
                  <p className="text-[11px] text-slate-400">{up.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-xl space-y-5">
              <div>
                <span className="text-xs font-semibold text-indigo-400">
                  {currentWrite.taskType} · {currentWrite.topicCategory}
                </span>
                <h2 className="mt-1 text-lg font-bold text-white">{currentWrite.title}</h2>
                <p className="mt-3 rounded-xl border border-slate-700/80 bg-slate-950 p-4 font-serif text-sm leading-relaxed text-slate-100">
                  {currentWrite.question}
                </p>
              </div>

              {/* 审题与段落结构大纲 */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300">高分四段式审题逻辑框架：</span>
                  <button
                    onClick={() => setShowModelEssay((prev) => !prev)}
                    className="text-xs font-medium text-emerald-400 hover:underline"
                  >
                    {showModelEssay ? '收起 Band 8.5 考官范文' : '查看 Band 8.5 考官范文'}
                  </button>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {currentWrite.outlineSteps.map((st, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">{idx + 1}.</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {showModelEssay && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-2">
                  <span className="text-xs font-bold text-emerald-300">Band 8.5 考官级完整范文示范：</span>
                  <div className="whitespace-pre-line font-serif text-sm leading-relaxed text-slate-100">
                    {currentWrite.band85Model}
                  </div>
                </div>
              )}

              {/* 写作提交与 AI 四维批改 */}
              <form onSubmit={handleEvaluateWriting} className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>在此撰写你的作文段落或全文：</span>
                  <span>当前词数：{essayWordCount} words</span>
                </div>
                <textarea
                  rows={6}
                  value={essayDraft}
                  onChange={(e) => setEssayDraft(e.target.value)}
                  placeholder="输入你的雅思写作正文（引言段、主体段或全文），提交后由 AI 按照 TR / CC / LR / GRA 官方四项标准评分..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-serif text-sm leading-relaxed text-slate-100 focus:border-indigo-400 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isEvaluatingWriting || !essayDraft.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isEvaluatingWriting ? 'AI 考官正在执行四维批改...' : '提交作文获取官方四维 Band 精批'}
                  </button>
                </div>
              </form>

              {writingEval && (
                <div className="animate-fade-in-up rounded-2xl border border-indigo-500/40 bg-slate-950/90 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-indigo-600/25 border border-indigo-400/50">
                        <span className="text-xl font-extrabold text-indigo-300">{writingEval.overallBand}</span>
                        <span className="text-[10px] text-indigo-200">Overall</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">IELTS Writing 四维诊断报告</h4>
                        {writingEvalMode && <p className="text-xs text-slate-400">{writingEvalMode}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { k: 'TR/TA', v: writingEval.criteria.taskResponse },
                        { k: 'CC', v: writingEval.criteria.coherence },
                        { k: 'LR', v: writingEval.criteria.lexical },
                        { k: 'GRA', v: writingEval.criteria.grammar },
                      ].map((c) => (
                        <div key={c.k} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5">
                          <div className="text-xs font-bold text-emerald-300">{c.v}</div>
                          <div className="text-[10px] text-slate-400">{c.k}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-200">{writingEval.summary}</p>

                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
                    <span className="text-xs font-semibold text-indigo-300">Band 8.0+ 定制升格范文：</span>
                    <p className="mt-1.5 whitespace-pre-line font-serif text-sm text-white">
                      {writingEval.upgradedVersion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 科目 4：雅思口语 (Speaking) */}
      {/* =================================================================== */}
      {activeSkill === 'speaking' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-semibold text-amber-300">
                  {currentSpeak.part}
                </span>
                {/* 2 分钟口语模考计时器 */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-amber-300 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => setTimerRunning((prev) => !prev)}
                    className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-500"
                  >
                    {timerRunning ? '暂停' : '开始计时'}
                  </button>
                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSeconds(120);
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800 p-1 text-slate-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h2 className="text-lg font-bold text-white">{currentSpeak.topic}</h2>
              {currentSpeak.cueCardPrompt && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-200">{currentSpeak.cueCardPrompt}</p>
                  <p className="text-xs text-slate-400">You should say:</p>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {currentSpeak.bulletPoints?.map((bp, i) => (
                      <li key={i}>• {bp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 口语自测与 AI 润色 */}
              <form onSubmit={handleEvaluateSpeaking} className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-300">
                  输入你的口语回答逐字稿（获取 FC / LR / GRA 四维评估与母语习语升级）：
                </label>
                <textarea
                  rows={4}
                  value={speakingDraft}
                  onChange={(e) => setSpeakingDraft(e.target.value)}
                  placeholder="Write or transcribe your spoken answer here..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isEvaluatingSpeaking || !speakingDraft.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isEvaluatingSpeaking ? '正在评估口语流利度与地道表达...' : '提交口语回答并获取 Band 8+ 润色'}
                </button>
              </form>

              {speakingEval && (
                <div className="rounded-xl border border-amber-500/40 bg-slate-950 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">预估口语得分：Band {speakingEval.overallBand}</span>
                    {speakingEvalMode && <span className="text-slate-400">{speakingEvalMode}</span>}
                  </div>
                  <p className="text-slate-300">{speakingEval.summary}</p>
                  <div className="rounded-lg bg-slate-900 p-3 font-serif italic text-emerald-300">
                    “{speakingEval.upgradedVersion}”
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {currentSpeak.questions.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5 space-y-3">
                <h3 className="text-sm font-bold text-white">{item.q}</h3>
                <p className="text-xs text-amber-300/90">
                  <strong>答题策略：</strong>
                  {item.strategy}
                </p>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-serif text-sm leading-relaxed text-slate-100">
                  “{item.sampleAnswer}”
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.idioms.map((idItem, k) => (
                    <span
                      key={k}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200"
                    >
                      <strong>{idItem.phrase}</strong>：{idItem.meaning}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
