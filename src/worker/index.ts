export interface Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  DB?: D1Database;
  STORAGE_KV?: KVNamespace;
  DEFAULT_AI_BASE_URL?: string;
  DEFAULT_AI_API_KEY?: string;
  DEFAULT_AI_MODEL?: string;
}

export interface AIConfigPayload {
  providerName?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  customSystemPrompt?: string;
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

export interface SavedSentenceRecord {
  id: string;
  userId: string;
  sentence: string;
  analysis: Record<string, unknown>;
  createdAt: string;
}

// 边缘内存兜底存储（当本地未配置 D1/KV 绑定时确保开箱即用）
const memoryStore = {
  profiles: new Map<string, { aiConfig: AIConfigPayload; progress: Record<string, unknown>; updatedAt: string }>(),
  records: new Map<string, PracticeRecord[]>(),
  sentences: new Map<string, SavedSentenceRecord[]>(),
};

let d1Initialized = false;

async function ensureD1Schema(db: D1Database): Promise<boolean> {
  if (d1Initialized) return true;
  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS user_profiles (
          user_id TEXT PRIMARY KEY,
          ai_config_json TEXT NOT NULL DEFAULT '{}',
          progress_json TEXT NOT NULL DEFAULT '{}',
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS practice_records (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          module TEXT NOT NULL,
          item_id TEXT NOT NULL,
          title TEXT NOT NULL,
          user_input TEXT NOT NULL,
          score REAL,
          feedback_json TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      )
      .run();

    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS saved_sentences (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          sentence TEXT NOT NULL,
          analysis_json TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      )
      .run();

    d1Initialized = true;
    return true;
  } catch {
    return false;
  }
}

async function detectStorageBackend(env: Env): Promise<'d1' | 'kv' | 'memory'> {
  if (env.DB) {
    const ok = await ensureD1Schema(env.DB);
    if (ok) return 'd1';
  }
  if (env.STORAGE_KV) {
    return 'kv';
  }
  return 'memory';
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });
}

function normalizeOpenAIBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/chat/completions')) {
    return trimmed;
  }
  if (trimmed.endsWith('/v1') || trimmed.endsWith('/v1beta/openai') || trimmed.includes('/compatible-mode/v1')) {
    return `${trimmed}/chat/completions`;
  }
  return `${trimmed}/v1/chat/completions`;
}

function extractJsonFromText(text: string): unknown {
  const cleaned = text.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = codeBlockMatch ? codeBlockMatch[1].trim() : cleaned;
  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('无法将 AI 响应解析为 JSON 结构');
  }
}

// 当用户尚未配置真实 API Key 时提供的离线启发式分析兜底，确保所有交互开箱可体验
function buildHeuristicFallback(taskType: string, payload: Record<string, unknown>): unknown {
  if (taskType === 'grammar_analyze') {
    const sentence = String(payload.sentence || 'Although the rain was heavy, the students continued their experiment in the laboratory.');
    const words = sentence.replace(/([,.!?;:])/g, ' $1 ').trim().split(/\s+/);
    const hasSubordinator = /^(although|though|while|when|if|because|since|unless|as)/i.test(words[0] || '');
    return {
      sentence,
      translation: '（离线启发式解析模式 — 配置 AI API Key 后可获取深度语义与句法树解析）',
      pattern: hasSubordinator ? '让步/条件状语从句 + 主谓宾 (SVO) 主句' : '主谓宾/主系表复合句 (SVO / SVP)',
      difficulty: sentence.length > 80 ? '高级 (C1)' : sentence.length > 45 ? '中级 (B2)' : '初级 (B1)',
      summary: `该句共包含 ${words.length} 个词元。${hasSubordinator ? '句首由从属连词引导状语从句修饰主句，体现主从复合句的层次逻辑。' : '核心骨架遵循英语标准主谓结构，修饰成分围绕核心名词与谓语动词展开。'}`,
      tokens: words.map((w, idx) => {
        const lower = w.toLowerCase();
        let role = '修饰/其他';
        let roleCode = 'Attr';
        let explanation = '句子构成词元';
        if (/^(although|though|because|when|while|if|unless|that|which|who)$/.test(lower)) {
          role = '连词/引导词';
          roleCode = 'Conn';
          explanation = '引导从句或连接并列结构';
        } else if (idx === 0 || /^(the|a|an|this|that|their|his|her|our|students|researchers|he|she|it|they|i|we)$/.test(lower)) {
          role = idx < 4 ? '主语成分' : '定语/限定词';
          roleCode = idx < 4 ? 'S' : 'Attr';
          explanation = idx < 4 ? '动作的发出者或主句核心探讨对象' : '限定或修饰后面的核心名词';
        } else if (/^(is|are|was|were|be|been|continued|completed|found|studied|analyzed|made|took|had|have|will|can|would)$/.test(lower) || /ed$/.test(lower)) {
          role = '谓语动词';
          roleCode = 'V';
          explanation = '表示核心动作或状态，体现时态与语态';
        } else if (/^(in|on|at|with|by|for|from|to|under|through|during)$/.test(lower)) {
          role = '介词短语(状语)';
          roleCode = 'Adv';
          explanation = '构成介词短语，修饰动作发生的时间、地点或方式';
        } else if (idx > words.length / 2) {
          role = '宾语/表语/补足';
          roleCode = 'O';
          explanation = '承受谓语动词的动作或补充说明主语状态';
        }
        return { text: w, role, roleCode, explanation };
      }),
      steps: [
        {
          step: 1,
          title: '第一步：定位句子主干谓语与连词边界',
          description: '先找出句中的限定动词（谓语）与从属连词，划分主句与从句的边界。',
          highlightRoles: ['Conn', 'V'],
        },
        {
          step: 2,
          title: '第二步：提取主句主干（主语 + 谓语 + 宾语/表语）',
          description: '剥离修饰成分，确立句子的核心事件骨架。',
          highlightRoles: ['S', 'V', 'O'],
        },
        {
          step: 3,
          title: '第三步：挂载定语、状语与从句修饰层',
          description: '将介词短语、形容词定语和状语从句重新挂回主干，还原完整句意。',
          highlightRoles: ['S', 'V', 'O', 'Attr', 'Adv', 'Conn'],
        },
      ],
      syntaxTree: {
        id: 'root',
        label: 'S (完整句子)',
        role: 'Clause',
        text: sentence,
        children: [
          {
            id: 'np-subj',
            label: 'NP (主语模块 / 从句引导部)',
            role: 'S',
            text: words.slice(0, Math.max(2, Math.floor(words.length * 0.35))).join(' '),
            children: [
              {
                id: 'subj-core',
                label: '核心主语/从句成分',
                role: 'S',
                text: words.slice(0, Math.max(2, Math.floor(words.length * 0.35))).join(' '),
              },
            ],
          },
          {
            id: 'vp-pred',
            label: 'VP (谓语动词短语)',
            role: 'V',
            text: words.slice(Math.max(2, Math.floor(words.length * 0.35))).join(' '),
            children: [
              {
                id: 'v-core',
                label: 'V (核心谓语)',
                role: 'V',
                text: words.slice(Math.floor(words.length * 0.35), Math.floor(words.length * 0.6)).join(' '),
              },
              {
                id: 'obj-adv',
                label: 'NP / PP (宾语与状语扩展)',
                role: 'O',
                text: words.slice(Math.floor(words.length * 0.6)).join(' '),
              },
            ],
          },
        ],
      },
    };
  }

  if (taskType === 'translation_grade') {
    const userTranslation = String(payload.userTranslation || '').trim();
    const reference = String(payload.referenceEnglish || '').trim();
    const refWords = new Set(reference.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean));
    const userWords = userTranslation.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
    const matched = userWords.filter((w) => refWords.has(w)).length;
    const ratio = refWords.size > 0 ? Math.min(1, matched / Math.max(4, refWords.size * 0.65)) : 0.7;
    const baseScore = userTranslation.length < 5 ? 35 : Math.round(68 + ratio * 26);

    return {
      overallScore: baseScore,
      dimensions: {
        accuracy: Math.min(98, baseScore + 2),
        grammar: Math.min(96, baseScore),
        idiomaticity: Math.max(60, baseScore - 3),
      },
      commentary: '【本地启发式评估（未配置 AI 密钥）】你的译文已涵盖核心语义主干。若需获取逐词语法纠错、文学修辞对比与地道母语润色，请在右上角「AI 配置」中填入 OpenAI 兼容 API Key。',
      strengths: [
        '主干语义传达清晰，句子基本结构完整',
        '核心实词与原句关键概念具备较高对应度',
      ],
      improvements: [
        '注意主从句之间的逻辑连接词选择及从句语序',
        '可进一步借鉴原著/原片中的具象化动词与文学修辞搭配',
      ],
      polishedVersion: reference,
    };
  }

  if (taskType === 'ielts_evaluate') {
    const skill = String(payload.skill || 'writing');
    const userText = String(payload.userResponse || '').trim();
    const wordCount = userText.split(/\s+/).filter(Boolean).length;
    const band = wordCount > 120 ? 7.0 : wordCount > 50 ? 6.5 : 6.0;
    return {
      overallBand: band,
      criteria: {
        taskResponse: band,
        coherence: band,
        lexical: band + 0.5,
        grammar: band - 0.5,
      },
      summary: `【本地启发式评估（当前字数：${wordCount} 词）】已根据作答长度与词汇复杂度生成初步预估。配置 OpenAI 兼容 API Key 后，Worker 将通过代理调用大模型提供官方四维考官级逐句精批。`,
      strengths: [
        '切题度良好，论点方向明确，段落层次清晰',
        '尝试使用了复合句型与学术衔接手段',
      ],
      improvements: [
        '建议增加高阶同义替换（Lexical Resource），避免同一核心词重复出现',
        '可适当引入非谓语结构、定语从句与让步状语从句以提升 GRA 评分',
      ],
      upgradedVersion: String(payload.referenceAnswer || '请在右上角配置 AI 服务以生成针对您作答内容的 Band 8.5 定制升格范文。'),
      highBandVocabulary: [
        { word: 'mitigate / alleviate', meaning: '缓解、减轻（替代 solve / reduce）' },
        { word: 'indispensable', meaning: '不可或缺的（替代 very important）' },
        { word: 'exacerbate', meaning: '加剧、恶化（替代 make worse）' },
      ],
      skill,
    };
  }

  return {
    reply: '你好！我是运行在 Cloudflare Workers 边缘节点的 AI 英语助教。当前处于离线演示模式，你可以点击右上角「AI 配置」填入 OpenAI / DeepSeek / 通义千问等兼容接口的 Base URL 与 API Key，即可通过 Worker 安全代理开启实时语法拆解、文学翻译精批与雅思四科考官级辅导！',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const userId = request.headers.get('X-User-Id') || url.searchParams.get('userId') || 'default-learner';

    // ========================================================================
    // 1. 健康检查与环境诊断接口: GET /api/health
    // ========================================================================
    if (url.pathname === '/api/health' && request.method === 'GET') {
      const backend = await detectStorageBackend(env);
      return jsonResponse({
        ok: true,
        runtime: 'cloudflare-workers',
        storageBackend: backend,
        hasDefaultServerKey: Boolean(env.DEFAULT_AI_API_KEY),
        defaultBaseUrl: env.DEFAULT_AI_BASE_URL || 'https://api.openai.com/v1',
        defaultModel: env.DEFAULT_AI_MODEL || 'gpt-4o-mini',
        timestamp: new Date().toISOString(),
      });
    }

    // ========================================================================
    // 2. 用户状态与 AI 配置持久化接口: GET & PUT /api/state
    // ========================================================================
    if (url.pathname === '/api/state') {
      const backend = await detectStorageBackend(env);

      if (request.method === 'GET') {
        if (backend === 'd1' && env.DB) {
          const row = await env.DB.prepare(
            'SELECT ai_config_json, progress_json, updated_at FROM user_profiles WHERE user_id = ?'
          )
            .bind(userId)
            .first<{ ai_config_json: string; progress_json: string; updated_at: string }>();

          return jsonResponse({
            ok: true,
            storageBackend: 'd1',
            userId,
            aiConfig: row ? JSON.parse(row.ai_config_json || '{}') : null,
            progress: row ? JSON.parse(row.progress_json || '{}') : null,
            updatedAt: row?.updated_at || null,
          });
        }

        if (backend === 'kv' && env.STORAGE_KV) {
          const raw = await env.STORAGE_KV.get(`profile:${userId}`);
          const parsed = raw ? JSON.parse(raw) : null;
          return jsonResponse({
            ok: true,
            storageBackend: 'kv',
            userId,
            aiConfig: parsed?.aiConfig || null,
            progress: parsed?.progress || null,
            updatedAt: parsed?.updatedAt || null,
          });
        }

        const mem = memoryStore.profiles.get(userId);
        return jsonResponse({
          ok: true,
          storageBackend: 'memory',
          userId,
          aiConfig: mem?.aiConfig || null,
          progress: mem?.progress || null,
          updatedAt: mem?.updatedAt || null,
        });
      }

      if (request.method === 'PUT' || request.method === 'POST') {
        const body = (await request.json()) as {
          aiConfig?: AIConfigPayload;
          progress?: Record<string, unknown>;
        };
        const now = new Date().toISOString();

        if (backend === 'd1' && env.DB) {
          const existing = await env.DB.prepare(
            'SELECT ai_config_json, progress_json FROM user_profiles WHERE user_id = ?'
          )
            .bind(userId)
            .first<{ ai_config_json: string; progress_json: string }>();

          const mergedAiConfig = body.aiConfig ?? (existing ? JSON.parse(existing.ai_config_json) : {});
          const mergedProgress = body.progress ?? (existing ? JSON.parse(existing.progress_json) : {});

          await env.DB.prepare(
            `INSERT INTO user_profiles (user_id, ai_config_json, progress_json, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(user_id) DO UPDATE SET
               ai_config_json = excluded.ai_config_json,
               progress_json = excluded.progress_json,
               updated_at = excluded.updated_at`
          )
            .bind(userId, JSON.stringify(mergedAiConfig), JSON.stringify(mergedProgress), now)
            .run();

          return jsonResponse({ ok: true, storageBackend: 'd1', updatedAt: now });
        }

        if (backend === 'kv' && env.STORAGE_KV) {
          const existingRaw = await env.STORAGE_KV.get(`profile:${userId}`);
          const existing = existingRaw ? JSON.parse(existingRaw) : {};
          const payload = {
            aiConfig: body.aiConfig ?? existing.aiConfig ?? {},
            progress: body.progress ?? existing.progress ?? {},
            updatedAt: now,
          };
          await env.STORAGE_KV.put(`profile:${userId}`, JSON.stringify(payload));
          return jsonResponse({ ok: true, storageBackend: 'kv', updatedAt: now });
        }

        const existingMem = memoryStore.profiles.get(userId);
        memoryStore.profiles.set(userId, {
          aiConfig: body.aiConfig ?? existingMem?.aiConfig ?? {},
          progress: body.progress ?? existingMem?.progress ?? {},
          updatedAt: now,
        });
        return jsonResponse({ ok: true, storageBackend: 'memory', updatedAt: now });
      }
    }

    // ========================================================================
    // 3. 练习历史与自定义句子持久化接口: /api/history & /api/sentences
    // ========================================================================
    if (url.pathname === '/api/history') {
      const backend = await detectStorageBackend(env);
      const moduleFilter = url.searchParams.get('module');

      if (request.method === 'GET') {
        if (backend === 'd1' && env.DB) {
          const query = moduleFilter
            ? 'SELECT * FROM practice_records WHERE user_id = ? AND module = ? ORDER BY created_at DESC LIMIT 50'
            : 'SELECT * FROM practice_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';
          const stmt = moduleFilter
            ? env.DB.prepare(query).bind(userId, moduleFilter)
            : env.DB.prepare(query).bind(userId);
          const { results } = await stmt.all<{
            id: string;
            user_id: string;
            module: string;
            item_id: string;
            title: string;
            user_input: string;
            score: number | null;
            feedback_json: string;
            created_at: string;
          }>();

          const records: PracticeRecord[] = (results || []).map((r) => ({
            id: r.id,
            userId: r.user_id,
            module: r.module,
            itemId: r.item_id,
            title: r.title,
            userInput: r.user_input,
            score: r.score,
            feedback: JSON.parse(r.feedback_json || '{}'),
            createdAt: r.created_at,
          }));
          return jsonResponse({ ok: true, storageBackend: 'd1', records });
        }

        if (backend === 'kv' && env.STORAGE_KV) {
          const raw = await env.STORAGE_KV.get(`history:${userId}`);
          const allRecords: PracticeRecord[] = raw ? JSON.parse(raw) : [];
          const filtered = moduleFilter ? allRecords.filter((r) => r.module === moduleFilter) : allRecords;
          return jsonResponse({ ok: true, storageBackend: 'kv', records: filtered.slice(0, 50) });
        }

        const allMem = memoryStore.records.get(userId) || [];
        const filtered = moduleFilter ? allMem.filter((r) => r.module === moduleFilter) : allMem;
        return jsonResponse({ ok: true, storageBackend: 'memory', records: filtered.slice(0, 50) });
      }

      if (request.method === 'POST') {
        const body = (await request.json()) as {
          module: string;
          itemId: string;
          title: string;
          userInput: string;
          score?: number | null;
          feedback?: Record<string, unknown>;
        };

        const record: PracticeRecord = {
          id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          userId,
          module: body.module || 'general',
          itemId: body.itemId || 'custom',
          title: body.title || '练习记录',
          userInput: body.userInput || '',
          score: body.score ?? null,
          feedback: body.feedback || {},
          createdAt: new Date().toISOString(),
        };

        if (backend === 'd1' && env.DB) {
          await env.DB.prepare(
            `INSERT INTO practice_records (id, user_id, module, item_id, title, user_input, score, feedback_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              record.id,
              record.userId,
              record.module,
              record.itemId,
              record.title,
              record.userInput,
              record.score,
              JSON.stringify(record.feedback),
              record.createdAt
            )
            .run();
          return jsonResponse({ ok: true, storageBackend: 'd1', record });
        }

        if (backend === 'kv' && env.STORAGE_KV) {
          const raw = await env.STORAGE_KV.get(`history:${userId}`);
          const list: PracticeRecord[] = raw ? JSON.parse(raw) : [];
          list.unshift(record);
          await env.STORAGE_KV.put(`history:${userId}`, JSON.stringify(list.slice(0, 100)));
          return jsonResponse({ ok: true, storageBackend: 'kv', record });
        }

        const list = memoryStore.records.get(userId) || [];
        list.unshift(record);
        memoryStore.records.set(userId, list.slice(0, 100));
        return jsonResponse({ ok: true, storageBackend: 'memory', record });
      }
    }

    if (url.pathname === '/api/sentences') {
      const backend = await detectStorageBackend(env);

      if (request.method === 'GET') {
        if (backend === 'd1' && env.DB) {
          const { results } = await env.DB.prepare(
            'SELECT * FROM saved_sentences WHERE user_id = ? ORDER BY created_at DESC LIMIT 30'
          )
            .bind(userId)
            .all<{ id: string; user_id: string; sentence: string; analysis_json: string; created_at: string }>();

          return jsonResponse({
            ok: true,
            storageBackend: 'd1',
            sentences: (results || []).map((r) => ({
              id: r.id,
              userId: r.user_id,
              sentence: r.sentence,
              analysis: JSON.parse(r.analysis_json || '{}'),
              createdAt: r.created_at,
            })),
          });
        }

        if (backend === 'kv' && env.STORAGE_KV) {
          const raw = await env.STORAGE_KV.get(`sentences:${userId}`);
          return jsonResponse({ ok: true, storageBackend: 'kv', sentences: raw ? JSON.parse(raw) : [] });
        }

        return jsonResponse({
          ok: true,
          storageBackend: 'memory',
          sentences: memoryStore.sentences.get(userId) || [],
        });
      }

      if (request.method === 'POST') {
        const body = (await request.json()) as { sentence: string; analysis: Record<string, unknown> };
        const item: SavedSentenceRecord = {
          id: `sent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId,
          sentence: body.sentence,
          analysis: body.analysis,
          createdAt: new Date().toISOString(),
        };

        if (backend === 'd1' && env.DB) {
          await env.DB.prepare(
            'INSERT INTO saved_sentences (id, user_id, sentence, analysis_json, created_at) VALUES (?, ?, ?, ?, ?)'
          )
            .bind(item.id, item.userId, item.sentence, JSON.stringify(item.analysis), item.createdAt)
            .run();
          return jsonResponse({ ok: true, storageBackend: 'd1', item });
        }

        if (backend === 'kv' && env.STORAGE_KV) {
          const raw = await env.STORAGE_KV.get(`sentences:${userId}`);
          const list: SavedSentenceRecord[] = raw ? JSON.parse(raw) : [];
          list.unshift(item);
          await env.STORAGE_KV.put(`sentences:${userId}`, JSON.stringify(list.slice(0, 50)));
          return jsonResponse({ ok: true, storageBackend: 'kv', item });
        }

        const list = memoryStore.sentences.get(userId) || [];
        list.unshift(item);
        memoryStore.sentences.set(userId, list.slice(0, 50));
        return jsonResponse({ ok: true, storageBackend: 'memory', item });
      }
    }

    // ========================================================================
    // 4. OpenAI 兼容代理转发接口: POST /api/ai/chat & POST /api/ai/test
    // ========================================================================
    if (url.pathname === '/api/ai/test' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { aiConfig?: AIConfigPayload };
        const cfg = body.aiConfig || {};
        const apiKey = (cfg.apiKey || env.DEFAULT_AI_API_KEY || '').trim();
        const baseUrl = cfg.baseUrl || env.DEFAULT_AI_BASE_URL || 'https://api.openai.com/v1';
        const model = cfg.model || env.DEFAULT_AI_MODEL || 'gpt-4o-mini';

        if (!apiKey) {
          return jsonResponse(
            {
              ok: false,
              error: '未提供 API Key（前端未填写且 Worker 服务端未配置 DEFAULT_AI_API_KEY）',
            },
            400
          );
        }

        const endpoint = normalizeOpenAIBaseUrl(baseUrl);
        const startTime = Date.now();
        const upstreamRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are a helpful English learning assistant.' },
              { role: 'user', content: 'Reply with a short greeting in 10 words to confirm connection.' },
            ],
            max_tokens: 32,
            temperature: 0.3,
          }),
        });

        const latencyMs = Date.now() - startTime;
        if (!upstreamRes.ok) {
          const errText = await upstreamRes.text();
          return jsonResponse(
            {
              ok: false,
              status: upstreamRes.status,
              endpoint,
              error: `上游 AI 服务返回错误 (${upstreamRes.status}): ${errText.slice(0, 240)}`,
            },
            upstreamRes.status
          );
        }

        const data = (await upstreamRes.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          model?: string;
        };
        const reply = data.choices?.[0]?.message?.content || 'Connection verified!';

        return jsonResponse({
          ok: true,
          endpoint,
          model: data.model || model,
          latencyMs,
          reply,
        });
      } catch (err) {
        return jsonResponse(
          {
            ok: false,
            error: err instanceof Error ? err.message : '连接上游 AI 服务失败',
          },
          500
        );
      }
    }

    if (url.pathname === '/api/ai/chat' && request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          taskType: 'grammar_analyze' | 'translation_grade' | 'ielts_evaluate' | 'tutor_chat';
          payload: Record<string, unknown>;
          aiConfig?: AIConfigPayload;
        };

        const { taskType, payload, aiConfig } = body;
        const apiKey = (aiConfig?.apiKey || env.DEFAULT_AI_API_KEY || '').trim();
        const baseUrl = aiConfig?.baseUrl || env.DEFAULT_AI_BASE_URL || 'https://api.openai.com/v1';
        const model = aiConfig?.model || env.DEFAULT_AI_MODEL || 'gpt-4o-mini';
        const temperature = typeof aiConfig?.temperature === 'number' ? aiConfig.temperature : 0.4;
        const maxTokens = typeof aiConfig?.maxTokens === 'number' ? aiConfig.maxTokens : 2000;

        // 若未配置任何 API Key，则返回离线启发式结构化数据并标记 mode = 'heuristic'
        if (!apiKey) {
          return jsonResponse({
            ok: true,
            mode: 'heuristic',
            model: 'local-heuristic-engine',
            data: buildHeuristicFallback(taskType, payload || {}),
          });
        }

        let systemPrompt =
          aiConfig?.customSystemPrompt?.trim() ||
          '你是一位资深的英语语言学专家、文学翻译导师与前雅思考官。请始终使用专业、清晰的中文进行讲解。';
        let userPrompt = '';
        let expectJson = true;

        if (taskType === 'grammar_analyze') {
          systemPrompt +=
            '\n请将用户输入的英语句子拆解为严格的 JSON 格式，不要输出额外解释文本。JSON 结构必须包含：' +
            '{"sentence": "原句", "translation": "精准中文译文", "pattern": "句型结构概括(如 主句SVO + 让步状语从句)", "difficulty": "初级(B1)/中级(B2)/高级(C1)", "summary": "核心语法点与句法逻辑总览(60-120字)", ' +
            '"tokens": [{"text": "词或短语片段", "role": "中文成分名(主语/谓语动词/宾语/表语/定语/状语/补语/连词/同位语/从句)", "roleCode": "S|V|O|P|Attr|Adv|Comp|Conn|Clause", "explanation": "该片段在句中的语法功能解析"}], ' +
            '"steps": [{"step": 1, "title": "步骤标题", "description": "拆解说明", "highlightRoles": ["S", "V"]}], ' +
            '"syntaxTree": {"id": "root", "label": "S (完整句)", "role": "Clause", "text": "完整句文本", "children": [{"id": "n1", "label": "NP (主语短语)", "role": "S", "text": "...", "children": []}]}}';
          userPrompt = `请深度拆解以下英语句子的语法成分与短语结构句法树：\n"${payload.sentence}"`;
        } else if (taskType === 'translation_grade') {
          systemPrompt +=
            '\n请对用户的中译英句子进行多维评分与批改，返回严格 JSON 格式：' +
            '{"overallScore": 88, "dimensions": {"accuracy": 90, "grammar": 86, "idiomaticity": 88}, ' +
            '"commentary": "总体点评(指出亮点与核心差距)", "strengths": ["亮点1", "亮点2"], "improvements": ["具体改进建议1", "具体改进建议2"], "polishedVersion": "保留用户思路的高阶母语润色版本"}';
          userPrompt =
            `中文原句：${payload.chinese}\n` +
            `出处背景：${payload.sourceTitle || ''} (${payload.sourceWork || ''})\n` +
            `原著/影视参考英文：${payload.referenceEnglish}\n` +
            `用户提交的英文译文：${payload.userTranslation}\n` +
            `请对比原著参考译文，对用户译文进行严格批改。`;
        } else if (taskType === 'ielts_evaluate') {
          systemPrompt +=
            '\n你是一位资深雅思考官。请按照雅思官方四项评分标准对用户的写作或口语作答进行评分与升格，返回严格 JSON 格式：' +
            '{"overallBand": 7.0, "criteria": {"taskResponse": 7.0, "coherence": 7.0, "lexical": 7.5, "grammar": 6.5}, ' +
            '"summary": "考官总评与提分核心建议", "strengths": ["优势1", "优势2"], "improvements": ["问题与修改建议1", "问题与修改建议2"], ' +
            '"upgradedVersion": "基于考生原文升格后的 Band 8.0+ 范文或高分口语回答", ' +
            '"highBandVocabulary": [{"word": "高分替换词/短语", "meaning": "中文释义与替换说明"}]}';
          userPrompt =
            `雅思科目：${payload.skill}\n` +
            `题目/话题：${payload.promptTitle}\n` +
            `题目要求：${payload.promptQuestion}\n` +
            `考生作答内容：${payload.userResponse}\n` +
            `请给出四维 Band 评分、纠错建议及 Band 8.0+ 升格示范。`;
        } else {
          expectJson = false;
          const contextInfo = payload.context ? `\n【当前学习模块上下文】：${payload.context}` : '';
          userPrompt = `${contextInfo}\n\n【用户问题】：${payload.question || payload.message || ''}`;
        }

        const endpoint = normalizeOpenAIBaseUrl(baseUrl);
        const upstreamRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!upstreamRes.ok) {
          const errText = await upstreamRes.text();
          return jsonResponse(
            {
              ok: false,
              status: upstreamRes.status,
              error: `AI 代理请求失败 (${upstreamRes.status}): ${errText.slice(0, 300)}`,
            },
            upstreamRes.status
          );
        }

        const completion = (await upstreamRes.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          model?: string;
        };
        const rawContent = completion.choices?.[0]?.message?.content || '';

        if (expectJson) {
          try {
            const parsedData = extractJsonFromText(rawContent);
            return jsonResponse({
              ok: true,
              mode: 'live',
              model: completion.model || model,
              data: parsedData,
            });
          } catch {
            // 如果模型未严格输出 JSON，则合并启发式结构与原始回复
            const fallback = buildHeuristicFallback(taskType, payload || {}) as Record<string, unknown>;
            return jsonResponse({
              ok: true,
              mode: 'live',
              model: completion.model || model,
              data: {
                ...fallback,
                summary: rawContent,
                commentary: rawContent,
              },
            });
          }
        }

        return jsonResponse({
          ok: true,
          mode: 'live',
          model: completion.model || model,
          data: { reply: rawContent },
        });
      } catch (err) {
        return jsonResponse(
          {
            ok: false,
            error: err instanceof Error ? err.message : 'Worker 代理转发异常',
          },
          500
        );
      }
    }

    // ========================================================================
    // 5. 静态资源服务（转发至 Cloudflare Workers Static Assets）
    // ========================================================================
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      'LinguaForge Worker API is running. Build frontend assets with `npm run build` to serve static files.',
      { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  },
};
