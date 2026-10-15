import {
  AIConfig,
  GrammarSentence,
  IeltsEvaluationResult,
  PracticeRecord,
  TranslationFeedback,
  UserProgress,
} from '../types';

// workers-types 下 Response.json() 返回 unknown，统一在此断言为动态对象后再消费
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readJson(res: Response): Promise<any> {
  return await res.json();
}

const STORAGE_KEYS = {
  USER_ID: 'linguaforge_user_id',
  AI_CONFIG: 'linguaforge_ai_config',
  PROGRESS: 'linguaforge_user_progress',
  LOCAL_HISTORY: 'linguaforge_local_history',
  LOCAL_SENTENCES: 'linguaforge_local_sentences',
};

export const DEFAULT_AI_CONFIG: AIConfig = {
  providerId: 'openai',
  providerName: 'OpenAI 官方接口',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.4,
  maxTokens: 2000,
  customSystemPrompt:
    '你是一位资深的英语语言学专家、文学翻译导师与前雅思考官。请始终使用专业、清晰的中文进行讲解，并结合具体例句与语法规则提供建设性指导。',
};

export const DEFAULT_USER_PROGRESS: UserProgress = {
  completedGrammarIds: [],
  completedTranslationIds: [],
  completedIeltsIds: [],
  bookmarkedWords: [],
  totalPracticeCount: 0,
};

export function getUserId(): string {
  let uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!uid) {
    uid = `learner_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, uid);
  }
  return uid;
}

export function setUserId(newId: string): void {
  const cleaned = newId.trim() || 'default-learner';
  localStorage.setItem(STORAGE_KEYS.USER_ID, cleaned);
}

export function loadLocalAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_CONFIG);
    if (!raw) return DEFAULT_AI_CONFIG;
    return { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveLocalAIConfig(config: AIConfig): void {
  localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(config));
}

export function loadLocalProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!raw) return DEFAULT_USER_PROGRESS;
    return { ...DEFAULT_USER_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_PROGRESS;
  }
}

export function saveLocalProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

export interface CloudHealthInfo {
  ok: boolean;
  runtime: string;
  storageBackend: 'd1' | 'kv' | 'memory' | 'local-only';
  hasDefaultServerKey: boolean;
  updatedAt?: string | null;
}

export async function checkWorkerHealth(): Promise<CloudHealthInfo> {
  try {
    const res = await fetch('/api/health', {
      headers: { 'X-User-Id': getUserId() },
    });
    if (!res.ok) throw new Error('Health check failed');
    return await readJson(res);
  } catch {
    return {
      ok: false,
      runtime: 'browser-fallback',
      storageBackend: 'local-only',
      hasDefaultServerKey: false,
    };
  }
}

export async function syncStateFromCloud(): Promise<{
  storageBackend: 'd1' | 'kv' | 'memory' | 'local-only';
  aiConfig: AIConfig;
  progress: UserProgress;
  updatedAt: string | null;
}> {
  const localConfig = loadLocalAIConfig();
  const localProgress = loadLocalProgress();

  try {
    const res = await fetch('/api/state', {
      method: 'GET',
      headers: { 'X-User-Id': getUserId() },
    });
    if (!res.ok) throw new Error('State fetch failed');
    const data = await readJson(res);

    const mergedConfig: AIConfig =
      data.aiConfig && Object.keys(data.aiConfig).length > 0
        ? { ...localConfig, ...data.aiConfig, apiKey: data.aiConfig.apiKey || localConfig.apiKey }
        : localConfig;

    const mergedProgress: UserProgress =
      data.progress && Object.keys(data.progress).length > 0
        ? {
            completedGrammarIds: Array.from(
              new Set([...(localProgress.completedGrammarIds || []), ...(data.progress.completedGrammarIds || [])])
            ),
            completedTranslationIds: Array.from(
              new Set([
                ...(localProgress.completedTranslationIds || []),
                ...(data.progress.completedTranslationIds || []),
              ])
            ),
            completedIeltsIds: Array.from(
              new Set([...(localProgress.completedIeltsIds || []), ...(data.progress.completedIeltsIds || [])])
            ),
            bookmarkedWords: Array.from(
              new Set([...(localProgress.bookmarkedWords || []), ...(data.progress.bookmarkedWords || [])])
            ),
            totalPracticeCount: Math.max(
              localProgress.totalPracticeCount || 0,
              data.progress.totalPracticeCount || 0
            ),
          }
        : localProgress;

    saveLocalAIConfig(mergedConfig);
    saveLocalProgress(mergedProgress);

    return {
      storageBackend: data.storageBackend || 'memory',
      aiConfig: mergedConfig,
      progress: mergedProgress,
      updatedAt: data.updatedAt || null,
    };
  } catch {
    return {
      storageBackend: 'local-only',
      aiConfig: localConfig,
      progress: localProgress,
      updatedAt: null,
    };
  }
}

export async function pushStateToCloud(
  aiConfig: AIConfig,
  progress: UserProgress
): Promise<{ ok: boolean; storageBackend: string; updatedAt: string }> {
  saveLocalAIConfig(aiConfig);
  saveLocalProgress(progress);

  try {
    const res = await fetch('/api/state', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': getUserId(),
      },
      body: JSON.stringify({ aiConfig, progress }),
    });
    if (!res.ok) throw new Error('Failed to push state');
    return await readJson(res);
  } catch {
    return {
      ok: true,
      storageBackend: 'local-only',
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function fetchPracticeHistory(module?: string): Promise<PracticeRecord[]> {
  try {
    const query = module ? `?module=${encodeURIComponent(module)}` : '';
    const res = await fetch(`/api/history${query}`, {
      headers: { 'X-User-Id': getUserId() },
    });
    if (!res.ok) throw new Error('History fetch failed');
    const data = await readJson(res);
    if (Array.isArray(data.records)) {
      return data.records;
    }
  } catch {
    // fallback to localStorage
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_HISTORY);
    const list: PracticeRecord[] = raw ? JSON.parse(raw) : [];
    return module ? list.filter((r) => r.module === module) : list;
  } catch {
    return [];
  }
}

export async function savePracticeRecord(params: {
  module: string;
  itemId: string;
  title: string;
  userInput: string;
  score?: number | null;
  feedback?: Record<string, unknown>;
}): Promise<PracticeRecord> {
  const fallbackRecord: PracticeRecord = {
    id: `local_${Date.now()}`,
    userId: getUserId(),
    module: params.module,
    itemId: params.itemId,
    title: params.title,
    userInput: params.userInput,
    score: params.score ?? null,
    feedback: params.feedback || {},
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_HISTORY);
    const list: PracticeRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(fallbackRecord);
    localStorage.setItem(STORAGE_KEYS.LOCAL_HISTORY, JSON.stringify(list.slice(0, 80)));
  } catch {
    // ignore storage quota errors
  }

  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': getUserId(),
      },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await readJson(res);
      if (data.record) return data.record;
    }
  } catch {
    // fallback already saved locally
  }

  return fallbackRecord;
}

export async function testAIProxyConnection(aiConfig: AIConfig): Promise<{
  ok: boolean;
  endpoint?: string;
  model?: string;
  latencyMs?: number;
  reply?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/ai/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': getUserId(),
      },
      body: JSON.stringify({ aiConfig }),
    });
    return await readJson(res);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '无法连接 Cloudflare Worker 代理服务',
    };
  }
}

export async function analyzeSentenceWithAI(
  sentence: string,
  aiConfig: AIConfig
): Promise<{ mode: 'live' | 'heuristic'; model: string; data: GrammarSentence }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify({
      taskType: 'grammar_analyze',
      payload: { sentence },
      aiConfig,
    }),
  });

  const json = await readJson(res);
  if (!res.ok || !json.ok) {
    throw new Error(json.error || 'AI 句子语法拆解失败');
  }

  const raw = json.data || {};
  const formatted: GrammarSentence = {
    id: `custom-${Date.now()}`,
    category: 'AI 实时拆解 · 自定义句子',
    title: sentence.slice(0, 42) + (sentence.length > 42 ? '...' : ''),
    difficulty: raw.difficulty || '中级 (B2)',
    sentence: raw.sentence || sentence,
    translation: raw.translation || '已完成句法结构拆解',
    pattern: raw.pattern || '主从复合句 / 核心主谓结构',
    summary: raw.summary || '由 AI 驱动生成的句子成分与短语结构句法树分析。',
    keyPoints: Array.isArray(raw.keyPoints)
      ? raw.keyPoints
      : ['重点关注主谓核心骨架与修饰从句的层级边界', '点击下方句法树节点可折叠或展开子短语结构'],
    tokens: Array.isArray(raw.tokens) ? raw.tokens : [],
    steps: Array.isArray(raw.steps) ? raw.steps : [],
    syntaxTree: raw.syntaxTree || {
      id: 'custom-root',
      label: 'S (完整句子)',
      role: 'Clause',
      text: sentence,
      children: [],
    },
  };

  return {
    mode: json.mode || 'live',
    model: json.model || aiConfig.model,
    data: formatted,
  };
}

export async function gradeTranslationWithAI(
  params: {
    chinese: string;
    referenceEnglish: string;
    userTranslation: string;
    sourceTitle: string;
    sourceWork: string;
  },
  aiConfig: AIConfig
): Promise<{ mode: 'live' | 'heuristic'; model: string; data: TranslationFeedback }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify({
      taskType: 'translation_grade',
      payload: params,
      aiConfig,
    }),
  });

  const json = await readJson(res);
  if (!res.ok || !json.ok) {
    throw new Error(json.error || 'AI 翻译批改请求失败');
  }

  return {
    mode: json.mode || 'live',
    model: json.model || aiConfig.model,
    data: json.data as TranslationFeedback,
  };
}

export async function evaluateIeltsWithAI(
  params: {
    skill: string;
    promptTitle: string;
    promptQuestion: string;
    userResponse: string;
    referenceAnswer?: string;
  },
  aiConfig: AIConfig
): Promise<{ mode: 'live' | 'heuristic'; model: string; data: IeltsEvaluationResult }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify({
      taskType: 'ielts_evaluate',
      payload: params,
      aiConfig,
    }),
  });

  const json = await readJson(res);
  if (!res.ok || !json.ok) {
    throw new Error(json.error || 'AI 雅思评分请求失败');
  }

  return {
    mode: json.mode || 'live',
    model: json.model || aiConfig.model,
    data: json.data as IeltsEvaluationResult,
  };
}

export async function askAITutor(
  question: string,
  context: string,
  aiConfig: AIConfig
): Promise<{ mode: 'live' | 'heuristic'; model: string; reply: string }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify({
      taskType: 'tutor_chat',
      payload: { question, context },
      aiConfig,
    }),
  });

  const json = await readJson(res);
  if (!res.ok || !json.ok) {
    throw new Error(json.error || 'AI 助教响应失败');
  }

  return {
    mode: json.mode || 'live',
    model: json.model || aiConfig.model,
    reply: json.data?.reply || '已完成解答。',
  };
}
