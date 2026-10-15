import React, { useMemo, useState } from 'react';
import { Check, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
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
    const x = counter.leafIndex * 215 + 115;
    counter.leafIndex += 1;
    return {
      node,
      x,
      y: depth * 105 + 42,
      children: [],
    };
  }

  const childLayouts = rawChildren.map((child) => buildTreeLayout(child, collapsedIds, depth + 1, counter));
  const minX = childLayouts[0].x;
  const maxX = childLayouts[childLayouts.length - 1].x;
  return {
    node,
    x: (minX + maxX) / 2,
    y: depth * 105 + 42,
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
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(0);
  const [focusedRole, setFocusedRole] = useState<RoleCode | null>(null);
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<Set<string>>(new Set());
  const [customInput, setCustomInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const currentSentence = useMemo(
    () => sentenceList.find((s) => s.id === selectedId) || sentenceList[0],
    [sentenceList, selectedId]
  );

  const treeLayoutData = useMemo(() => {
    const counter = { leafIndex: 0 };
    const rootLayout = buildTreeLayout(currentSentence.syntaxTree, collapsedTreeIds, 0, counter);
    const allNodes = flattenTreeLayout(rootLayout);
    const maxX = Math.max(...allNodes.map((n) => n.x), 580) + 120;
    const maxY = Math.max(...allNodes.map((n) => n.y), 220) + 65;
    return { rootLayout, allNodes, width: maxX, height: maxY };
  }, [currentSentence, collapsedTreeIds]);

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

    try {
      const res = await analyzeSentenceWithAI(trimmed, aiConfig);
      setSentenceList((prev) => [res.data, ...prev]);
      setSelectedId(res.data.id);
      setSelectedTokenIndex(0);
      setFocusedRole(null);
      setCollapsedTreeIds(new Set());
      setCustomInput('');

      await savePracticeRecord({
        module: 'grammar',
        itemId: res.data.id,
        title: res.data.title,
        userInput: trimmed,
        score: 100,
        feedback: { pattern: res.data.pattern, summary: res.data.summary },
      });
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : '句子解析请求未成功');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeToken =
    selectedTokenIndex !== null && currentSentence.tokens[selectedTokenIndex]
      ? currentSentence.tokens[selectedTokenIndex]
      : currentSentence.tokens[0];

  return (
    <div className="space-y-6 animate-soft-reveal">
      {/* 顶部：例句选目与自定义解析栏 */}
      <div className="editorial-card rounded-xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium tracking-wider text-[#7A6B58] mr-1">
              经典例句 / Examples
            </span>
            {sentenceList.map((item) => {
              const isSelected = item.id === currentSentence.id;
              const isDone = completedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setSelectedTokenIndex(0);
                    setFocusedRole(null);
                    setCollapsedTreeIds(new Set());
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all duration-200 ${
                    isSelected
                      ? 'border-[#B07D4F] bg-[#EFE6D5] font-semibold text-[#2C2623] shadow-sm'
                      : 'border-[#DFD7C8] bg-[#FBF8F3] text-[#5C5144] hover:border-[#C8B9A6]'
                  }`}
                >
                  <span>{item.category}</span>
                  {isDone && <Check className="h-3 w-3 text-[#2E5641]" />}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleCustomAnalyze} className="flex items-center gap-2 lg:w-96">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="输入任意英语句子解析结构..."
              className="flex-1 rounded-lg border border-[#D8CEBE] bg-[#FBF8F3] px-3.5 py-1.5 text-xs text-[#2C2623] placeholder-[#9C8F7E] focus:border-[#B07D4F] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isAnalyzing || !customInput.trim()}
              className="shrink-0 rounded-lg bg-[#2E5641] px-3.5 py-1.5 text-xs font-medium text-[#FBF8F3] transition hover:bg-[#234533] disabled:opacity-50"
            >
              {isAnalyzing ? '解析中...' : '解析'}
            </button>
          </form>
        </div>
        {analyzeError && <p className="mt-2 text-xs text-[#9E473B]">{analyzeError}</p>}
      </div>

      {/* 主体双栏书页布局（严格对应方向一设计图） */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 左栏（7列）：句式剖析 / Sentence Analysis + 句法树 / Syntax Tree */}
        <div className="lg:col-span-7 editorial-card rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-8">
          {/* 1. 句式剖析 / Sentence Analysis */}
          <div>
            <div className="flex items-center justify-between border-b border-[#E2DACB] pb-3">
              <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#2C2623]">
                句式剖析 <span className="font-normal text-[#6E6050]">/ Sentence Analysis</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSpeakSentence(currentSentence.sentence)}
                  className="inline-flex items-center gap-1 rounded-md border border-[#D8CEBE] bg-[#FBF8F3] px-2.5 py-1 text-xs text-[#5C5144] transition hover:border-[#B07D4F] hover:text-[#2C2623]"
                >
                  <Volume2 className="h-3.5 w-3.5 text-[#B07D4F]" />
                  <span>朗读</span>
                </button>
                <button
                  onClick={() => onMarkCompleted(currentSentence.id)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition ${
                    completedIds.includes(currentSentence.id)
                      ? 'border-[#8AB09B] bg-[#E3ECE6] text-[#2E5641]'
                      : 'border-[#D8CEBE] bg-[#FBF8F3] text-[#5C5144] hover:border-[#B07D4F]'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{completedIds.includes(currentSentence.id) ? '已归档' : '归档'}</span>
                </button>
              </div>
            </div>

            {/* 书页批注式下划线拆解展示区 */}
            <div className="mt-6 rounded-xl editorial-card-inner p-6">
              <div className="flex flex-wrap items-start gap-x-4 gap-y-6 leading-relaxed">
                {currentSentence.tokens.map((tok, idx) => {
                  const meta = ROLE_META[tok.roleCode] || ROLE_META.Attr;
                  const isSelected = selectedTokenIndex === idx;
                  const isDimmed = focusedRole !== null && focusedRole !== tok.roleCode;

                  return (
                    <button
                      key={`${tok.text}-${idx}`}
                      onClick={() => {
                        setSelectedTokenIndex(idx);
                        setFocusedRole((prev) => (prev === tok.roleCode ? null : tok.roleCode));
                      }}
                      onMouseEnter={() => setSelectedTokenIndex(idx)}
                      className={`group flex flex-col items-start text-left transition-all duration-300 ${
                        isDimmed ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      {/* 原句词段 */}
                      <span
                        className={`font-editorial text-xl sm:text-2xl tracking-wide transition-colors px-1 rounded ${
                          isSelected ? 'bg-[#EFE6D5]/90 text-[#1F1A17] font-semibold' : 'text-[#2C2623]'
                        }`}
                      >
                        {tok.text}
                      </span>

                      {/* 批注下划线或从句托架 */}
                      <div className="mt-1.5 w-full px-1">
                        {tok.roleCode === 'Clause' || tok.underlineStyle === 'dotted' ? (
                          <div
                            className="h-2 w-full border-b-2 border-l-2 border-r-2 border-dotted transition-all"
                            style={{ borderColor: meta.strokeColor }}
                          />
                        ) : (
                          <div
                            className="w-full transition-all"
                            style={{
                              height: '3px',
                              backgroundColor: meta.strokeColor,
                              opacity: isSelected ? 1 : 0.78,
                            }}
                          />
                        )}
                      </div>

                      {/* 双语成分标签 */}
                      <div className="mt-1.5 px-1 flex flex-col">
                        <span className="font-editorial text-xs font-semibold text-[#2C2623]">
                          {meta.enName}
                        </span>
                        <span className="text-[11px] text-[#6E6050]">（{meta.zhName}）</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 当前指向词段的精炼批注 */}
              {activeToken && (
                <div className="mt-6 border-t border-[#E5DEC9] pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${
                          (ROLE_META[activeToken.roleCode] || ROLE_META.Attr).badgeClass
                        }`}
                      >
                        {activeToken.role}
                      </span>
                      <span className="font-editorial text-base font-semibold text-[#2C2623]">
                        “{activeToken.text}”
                      </span>
                    </div>
                    <p className="text-xs text-[#4A4238] leading-relaxed">{activeToken.explanation}</p>
                  </div>

                  <button
                    onClick={() =>
                      onAskTutor(
                        `请解析句子 “${currentSentence.sentence}” 中的 “${activeToken.text}”（${activeToken.role}）的句法功能与同义句式转换。`,
                        currentSentence.sentence
                      )
                    }
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#C9A67E] bg-[#EFE6D5] px-3 py-1.5 text-xs font-medium text-[#6E4B28] transition hover:bg-[#E5D7C0]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>句法追问</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. 结构分层拆解（主干 · 修饰 · 从句） */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[#6E6050]">
                层级分解 / Structural Layers
              </span>
              {focusedRole && (
                <button
                  onClick={() => setFocusedRole(null)}
                  className="inline-flex items-center gap-1 text-xs text-[#8C5A2B] hover:underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>显示全句成分</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {currentSentence.steps.map((layer) => (
                <div
                  key={layer.step}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-[#E2DACB] bg-[#FBF8F3] px-4 py-2.5 transition hover:border-[#C9A67E]"
                >
                  <span className="shrink-0 rounded bg-[#EFE6D5] px-2.5 py-0.5 text-xs font-semibold text-[#7A4E24]">
                    {layer.title}
                  </span>
                  <span className="text-xs text-[#3D352E] font-editorial sm:text-sm">
                    {layer.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 句法树 / Syntax Tree */}
          <div>
            <div className="flex items-center justify-between border-b border-[#E2DACB] pb-2.5">
              <h3 className="font-editorial text-lg sm:text-xl font-semibold text-[#2C2623]">
                句法树 <span className="font-normal text-[#6E6050]">/ Syntax Tree</span>
              </h3>
              <button
                onClick={() => setCollapsedTreeIds(new Set())}
                className="text-xs text-[#6E6050] hover:text-[#2C2623]"
              >
                展开全部节点
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl editorial-card-inner p-4">
              <svg
                width={treeLayoutData.width}
                height={treeLayoutData.height}
                viewBox={`0 0 ${treeLayoutData.width} ${treeLayoutData.height}`}
                className="mx-auto select-none"
              >
                {/* 虚线/实线书页风格连接线 */}
                {treeLayoutData.allNodes.map((parent) =>
                  parent.children.map((child) => {
                    return (
                      <line
                        key={`${parent.node.id}->${child.node.id}`}
                        x1={parent.x}
                        y1={parent.y + 24}
                        x2={child.x}
                        y2={child.y - 24}
                        stroke="#B8A994"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                      />
                    );
                  })
                )}

                {/* 句法树节点 */}
                {treeLayoutData.allNodes.map((item) => {
                  const meta = ROLE_META[item.node.role] || ROLE_META.Clause;
                  const hasChildren = Boolean(item.node.children && item.node.children.length > 0);
                  const isCollapsed = collapsedTreeIds.has(item.node.id);
                  const boxWidth = 186;
                  const boxHeight = 52;

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
                        rx={8}
                        fill={meta.fillColor}
                        stroke={meta.strokeColor}
                        strokeWidth={1.2}
                      />
                      <text
                        x={boxWidth / 2}
                        y={20}
                        textAnchor="middle"
                        fill="#2C2623"
                        fontSize={12}
                        fontWeight="600"
                        fontFamily="Cormorant Garamond, Georgia, serif"
                      >
                        {item.node.label.length > 24 ? `${item.node.label.slice(0, 24)}…` : item.node.label}
                      </text>
                      <text
                        x={boxWidth / 2}
                        y={38}
                        textAnchor="middle"
                        fill="#5C5144"
                        fontSize={11}
                        fontFamily="Cormorant Garamond, Georgia, serif"
                      >
                        {item.node.text.length > 26 ? `${item.node.text.slice(0, 26)}…` : item.node.text}
                      </text>
                      {hasChildren && (
                        <text
                          x={boxWidth - 12}
                          y={16}
                          fill="#8C5A2B"
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
          </div>
        </div>

        {/* 右栏（5列）：文学与语法译注 / Literary & Grammatical Notes（严格还原方向一右栏） */}
        <div className="lg:col-span-5 editorial-card rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="border-b border-[#E2DACB] pb-4">
              <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#2C2623]">
                文学与语法译注 <span className="font-normal text-[#6E6050]">/ Notes</span>
              </h2>
              <p className="mt-1.5 font-editorial text-sm italic text-[#5C5144]">
                {currentSentence.title}
              </p>
            </div>

            {/* 译文呈现 */}
            <div className="space-y-2 border-b border-[#E2DACB] pb-5">
              <p className="font-editorial text-lg sm:text-xl leading-relaxed text-[#2C2623]">
                {currentSentence.translation}
              </p>
              <p className="text-right font-editorial text-xs italic text-[#8A7B68]">
                —— {currentSentence.pattern}
              </p>
            </div>

            {/* 句式结构总括 */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wider text-[#6E6050]">
                结构解析 / Structural Overview
              </h3>
              <p className="text-sm leading-relaxed text-[#3D352E]">{currentSentence.summary}</p>
            </div>

            {/* 装饰性内框：词汇与句法美学 / Vocabulary & Syntax Highlights */}
            <div className="editorial-inset-box rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#DFD7C8] pb-2.5">
                <h3 className="font-editorial text-base font-semibold text-[#2C2623]">
                  句法与词汇要旨 <span className="font-normal text-[#6E6050]">/ Highlights</span>
                </h3>
                <span className="text-xs text-[#B07D4F]">✦</span>
              </div>

              <div className="space-y-3.5">
                {currentSentence.keyPoints.map((pt, index) => {
                  const [head, ...rest] = pt.split('：');
                  const body = rest.join('：');
                  return (
                    <div key={index} className="text-xs sm:text-sm leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2.5 shrink-0 rounded-sm bg-[#B07D4F]" />
                        {body ? (
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="font-editorial font-semibold text-base text-[#2C2623]">
                              {head}
                            </span>
                            <span className="text-[#B8A994]">┈┈┈┈▸</span>
                            <span className="text-[#4A4238]">{body}</span>
                          </div>
                        ) : (
                          <span className="text-[#4A4238]">{pt}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 底部成分色卡图例（点击可筛选对应成分） */}
          <div className="border-t border-[#E2DACB] pt-4">
            <span className="block text-[11px] text-[#7A6B58] mb-2">
              点击图例可单独聚焦对应语法成分：
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(ROLE_META).map((m) => (
                <button
                  key={m.code}
                  onClick={() => setFocusedRole((prev) => (prev === m.code ? null : m.code))}
                  className={`rounded border px-2 py-0.5 text-[11px] transition ${m.badgeClass} ${
                    focusedRole === m.code ? 'ring-1 ring-[#8C5A2B] font-semibold' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {m.shortName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
