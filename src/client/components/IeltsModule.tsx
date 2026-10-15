import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, Headphones, Mic, PenTool, Play, RotateCcw, Sparkles, Square } from 'lucide-react';
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
  onMarkCompleted,
  onAskTutor,
}) => {
  const [activeSkill, setActiveSkill] = useState<IeltsSkillTab>('listening');

  // 听力状态
  const [selectedListenId, setSelectedListenId] = useState<string>(IELTS_LISTENING_ITEMS[0].id);
  const [listenAnswers, setListenAnswers] = useState<Record<number, string>>({});
  const [listenSubmitted, setListenSubmitted] = useState<boolean>(false);
  const [showAudioScript, setShowAudioScript] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<boolean>(false);

  // 阅读状态
  const [selectedReadId] = useState<string>(IELTS_READING_ITEMS[0].id);
  const [readingChoices, setReadingChoices] = useState<Record<string, 'TRUE' | 'FALSE' | 'NOT GIVEN'>>({});
  const [readingChecked, setReadingChecked] = useState<boolean>(false);

  // 写作状态
  const [selectedWriteId, setSelectedWriteId] = useState<string>(IELTS_WRITING_PROMPTS[0].id);
  const [essayDraft, setEssayDraft] = useState<string>('');
  const [showModelEssay, setShowModelEssay] = useState<boolean>(false);
  const [writingEval, setWritingEval] = useState<IeltsEvaluationResult | null>(null);
  const [isEvaluatingWriting, setIsEvaluatingWriting] = useState<boolean>(false);

  // 口语状态
  const [selectedSpeakId] = useState<string>(IELTS_SPEAKING_TOPICS[0].id);
  const [speakingDraft, setSpeakingDraft] = useState<string>('');
  const [speakingEval, setSpeakingEval] = useState<IeltsEvaluationResult | null>(null);
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
      title: currentListen.title,
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
      title: currentRead.title,
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
      onMarkCompleted(currentWrite.id);
      await savePracticeRecord({
        module: 'ielts_writing',
        itemId: currentWrite.id,
        title: currentWrite.title,
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
      onMarkCompleted(currentSpeak.id);
      await savePracticeRecord({
        module: 'ielts_speaking',
        itemId: currentSpeak.id,
        title: currentSpeak.topic,
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
    <div className="space-y-6 animate-soft-reveal">
      {/* 四科平级切换栏 */}
      <div className="editorial-card rounded-xl p-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { id: 'listening', title: '听力 · Listening', sub: '场景精听与干扰项辨析', icon: Headphones },
          { id: 'reading', title: '阅读 · Reading', sub: '同义替换与逻辑判断', icon: BookOpen },
          { id: 'writing', title: '写作 · Writing', sub: '语料升格与四维评定', icon: PenTool },
          { id: 'speaking', title: '口语 · Speaking', sub: '话题陈述与高阶习语', icon: Mic },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSkill === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSkill(tab.id as IeltsSkillTab)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-[#B07D4F] bg-[#EFE6D5] text-[#2C2623] shadow-sm'
                  : 'border-transparent bg-[#FBF8F3] text-[#5C5144] hover:border-[#DFD7C8]'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#8C5A2B]' : 'text-[#8A7B68]'}`} />
              <div>
                <div className="font-editorial text-sm font-semibold">{tab.title}</div>
                <div className="text-[11px] text-[#7A6B58]">{tab.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 1. 听力模块 */}
      {activeSkill === 'listening' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 editorial-card rounded-xl p-6 sm:p-7 space-y-5">
            <div className="border-b border-[#E2DACB] pb-3">
              <h2 className="font-editorial text-xl font-semibold text-[#2C2623]">
                听力选段 <span className="font-normal text-[#6E6050]">/ Listening Passages</span>
              </h2>
            </div>

            <div className="space-y-2.5">
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
                  className={`w-full text-left rounded-lg border p-3.5 transition ${
                    item.id === currentListen.id
                      ? 'border-[#B07D4F] bg-[#EFE6D5]'
                      : 'border-[#E2DACB] bg-[#FBF8F3] hover:border-[#C8B9A6]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#7A4E24]">
                    <span className="font-medium">{item.section}</span>
                    <span>{item.accent}</span>
                  </div>
                  <p className="mt-1 font-editorial text-base font-semibold text-[#2C2623]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs text-[#5C5144]">{item.scenario}</p>
                </button>
              ))}
            </div>

            {/* 核心词汇内框 */}
            <div className="editorial-inset-box rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#DFD7C8] pb-2">
                <h3 className="font-editorial text-sm font-semibold text-[#2C2623]">
                  场景词汇 <span className="font-normal text-[#6E6050]">/ Key Vocabulary</span>
                </h3>
                <span className="text-xs text-[#B07D4F]">✦</span>
              </div>
              <div className="space-y-2.5">
                {currentListen.coreVocab.map((v, i) => (
                  <div key={i} className="text-xs flex flex-wrap items-baseline gap-2">
                    <span className="inline-block h-1.5 w-2 rounded-sm bg-[#B07D4F]" />
                    <span className="font-editorial font-semibold text-sm text-[#2C2623]">{v.word}</span>
                    <span className="text-[#8A7B68]">{v.phonetic}</span>
                    <span className="text-[#4A4238]">{v.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 editorial-card rounded-xl p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DACB] pb-4">
              <div>
                <span className="text-xs text-[#7A6B58]">{currentListen.section}</span>
                <h3 className="font-editorial text-xl font-semibold text-[#2C2623]">
                  {currentListen.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="rounded-lg border border-[#D8CEBE] bg-[#FBF8F3] px-2.5 py-1.5 text-xs text-[#2C2623]"
                >
                  <option value={0.85}>0.85x 慢速</option>
                  <option value={0.95}>1.0x 常速</option>
                  <option value={1.15}>1.15x 倍速</option>
                </select>

                {!isSpeakingAudio ? (
                  <button
                    onClick={handlePlayListeningTTS}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E5641] px-3.5 py-1.5 text-xs font-medium text-[#FBF8F3] hover:bg-[#234533]"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>朗读录音</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopTTS}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#9E473B] px-3.5 py-1.5 text-xs font-medium text-[#FBF8F3]"
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span>停止</span>
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl editorial-card-inner p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#6E6050]">
                  笔记填空（每空限填一词或数字）：
                </span>
                <button
                  onClick={() => setShowAudioScript((prev) => !prev)}
                  className="text-xs text-[#8C5A2B] hover:underline"
                >
                  {showAudioScript ? '隐藏录音文本' : '对照录音文本'}
                </button>
              </div>

              <div className="space-y-3">
                {currentListen.blanks.map((blank) => {
                  const userVal = listenAnswers[blank.index] || '';
                  const isCorrect =
                    listenSubmitted && userVal.trim().toLowerCase() === blank.answer.toLowerCase();
                  return (
                    <div
                      key={blank.index}
                      className="rounded-lg border border-[#E2DACB] bg-[#F4EFE6] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#5C5144]">第 {blank.index + 1} 题</span>
                        {listenSubmitted && (
                          <span className={isCorrect ? 'font-semibold text-[#2E5641]' : 'font-semibold text-[#9E473B]'}>
                            {isCorrect ? '回答正确' : `参考答案：${blank.answer}`}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={userVal}
                        onChange={(e) =>
                          setListenAnswers((prev) => ({ ...prev, [blank.index]: e.target.value }))
                        }
                        placeholder="在此填写答案..."
                        className="w-full rounded border border-[#D8CEBE] bg-[#FBF8F3] px-3 py-1.5 text-sm text-[#2C2623] focus:border-[#B07D4F] focus:outline-none"
                      />
                      {listenSubmitted && (
                        <div className="text-xs space-y-1 text-[#4A4238] pt-1">
                          <p>
                            <strong className="text-[#2E5641]">原文定位：</strong>“{blank.synonymCue}”
                          </p>
                          <p>
                            <strong className="text-[#8C5A2B]">干扰项辨析：</strong>{blank.distractorTrap}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCheckListening}
                  className="rounded-lg bg-[#2E5641] px-4 py-1.5 text-xs font-medium text-[#FBF8F3] hover:bg-[#234533]"
                >
                  核对答案
                </button>
              </div>
            </div>

            {showAudioScript && (
              <div className="rounded-xl editorial-inset-box p-4 space-y-1.5">
                <span className="text-xs font-semibold text-[#6E6050]">录音原文 / Audio Transcript</span>
                <p className="font-editorial text-base leading-relaxed text-[#2C2623]">
                  {currentListen.audioScript}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 阅读模块 */}
      {activeSkill === 'reading' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 editorial-card rounded-xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#E2DACB] pb-3">
              <span className="text-xs text-[#7A6B58]">{currentRead.topic}</span>
              <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#2C2623]">
                {currentRead.title}
              </h2>
            </div>

            <div className="rounded-xl editorial-card-inner p-5">
              <p className="font-editorial text-lg leading-relaxed text-[#2C2623]">
                {currentRead.passageExcerpt}
              </p>
            </div>

            {/* TRUE / FALSE / NOT GIVEN 题目 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2DACB] pb-2">
                <h3 className="font-editorial text-lg font-semibold text-[#2C2623]">
                  逻辑判断 <span className="font-normal text-[#6E6050]">/ True · False · Not Given</span>
                </h3>
                <button
                  onClick={handleCheckReading}
                  className="rounded-lg bg-[#2E5641] px-4 py-1.5 text-xs font-medium text-[#FBF8F3] hover:bg-[#234533]"
                >
                  核对判定
                </button>
              </div>

              {currentRead.questions.map((q, i) => {
                const chosen = readingChoices[q.id];
                const isCorrect = readingChecked && chosen === q.answer;
                return (
                  <div
                    key={q.id}
                    className="rounded-xl editorial-card-inner p-4 space-y-3"
                  >
                    <p className="font-editorial text-base text-[#2C2623]">
                      <span className="font-semibold text-[#8C5A2B] mr-2">{i + 1}.</span>
                      {q.statement}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {(['TRUE', 'FALSE', 'NOT GIVEN'] as const).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setReadingChoices((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`rounded border px-3 py-1 text-xs font-medium transition ${
                            chosen === opt
                              ? 'border-[#2E5641] bg-[#2E5641] text-[#FBF8F3]'
                              : 'border-[#D8CEBE] bg-[#F4EFE6] text-[#5C5144] hover:border-[#B07D4F]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {readingChecked && (
                        <span
                          className={`ml-auto text-xs font-semibold ${
                            isCorrect ? 'text-[#2E5641]' : 'text-[#9E473B]'
                          }`}
                        >
                          {isCorrect ? `正确 (${q.answer})` : `标准判定：${q.answer}`}
                        </span>
                      )}
                    </div>
                    {readingChecked && (
                      <p className="border-t border-[#E5DEC9] pt-2 text-xs text-[#4A4238]">
                        <strong className="text-[#7A4E24]">依据：</strong>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 editorial-card rounded-xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#E2DACB] pb-3">
              <h3 className="font-editorial text-xl font-semibold text-[#2C2623]">
                同义替换与长难句 <span className="font-normal text-[#6E6050]">/ Paraphrase & Syntax</span>
              </h3>
            </div>

            <div className="editorial-inset-box rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#DFD7C8] pb-2">
                <span className="font-editorial text-base font-semibold text-[#2C2623]">
                  同义替换对照
                </span>
                <span className="text-xs text-[#B07D4F]">✦</span>
              </div>
              <div className="space-y-3">
                {currentRead.paraphrasePairs.map((pair, idx) => (
                  <div key={idx} className="text-xs space-y-1 border-b border-[#E5DEC9] pb-2.5 last:border-none">
                    <div className="font-editorial text-sm font-semibold text-[#2C2623]">
                      {pair.passageExpr}
                    </div>
                    <div className="text-[#8C5A2B]">┈┈┈┈▸ {pair.questionExpr}</div>
                    <div className="text-[11px] text-[#7A6B58]">{pair.type}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl editorial-card-inner p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6E6050]">长难句结构剖析</span>
                <button
                  onClick={() =>
                    onAskTutor(
                      `请解析阅读长难句：“${currentRead.longSentenceAnalysis.sentence}”的句法层次。`,
                      currentRead.passageExcerpt
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs text-[#8C5A2B] hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>句法追问</span>
                </button>
              </div>
              <p className="font-editorial text-base italic text-[#2C2623]">
                “{currentRead.longSentenceAnalysis.sentence}”
              </p>
              <p className="text-xs text-[#3D352E] leading-relaxed">
                {currentRead.longSentenceAnalysis.translation}
              </p>
              <p className="border-t border-[#E5DEC9] pt-2 text-xs text-[#5C5144] leading-relaxed">
                {currentRead.longSentenceAnalysis.breakdown}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. 写作模块 */}
      {activeSkill === 'writing' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 editorial-card rounded-xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2">
              {IELTS_WRITING_PROMPTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedWriteId(item.id);
                    setEssayDraft('');
                    setWritingEval(null);
                    setShowModelEssay(false);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                    item.id === currentWrite.id
                      ? 'border-[#B07D4F] bg-[#EFE6D5] font-semibold text-[#2C2623]'
                      : 'border-[#DFD7C8] bg-[#FBF8F3] text-[#5C5144]'
                  }`}
                >
                  {item.taskType}
                </button>
              ))}
            </div>

            <div className="border-b border-[#E2DACB] pb-4">
              <h2 className="font-editorial text-xl font-semibold text-[#2C2623]">
                {currentWrite.title}
              </h2>
              <p className="mt-2 font-editorial text-base leading-relaxed text-[#3D352E]">
                {currentWrite.question}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#6E6050]">论证结构要旨 / Outline</span>
              <ul className="space-y-1.5 text-xs text-[#4A4238] leading-relaxed">
                {currentWrite.outlineSteps.map((st, idx) => (
                  <li key={idx}>• {st}</li>
                ))}
              </ul>
            </div>

            <div className="editorial-inset-box rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#DFD7C8] pb-2">
                <h3 className="font-editorial text-sm font-semibold text-[#2C2623]">
                  语料升格对照 <span className="font-normal text-[#6E6050]">/ Band 6.0 → 8.5</span>
                </h3>
                <span className="text-xs text-[#B07D4F]">✦</span>
              </div>
              {currentWrite.upgradeHighlights.map((up, idx) => (
                <div key={idx} className="text-xs space-y-1 border-b border-[#E5DEC9] pb-2.5 last:border-none">
                  <div className="text-[#8A7B68] line-through">{up.band6}</div>
                  <div className="font-editorial font-semibold text-sm text-[#2E5641]">
                    {up.band85}
                  </div>
                  <div className="text-[11px] text-[#5C5144]">{up.reason}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 editorial-card rounded-xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2DACB] pb-3">
              <h3 className="font-editorial text-xl font-semibold text-[#2C2623]">
                写作练习与四维评定 <span className="font-normal text-[#6E6050]">/ Essay Practice</span>
              </h3>
              <button
                onClick={() => setShowModelEssay((prev) => !prev)}
                className="text-xs text-[#8C5A2B] hover:underline"
              >
                {showModelEssay ? '隐藏范文' : '对照 Band 8.5 范文'}
              </button>
            </div>

            {showModelEssay && (
              <div className="rounded-xl editorial-card-inner p-5 space-y-2">
                <span className="text-xs font-semibold text-[#2E5641]">Band 8.5 参考范文</span>
                <div className="whitespace-pre-line font-editorial text-base leading-relaxed text-[#2C2623]">
                  {currentWrite.band85Model}
                </div>
              </div>
            )}

            <form onSubmit={handleEvaluateWriting} className="space-y-3">
              <div className="flex justify-between text-xs text-[#7A6B58]">
                <span>撰写段落或全文</span>
                <span>词数：{essayWordCount} words</span>
              </div>
              <div className="rounded-xl editorial-card-inner p-4">
                <textarea
                  rows={7}
                  value={essayDraft}
                  onChange={(e) => setEssayDraft(e.target.value)}
                  placeholder="在此撰写英文议论文或图表分析..."
                  className="w-full bg-transparent font-editorial text-base leading-relaxed text-[#2C2623] placeholder-[#A69988] focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isEvaluatingWriting || !essayDraft.trim()}
                  className="rounded-lg bg-[#2E5641] px-5 py-2 text-xs font-medium text-[#FBF8F3] hover:bg-[#234533] disabled:opacity-50"
                >
                  {isEvaluatingWriting ? '正在评定...' : '提交四维评定'}
                </button>
              </div>
            </form>

            {writingEval && (
              <div className="rounded-xl editorial-inset-box p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFD7C8] pb-3">
                  <span className="font-editorial text-lg font-semibold text-[#2C2623]">
                    四维评定结果 · Overall Band {writingEval.overallBand}
                  </span>
                  <div className="flex gap-2">
                    {[
                      { k: 'TR/TA', v: writingEval.criteria.taskResponse },
                      { k: 'CC', v: writingEval.criteria.coherence },
                      { k: 'LR', v: writingEval.criteria.lexical },
                      { k: 'GRA', v: writingEval.criteria.grammar },
                    ].map((c) => (
                      <span
                        key={c.k}
                        className="rounded border border-[#D8CEBE] bg-[#FBF8F3] px-2.5 py-1 text-xs font-medium text-[#2C2623]"
                      >
                        {c.k}: {c.v}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#3D352E] leading-relaxed">{writingEval.summary}</p>
                <div className="rounded-lg border border-[#E2DACB] bg-[#FBF8F3] p-4">
                  <span className="text-xs font-semibold text-[#6E6050]">升格范式：</span>
                  <p className="mt-1 whitespace-pre-line font-editorial text-base text-[#2C2623]">
                    {writingEval.upgradedVersion}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. 口语模块 */}
      {activeSkill === 'speaking' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 editorial-card rounded-xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2DACB] pb-3">
              <span className="text-xs font-semibold text-[#7A4E24]">{currentSpeak.part}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#2C2623] flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#8C5A2B]" />
                  {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
                </span>
                <button
                  onClick={() => setTimerRunning((prev) => !prev)}
                  className="rounded border border-[#C9A67E] bg-[#EFE6D5] px-2.5 py-0.5 text-xs text-[#6E4B28]"
                >
                  {timerRunning ? '暂停' : '计时'}
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(120);
                  }}
                  className="text-[#7A6B58] hover:text-[#2C2623]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <h2 className="font-editorial text-xl font-semibold text-[#2C2623]">{currentSpeak.topic}</h2>

            {currentSpeak.cueCardPrompt && (
              <div className="rounded-xl editorial-card-inner p-4 space-y-2">
                <p className="font-editorial text-sm font-semibold text-[#2C2623]">
                  {currentSpeak.cueCardPrompt}
                </p>
                <ul className="space-y-1 text-xs text-[#4A4238]">
                  {currentSpeak.bulletPoints?.map((bp, i) => (
                    <li key={i}>• {bp}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleEvaluateSpeaking} className="space-y-3">
              <div className="rounded-xl editorial-card-inner p-3.5">
                <textarea
                  rows={4}
                  value={speakingDraft}
                  onChange={(e) => setSpeakingDraft(e.target.value)}
                  placeholder="在此记录口语陈述文稿以供评定与润色..."
                  className="w-full bg-transparent font-editorial text-base text-[#2C2623] placeholder-[#A69988] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isEvaluatingSpeaking || !speakingDraft.trim()}
                className="w-full rounded-lg bg-[#2E5641] py-2 text-xs font-medium text-[#FBF8F3] hover:bg-[#234533] disabled:opacity-50"
              >
                {isEvaluatingSpeaking ? '正在评定...' : '提交口语文稿'}
              </button>
            </form>

            {speakingEval && (
              <div className="rounded-xl editorial-inset-box p-4 space-y-2 text-xs">
                <div className="font-semibold text-[#2E5641]">
                  口语评定：Band {speakingEval.overallBand}
                </div>
                <p className="text-[#4A4238]">{speakingEval.summary}</p>
                <p className="font-editorial text-sm italic text-[#2C2623]">
                  “{speakingEval.upgradedVersion}”
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-5">
            {currentSpeak.questions.map((item, idx) => (
              <div key={idx} className="editorial-card rounded-xl p-6 space-y-4">
                <h3 className="font-editorial text-lg font-semibold text-[#2C2623]">{item.q}</h3>
                <p className="text-xs text-[#5C5144]">
                  <strong className="text-[#7A4E24]">展开脉络：</strong>
                  {item.strategy}
                </p>
                <div className="rounded-xl editorial-card-inner p-4 font-editorial text-base leading-relaxed text-[#2C2623]">
                  “{item.sampleAnswer}”
                </div>
                <div className="editorial-inset-box rounded-lg p-4 space-y-2">
                  <span className="text-xs font-semibold text-[#6E6050]">地道表达 / Idioms</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {item.idioms.map((idItem, k) => (
                      <div key={k} className="text-xs flex items-baseline gap-2">
                        <span className="inline-block h-1.5 w-2 rounded-sm bg-[#B07D4F]" />
                        <span className="font-editorial font-semibold text-sm text-[#2C2623]">
                          {idItem.phrase}
                        </span>
                        <span className="text-[#5C5144]">{idItem.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
