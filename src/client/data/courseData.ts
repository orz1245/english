import {
  AIProviderPreset,
  GrammarSentence,
  IeltsListeningItem,
  IeltsReadingItem,
  IeltsSpeakingTopic,
  IeltsWritingPrompt,
  RoleCode,
  TranslationItem,
} from '../types';

export const ROLE_META: Record<
  RoleCode,
  {
    code: RoleCode;
    name: string;
    shortName: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeClass: string;
    strokeColor: string;
    fillColor: string;
    desc: string;
  }
> = {
  S: {
    code: 'S',
    name: '主语 (Subject)',
    shortName: '主语 S',
    bgClass: 'bg-sky-500/15',
    borderClass: 'border-sky-400/60',
    textClass: 'text-sky-300',
    badgeClass: 'bg-sky-500/25 text-sky-200 border-sky-400/40',
    strokeColor: '#38bdf8',
    fillColor: '#0c4a6e',
    desc: '句子叙述的主体或动作发出者，通常由名词短语、代词或主语从句充当。',
  },
  V: {
    code: 'V',
    name: '谓语动词 (Verb)',
    shortName: '谓语 V',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-400/60',
    textClass: 'text-rose-300',
    badgeClass: 'bg-rose-500/25 text-rose-200 border-rose-400/40',
    strokeColor: '#fb7185',
    fillColor: '#881337',
    desc: '句子的核心引擎，决定时态、语态及后续搭配的宾语或补足语结构。',
  },
  O: {
    code: 'O',
    name: '宾语 (Object)',
    shortName: '宾语 O',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-400/60',
    textClass: 'text-emerald-300',
    badgeClass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40',
    strokeColor: '#34d399',
    fillColor: '#064e3b',
    desc: '及物动词或介词所支配的动作承受者，包含直接宾语与间接宾语。',
  },
  P: {
    code: 'P',
    name: '表语 (Predicative)',
    shortName: '表语 P',
    bgClass: 'bg-teal-500/15',
    borderClass: 'border-teal-400/60',
    textClass: 'text-teal-300',
    badgeClass: 'bg-teal-500/25 text-teal-200 border-teal-400/40',
    strokeColor: '#2dd4bf',
    fillColor: '#134e4a',
    desc: '位于系动词之后，用于说明主语的身份、性质、特征或状态。',
  },
  Attr: {
    code: 'Attr',
    name: '定语 (Attributive)',
    shortName: '定语 Attr',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-400/60',
    textClass: 'text-amber-300',
    badgeClass: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
    strokeColor: '#fbbf24',
    fillColor: '#78350f',
    desc: '修饰或限定名词/代词的成分，包括前置形容词、后置介词短语、分词及定语从句。',
  },
  Adv: {
    code: 'Adv',
    name: '状语 (Adverbial)',
    shortName: '状语 Adv',
    bgClass: 'bg-purple-500/15',
    borderClass: 'border-purple-400/60',
    textClass: 'text-purple-300',
    badgeClass: 'bg-purple-500/25 text-purple-200 border-purple-400/40',
    strokeColor: '#c084fc',
    fillColor: '#581c87',
    desc: '修饰动词、形容词或整句，交代时间、地点、原因、条件、让步、伴随或结果。',
  },
  Comp: {
    code: 'Comp',
    name: '补语 (Complement)',
    shortName: '补语 Comp',
    bgClass: 'bg-cyan-500/15',
    borderClass: 'border-cyan-400/60',
    textClass: 'text-cyan-300',
    badgeClass: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/40',
    strokeColor: '#22d3ee',
    fillColor: '#164e63',
    desc: '补充说明主语或宾语的状态与动作（宾语补足语构成复合宾语 SVOC）。',
  },
  Conn: {
    code: 'Conn',
    name: '连词/引导词 (Connector)',
    shortName: '连词 Conn',
    bgClass: 'bg-fuchsia-500/15',
    borderClass: 'border-fuchsia-400/60',
    textClass: 'text-fuchsia-300',
    badgeClass: 'bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-400/40',
    strokeColor: '#e879f9',
    fillColor: '#701a75',
    desc: '连接并列分句或引导从属子句的枢纽词（如 although, which, that, had 等倒装助动词）。',
  },
  Clause: {
    code: 'Clause',
    name: '从句/句法节点 (Clause)',
    shortName: '从句 Clause',
    bgClass: 'bg-indigo-500/15',
    borderClass: 'border-indigo-400/60',
    textClass: 'text-indigo-300',
    badgeClass: 'bg-indigo-500/25 text-indigo-200 border-indigo-400/40',
    strokeColor: '#818cf8',
    fillColor: '#312e81',
    desc: '嵌套在主句内部的完整子句结构（定语从句、状语从句、名词性从句）。',
  },
};

export const GRAMMAR_SENTENCES: GrammarSentence[] = [
  {
    id: 'gram-1',
    category: '复合宾语与后置定语 (SVOC)',
    title: '科技变革对工作方式的重塑',
    difficulty: '初级 (B1)',
    sentence: 'Digital technology has made remote collaboration across global time zones remarkably efficient.',
    translation: '数字技术已经让跨越全球不同时区的远程协作变得异常高效。',
    pattern: '主语 (S) + 谓语 (V) + 宾语 (O) + 后置定语 (Attr) + 宾语补足语 (Comp)',
    summary:
      '本句是典型的 SVOC（主谓宾宾补）结构。核心陷阱在于宾语 "remote collaboration" 后面紧跟了介词短语 "across global time zones" 作后置定语，将宾语和形容词宾补 "remarkably efficient" 分隔开。',
    keyPoints: [
      'make + 宾语 (NP) + 形容词短语 (AdjP) 构成复合宾语结构',
      '介词短语 across global time zones 后置修饰核心名词 collaboration',
      '副词 remarkably 修饰形容词 efficient，共同构成宾语补足语',
    ],
    tokens: [
      {
        text: 'Digital technology',
        role: '主语 (Subject)',
        roleCode: 'S',
        explanation: '名词短语作主语：形容词 Digital 修饰核心名词 technology。',
      },
      {
        text: 'has made',
        role: '谓语动词 (Verb)',
        roleCode: 'V',
        explanation: '现在完成时谓语动词，表示过去发生并持续对现在产生影响的动作。',
      },
      {
        text: 'remote collaboration',
        role: '宾语 (Object)',
        roleCode: 'O',
        explanation: '谓语动词 has made 的核心直接宾语。',
      },
      {
        text: 'across global time zones',
        role: '后置定语 (Attributive)',
        roleCode: 'Attr',
        explanation: '介词短语作后置定语，限定“远程协作”跨越的空间范围。',
      },
      {
        text: 'remarkably efficient.',
        role: '宾语补足语 (Complement)',
        roleCode: 'Comp',
        explanation: '形容词短语作宾语补足语，补充说明宾语 collaboration 的状态与结果。',
      },
    ],
    steps: [
      {
        step: 1,
        title: '第一步：锁定句子主干动词与主语',
        description: '找出限定谓语动词 "has made" 及其前面的动作发出者 "Digital technology"。',
        highlightRoles: ['S', 'V'],
      },
      {
        step: 2,
        title: '第二步：识别核心宾语与宾语补足语 (SVOC)',
        description: '"make + O + Adj" 结构中，"remote collaboration" 是宾语，"remarkably efficient" 是补充说明宾语状态的宾补。',
        highlightRoles: ['S', 'V', 'O', 'Comp'],
      },
      {
        step: 3,
        title: '第三步：挂载中间插入的后置定语',
        description: '介词短语 "across global time zones" 紧跟宾语之后对其进行限定，还原完整句法链条。',
        highlightRoles: ['S', 'V', 'O', 'Attr', 'Comp'],
      },
    ],
    syntaxTree: {
      id: 'g1-s',
      label: 'S (主谓宾宾补句 SVOC)',
      role: 'Clause',
      text: 'Digital technology has made remote collaboration across global time zones remarkably efficient.',
      children: [
        {
          id: 'g1-np',
          label: 'NP (主语短语)',
          role: 'S',
          text: 'Digital technology',
          children: [
            { id: 'g1-attr1', label: 'Adj (前置定语)', role: 'Attr', text: 'Digital' },
            { id: 'g1-n1', label: 'N (核心主语)', role: 'S', text: 'technology' },
          ],
        },
        {
          id: 'g1-vp',
          label: 'VP (谓语动词短语)',
          role: 'V',
          text: 'has made remote collaboration ... remarkably efficient',
          children: [
            { id: 'g1-v', label: 'V (现在完成时谓语)', role: 'V', text: 'has made' },
            {
              id: 'g1-obj-np',
              label: 'NP (复杂宾语短语)',
              role: 'O',
              text: 'remote collaboration across global time zones',
              children: [
                { id: 'g1-o-core', label: 'NP (核心宾语)', role: 'O', text: 'remote collaboration' },
                { id: 'g1-o-pp', label: 'PP (后置定语)', role: 'Attr', text: 'across global time zones' },
              ],
            },
            {
              id: 'g1-comp',
              label: 'AdjP (宾语补足语)',
              role: 'Comp',
              text: 'remarkably efficient',
            },
          ],
        },
      ],
    },
    dependencies: [
      { fromIndex: 1, toIndex: 0, label: '主谓 (subj)' },
      { fromIndex: 1, toIndex: 2, label: '动宾 (dobj)' },
      { fromIndex: 2, toIndex: 3, label: '后置定语 (prep)' },
      { fromIndex: 1, toIndex: 4, label: '宾补 (oprd)' },
    ],
  },
  {
    id: 'gram-2',
    category: '分词状语与定语从句嵌套',
    title: '考古发现与古代文明贸易网',
    difficulty: '中级 (B2)',
    sentence: 'Equipped with advanced sonar instruments, the marine archaeologists discovered a sunken merchant vessel that dated back to the Bronze Age.',
    translation: '海洋考古学家们配备了先进的声呐仪器，发现了一艘可追溯至青铜时代的沉没商船。',
    pattern: '过去分词状语 (Adv) + 主语 (S) + 谓语 (V) + 宾语 (O) + 定语从句 (Attr)',
    summary:
      '本句结合了两大高频高阶语法点：句首使用过去分词短语 "Equipped with..." 作伴随/条件状语（逻辑主语与主句主语 the marine archaeologists 一致），句尾使用 that 引导的限制性定语从句修饰先行词 vessel。',
    keyPoints: [
      '句首过去分词短语 Equipped with... 表被动完成状态，逻辑主语即主句主语',
      'sunken 为过去分词作前置定语（已沉没的）',
      'that dated back to the Bronze Age 为限制性定语从句修饰 merchant vessel',
    ],
    tokens: [
      {
        text: 'Equipped with advanced sonar instruments,',
        role: '分词状语 (Adverbial)',
        roleCode: 'Adv',
        explanation: '过去分词短语置于句首作状语，源自 be equipped with，逻辑主语是 archaeologists。',
      },
      {
        text: 'the marine archaeologists',
        role: '主语 (Subject)',
        roleCode: 'S',
        explanation: '主句核心主语，“海洋考古学家们”。',
      },
      {
        text: 'discovered',
        role: '谓语动词 (Verb)',
        roleCode: 'V',
        explanation: '一般过去时及物动词，充当主句核心谓语。',
      },
      {
        text: 'a sunken merchant vessel',
        role: '宾语 (Object)',
        roleCode: 'O',
        explanation: 'discovered 的直接宾语，同时作为后续定语从句的先行词。',
      },
      {
        text: 'that',
        role: '关系代词 (Connector)',
        roleCode: 'Conn',
        explanation: '引导限制性定语从句，指代先行词 vessel 并在从句中作主语。',
      },
      {
        text: 'dated back to the Bronze Age.',
        role: '定语从句 (Attributive)',
        roleCode: 'Attr',
        explanation: '定语从句谓语部分，date back to 意为“追溯到……”。',
      },
    ],
    steps: [
      {
        step: 1,
        title: '第一步：提取主句核心骨架 (SVO)',
        description: '略去句首逗号前的非谓语结构与句尾从句，抓取主干："the marine archaeologists discovered a sunken merchant vessel"。',
        highlightRoles: ['S', 'V', 'O'],
      },
      {
        step: 2,
        title: '第二步：解析句首过去分词状语',
        description: '"Equipped with advanced sonar instruments" 说明主语在执行发现动作时的装备条件。',
        highlightRoles: ['Adv', 'S', 'V', 'O'],
      },
      {
        step: 3,
        title: '第三步：拆解句尾限制性定语从句',
        description: '关系代词 "that" 指代 "vessel"，将 "dated back to the Bronze Age" 挂载为后置定语。',
        highlightRoles: ['Adv', 'S', 'V', 'O', 'Conn', 'Attr'],
      },
    ],
    syntaxTree: {
      id: 'g2-s',
      label: 'S (含非谓语状语与定语从句的复合句)',
      role: 'Clause',
      text: 'Equipped with ..., the marine archaeologists discovered a sunken merchant vessel that dated back to the Bronze Age.',
      children: [
        {
          id: 'g2-adv',
          label: 'Participle Phrase (过去分词状语)',
          role: 'Adv',
          text: 'Equipped with advanced sonar instruments',
        },
        {
          id: 'g2-main',
          label: 'Main Clause (主句 SVO)',
          role: 'Clause',
          text: 'the marine archaeologists discovered a sunken merchant vessel...',
          children: [
            { id: 'g2-subj', label: 'NP (主句主语)', role: 'S', text: 'the marine archaeologists' },
            {
              id: 'g2-vp',
              label: 'VP (主句谓语短语)',
              role: 'V',
              text: 'discovered a sunken merchant vessel that...',
              children: [
                { id: 'g2-v', label: 'V (谓语动词)', role: 'V', text: 'discovered' },
                {
                  id: 'g2-obj',
                  label: 'NP (先行词宾语 + 定语从句)',
                  role: 'O',
                  text: 'a sunken merchant vessel that dated back to the Bronze Age',
                  children: [
                    { id: 'g2-o-head', label: 'NP (先行词)', role: 'O', text: 'a sunken merchant vessel' },
                    {
                      id: 'g2-rc',
                      label: 'Relative Clause (定语从句)',
                      role: 'Attr',
                      text: 'that dated back to the Bronze Age',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    dependencies: [
      { fromIndex: 2, toIndex: 0, label: '分词状语 (advcl)' },
      { fromIndex: 2, toIndex: 1, label: '主谓 (nsubj)' },
      { fromIndex: 2, toIndex: 3, label: '动宾 (dobj)' },
      { fromIndex: 3, toIndex: 5, label: '定语从句 (relcl)' },
    ],
  },
  {
    id: 'gram-3',
    category: '让步状语从句与同位语从句',
    title: '气候科学与政策制定的博弈',
    difficulty: '高级 (C1)',
    sentence: 'While temporary economic fluctuations often dominate public debates, leading climatologists maintain the consensus that decarbonization remains an urgent priority.',
    translation: '尽管短期的经济波动常常主导公共辩论，但顶尖气候学家仍坚持一个共识，即脱碳依然是当务之急。',
    pattern: '让步状语从句 (Adv) + 主句主语 (S) + 谓语 (V) + 宾语 (O) + 同位语从句 (Clause)',
    summary:
      '雅思写作与外刊阅读经典句式：句首由 While 引导让步状语从句（“尽管……”），形成先抑后扬的论证节奏；主句宾语 "the consensus" 后紧跟由 that 引导的同位语从句，完整解释“共识”的具体内容。',
    keyPoints: [
      'While 位于句首表让步，相当于 Although / Whereas，引导让步状语从句',
      'that 引导同位语从句解释抽象名词 consensus 的具体内容，that 在从句中不作成分但不可省略',
      '同位语从句内部为系表结构：decarbonization (S) + remains (系动词 V) + an urgent priority (表语 P)',
    ],
    tokens: [
      {
        text: 'While',
        role: '从属连词 (Connector)',
        roleCode: 'Conn',
        explanation: '引导让步状语从句，表示“尽管、虽然”。',
      },
      {
        text: 'temporary economic fluctuations often dominate public debates,',
        role: '让步状语从句 (Adverbial)',
        roleCode: 'Adv',
        explanation: '完整的主谓宾子句，作为让步背景衬托主句观点。',
      },
      {
        text: 'leading climatologists',
        role: '主句主语 (Subject)',
        roleCode: 'S',
        explanation: '主句动作发出者，“顶尖气候学家们”。',
      },
      {
        text: 'maintain',
        role: '主句谓语 (Verb)',
        roleCode: 'V',
        explanation: '及物动词，此处意为“坚持认为、主张”。',
      },
      {
        text: 'the consensus',
        role: '主句宾语 (Object)',
        roleCode: 'O',
        explanation: '抽象名词作宾语，后接同位语从句展开说明其内涵。',
      },
      {
        text: 'that',
        role: '同位语引导词 (Connector)',
        roleCode: 'Conn',
        explanation: '引导同位语从句，仅起连接作用，不充当从句内部成分。',
      },
      {
        text: 'decarbonization remains an urgent priority.',
        role: '同位语从句 (Clause)',
        roleCode: 'Clause',
        explanation: '与 the consensus 同位，揭示共识的具体命题（内部为主系表 SVP 结构）。',
      },
    ],
    steps: [
      {
        step: 1,
        title: '第一步：切分让步从句与主句边界',
        description: '以逗号为界，识别句首 While 引导的让步状语从句与逗号后的核心主句。',
        highlightRoles: ['Conn', 'Adv'],
      },
      {
        step: 2,
        title: '第二步：提取主句主谓宾主干',
        description: '主句主干为 "leading climatologists (S) maintain (V) the consensus (O)"。',
        highlightRoles: ['S', 'V', 'O'],
      },
      {
        step: 3,
        title: '第三步：解析抽象名词后的同位语从句',
        description: '"that decarbonization remains an urgent priority" 完整揭示 "the consensus" 的具体内容，区别于定语从句（that 不作成分）。',
        highlightRoles: ['Conn', 'Adv', 'S', 'V', 'O', 'Clause'],
      },
    ],
    syntaxTree: {
      id: 'g3-s',
      label: 'S (主从复合句：让步状语从句 + 同位语从句)',
      role: 'Clause',
      text: 'While temporary economic fluctuations..., leading climatologists maintain the consensus that...',
      children: [
        {
          id: 'g3-adv-clause',
          label: 'Adv Clause (While 让步状语从句)',
          role: 'Adv',
          text: 'While temporary economic fluctuations often dominate public debates',
          children: [
            { id: 'g3-c1', label: 'Conj (从属连词)', role: 'Conn', text: 'While' },
            { id: 'g3-sub-s', label: 'NP (从句主语)', role: 'S', text: 'temporary economic fluctuations' },
            { id: 'g3-sub-vp', label: 'VP (从句谓宾)', role: 'V', text: 'often dominate public debates' },
          ],
        },
        {
          id: 'g3-main-clause',
          label: 'Main Clause (核心主句)',
          role: 'Clause',
          text: 'leading climatologists maintain the consensus that decarbonization remains an urgent priority',
          children: [
            { id: 'g3-m-s', label: 'NP (主句主语)', role: 'S', text: 'leading climatologists' },
            {
              id: 'g3-m-vp',
              label: 'VP (主句谓语短语)',
              role: 'V',
              text: 'maintain the consensus that...',
              children: [
                { id: 'g3-m-v', label: 'V (谓语动词)', role: 'V', text: 'maintain' },
                { id: 'g3-m-o', label: 'NP (抽象名词宾语)', role: 'O', text: 'the consensus' },
                {
                  id: 'g3-app-c',
                  label: 'Appositive Clause (同位语从句)',
                  role: 'Clause',
                  text: 'that decarbonization remains an urgent priority',
                },
              ],
            },
          ],
        },
      ],
    },
    dependencies: [
      { fromIndex: 3, toIndex: 1, label: '让步状语 (advcl)' },
      { fromIndex: 3, toIndex: 2, label: '主谓 (nsubj)' },
      { fromIndex: 3, toIndex: 4, label: '动宾 (dobj)' },
      { fromIndex: 4, toIndex: 6, label: '同位语从句 (acl)' },
    ],
  },
  {
    id: 'gram-4',
    category: '虚拟语气与省略 if 倒装',
    title: '历史转折点与虚拟条件句倒装',
    difficulty: '高级 (C1)',
    sentence: 'Had the navigation team not calibrated the orbital trajectory in time, the deep-space probe would have missed its target planet entirely.',
    translation: '倘若导航团队当时没有及时校准轨道轨迹，这颗深空探测器就会彻底错过它的目标行星。',
    pattern: '虚拟条件倒装从句 (Had + S + not + V-ed) + 主句主语 (S) + 虚拟谓语 (would have V-ed) + 宾语 (O) + 状语 (Adv)',
    summary:
      '本句展示了与过去事实相反的第三类虚拟语气（If + had done, would have done）的高阶倒装形式：省略连词 if，将助动词 Had 提至主语 "the navigation team" 之前，否定词 not 保留在主语之后。',
    keyPoints: [
      '原句相当于 If the navigation team had not calibrated...，省略 if 后助动词 Had 前置形成部分倒装',
      '与过去事实相反：从句使用过去完成时 (had + past participle)，主句使用 would have + past participle',
      '副词 entirely 位于句尾作程度状语修饰动词 missed',
    ],
    tokens: [
      {
        text: 'Had',
        role: '倒装助动词 (Connector)',
        roleCode: 'Conn',
        explanation: '省略 if 后的前置过去完成时助动词，标志与过去事实相反的虚拟条件句。',
      },
      {
        text: 'the navigation team not calibrated the orbital trajectory in time,',
        role: '虚拟条件从句 (Adverbial)',
        roleCode: 'Adv',
        explanation: '倒装条件状语从句主体，还原语序为 the navigation team had not calibrated...。',
      },
      {
        text: 'the deep-space probe',
        role: '主句主语 (Subject)',
        roleCode: 'S',
        explanation: '主句核心主语，“这颗深空探测器”。',
      },
      {
        text: 'would have missed',
        role: '虚拟谓语 (Verb)',
        roleCode: 'V',
        explanation: '情态动词 would + 完成体 have missed，表示本会发生但实际未发生的过去结果。',
      },
      {
        text: 'its target planet',
        role: '宾语 (Object)',
        roleCode: 'O',
        explanation: 'missed 的直接宾语，“它的目标行星”。',
      },
      {
        text: 'entirely.',
        role: '程度状语 (Adverbial)',
        roleCode: 'Adv',
        explanation: '副词作状语，修饰谓语动词 would have missed，意为“彻底地、完全地”。',
      },
    ],
    steps: [
      {
        step: 1,
        title: '第一步：识别句首 Had 触发的虚拟倒装信号',
        description: '句首大写 "Had" 且句末为句号（非疑问句），立即判定为省略 if 的虚拟条件倒装从句。',
        highlightRoles: ['Conn', 'Adv'],
      },
      {
        step: 2,
        title: '第二步：抓取主句虚拟结果核心 (S + would have done + O)',
        description: '主句 "the deep-space probe would have missed its target planet" 呈现假设未校准将导致的后果。',
        highlightRoles: ['S', 'V', 'O'],
      },
      {
        step: 3,
        title: '第三步：串联条件与结果，校验时态呼应',
        description: '从句 Had ... calibrated 与主句 would have missed 严格对应“对过去情况的虚拟假设”。',
        highlightRoles: ['Conn', 'Adv', 'S', 'V', 'O'],
      },
    ],
    syntaxTree: {
      id: 'g4-s',
      label: 'S (第三类虚拟语气倒装复合句)',
      role: 'Clause',
      text: 'Had the navigation team not calibrated..., the deep-space probe would have missed its target planet entirely.',
      children: [
        {
          id: 'g4-cond',
          label: 'Inverted Conditional Clause (省略 if 的倒装条件从句)',
          role: 'Adv',
          text: 'Had the navigation team not calibrated the orbital trajectory in time',
          children: [
            { id: 'g4-aux', label: 'Aux (前置助动词)', role: 'Conn', text: 'Had' },
            { id: 'g4-cs', label: 'NP (从句主语)', role: 'S', text: 'the navigation team' },
            { id: 'g4-cvp', label: 'VP (否定过去分词短语)', role: 'V', text: 'not calibrated the orbital trajectory in time' },
          ],
        },
        {
          id: 'g4-main',
          label: 'Main Clause (虚拟结果主句)',
          role: 'Clause',
          text: 'the deep-space probe would have missed its target planet entirely',
          children: [
            { id: 'g4-ms', label: 'NP (主句主语)', role: 'S', text: 'the deep-space probe' },
            {
              id: 'g4-mvp',
              label: 'VP (主句虚拟谓宾)',
              role: 'V',
              text: 'would have missed its target planet entirely',
              children: [
                { id: 'g4-mv', label: 'Modal Perfect (虚拟谓语)', role: 'V', text: 'would have missed' },
                { id: 'g4-mo', label: 'NP (直接宾语)', role: 'O', text: 'its target planet' },
                { id: 'g4-madv', label: 'Adv (程度状语)', role: 'Adv', text: 'entirely' },
              ],
            },
          ],
        },
      ],
    },
    dependencies: [
      { fromIndex: 3, toIndex: 1, label: '虚拟条件 (advcl)' },
      { fromIndex: 3, toIndex: 2, label: '主谓 (nsubj)' },
      { fromIndex: 3, toIndex: 4, label: '动宾 (dobj)' },
      { fromIndex: 3, toIndex: 5, label: '状语修饰 (advmod)' },
    ],
  },
];

export const TRANSLATION_ITEMS: TranslationItem[] = [
  // ==================== 初级 (Beginner) ====================
  {
    id: 'trans-beg-1',
    difficulty: 'beginner',
    difficultyLabel: '初级 · 简单句与并列结构',
    sourceType: 'film',
    workTitle: '《肖申克的救赎》',
    workTitleEn: 'The Shawshank Redemption',
    creator: '弗兰克·德拉邦特 (Frank Darabont) 执导 / 斯蒂芬·金原著',
    year: '1994',
    characterOrScene: '安迪·杜佛兰 (Andy Dufresne) 给瑞德 (Red) 留下的橡树下信件独白',
    sourceIntro:
      '影史经典《肖申克的救赎》高潮段落：安迪历经十九年越狱成功后，在黑岩镇草场的火山玻璃下留给好友瑞德的信中写下这句关于“希望”的箴言，结构简练却极富力量。',
    chinese: '希望是一件美好的事物，也许是世间最美好的事物，而美好的事物永不消逝。',
    referenceEnglish: 'Hope is a good thing, maybe the best of things, and no good thing ever dies.',
    alternativeEnglish: 'Hope is a wonderful thing, perhaps the best of all things, and good things never fade away.',
    grammarFocus: '主系表结构 (SVP) + 同位语补充说明 (maybe the best of things) + and 并列分句 (no... ever 完全否定结构)',
    vocabHints: [
      { word: 'maybe / perhaps', pos: 'adv.', meaning: '也许，大概（引出递进同位语）' },
      { word: 'the best of things', pos: 'phr.', meaning: '世间最美好的事物' },
      { word: 'no ... ever', pos: 'phr.', meaning: '永不……（比 never 更具文学强调感）' },
    ],
    literaryNote:
      '原台词三次复现核心词 "thing" 与 "good/best"，通过极简盎格鲁-撒克逊短词营造出箴言般的节奏感；"no good thing ever dies" 采用否定主语 + 永不副词 ever，比普通被动句更有力。',
  },
  {
    id: 'trans-beg-2',
    difficulty: 'beginner',
    difficultyLabel: '初级 · 简单句与并列结构',
    sourceType: 'film',
    workTitle: '《阿甘正传》',
    workTitleEn: 'Forrest Gump',
    creator: '罗伯特·泽米吉斯 (Robert Zemeckis) 执导',
    year: '1994',
    characterOrScene: '阿甘坐在萨凡纳公交长椅上向陌生人讲述母亲的人生哲理',
    sourceIntro:
      '《阿甘正传》开篇最具代表性的台词。阿甘引用母亲生前常说的话，用一盒巧克力比喻人生的未知与偶然，句式平实自然，是训练明喻（Simile）与宾语从句的绝佳范例。',
    chinese: '人生就像一盒巧克力，你永远不知道下一颗会尝到什么味道。',
    referenceEnglish: 'Life was like a box of chocolates. You never know what you are going to get.',
    alternativeEnglish: 'Life is like a box of chocolates, and you never know what you will get next.',
    grammarFocus: '介词 like 构成的明喻主系表结构 + what 引导的宾语从句 (know + what-clause)',
    vocabHints: [
      { word: 'be like', pos: 'phr.', meaning: '就像……一样（系动词 be + 介词 like）' },
      { word: 'a box of chocolates', pos: 'n.', meaning: '一盒巧克力（注意 chocolates 用复数表示不同口味的颗粒）' },
      { word: 'what you are going to get', pos: 'clause', meaning: '你将会得到什么（what 作 get 的宾语）' },
    ],
    literaryNote:
      '注意中文里的“尝到什么味道”在英文地道表达中用极简的动词 "get" 即可自然传达，体现了中译英“化繁为简、以动词为核心”的转换思维。',
  },
  {
    id: 'trans-beg-3',
    difficulty: 'beginner',
    difficultyLabel: '初级 · 简单句与并列结构',
    sourceType: 'film',
    workTitle: '《死亡诗社》',
    workTitleEn: 'Dead Poets Society',
    creator: '彼得·威尔 (Peter Weir) 执导',
    year: '1989',
    characterOrScene: '基廷老师 (John Keating) 在威尔顿预科学校第一堂课带学生凝视校史老照片',
    sourceIntro:
      '罗宾·威廉姆斯饰演的基廷老师带领学生走出僵化教育，凝视百年前校友的照片并轻声吟诵拉丁格言 "Carpe Diem"，鼓励少年把握当下、让生命超凡脱俗。',
    chinese: '把握当下，孩子们，让你们的人生变得不同凡响。',
    referenceEnglish: 'Seize the day, boys. Make your lives extraordinary.',
    alternativeEnglish: 'Carpe diem, boys; make your lives truly extraordinary.',
    grammarFocus: '祈使句并列结构 (Seize... / Make...) + 复合宾语结构 (make + 宾语 your lives + 形容词宾补 extraordinary)',
    vocabHints: [
      { word: 'seize the day', pos: 'idiom', meaning: '把握当下，及时行乐（对应拉丁语 Carpe Diem）' },
      { word: 'extraordinary', pos: 'adj.', meaning: '非凡的，不同凡响的（作宾语补足语）' },
    ],
    literaryNote:
      '中文“变得不同凡响”是动补结构，英文直接用 `Make + 宾语 + 形容词宾补` 即可无需多余的 become，短促有力，极富演讲感召力。',
  },

  // ==================== 中级 (Intermediate) ====================
  {
    id: 'trans-int-1',
    difficulty: 'intermediate',
    difficultyLabel: '中级 · 复合从句与非谓语训练',
    sourceType: 'literature',
    workTitle: '《了不起的盖茨比》',
    workTitleEn: 'The Great Gatsby',
    creator: 'F·斯科特·菲茨杰拉德 (F. Scott Fitzgerald)',
    year: '1925',
    characterOrScene: '小说第一卷开篇：叙述者尼克·卡拉威 (Nick Carraway) 回忆父亲的忠告',
    sourceIntro:
      '二十世纪美国文学巅峰之作《了不起的盖茨比》全书第一段。尼克转述父亲在他年纪尚轻、容易受人影响时给出的人生建议，奠定了全书宽容而冷静的叙事基调。',
    chinese: '每当你想要批评别人的时候，要记住，这世上并非所有人都拥有你所占有的那些优越条件。',
    referenceEnglish:
      'Whenever you feel like criticizing any one, just remember that all the people in this world have not had the advantages that you have had.',
    alternativeEnglish:
      'Whenever you want to criticize someone, remember that not everyone in this world has enjoyed the privileges that you have had.',
    grammarFocus: 'Whenever 引导的时间/让步状语从句 + 祈使句主干 + that 宾语从句（含 all... not 部分否定）+ that 定语从句',
    vocabHints: [
      { word: 'feel like doing', pos: 'phr.', meaning: '想要做某事' },
      { word: 'all ... not / not all', pos: 'phr.', meaning: '并非所有人都……（部分否定结构）' },
      { word: 'advantages', pos: 'n.', meaning: '优越条件，有利条件' },
    ],
    literaryNote:
      '菲茨杰拉德使用了 `all the people ... have not had` 的经典部分否定句式，句尾连用两个 `have had`（主句过去完成/现在完成与定语从句呼应），形成优雅的文学回响。',
  },
  {
    id: 'trans-int-2',
    difficulty: 'intermediate',
    difficultyLabel: '中级 · 复合从句与非谓语训练',
    sourceType: 'literature',
    workTitle: '《杀死一只知更鸟》',
    workTitleEn: 'To Kill a Mockingbird',
    creator: '哈珀·李 (Harper Lee)',
    year: '1960',
    characterOrScene: '律师阿蒂克斯·芬奇 (Atticus Finch) 教导女儿斯考特学会共情他人',
    sourceIntro:
      '普利策奖经典小说《杀死一只知更鸟》的核心金句。阿蒂克斯在门廊上耐心开导年幼的女儿斯考特：真正的理解需要站在他人的立场上思考与生活。',
    chinese: '你永远不可能真正了解一个人，除非你站在他的角度思考问题——钻进他的皮肤里，像他一样走来走去。',
    referenceEnglish:
      'You never really understand a person until you consider things from his point of view—until you climb into his skin and walk around in it.',
    grammarFocus: 'not/never ... until 引导的时间/条件状语从句 + 破折号递进重述同位结构',
    vocabHints: [
      { word: 'never ... until', pos: 'conj.', meaning: '直到……才……；除非……否则永不……' },
      { word: 'from one’s point of view', pos: 'phr.', meaning: '站在某人的角度/立场上' },
      { word: 'climb into one’s skin', pos: 'idiom', meaning: '钻进某人的皮肤里（具象化比喻设身处地）' },
    ],
    literaryNote:
      '连用两个 `until` 引导状语从句，第一个抽象表达“站在他的角度”，破折号后转为极富画面感的具象动作 `climb into his skin and walk around in it`。',
  },
  {
    id: 'trans-int-3',
    difficulty: 'intermediate',
    difficultyLabel: '中级 · 复合从句与非谓语训练',
    sourceType: 'film',
    workTitle: '《星际穿越》',
    workTitleEn: 'Interstellar',
    creator: '克里斯托弗·诺兰 (Christopher Nolan) 执导',
    year: '2014',
    characterOrScene: '布兰德博士 (Dr. Amelia Brand) 在耐力号飞船上探讨跨越时空维度的情感纽带',
    sourceIntro:
      '科幻史诗《星际穿越》中关于科学与人性交汇的核心独白：布兰德博士指出，在冰冷的引力与时空方程之外，唯有爱是人类可以感知并超越时空维度的存在。',
    chinese: '爱是我们能够感知的、唯一可以超越时间与空间维度的事物。',
    referenceEnglish: 'Love is the one thing we are capable of perceiving that transcends dimensions of time and space.',
    alternativeEnglish: 'Love is the only thing that we can perceive which transcends the dimensions of time and space.',
    grammarFocus: '主系表结构 + 双重限制性定语从句嵌套（省略关系代词的定语从句 + that 引导的定语从句）',
    vocabHints: [
      { word: 'be capable of perceiving', pos: 'phr.', meaning: '能够感知的（后置定语从句修饰 the one thing）' },
      { word: 'transcend', pos: 'v.', meaning: '超越，跨越（时空或界限）' },
      { word: 'dimensions of time and space', pos: 'n.', meaning: '时间与空间的维度' },
    ],
    literaryNote:
      '先行词 `the one thing` 同时被两个定语从句修饰：第一个 `(that) we are capable of perceiving` 省略了宾语关系代词，第二个 `that transcends...` 用作主语关系代词，层层递进。',
  },

  // ==================== 高级 (Advanced) ====================
  {
    id: 'trans-adv-1',
    difficulty: 'advanced',
    difficultyLabel: '高级 · 文学修辞与复杂长难句',
    sourceType: 'literature',
    workTitle: '《傲慢与偏见》',
    workTitleEn: 'Pride and Prejudice',
    creator: '简·奥斯汀 (Jane Austen)',
    year: '1813',
    characterOrScene: '小说第一卷第一章开篇第一句：奥斯汀式反讽名言',
    sourceIntro:
      '世界文学史上最著名的开篇句之一。简·奥斯汀以庄重宏大的哲学命题口吻（“举世公认的真理”），反讽当时英国乡绅阶层急于将女儿嫁给富有的单身汉的世俗心态。',
    chinese: '凡是有钱的单身汉，总想娶位太太，这已经成了一条举世公认的真理。',
    referenceEnglish:
      'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    grammarFocus: 'It 形式主语 + 过去分词短语后置定语 (universally acknowledged) + that 真正主语从句 + 介词短语定语与表语',
    vocabHints: [
      { word: 'universally acknowledged', pos: 'phr.', meaning: '举世公认的（过去分词短语作后置定语修饰 truth）' },
      { word: 'in possession of', pos: 'phr.', meaning: '拥有……的（介词短语作后置定语修饰 a single man）' },
      { word: 'in want of', pos: 'phr.', meaning: '需要……，缺少……（作 must be 的表语）' },
    ],
    literaryNote:
      '中文习惯先说具体内容再总结“这是公认的真理”，而英文采用“头轻脚重”原则，以 `It is a truth universally acknowledged, that...` 形式主语前置，并用静态介词短语 `in possession of` 和 `in want of` 替代普通动词 have 与 need，尽显古典英伦雅致。',
  },
  {
    id: 'trans-adv-2',
    difficulty: 'advanced',
    difficultyLabel: '高级 · 文学修辞与复杂长难句',
    sourceType: 'literature',
    workTitle: '《了不起的盖茨比》',
    workTitleEn: 'The Great Gatsby',
    creator: 'F·斯科特·菲茨杰拉德 (F. Scott Fitzgerald)',
    year: '1925',
    characterOrScene: '全书结尾最后一句：凝视长岛绿灯的终极咏叹',
    sourceIntro:
      '美国文学史上最富诗意的结尾句。尼克站在海滩上思索盖茨比幻灭的美国梦，将人类对未来的追逐比作逆流而上的孤舟，永远被不可抗拒的往昔浪潮推回过去。',
    chinese: '于是我们奋力向前划桨，逆流而上的小舟，不停地被推回往昔岁月。',
    referenceEnglish: 'So we beat on, boats against the current, borne back ceaselessly into the past.',
    grammarFocus: '主谓核心 (we beat on) + 名词短语同位语隐喻 (boats against the current) + 过去分词短语作结果/伴随状语 (borne back...)',
    vocabHints: [
      { word: 'beat on', pos: 'v.', meaning: '迎风逆水奋力拍击/划行' },
      { word: 'against the current', pos: 'phr.', meaning: '逆流而上（介词短语修饰同位语 boats）' },
      { word: 'borne back ceaselessly', pos: 'phr.', meaning: '不停地被推回（bear 的过去分词 borne 表被动）' },
    ],
    literaryNote:
      '全句仅 14 个词，却浓缩了三重句法层次：主谓短句 `we beat on`、省略 like 的同位语暗喻 `boats against the current`，以及头韵（beat / boats / borne back）与过去分词状语的完美交织。',
  },
  {
    id: 'trans-adv-3',
    difficulty: 'advanced',
    difficultyLabel: '高级 · 文学修辞与复杂长难句',
    sourceType: 'literature',
    workTitle: '《双城记》',
    workTitleEn: 'A Tale of Two Cities',
    creator: '查尔斯·狄更斯 (Charles Dickens)',
    year: '1859',
    characterOrScene: '小说第一卷第一章开篇排比：1775 年英法大变革前夜的时代悖论',
    sourceIntro:
      '狄更斯在《双城记》开篇以气势恢宏的对偶排比（Antithesis & Parallelism），描绘法国大革命前夕伦敦与巴黎两座城市光明与黑暗交织、希望与绝望并存的极化时代。',
    chinese: '那是最好的时代，那是最坏的时代；那是智慧的年头，那是愚昧的年头；那是希望之春，那是绝望之冬。',
    referenceEnglish:
      'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the spring of hope, it was the winter of despair.',
    grammarFocus: '首语重复法 (Anaphora: It was...) + 对仗反义排比结构 (the + 最高级/抽象名词 + of + 名词)',
    vocabHints: [
      { word: 'the age of wisdom / foolishness', pos: 'phr.', meaning: '智慧的年代 / 愚昧的年代' },
      { word: 'the spring of hope', pos: 'phr.', meaning: '希望之春（以四季隐喻时代心境）' },
      { word: 'the winter of despair', pos: 'phr.', meaning: '绝望之冬' },
    ],
    literaryNote:
      '通过严格的句式复现 `It was the [A] of [B]` 构建出钟摆般庄严的节奏，是学习英文修辞学中“对偶反衬（Antithesis）”与“首语重复（Anaphora）”的典范。',
  },
];

// ==================== 雅思四科专项学习数据 ====================

export const IELTS_LISTENING_ITEMS: IeltsListeningItem[] = [
  {
    id: 'listen-1',
    section: 'Part 1 · 生活咨询',
    title: '剑雅高频租房与社区体育中心会员办理',
    scenario: '新生致电市政体育中心咨询游泳馆开放时间、会员折扣及体检预约信息（注意数字修正与转折陷阱）。',
    accent: '英音 (UK)',
    audioScript:
      'Receptionist: Good morning, Westside Leisure Centre. You are inquiring about our student annual membership, right? Originally the standard fee was 240 pounds, wait—sorry, that was last year’s rate; for full-time students with a valid ID card, the discounted annual fee is 185 pounds. Also, please bring a passport photo and complete a health questionnaire before your first induction session on Thursday.',
    questionStem:
      'Student Membership Notes:\n1. Discounted annual membership fee for full-time students: £ {{0}}\n2. Required document besides a passport photo: a health {{1}}\n3. Day of the first induction session: {{2}}',
    blanks: [
      {
        index: 0,
        answer: '185',
        synonymCue: 'discounted annual fee is 185 pounds',
        distractorTrap: '先出现的 £240 是去年的旧标准价（wait—sorry, that was last year’s rate），属于典型的自我修正干扰项。',
      },
      {
        index: 1,
        answer: 'questionnaire',
        synonymCue: 'complete a health questionnaire',
        distractorTrap: '注意 questionnaire 的双写 n 与结尾 aire 拼写，雅思听力 Part 1 常考高频拼写词。',
      },
      {
        index: 2,
        answer: 'Thursday',
        synonymCue: 'first induction session on Thursday',
        distractorTrap: '星期名称首字母必须大写，且注意区分 Tuesday 与 Thursday 的发音。',
      },
    ],
    coreVocab: [
      { word: 'questionnaire', phonetic: '/ˌkwestʃəˈneə(r)/', meaning: 'n. 调查问卷、健康登记表（高频拼写必考词）' },
      { word: 'induction session', phonetic: '/ɪnˈdʌkʃn ˈseʃn/', meaning: 'n. 入门指导课、迎新培训会' },
      { word: 'discounted rate', phonetic: '/ˈdɪskaʊntɪd reɪt/', meaning: 'n. 折扣价格、优惠费率' },
    ],
  },
  {
    id: 'listen-2',
    section: 'Part 4 · 学术讲座',
    title: '城市生态建筑与垂直森林系统讲座',
    scenario: '环境工程教授探讨现代高密度城市中的垂直绿化外墙如何缓解城市热岛效应并过滤颗粒物。',
    accent: '英音 (UK)',
    audioScript:
      'Professor: In today’s lecture on sustainable urban architecture, we examine vertical forests. Contrary to early skepticism regarding structural weight, reinforced balconies can easily support medium-sized shrubs. The primary environmental benefit is not merely aesthetic; rather, the dense foliage acts as a natural filter that absorbs fine particulate matter and significantly reduces ambient noise levels inside residential apartments.',
    questionStem:
      'Vertical Forest Architecture:\n1. Reinforced balconies are designed to support medium-sized {{0}}.\n2. Dense foliage functions as a natural {{1}} against air pollutants.\n3. Apart from air quality, the greenery also lowers indoor {{2}} levels.',
    blanks: [
      {
        index: 0,
        answer: 'shrubs',
        synonymCue: 'support medium-sized shrubs',
        distractorTrap: '注意复数形式 shrubs（灌木），不可漏掉词尾 s。',
      },
      {
        index: 1,
        answer: 'filter',
        synonymCue: 'acts as a natural filter',
        distractorTrap: '题干 functions as 同义替换原文中的 acts as。',
      },
      {
        index: 2,
        answer: 'noise',
        synonymCue: 'reduces ambient noise levels inside residential apartments',
        distractorTrap: '题干 lowers indoor 同义替换原文 reduces ... inside residential apartments。',
      },
    ],
    coreVocab: [
      { word: 'foliage', phonetic: '/ˈfəʊliɪdʒ/', meaning: 'n. 植物的枝叶（不可数集合名词）' },
      { word: 'particulate matter', phonetic: '/pɑːˈtɪkjələt ˈmætə/', meaning: 'n. 悬浮颗粒物（PM）' },
      { word: 'ambient', phonetic: '/ˈæmbiənt/', meaning: 'adj. 周围环境的，环境背景的' },
    ],
  },
];

export const IELTS_READING_ITEMS: IeltsReadingItem[] = [
  {
    id: 'read-1',
    topic: '认知神经科学与双语大脑 (Bilingualism & Cognitive Reserve)',
    title: '双语能力如何重塑人类大脑执行控制网络',
    passageExcerpt:
      'For decades, early developmental psychologists assumed that exposing infants to two languages simultaneously might induce linguistic confusion and delay vocabulary acquisition. However, contemporary neuroimaging studies utilizing functional MRI have thoroughly debunked this hypothesis. Because bilingual speakers must constantly inhibit one active language system while selecting lexical items from another, their dorsolateral prefrontal cortex undergoes continuous executive training. Consequently, lifelong bilinguals typically exhibit delayed onset of neurodegenerative symptoms by an average of four to five years compared to monolingual peers, even when underlying brain pathology is already present.',
    longSentenceAnalysis: {
      sentence:
        'Because bilingual speakers must constantly inhibit one active language system while selecting lexical items from another, their dorsolateral prefrontal cortex undergoes continuous executive training.',
      translation:
        '由于双语使用者在从一套语言系统中提取词汇的同时，必须持续抑制另一套处于激活状态的语言系统，因此他们的背外侧前额叶皮层会接受持续的执行控制训练。',
      breakdown:
        '【句法拆解】句首由 Because 引导原因状语从句，内部嵌套了连词 + 现在分词短语 "while selecting lexical items from another" 作时间伴随状语；逗号后为主句主干：their dorsolateral prefrontal cortex (主语 S) + undergoes (谓语 V) + continuous executive training (宾语 O)。',
    },
    paraphrasePairs: [
      {
        passageExpr: 'thoroughly debunked this hypothesis',
        questionExpr: 'proved the early assumption to be completely false',
        type: '动词+名词同义替换 (debunk = prove false)',
      },
      {
        passageExpr: 'constantly inhibit one active language system',
        questionExpr: 'suppress one language on a regular basis',
        type: '学术高频替换 (inhibit = suppress; constantly = on a regular basis)',
      },
      {
        passageExpr: 'delayed onset of neurodegenerative symptoms',
        questionExpr: 'postponed appearance of age-related cognitive decline signs',
        type: '词根与上下义替换 (onset = appearance; delayed = postponed)',
      },
    ],
    questions: [
      {
        id: 'rq-1',
        statement:
          'Modern brain-scanning technology has confirmed the early belief that learning two languages in infancy slows down language development.',
        answer: 'FALSE',
        explanation:
          '原文明确指出当代神经影像学研究已经彻底推翻（thoroughly debunked）了这一早期假说，与题干 confirmed（证实）直接相反，故判为 FALSE。',
      },
      {
        id: 'rq-2',
        statement:
          'Bilingual individuals develop symptoms of neurodegenerative diseases several years later than people who speak only one language.',
        answer: 'TRUE',
        explanation:
          '原文最后一句指出终身双语者比单语同龄人（monolingual peers）出现神经退行性症状的时间平均推迟 4 到 5 年（delayed onset ... by an average of four to five years），同义替换完全成立，故为 TRUE。',
      },
      {
        id: 'rq-3',
        statement:
          'Speaking three or more languages provides twice as much cognitive protection as speaking only two languages.',
        answer: 'NOT GIVEN',
        explanation:
          '全文仅对比了双语者（bilinguals）与单语者（monolingual peers），完全未提及掌握三种及以上语言是否带来翻倍保护效应，属于无中生有，判为 NOT GIVEN。',
      },
    ],
  },
];

export const IELTS_WRITING_PROMPTS: IeltsWritingPrompt[] = [
  {
    id: 'write-1',
    taskType: 'Task 2 (大作文议论文)',
    topicCategory: '人工智能与未来就业结构 (Technology & Society)',
    title: '自动化与人工智能对人类创造力及工作的影响',
    question:
      'Some people believe that the rapid advancement of artificial intelligence and automation will inevitably lead to widespread unemployment, while others argue that it will liberate humans to pursue more creative and fulfilling work. Discuss both views and give your own opinion.',
    outlineSteps: [
      '引言段 (Introduction)：背景改写题干争议（同义替换 rapid advancement / widespread unemployment）+ 明确个人平衡立场（短期结构性阵痛不可避免，但结合教育转型可释放高阶创造力）。',
      '主体段一 (Body 1 - 审视担忧方)：让步剖析自动化对重复性、程序化岗位（routine manual and cognitive tasks）的替代效应及转型期技能错配（skill mismatch）。',
      '主体段二 (Body 2 - 论证支持方)：阐述 AI 作为生产力倍增器如何承担繁琐数据处理，使人类聚焦于跨学科创新、情感共鸣与伦理决策（empathetic care & strategic innovation）。',
      '结论段 (Conclusion)：总结双方逻辑，重申政策制定者需通过终身职业重培训（lifelong reskilling initiatives）实现技术红利共享。',
    ],
    band6Excerpt:
      'Nowadays, AI is developing very fast. Many people think robots will take away our jobs and make many workers lose money. However, other people think AI is very helpful because it can do boring work for us, so we can have more time to do creative things.',
    band85Model:
      'The exponential proliferation of artificial intelligence has ignited a polarized debate regarding the future of human labor. While concerns over the displacement of routine occupations are well-founded in the short term, I contend that algorithmic automation, when coupled with proactive educational reform, ultimately empowers the workforce to engage in higher-order creative endeavors.\n\nAdmittedly, anxieties surrounding technological unemployment stem from tangible structural shifts. Unlike previous industrial revolutions that primarily mechanized physical toil, contemporary machine-learning models can execute complex analytical and administrative tasks with unprecedented precision. Consequently, workers entrenched in standardized roles—ranging from data entry to basic financial auditing—face an acute risk of redundancy unless social safety nets and vocational retraining are swiftly implemented.\n\nNevertheless, viewing technological progress solely through the lens of job destruction overlooks its capacity to augment human potential. By delegating repetitive, data-intensive calculations to intelligent systems, professionals in fields such as medicine, architecture, and scientific research are liberated to focus on conceptual innovation, ethical judgment, and interpersonal empathy—domains where human cognition remains irreplaceable.',
    upgradeHighlights: [
      {
        band6: 'AI is developing very fast',
        band85: 'The exponential proliferation of artificial intelligence',
        reason: '用名词化短语 exponential proliferation（指数级普及）替代口语化副词 very fast，确立学术语域。',
      },
      {
        band6: 'take away our jobs',
        band85: 'the displacement of routine occupations / face an acute risk of redundancy',
        reason: '使用精准经济学术语 displacement（岗位替代）与 redundancy（裁员/岗位冗余），大幅提升 LR 词汇评分。',
      },
      {
        band6: 'do boring work for us, so we can have more time',
        band85: 'By delegating repetitive, data-intensive calculations to intelligent systems, professionals ... are liberated to focus on...',
        reason: '运用 By doing 方式状语 + 被动语态 are liberated to + 破折号同位语解释，兼顾句式多样性（GRA）与逻辑连贯（CC）。',
      },
    ],
  },
  {
    id: 'write-2',
    taskType: 'Task 1 (学术图表/书信)',
    topicCategory: '动态折线图趋势对比 (Dynamic Line Graph)',
    title: '四国可再生能源发电占比三十年趋势对比',
    question:
      'The graph below shows the percentage of electricity generated from renewable sources in four countries (Norway, Germany, the UK, and Australia) between 1995 and 2025. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
    outlineSteps: [
      '首段改写 (Paraphrase)：将 shows the percentage of electricity generated from... 改写为 illustrates the proportion of power derived from sustainable sources across four nations over a three-decade period。',
      '总体概述段 (Overview - 必写核心得分点)：指出整体上升趋势（upward trajectory），并点出极值特征——挪威始终保持压倒性领先，而德国与英国在后半程呈现最显著的加速跃升。',
      '细节段一 (Body 1 - 高位稳定组)：描写挪威从 1995 年逾 65% 稳步攀升至 2025 年近 80% 的主导地位。',
      '细节段二 (Body 2 - 追赶跃升组)：对比德国、英国与澳大利亚从不足 10% 起步，在 2010 年后出现陡峭增长（witnessed a dramatic surge）与分化的具体数值。',
    ],
    band6Excerpt:
      'From the line graph we can see that renewable energy increased in all four countries from 1995 to 2025. Norway was always the highest one. Germany and the UK started very low in 1995, but they went up very fast after 2010.',
    band85Model:
      'The line graph illustrates the proportion of electricity derived from renewable energy across four nations—namely Norway, Germany, the UK, and Australia—over a thirty-year span from 1995 to 2025.\n\nOverall, all four countries experienced an upward trajectory in clean power generation throughout the period. Notably, Norway consistently maintained a commanding lead, whereas Germany and the UK registered the most pronounced surges during the final fifteen years.\n\nIn 1995, Norway already generated approximately 66% of its electricity from renewables, dwarfing the other three nations, all of which stood below 8%. Over the subsequent three decades, Norway’s figure rose steadily, plateauing briefly around 2010 before reaching a peak of nearly 82% in 2025.\n\nBy contrast, Germany and the UK began at negligible levels of roughly 4% and 2% respectively. Following a decade of modest growth, both nations witnessed an exponential climb after 2010, with Germany overtaking Australia in 2005 and surging to 48% by 2025, closely trailed by the UK at 42%.',
    upgradeHighlights: [
      {
        band6: 'went up very fast after 2010',
        band85: 'witnessed an exponential climb / registered the most pronounced surges',
        reason: '雅思小作文切忌反复使用 go up / increase，改用 witness an exponential climb 或 register a pronounced surge。',
      },
      {
        band6: 'Norway was always the highest one',
        band85: 'Norway consistently maintained a commanding lead, dwarfing the other three nations',
        reason: '引入现在分词伴随状语 dwarfing...（使其他三国相形见绌）与 commanding lead（显著领先地位）。',
      },
    ],
  },
];

export const IELTS_SPEAKING_TOPICS: IeltsSpeakingTopic[] = [
  {
    id: 'speak-1',
    part: 'Part 2 · 个人陈述 (Cue Card)',
    topic: 'Describe a skill that took you a long time to learn (耗时良久掌握的一项技能)',
    cueCardPrompt: 'Describe a practical or intellectual skill that took you a long time to learn.',
    bulletPoints: [
      'What the skill is and why you decided to learn it',
      'How and where you learned it step by step',
      'What difficulties or bottlenecks you encountered along the way',
      'And explain how you felt once you finally mastered it',
    ],
    questions: [
      {
        q: 'Part 2 2分钟独白示范：如何自然展开故事线并融入高分习语？',
        strategy:
          '采用「动机引入 (Hook) → 瓶颈挫折 (Steep learning curve) → 突破顿悟 (Turning point) → 长期收获 (Rewarding payoff)」四段式叙事结构，避免干瘪罗列。',
        sampleAnswer:
          'To be completely honest, the first skill that springs to mind is mastering touch-typing and algorithmic coding in Python, which took me well over a year of consistent practice to truly get the hang of. Initially, I embarked on this journey during my sophomore year because I realized that automating data analysis would be a game-changer for my research projects. At first, the learning curve was painfully steep—I kept hitting a plateau whenever I dealt with complex recursion. However, by breaking down problems into bite-sized chunks and building real-world mini-apps every weekend, everything eventually clicked into place. Looking back, the sense of accomplishment was second to none.',
        idioms: [
          { phrase: 'get the hang of something', meaning: '掌握……的窍门、熟练上手' },
          { phrase: 'a steep learning curve', meaning: '陡峭的学习曲线（初期极难上手的过程）' },
          { phrase: 'hit a plateau', meaning: '遭遇瓶颈期、停滞不前' },
          { phrase: 'click into place', meaning: '豁然开朗、融会贯通' },
        ],
      },
      {
        q: 'Part 3 深度追问：Why do many adults find it harder to acquire new skills compared to children?',
        strategy:
          'Part 3 切忌只谈个人经历，应上升至群体心理、时间成本与神经可塑性（neuroplasticity）两个普遍维度进行辩证对比。',
        sampleAnswer:
          'Well, I reckon that comes down to a combination of cognitive and practical factors. First and foremost, from a psychological standpoint, adults tend to be much more self-conscious about making mistakes in public, whereas children learn through trial and error without fear of embarrassment. On top of that, working professionals are constantly juggling career commitments and family responsibilities, making it exceedingly difficult to carve out uninterrupted blocks of time for deliberate practice.',
        idioms: [
          { phrase: 'trial and error', meaning: '反复试错、摸索尝试' },
          { phrase: 'juggle multiple commitments', meaning: '同时兼顾多项繁重事务' },
          { phrase: 'deliberate practice', meaning: '刻意练习' },
        ],
      },
    ],
  },
];

export const AI_PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI 官方接口',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o3-mini'],
    description: '标准 OpenAI 官方 API，通过 Cloudflare Worker 全球边缘节点直连转发。',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek (深度求索)',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    description: '高性价比中文与双语推理模型，完全兼容 OpenAI SDK 格式。',
  },
  {
    id: 'qwen',
    name: '通义千问 (阿里云百炼)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
    description: '阿里云 DashScope OpenAI 兼容模式接口，中英互译与语法解析响应迅速。',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow (硅基流动)',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    models: ['Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-7B-Instruct'],
    description: '聚合多款开源大模型的高速推理平台，支持免费额度模型测试。',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter 聚合网关',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-001'],
    description: '统一调用 Claude、Gemini、GPT 等全球主流模型的 OpenAI 兼容网关。',
  },
  {
    id: 'custom',
    name: '自定义 OpenAI 兼容服务',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini'],
    description: '支持任意兼容 /v1/chat/completions 协议的自建中转站、OneAPI 或本地网关。',
  },
];
