import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  Wand2,
} from 'lucide-react';
import { GRAMMAR_SENTENCES, ROLE_META } from '../data/courseData';
import { analyzeSentenceWithAI, savePracticeRecord } from '../services/api';
import { AIConfig, GrammarSentence, RoleCode, SyntaxTreeNode } from '../types';

interface GrammarModuleProps {
  aiConfig: AIConfig;
  completedIds: string[];
  onMarkCompleted: (id: string) => void;
  onAskTutor: (prefillQuestion: string, contextText: string) => void;
}

interface TreeNodeLayout {
  node: SyntaxTreeNode;
  x: number;
  y: number;
  children: TreeNodeLayout[];
}

function buildTreeLayout(
  node: SyntaxTreeNode,
  collapsedIds: Set<string>,
  depth = 0,
  counter = { leafIndex: 0 }
): TreeNodeLayout {
  const isCollapsed = collapsedIds.has(node.id);
  const rawChildren = !isCollapsed && node.children ? node.children : [];

  if (rawChildren.length === 0) {
    const x = counter.leafIndex * 220 + 125;
    counter.leafIndex += 1;
    return {
      node,
      x,
      y: depth * 115 + 55,
      children: [],
    };
  }

  const childLayouts = rawChildren.map((child) => buildTreeLayout(child, collapsedIds, depth + 1, counter));
  const minX = childLayouts[0].x;
  const maxX = childLayouts[childLayouts.length - 1].x;
  return {
    node,
    x: (minX + maxX) / 2,
    y: depth * 115 + 55,
    children: childLayouts,
  };
}

function flattenTreeLayout(layout: TreeNodeLayout): TreeNodeLayout[] {
  const list: TreeNodeLayout[] = [layout];
  for (const child of layout.children) {
    list.push(...flattenTreeLayout(child));
  }
  return list;
}

export const GrammarModule: React.FC<GrammarModuleProps> = ({
  aiConfig,
  completedIds,
  onMarkCompleted,
  onAskTutor,
}) => {
  const [sentenceList, setSentenceList] = useState<GrammarSentence[]>(GRAMMAR_SENTENCES);
  const [selectedId, setSelectedId] = useState<string>(GRAMMAR_SENTENCES[0].id);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1); // -1 表示全部展示
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(0);
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<Set<string>>(new Set());
  const [customInput, setCustomInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeModeBadge, setAnalyzeModeBadge] = useState<string | null>(null);

  const currentSentence = useMemo(
    () => sentenceList.find((s) => s.id === selectedId) || sentenceList[0],
    [sentenceList, selectedId]
  );

  // 分步动画计时器
  useEffect(() => {
    if (!isPlaying) return;
    const stepsCount = currentSentence.steps.length;
    if (stepsCount === 0) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < stepsCount - 1) {
          return prev + 1;
        }
        setIsPlaying(false);
        return prev;
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isPlaying, currentSentence]);

  const highlightedRoles = useMemo<Set<RoleCode>>(() => {
    if (activeStepIndex < 0 || !currentSentence.steps[activeStepIndex]) {
      return new Set<RoleCode>(['S', 'V', 'O', 'P', 'Attr', 'Adv', 'Comp', 'Conn', 'Clause']);
    }
    return new Set<RoleCode>(currentSentence.steps[activeStepIndex].highlightRoles);
  }, [activeStepIndex, currentSentence]);

  const treeLayoutData = useMemo(() => {
    const counter = { leafIndex: 0 };
    const rootLayout = buildTreeLayout(currentSentence.syntaxTree, collapsedTreeIds, 0, counter);
    const allNodes = flattenTreeLayout(rootLayout);
    const maxX = Math.max(...allNodes.map((n) => n.x), 650) + 130;
    const maxY = Math.max(...allNodes.map((n) => n.y), 260) + 75;
    return { rootLayout, allNodes, width: maxX, height: maxY };
  }, [currentSentence, collapsedTreeIds]);

  const handleStartStepAnimation = () => {
    setActiveStepIndex(0);
    setIsPlaying(true);
  };

  const handleResetAnimation = () => {
    setIsPlaying(false);
    setActiveStepIndex(-1);
  };

  const toggleTreeNode = (nodeId: string) => {
    setCollapsedTreeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleSpeakSentence = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-GB';
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  };

  const handleCustomAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeModeBadge(null);

    try {
      const res = await analyzeSentenceWithAI(trimmed, aiConfig);
      setSentenceList((prev) => [res.data, ...prev]);
      setSelectedId(res.data.id);
      setActiveStepIndex(-1);
      setSelectedTokenIndex(0);
      setCollapsedTreeIds(new Set());
      setAnalyzeModeBadge(
        res.mode === 'live' ? `AI 实时解析 (${res.model})` : '本地启发式引擎（配置 API Key 可解锁深度句法树）'
      );

      await savePracticeRecord({
        module: 'grammar',
        itemId: res.data.id,
        title: `自定义句子拆解：${trimmed.slice(0, 36)}`,
        userInput: trimmed,
        score: 100,
        feedback: { pattern: res.data.pattern, summary: res.data.summary },
      });
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : '句子拆解请求失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeToken =
    selectedTokenIndex !== null && currentSentence.tokens[selectedTokenIndex]
      ? currentSentence.tokens[selectedTokenIndex]
      : currentSentence.tokens[0];

  return (
    <div className="space-y-6">
      {/* 顶部：AI 自定义句子实时拆解输入框 */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-slate-900/90 p-5 shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold">
              <Wand2 className="h-4 w-4" />
              <span>AI 交互式长难句结构分析器（支持任意外刊/真题长难句实时拆解）</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              输入任意英语句子，通过 Cloudflare Worker 代理调用 OpenAI 兼容模型，自动生成成分色块、分步拆解动画与交互式句法树。
            </p>
          </div>
          {analyzeModeBadge && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              {analyzeModeBadge}
            </span>
          )}
        </div>

        <form onSubmit={handleCustomAnalyze} className="mt-3.5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="输入任意英语句子，例如：Not until the paradigm shifted did researchers realize what lay beneath the surface..."
            className="flex-1 rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !customInput.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isAnalyzing ? '正在拆解句法树...' : 'AI 实时拆解句子'}
          </button>
        </form>
        {analyzeError && <p className="mt-2 text-xs text-rose-400">{analyzeError}</p>}
      </div>

      {/* 主体网格：左侧精选句库列表 + 右侧可视化拆解工作台 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 左侧句库导航 */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              核心语法典型句库 ({sentenceList.length})
            </h3>
            <span className="text-xs text-slate-500">
              已掌握 {completedIds.length}/{sentenceList.length}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {sentenceList.map((item) => {
              const isSelected = item.id === currentSentence.id;
              const isDone = completedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setActiveStepIndex(-1);
                    setIsPlaying(false);
                    setSelectedTokenIndex(0);
                    setCollapsedTreeIds(new Set());
                  }}
                  className={`w-full text-left rounded-xl border p-3.5 transition ${
                    isSelected
                      ? 'border-indigo-500/80 bg-indigo-950/40 shadow-md'
                      : 'border-slate-800/90 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          item.difficulty.includes('初级')
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : item.difficulty.includes('中级')
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {item.difficulty}
                      </span>
                      {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    </div>
                  </div>
                  <p className="mt-2 font-medium text-sm text-slate-100 line-clamp-1">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-400 font-serif italic line-clamp-2">{item.sentence}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧可视化拆解工作台 */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. 句子成分动画拆解面板 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    {currentSentence.category}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">{currentSentence.pattern}</span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-white">{currentSentence.title}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSpeakSentence(currentSentence.sentence)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                  title="英音朗读原句"
                >
                  <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                  朗读原句
                </button>

                {!isPlaying ? (
                  <button
                    onClick={handleStartStepAnimation}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    <Play className="h-3.5 w-3.5" />
                    播放分步拆解动画
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPlaying(false)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    暂停动画
                  </button>
                )}

                <button
                  onClick={handleResetAnimation}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
                  title="显示全部成分"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  全览
                </button>

                <button
                  onClick={() => onMarkCompleted(currentSentence.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    completedIds.includes(currentSentence.id)
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-emerald-500/40'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completedIds.includes(currentSentence.id) ? '已掌握' : '标记掌握'}
                </button>
              </div>
            </div>

            {/* 分步拆解进度条与步骤切换 */}
            {currentSentence.steps.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStepIndex(-1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeStepIndex === -1
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  完整句子成分
                </button>
                {currentSentence.steps.map((st, idx) => (
                  <button
                    key={st.step}
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveStepIndex(idx);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      activeStepIndex === idx
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Step {st.step}: {st.title.replace(/^第.步：/, '')}
                  </button>
                ))}
              </div>
            )}

            {/* 当前动画步骤说明横幅 */}
            {activeStepIndex >= 0 && currentSentence.steps[activeStepIndex] && (
              <div className="mt-3 animate-fade-in-up rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-4 py-3">
                <p className="text-xs font-semibold text-indigo-300">
                  {currentSentence.steps[activeStepIndex].title}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {currentSentence.steps[activeStepIndex].description}
                </p>
              </div>
            )}

            {/* 交互式句子成分色块拆解区 */}
            <div className="mt-5 rounded-2xl border border-slate-800/90 bg-slate-950/90 p-5">
              <div className="flex flex-wrap items-stretch gap-3">
                {currentSentence.tokens.map((tok, idx) => {
                  const meta = ROLE_META[tok.roleCode] || ROLE_META.Attr;
                  const isHighlighted = highlightedRoles.has(tok.roleCode);
                  const isSelected = selectedTokenIndex === idx;

                  return (
                    <button
                      key={`${tok.text}-${idx}`}
                      onClick={() => setSelectedTokenIndex(idx)}
                      className={`group relative flex flex-col justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all duration-300 ${
                        isHighlighted
                          ? `${meta.bgClass} ${meta.borderClass} opacity-100 scale-100`
                          : 'border-slate-800 bg-slate-900/40 opacity-35 scale-95'
                      } ${isSelected ? 'ring-2 ring-indigo-400 shadow-lg' : 'hover:scale-[1.02]'}`}
                    >
                      <span className="font-serif text-base sm:text-lg font-medium tracking-wide text-white">
                        {tok.text}
                      </span>
                      <span
                        className={`mt-2 inline-flex items-center self-start rounded-md border px-2 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
                      >
                        {tok.role}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 句法依存弧线示意 (Dependency Arcs) */}
              {currentSentence.dependencies && currentSentence.dependencies.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    核心依存关系链：
                  </span>
                  {currentSentence.dependencies.map((dep, i) => {
                    const fromTok = currentSentence.tokens[dep.fromIndex];
                    const toTok = currentSentence.tokens[dep.toIndex];
                    if (!fromTok || !toTok) return null;
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300"
                      >
                        <span className="text-rose-300 font-medium">{fromTok.text.split(' ')[0]}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-sky-300 font-medium">{toTok.text.split(' ')[0]}</span>
                        <span className="text-[10px] text-indigo-400">({dep.label})</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 选中成分的深度语法卡片 */}
              {activeToken && (
                <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                          (ROLE_META[activeToken.roleCode] || ROLE_META.Attr).badgeClass
                        }`}
                      >
                        {activeToken.role}
                      </span>
                      <span className="font-serif text-sm font-semibold text-white">“{activeToken.text}”</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{activeToken.explanation}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      语法定义：{(ROLE_META[activeToken.roleCode] || ROLE_META.Attr).desc}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      onAskTutor(
                        `请详细讲解句子 "${currentSentence.sentence}" 中的片段 "${activeToken.text}"（${activeToken.role}），为什么这里用这种语法结构？能否再举两个替换例句？`,
                        `当前学习句子：${currentSentence.sentence}\n语法结构：${currentSentence.pattern}`
                      )
                    }
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3.5 py-2 text-xs font-medium text-indigo-200 hover:bg-indigo-500/25"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    就此成分向 AI 助教追问
                  </button>
                </div>
              )}
            </div>

            {/* 完整中文译文与核心语法要点 */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <span className="text-xs font-semibold text-slate-400">精准参考译文</span>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-100">{currentSentence.translation}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{currentSentence.summary}</p>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  核心句法拆解要点
                </span>
                <ul className="mt-2 space-y-1.5">
                  {currentSentence.keyPoints.map((pt, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="mt-0.5 text-indigo-400">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 2. 交互式短语结构句法树 (Interactive SVG Syntax Tree) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-indigo-400" />
                  可视化短语结构句法树 (Phrase Structure Syntax Tree)
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  点击带有子节点的句法树卡片可展开或折叠对应从句/短语层级，直观理解主句与从句的支配关系。
                </p>
              </div>
              <button
                onClick={() => setCollapsedTreeIds(new Set())}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                展开全部节点
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/90 p-3">
              <svg
                width={treeLayoutData.width}
                height={treeLayoutData.height}
                viewBox={`0 0 ${treeLayoutData.width} ${treeLayoutData.height}`}
                className="mx-auto select-none"
              >
                {/* 渲染父子节点连接贝塞尔曲线 */}
                {treeLayoutData.allNodes.map((parent) =>
                  parent.children.map((child) => {
                    const roleMeta = ROLE_META[child.node.role] || ROLE_META.Clause;
                    const pathData = `M ${parent.x} ${parent.y + 30} C ${parent.x} ${(parent.y + child.y) / 2}, ${
                      child.x
                    } ${(parent.y + child.y) / 2}, ${child.x} ${child.y - 30}`;
                    return (
                      <path
                        key={`${parent.node.id}->${child.node.id}`}
                        d={pathData}
                        fill="none"
                        stroke={roleMeta.strokeColor}
                        strokeWidth={2}
                        strokeOpacity={0.65}
                      />
                    );
                  })
                )}

                {/* 渲染每个句法树节点 */}
                {treeLayoutData.allNodes.map((item) => {
                  const meta = ROLE_META[item.node.role] || ROLE_META.Clause;
                  const hasChildren = Boolean(item.node.children && item.node.children.length > 0);
                  const isCollapsed = collapsedTreeIds.has(item.node.id);
                  const boxWidth = 196;
                  const boxHeight = 60;

                  return (
                    <g
                      key={item.node.id}
                      transform={`translate(${item.x - boxWidth / 2}, ${item.y - boxHeight / 2})`}
                      onClick={() => hasChildren && toggleTreeNode(item.node.id)}
                      className={hasChildren ? 'cursor-pointer' : 'cursor-default'}
                    >
                      <rect
                        width={boxWidth}
                        height={boxHeight}
                        rx={12}
                        fill={meta.fillColor}
                        fillOpacity={0.85}
                        stroke={meta.strokeColor}
                        strokeWidth={1.8}
                      />
                      <text
                        x={12}
                        y={22}
                        fill="#f8fafc"
                        fontSize={11}
                        fontWeight="bold"
                        fontFamily="Inter, system-ui, sans-serif"
                      >
                        {item.node.label.length > 24 ? `${item.node.label.slice(0, 24)}…` : item.node.label}
                      </text>
                      <text
                        x={12}
                        y={42}
                        fill="#cbd5e1"
                        fontSize={11}
                        fontStyle="italic"
                        fontFamily="Georgia, serif"
                      >
                        {item.node.text.length > 26 ? `“${item.node.text.slice(0, 26)}…”` : `“${item.node.text}”`}
                      </text>
                      {hasChildren && (
                        <circle
                          cx={boxWidth - 16}
                          cy={18}
                          r={8}
                          fill="#1e293b"
                          stroke={meta.strokeColor}
                          strokeWidth={1.2}
                        />
                      )}
                      {hasChildren && (
                        <text
                          x={boxWidth - 19}
                          y={22}
                          fill="#e2e8f0"
                          fontSize={11}
                          fontWeight="bold"
                        >
                          {isCollapsed ? '+' : '−'}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* 颜色图例说明 */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
              {Object.values(ROLE_META).map((m) => (
                <span
                  key={m.code}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${m.badgeClass}`}
                >
                  {m.shortName}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
