# LinguaForge — Cloudflare Workers 英语学习与雅思 AI 精研平台

基于 **React 18 + Vite + TypeScript + Cloudflare Workers (Static Assets + D1/KV 持久化 + OpenAI 兼容代理转发)** 构建的全栈英语学习平台。

## 线上地址与部署信息

| 项目 | 值 |
| --- | --- |
| 线上地址 | https://english.791860.xyz |
| 源码仓库 | https://github.com/orz1245/english （默认分支 `main`，推送即触发 CI） |
| Worker 名称 | `linguaforge-english` |
| 自定义域名 | `english.791860.xyz`（`wrangler.toml` 中 `[[routes]] custom_domain = true` 自动托管） |
| D1 数据库 | `linguaforge-db` / `f56b81c6-34ff-41c0-a513-aa54d9162b59`（绑定名 `DB`） |

常用命令：

```bash
npm install
npm run typecheck          # 类型检查（CI 必过）
npm run build              # 构建前端到 dist/client
npx wrangler deploy        # 部署 Worker + 静态资源 + 自定义域名
npx wrangler d1 execute linguaforge-db --remote --file=./schema.sql   # 初始化线上表结构与索引
npx wrangler secret put DEFAULT_AI_API_KEY   # 可选：服务端默认 AI 密钥
```

GitHub Actions 自动部署需在仓库 Settings → Secrets 中配置 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`（未配置时部署步骤会自动跳过），可选 `CLOUDFLARE_D1_DATABASE_ID`、`DEFAULT_AI_API_KEY`。

---

## 一、核心功能架构

1. **英语语法可视化模块 (`src/client/components/GrammarModule.tsx`)**
   - **动画分步成分拆解**：将句子按主语 (`S`)、谓语 (`V`)、宾语 (`O`)、表语 (`P`)、定语 (`Attr`)、状语 (`Adv`)、补语 (`Comp`)、连词 (`Conn`)、从句 (`Clause`) 9 类语法角色进行高对比度色块标注，支持自动播放/暂停分步拆解动画与句法依存关系链展示。
   - **交互式 SVG 短语结构句法树**：支持点击任意父节点折叠/展开子短语或从句节点，直观呈现主从复合句支配层级。
   - **AI 实时自定义句子拆解**：输入任意外刊或真题长难句，通过 Worker 代理调用大模型实时生成成分标注与可视化句法树。

2. **句子翻译分级训练模块 (`src/client/components/TranslationModule.tsx`)**
   - **多难度分级**：涵盖**初级（简单句与并列句）**、**中级（复合从句与非谓语）**、**高级（文学修辞与长难句）**三级训练。
   - **文学名著与经典影视素材**：精选《肖申克的救赎》《阿甘正传》《死亡诗社》《星际穿越》《了不起的盖茨比》《杀死一只知更鸟》《傲慢与偏见》《双城记》原句，附带完整作品创作背景、角色场景介绍、句法提示与文学修辞赏析。
   - **AI 多维翻译精批与云端历史**：从语义准确度、语法规范度、地道文学感三个维度打分，提供亮点总结、改进建议与高阶母语润色，并将练习记录持久化至 Cloudflare D1 / KV。

3. **雅思四科专项学习模块 (`src/client/components/IeltsModule.tsx`)**
   - **听力 (Listening)**：内置英/美音 TTS 变速精听播控（0.85x / 1.0x / 1.15x）、笔记填空训练及剑雅常见自我修正/转折干扰项深度解析。
   - **阅读 (Reading)**：剑雅核心同义替换矩阵（Paraphrase Matrix）、学术长难句结构精析，以及 `TRUE / FALSE / NOT GIVEN` 考官逻辑判断训练。
   - **写作 (Writing)**：涵盖 Task 1（动态图表）与 Task 2（议论文）审题大纲、Band 6.0 与 Band 8.5 语料升格对比，以及按照官方四项标准（TR/TA、CC、LR、GRA）打分的 AI 考官级作文精批。
   - **口语 (Speaking)**：覆盖 Part 1–3 题库与 Cue Card、内置 2 分钟口语模考倒计时器、地道高分习语库及 AI 口语回答润色评分。

4. **AI 配置管理与 Worker 代理转发 (`src/worker/index.ts` & `src/client/components/AiConfigModal.tsx`)**
   - 内置 **OpenAI、DeepSeek、通义千问、SiliconFlow、OpenRouter** 及自定义 OpenAI 兼容网关预设。
   - 所有 AI 请求均由前端发往当前域名的 `/api/ai/chat` 与 `/api/ai/test`，由 Cloudflare Worker 边缘节点代理转发，彻底解决浏览器跨域（CORS）限制，并支持配置服务端默认密钥兜底。
   - 当尚未填写 API Key 时，Worker 自动启用内置**启发式结构化引擎**，保证所有交互开箱即可完整体验。

---

## 二、目录结构

```text
/Users/wen/Dev/cloudflare/grammar
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自动化构建与 Cloudflare Workers 部署工作流
├── .gitignore                  # Git 忽略配置
├── index.html                  # 前端页面入口
├── package.json                # 项目依赖与构建部署脚本
├── wrangler.toml               # Cloudflare Workers 配置文件（Static Assets + D1/KV 绑定）
├── schema.sql                  # Cloudflare D1 数据库初始化表结构
├── vite.config.ts              # Vite 构建与本地开发代理配置
├── tsconfig.json               # TypeScript 配置
├── tailwind.config.js          # Tailwind CSS 配置
└── src/
    ├── worker/
    │   └── index.ts            # Cloudflare Worker 后端入口（API 路由 + 自适应持久化 + OpenAI 代理）
    └── client/
        ├── main.tsx            # React 挂载入口
        ├── App.tsx             # 顶层布局、模块路由与云端同步状态栏
        ├── types.ts            # 全局数据结构与类型定义
        ├── index.css           # 全局样式
        ├── data/
        │   └── courseData.ts   # 语法句法树库、文学影视分级翻译库、雅思四科题库与 AI 预设
        ├── services/
        │   └── api.ts          # Worker API 通信与 D1/KV + LocalStorage 双层持久化服务
        └── components/
            ├── GrammarModule.tsx     # 模块一：英语语法动画拆解与交互式句法树
            ├── TranslationModule.tsx # 模块二：文学与影视多难度分级翻译训练
            ├── IeltsModule.tsx       # 模块三：雅思听说读写四科专项备考
            └── AiConfigModal.tsx     # AI 服务参数配置弹窗与全局上下文 AI 答疑抽屉
```

---

## 三、GitHub Actions 自动部署配置指南

项目已内置 `.github/workflows/deploy.yml` 工作流，推送代码至 `main` 或 `master` 分支即可自动执行前端打包、类型检查并发布到 Cloudflare Workers。

### 1. 在 GitHub 仓库配置 Secrets

前往 GitHub 仓库的 **Settings → Secrets and variables → Actions → New repository secret**，添加以下变量：

| Secret 名称 | 是否必填 | 说明与获取方式 |
| :--- | :---: | :--- |
| `CLOUDFLARE_API_TOKEN` | **必填** | 在 Cloudflare Dashboard → **My Profile → API Tokens** 使用 **Edit Cloudflare Workers** 模板创建（如需使用 D1，请同时勾选 **D1:Edit** 权限）。 |
| `CLOUDFLARE_ACCOUNT_ID` | **必填** | 在 Cloudflare Dashboard 右侧栏或 **Workers & Pages → Overview** 页面复制你的 32 位 Account ID。 |
| `CLOUDFLARE_D1_DATABASE_ID` | 可选 | 若通过 `wrangler d1 create linguaforge-db` 创建了 D1 数据库，可在此填入 `database_id`，工作流会在构建时自动替换 `wrangler.toml` 中的占位符。 |
| `DEFAULT_AI_API_KEY` | 可选 | 服务端兜底的 OpenAI 兼容 API Key；若配置此项，工作流会自动通过 `wrangler secret put` 同步至 Worker。 |

### 2. 触发自动部署与初始化远程 D1 表结构

- **日常代码推送部署**：向 `main` 或 `master` 分支 `git push` 时，自动执行构建并部署至 Cloudflare Workers；提交 Pull Request 时仅执行构建与 TypeScript 类型校验，不触发生产部署。
- **手动触发并初始化 D1 数据库表**：在 GitHub 仓库的 **Actions → Deploy to Cloudflare Workers → Run workflow** 中，将 `init_d1_schema` 设为 `true`，即可在部署前自动对远程 D1 数据库执行 `schema.sql`。

---

## 四、本地开发与命令行部署

```bash
# 1. 安装依赖
npm install

# 2. 本地构建并启动 Worker 预览 (http://localhost:8787)
npm run preview

# 3. 本地命令行直接部署
npm run deploy
```
