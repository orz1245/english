export type RoleCode = 'S' | 'V' | 'O' | 'P' | 'Attr' | 'Adv' | 'Comp' | 'Conn' | 'Clause';

export interface GrammarToken {
  text: string;
  role: string;
  roleCode: RoleCode;
  explanation: string;
  /** 可选：覆盖该词段默认的批注下划线样式（内置语料与 AI 返回均可缺省） */
  underlineStyle?: 'solid' | 'double' | 'dashed' | 'dotted';
}

export interface GrammarStep {
  step: number;
  title: string;
  description: string;
  highlightRoles: RoleCode[];
}

export interface SyntaxTreeNode {
  id: string;
  label: string;
  role: RoleCode;
  text: string;
  note?: string;
  children?: SyntaxTreeNode[];
}

export interface DependencyArc {
  fromIndex: number;
  toIndex: number;
  label: string;
}

export interface GrammarSentence {
  id: string;
  category: string;
  title: string;
  difficulty: '初级 (B1)' | '中级 (B2)' | '高级 (C1)';
  sentence: string;
  translation: string;
  pattern: string;
  summary: string;
  keyPoints: string[];
  tokens: GrammarToken[];
  steps: GrammarStep[];
  syntaxTree: SyntaxTreeNode;
  dependencies?: DependencyArc[];
}

export type TranslationDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TranslationSourceType = 'literature' | 'film';

export interface TranslationItem {
  id: string;
  difficulty: TranslationDifficulty;
  difficultyLabel: string;
  sourceType: TranslationSourceType;
  workTitle: string;
  workTitleEn: string;
  creator: string; // 作者或导演
  year: string;
  characterOrScene: string;
  sourceIntro: string; // 作品与出处背景介绍
  chinese: string;
  referenceEnglish: string;
  alternativeEnglish?: string;
  grammarFocus: string;
  vocabHints: Array<{ word: string; pos: string; meaning: string }>;
  literaryNote: string;
}

export interface TranslationFeedback {
  overallScore: number;
  dimensions: {
    accuracy: number;
    grammar: number;
    idiomaticity: number;
  };
  commentary: string;
  strengths: string[];
  improvements: string[];
  polishedVersion: string;
}

// 雅思四科数据结构
export interface IeltsListeningItem {
  id: string;
  section: 'Part 1 · 生活咨询' | 'Part 2 · 公共导览' | 'Part 3 · 学术讨论' | 'Part 4 · 学术讲座';
  title: string;
  scenario: string;
  accent: '英音 (UK)' | '美音 (US)' | '澳音 (AU)';
  audioScript: string;
  questionStem: string; // 含 {{0}}, {{1}} 占位符
  blanks: Array<{
    index: number;
    answer: string;
    synonymCue: string;
    distractorTrap: string;
  }>;
  coreVocab: Array<{ word: string; phonetic: string; meaning: string }>;
}

export interface IeltsReadingItem {
  id: string;
  topic: string;
  title: string;
  passageExcerpt: string;
  longSentenceAnalysis: {
    sentence: string;
    translation: string;
    breakdown: string;
  };
  paraphrasePairs: Array<{
    passageExpr: string;
    questionExpr: string;
    type: string;
  }>;
  questions: Array<{
    id: string;
    statement: string;
    answer: 'TRUE' | 'FALSE' | 'NOT GIVEN';
    explanation: string;
  }>;
}

export interface IeltsWritingPrompt {
  id: string;
  taskType: 'Task 1 (学术图表/书信)' | 'Task 2 (大作文议论文)';
  topicCategory: string;
  title: string;
  question: string;
  outlineSteps: string[];
  band6Excerpt: string;
  band85Model: string;
  upgradeHighlights: Array<{
    band6: string;
    band85: string;
    reason: string;
  }>;
}

export interface IeltsSpeakingTopic {
  id: string;
  part: 'Part 1 · 日常问答' | 'Part 2 · 个人陈述 (Cue Card)' | 'Part 3 · 深度思辨';
  topic: string;
  cueCardPrompt?: string;
  bulletPoints?: string[];
  questions: Array<{
    q: string;
    strategy: string;
    sampleAnswer: string;
    idioms: Array<{ phrase: string; meaning: string }>;
  }>;
}

export interface IeltsEvaluationResult {
  overallBand: number;
  criteria: {
    taskResponse: number;
    coherence: number;
    lexical: number;
    grammar: number;
  };
  summary: string;
  strengths: string[];
  improvements: string[];
  upgradedVersion: string;
  highBandVocabulary: Array<{ word: string; meaning: string }>;
}

export interface AIConfig {
  providerId: string;
  providerName: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  customSystemPrompt: string;
}

export interface AIProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  description: string;
}

export interface UserProgress {
  completedGrammarIds: string[];
  completedTranslationIds: string[];
  completedIeltsIds: string[];
  bookmarkedWords: string[];
  totalPracticeCount: number;
}

export interface PracticeRecord {
  id: string;
  userId: string;
  module: string;
  itemId: string;
  title: string;
  userInput: string;
  score: number | null;
  feedback: Record<string, unknown>;
  createdAt: string;
}
