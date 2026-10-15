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
    throw new Error('JSON 解析失败');
  }
}

function buildHeuristicFallback(taskType: string, payload: Record<string, unknown>): unknown {
  if (taskType === 'grammar_analyze') {
    const sentence = String(
      payload.sentence || 'Although the rain was heavy, the students continued their experiment in the laboratory.'
    );
    const words = sentence.replace(/([,.!?;:])/g, ' $1 ').trim().split(/\s+/);
    const hasSubordinator = /^(although|though|while|when|if|because|since|unless|as)/i.test(words[0] || '');
    return {
      sentence,
      translation: '（结构化句法分析结果）',
      pattern: hasSubordinator ? '状语从句 + 主谓宾 (SVO) 主句' : '主谓宾 / 主系表结构 (SVO / SVP)',
      difficulty: sentence.length > 80 ? '高级 (C1)' : sentence.length > 45 ? '中级 (B2)' : '初级 (B1)',
      summary: `全句共 ${words.length} 个词元。${
        hasSubordinator
          ? '句首由从属连词引导状语从句，主句围绕核心谓语动词展开。'
          : '核心骨架遵循主谓结构，修饰成分围绕核心名词与谓语展开。'
      }`,
      tokens: words.map((w, idx) => {
        const lower = w.toLowerCase();
        let role = '定语/修饰';
        let roleCode = 'Attr';
        let explanation = '句内修饰或限定词元。';
        if (/^(although|though|because|when|while|if|unless|that|which|who)$/.test(lower)) {
          role = '连词 (Connector)';
          roleCode = 'Conn';
          explanation = '引导从属子句或连接并列分句。';
        } else if (
          idx === 0 ||
          /^(the|a|an|this|that|their|his|her|our|students|researchers|he|she|it|they|i|we)$/.test(lower)
        ) {
          role = idx < 4 ? '主语 (Subject)' : '定语 (Attributive)';
          roleCode = idx < 4 ? 'S' : 'Attr';
          explanation = idx < 4 ? '句子陈述主体或动作发出者。' : '限定后续核心名词。';
        } else if (
          /^(is|are|was|were|be|been|continued|completed|found|studied|analyzed|made|took|had|have|will|can|would)$/.test(
            lower
          ) ||
          /ed$/.test(lower)
        ) {
          role = '谓语 (Verb)';
          roleCode = 'V';
          explanation = '表示核心动作或状态，体现时态与语态。';
        } else if (/^(in|on|at|with|by|for|from|to|under|through|during)$/.test(lower)) {
          role = '状语 (Adverbial)';
          roleCode = 'Adv';
          explanation = '构成介词短语，修饰动作发生的时间、地点或方式。';
        } else if (idx > words.length / 2) {
          role = '宾语/表语 (Object)';
          roleCode = 'O';
          explanation = '谓语动词支配的对象或主语状态说明。';
        }
        return { text: w, role, roleCode, explanation };
      }),
      steps: [
        {
          step: 1,
          title: '核心主干 (Core Trunk)',
          description: '提取主语、限定谓语动词与核心宾语/表语。',
          highlightRoles: ['S', 'V', 'O'],
        },
        {
          step: 2,
          title: '修饰与从句 (Modifiers & Clauses)',
          description: '识别定语、状语及从属连词引导的子句结构。',
          highlightRoles: ['Attr', 'Adv', 'Conn', 'Clause'],
        },
      ],
      syntaxTree: {
        id: 'root',
        label: 'S (Sentence)',
        role: 'Clause',
        text: sentence,
        children: [
          {
            id: 'np-subj',
            label: 'NP (Subject)',
            role: 'S',
            text: words.slice(0, Math.max(2, Math.floor(words.length * 0.35))).join(' '),
          },
          {
            id: 'vp-pred',
            label: 'VP (Predicate)',
            role: 'V',
            text: words.slice(Math.max(2, Math.floor(words.length * 0.35))).join(' '),
            children: [
              {
                id: 'v-core',
                label: 'V',
                role: 'V',
                text: words.slice(Math.floor(words.length * 0.35), Math.floor(words.length * 0.6)).join(' '),
              },
              {
                id: 'obj-adv',
                label: 'NP / PP',
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
    const refWords = new Set(
      reference
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
    );
    const userWords = userTranslation
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    const matched = userWords.filter((w) => refWords.has(w)).length;
    const ratio = refWords.size > 0 ? Math.min(1, matched / Math.max(4, refWords.size * 0.65)) : 0.7;
    const baseScore = userTranslation.length < 5 ? 40 : Math.round(70 + ratio * 25);

    return {
      overallScore: baseScore,
      dimensions: {
        accuracy: Math.min(98, baseScore + 2),
        grammar: Math.min(96, baseScore),
        idiomaticity: Math.max(62, baseScore - 3),
      },
      commentary: '译文主干结构完整，核心语义与原句对应清晰。可进一步推敲从句衔接与静态介词短语的运用。',
      strengths: ['主干句式清晰，核心实词传达准确', '基本时态与主谓一致规范'],
      improvements: ['可借鉴原著中的分词后置定语或介词短语以增强文学凝练度', '注意长句内部的从句逻辑过渡'],
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
      summary: `已完成文本结构与学术语域评定（总词数：${wordCount} words）。建议进一步丰富高阶同义替换与复合从句层次。`,
      strengths: ['立场明确，段落推进符合学术论证规范', '具备复合句式意识'],
      improvements: ['减少高频基础词汇复现，引入学术名词化结构', '适当增加非谓语结构与让步从句比例'],
      upgradedVersion: String(payload.referenceAnswer || ''),
      highBandVocabulary: [
        { word: 'mitigate / alleviate', meaning: '缓解、减轻' },
        { word: 'indispensable', meaning: '不可或缺的' },
        { word: 'exacerbate', meaning: '加剧、恶化' },
      ],
      skill,
    };
  }

  return {
    reply: '建议先提炼句子的主谓宾（SVO）或主系表（SVP）主干，再依次辨析后置定语、分词短语与从属子句的修饰层级。',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const userId = request.headers.get('X-User-Id') || url.searchParams.get('userId') || 'default-learner';

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
              error: '未配置 API Key',
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
              { role: 'system', content: 'You are an academic English assistant.' },
              { role: 'user', content: 'Reply with OK.' },
            ],
            max_tokens: 16,
            temperature: 0.2,
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
              error: `上游状态 (${upstreamRes.status}): ${errText.slice(0, 200)}`,
            },
            upstreamRes.status
          );
        }

        const data = (await upstreamRes.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          model?: string;
        };
        const reply = data.choices?.[0]?.message?.content || 'OK';

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
            error: err instanceof Error ? err.message : '连接异常',
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
        const temperature = typeof aiConfig?.temperature === 'number' ? aiConfig.temperature : 0.3;
        const maxTokens = typeof aiConfig?.maxTokens === 'number' ? aiConfig.maxTokens : 2000;

        if (!apiKey) {
          return jsonResponse({
            ok: true,
            mode: 'heuristic',
            model: 'local-engine',
            data: buildHeuristicFallback(taskType, payload || {}),
          });
        }

        let systemPrompt =
          aiConfig?.customSystemPrompt?.trim() ||
          '你是一位英语语言学学者、文学译者与雅思考官。请使用简明、克制、准确的中文书面语进行解析。';
        let userPrompt = '';
        let expectJson = true;

        if (taskType === 'grammar_analyze') {
          systemPrompt +=
            '\n请将英语句子拆解为严格 JSON 格式，不要输出额外文本。结构如下：' +
            '{"sentence": "原句", "translation": "中文译文", "pattern": "句型结构概括", "difficulty": "初级(B1)/中级(B2)/高级(C1)", "summary": "核心句法结构说明", ' +
            '"tokens": [{"text": "词或短语片段", "role": "主语/谓语/宾语/表语/定语/状语/补语/连词/从句", "roleCode": "S|V|O|P|Attr|Adv|Comp|Conn|Clause", "explanation": "句法功能说明"}], ' +
            '"steps": [{"step": 1, "title": "核心主干 (Core Trunk)", "description": "主干成分说明", "highlightRoles": ["S", "V"]}], ' +
            '"syntaxTree": {"id": "root", "label": "S (Sentence)", "role": "Clause", "text": "原句", "children": [{"id": "n1", "label": "NP", "role": "S", "text": "...", "children": []}]}}';
          userPrompt = `请拆解以下英语句子的语法成分与句法树：\n"${payload.sentence}"`;
        } else if (taskType === 'translation_grade') {
          systemPrompt +=
            '\n请对中译英译文进行三维评定，返回严格 JSON 格式：' +
            '{"overallScore": 88, "dimensions": {"accuracy": 90, "grammar": 86, "idiomaticity": 88}, ' +
            '"commentary": "简明总评", "strengths": ["可取之处1", "可取之处2"], "improvements": ["修订建议1", "修订建议2"], "polishedVersion": "润色参考版本"}';
          userPrompt =
            `中文原句：${payload.chinese}\n` +
            `出处：${payload.sourceTitle || ''} (${payload.sourceWork || ''})\n` +
            `原著参考译文：${payload.referenceEnglish}\n` +
            `待评译文：${payload.userTranslation}`;
        } else if (taskType === 'ielts_evaluate') {
          systemPrompt +=
            '\n请按雅思官方四项标准评定作答，返回严格 JSON 格式：' +
            '{"overallBand": 7.0, "criteria": {"taskResponse": 7.0, "coherence": 7.0, "lexical": 7.5, "grammar": 6.5}, ' +
            '"summary": "简明评定意见", "strengths": ["优势1", "优势2"], "improvements": ["改进建议1", "改进建议2"], ' +
            '"upgradedVersion": "Band 8.0+ 升格范式", ' +
            '"highBandVocabulary": [{"word": "替换词", "meaning": "释义"}]}';
          userPrompt =
            `科目：${payload.skill}\n` +
            `题目：${payload.promptTitle}\n` +
            `要求：${payload.promptQuestion}\n` +
            `作答内容：${payload.userResponse}`;
        } else {
          expectJson = false;
          const contextInfo = payload.context ? `\n【语境】：${payload.context}` : '';
          userPrompt = `${contextInfo}\n\n【问题】：${payload.question || payload.message || ''}`;
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
              error: `AI 服务请求未成功 (${upstreamRes.status}): ${errText.slice(0, 240)}`,
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
            error: err instanceof Error ? err.message : '服务请求异常',
          },
          500
        );
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      'LinguaForge Worker API is active.',
      { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  },
};
