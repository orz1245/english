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
    enName: string;
    zhName: string;
    shortName: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeClass: string;
    strokeColor: string;
    fillColor: string;
    underlineStyle: 'solid' | 'double' | 'dashed' | 'dotted';
    desc: string;
  }
> = {
  S: {
    code: 'S',
    name: 'Subject (主语)',
    enName: 'Subject',
    zhName: '主语',
    shortName: 'Subject · 主语',
    bgClass: 'bg-[#EFE6D5]',
    borderClass: 'border-[#B07D4F]',
    textClass: 'text-[#8C5A2B]',
    badgeClass: 'bg-[#EFE6D5] text-[#7A4E24] border-[#C9A67E]',
    strokeColor: '#B07D4F',
    fillColor: '#F5EFE4',
    underlineStyle: 'solid',
    desc: '动作发出者或陈述主体，由名词短语、代词或主语从句充当。',
  },
  V: {
    code: 'V',
    name: 'Verb (谓语)',
    enName: 'Verb',
    zhName: '谓语',
    shortName: 'Verb · 谓语',
    bgClass: 'bg-[#E3ECE6]',
    borderClass: 'border-[#2E5641]',
    textClass: 'text-[#2E5641]',
    badgeClass: 'bg-[#E3ECE6] text-[#234533] border-[#8AB09B]',
    strokeColor: '#2E5641',
    fillColor: '#EDF3EF',
    underlineStyle: 'solid',
    desc: '句子核心动词结构，体现时态、语态与体貌特征。',
  },
  O: {
    code: 'O',
    name: 'Object (宾语)',
    enName: 'Object',
    zhName: '宾语',
    shortName: 'Object · 宾语',
    bgClass: 'bg-[#F2E5DF]',
    borderClass: 'border-[#A65242]',
    textClass: 'text-[#8E3F30]',
    badgeClass: 'bg-[#F2E5DF] text-[#8E3F30] border-[#CFA096]',
    strokeColor: '#A65242',
    fillColor: '#F7EFEA',
    underlineStyle: 'solid',
    desc: '及物动词或介词支配的对象。',
  },
  P: {
    code: 'P',
    name: 'Subject Complement (表语)',
    enName: 'Subject Complement',
    zhName: '表语',
    shortName: 'Complement · 表语',
    bgClass: 'bg-[#F3EBD8]',
    borderClass: 'border-[#C69C53]',
    textClass: 'text-[#8A6626]',
    badgeClass: 'bg-[#F3EBD8] text-[#8A6626] border-[#D8BC86]',
    strokeColor: '#C69C53',
    fillColor: '#F8F2E4',
    underlineStyle: 'solid',
    desc: '位于系动词后，说明主语的身份、性质或状态。',
  },
  Attr: {
    code: 'Attr',
    name: 'Attributive (定语)',
    enName: 'Attributive',
    zhName: '定语',
    shortName: 'Attributive · 定语',
    bgClass: 'bg-[#EAECE2]',
    borderClass: 'border-[#5C6F49]',
    textClass: 'text-[#485937]',
    badgeClass: 'bg-[#EAECE2] text-[#485937] border-[#A8B899]',
    strokeColor: '#5C6F49',
    fillColor: '#F1F3EC',
    underlineStyle: 'dashed',
    desc: '修饰或限定名词成分，含前置形容词与后置分词、介词短语及定语从句。',
  },
  Adv: {
    code: 'Adv',
    name: 'Adverbial (状语)',
    enName: 'Adverbial',
    zhName: '状语',
    shortName: 'Adverbial · 状语',
    bgClass: 'bg-[#E4ECEE]',
    borderClass: 'border-[#4A6A70]',
    textClass: 'text-[#365257]',
    badgeClass: 'bg-[#E4ECEE] text-[#365257] border-[#96B2B7]',
    strokeColor: '#4A6A70',
    fillColor: '#EDF2F3',
    underlineStyle: 'dashed',
    desc: '修饰动词、形容词或全句，交代时间、条件、原因、让步或方式。',
  },
  Comp: {
    code: 'Comp',
    name: 'Object Complement (补语)',
    enName: 'Object Complement',
    zhName: '宾语补足语',
    shortName: 'Complement · 补语',
    bgClass: 'bg-[#EFE6DC]',
    borderClass: 'border-[#8C6239]',
    textClass: 'text-[#6E4B28]',
    badgeClass: 'bg-[#EFE6DC] text-[#6E4B28] border-[#C4A687]',
    strokeColor: '#8C6239',
    fillColor: '#F6F0E8',
    underlineStyle: 'solid',
    desc: '补充说明宾语的状态、身份或动作，与宾语共同构成复合宾语。',
  },
  Conn: {
    code: 'Conn',
    name: 'Connector (连接/引导词)',
    enName: 'Connector',
    zhName: '连接词',
    shortName: 'Connector · 连词',
    bgClass: 'bg-[#EDE6E1]',
    borderClass: 'border-[#7A5638]',
    textClass: 'text-[#634329]',
    badgeClass: 'bg-[#EDE6E1] text-[#634329] border-[#BFA691]',
    strokeColor: '#7A5638',
    fillColor: '#F4EFEA',
    underlineStyle: 'dotted',
    desc: '连接并列分句或引导从属子句的枢纽词。',
  },
  Clause: {
    code: 'Clause',
    name: 'Subordinate Clause (从句)',
    enName: 'Subordinate Clause',
    zhName: '从句结构',
    shortName: 'Clause · 从句',
    bgClass: 'bg-[#E4EDE8]',
    borderClass: 'border-[#3A634C]',
    textClass: 'text-[#2B4E3B]',
    badgeClass: 'bg-[#E4EDE8] text-[#2B4E3B] border-[#93B5A2]',
    strokeColor: '#3A634C',
    fillColor: '#EEF4F0',
    underlineStyle: 'dotted',
    desc: '嵌套于主句之内的名词性从句、定语从句或状语从句。',
  },
};

export const GRAMMAR_SENTENCES: GrammarSentence[] = [
  {
    id: 'gram-0',
    category: '形式主语与主语从句',
    title: 'Jane Austen · Pride and Prejudice《傲慢与偏见》',
    difficulty: '高级 (C1)',
    sentence:
      'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    translation: '凡是有钱的单身汉，总想娶位太太，这已经成了一条公认的真理。',
    pattern: '形式主语 (It) + 系动词 (is) + 表语 (NP) + 过去分词定语 + 真正主语从句 (that-clause)',
    summary:
      '句首以 It 充当形式主语，表语核心词 a truth 后接过去分词短语 universally acknowledged 作后置定语；逗号后由 that 引导真正的主语从句（亦可视为解释 a truth 的同位语从句），从句内部以介词短语 in possession of a good fortune 修饰主语 a single man。',
    keyPoints: [
      'universally acknowledged：过去分词短语后置修饰 a truth，相当于 which is universally acknowledged',
      'in possession of a good fortune：静态介词短语作后置定语，替代普通动词短语 who possesses',
      'in want of：介词短语作系动词 must be 的表语，意为“需要、缺少”',
    ],
    tokens: [
      {
        text: 'It',
        role: '形式主语 (Subject)',
        roleCode: 'S',
        explanation: '形式主语，先行占位以平衡句式重心，指代后文 that 引导的从句。',
      },
      {
        text: 'is',
        role: '系动词 (Verb)',
        roleCode: 'V',
        explanation: '一般现在时系动词，连接形式主语与表语。',
      },
      {
        text: 'a truth universally acknowledged,',
        role: '表语与后置定语 (Subject Complement)',
        roleCode: 'P',
        explanation: '名词 a truth 为表语核心，过去分词短语 universally acknowledged 作后置定语。',
      },
      {
        text: 'that a single man in possession of a good fortune, must be in want of a wife.',
        role: '同位语/主语从句 (Appositive Clause)',
        roleCode: 'Clause',
        explanation: '揭示 a truth 的具体命题内容；内部主语为 a single man，谓语表语为 must be in want of a wife。',
      },
    ],
    steps: [
      {
        step: 1,
        title: '核心主干 (Core Trunk)',
        description: 'It (形式主语) + is (系动词) + a truth (表语)',
        highlightRoles: ['S', 'V', 'P'],
      },
      {
        step: 2,
        title: '修饰成分 (Modifiers)',
        description: 'universally acknowledged (过去分词后置定语) · in possession of a good fortune (介词短语定语)',
        highlightRoles: ['Attr', 'P'],
      },
      {
        step: 3,
        title: '从句结构 (Subordinate Clause)',
        description: 'that a single man ... must be in want of a wife (主语/同位语从句)',
        highlightRoles: ['Clause', 'Conn'],
      },
    ],
    syntaxTree: {
      id: 'g0-s',
      label: 'S (Sentence)',
      role: 'Clause',
      text: 'It is a truth universally acknowledged, that a single man...',
      children: [
        {
          id: 'g0-np',
          label: 'NP',
          role: 'S',
          text: '(It)',
        },
        {
          id: 'g0-vp',
          label: 'VP',
          role: 'V',
          text: '(is a truth universally acknowledged)',
          children: [
            { id: 'g0-v', label: 'V (Linking)', role: 'V', text: 'is' },
            { id: 'g0-sc', label: 'NP (Complement)', role: 'P', text: 'a truth universally acknowledged' },
          ],
        },
        {
          id: 'g0-cl',
          label: 'Cl (Appositive / Noun Clause)',
          role: 'Clause',
          text: '(that a single man in possession of...)',
          children: [
            { id: 'g0-cl-np', label: 'NP (Subject)', role: 'S', text: 'a single man in possession of a good fortune' },
            { id: 'g0-cl-vp', label: 'VP (Predicate)', role: 'V', text: 'must be in want of a wife' },
          ],
        },
      ],
    },
    dependencies: [
      { fromIndex: 1, toIndex: 0, label: '主系' },
      { fromIndex: 1, toIndex: 2, label: '系表' },
      { fromIndex: 2, toIndex: 3, label: '从句同位说明' },
    ],
  },
  {
    id: 'gram-1',
    category: '复合宾语与后置定语',
    title: '科技变革与全球协作效率',
    difficulty: '初级 (B1)',
    sentence: 'Digital technology has made remote collaboration across global time zones remarkably efficient.',
    translation: '数字技术已使跨越全球不同时区的远程协作变得尤为高效。',
    pattern: '主语 (S) + 谓语 (V) + 宾语 (O) + 后置定语 (Attr) + 宾语补足语 (Comp)',
    summary:
      '典型的主谓宾宾补（SVOC）句式。宾语 remote collaboration 后紧跟介词短语 across global time zones 作后置定语，将宾语与形容词补足语 remarkably efficient 分隔。',
    keyPoints: [
      'make + 宾语 (NP) + 形容词短语 (AdjP)：构成复合宾语结构',
      'across global time zones：介词短语后置限定 collaboration',
      'remarkably efficient：副词修饰形容词，充当宾语补足语',
    ],
    tokens: [
      {
        text: 'Digital technology',
        role: '主语 (Subject)',
        roleCode: 'S',
        explanation: '名词短语作主语，Digital 为前置形容词定语。',
      },
      {
        text: 'has made',
        role: '谓语 (Verb)',
        roleCode: 'V',
        explanation: '现在完成时及物动词短语，表示持续至今的影响。',
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
        explanation: '介词短语后置修饰 collaboration，界定空间范围。',
      },
      {
        text: 'remarkably efficient.',
        role: '宾语补足语 (Complement)',
        roleCode: 'Comp',
        explanation: '形容词短语作宾语补足语，说明宾语呈现的状态。',
      },
    ],
    steps: [
      {
        step: 1,
        title: '核心主干 (Core Trunk)',
        description: 'Digital technology (S) + has made (V) + remote collaboration (O) + remarkably efficient (Comp)',
        highlightRoles: ['S', 'V', 'O', 'Comp'],
      },
      {
        step: 2,
        title: '修饰成分 (Modifiers)',
        description: 'across global time zones (介词短语作后置定语修饰 collaboration)',
        highlightRoles: ['Attr'],
      },
    ],
    syntaxTree: {
      id: 'g1-s',
      label: 'S (Sentence)',
      role: 'Clause',
      text: 'Digital technology has made remote collaboration...',
      children: [
        {
          id: 'g1-np',
          label: 'NP (Subject)',
          role: 'S',
          text: '(Digital technology)',
        },
        {
          id: 'g1-vp',
          label: 'VP (Predicate)',
          role: 'V',
          text: '(has made ... remarkably efficient)',
          children: [
            { id: 'g1-v', label: 'V', role: 'V', text: 'has made' },
            {
              id: 'g1-obj-np',
              label: 'NP (Object)',
              role: 'O',
              text: 'remote collaboration across global time zones',
            },
            {
              id: 'g1-comp',
              label: 'AdjP (Complement)',
              role: 'Comp',
              text: 'remarkably efficient',
            },
          ],
        },
      ],
    },
    dependencies: [
      { fromIndex: 1, toIndex: 0, label: '主谓' },
      { fromIndex: 1, toIndex: 2, label: '动宾' },
      { fromIndex: 2, toIndex: 3, label: '后置定语' },
      { fromIndex: 1, toIndex: 4, label: '宾语补足语' },
    ],
  },
  {
    id: 'gram-2',
    category: '分词状语与定语从句',
    title: '海洋考古与青铜时代商船遗址',
    difficulty: '中级 (B2)',
    sentence:
      'Equipped with advanced sonar instruments, the marine archaeologists discovered a sunken merchant vessel that dated back to the Bronze Age.',
    translation: '海洋考古学家配备了先进的声呐仪器，发现了一艘可追溯至青铜时代的沉没商船。',
    pattern: '过去分词状语 (Adv) + 主语 (S) + 谓语 (V) + 宾语 (O) + 限制性定语从句 (Attr)',
    summary:
      '句首过去分词短语 Equipped with... 作伴随条件状语，其逻辑主语与主句主语 the marine archaeologists 一致；句末由关系代词 that 引导限制性定语从句修饰先行词 vessel。',
    keyPoints: [
      'Equipped with...：过去分词短语作状语，表被动或既有装备状态',
      'sunken：过去分词作前置定语（沉没的）',
      'that dated back to the Bronze Age：定语从句修饰先行词 merchant vessel',
    ],
    tokens: [
      {
        text: 'Equipped with advanced sonar instruments,',
        role: '分词状语 (Adverbial)',
        roleCode: 'Adv',
        explanation: '过去分词短语置于句首作状语，逻辑主语为 archaeologists。',
      },
      {
        text: 'the marine archaeologists',
        role: '主语 (Subject)',
        roleCode: 'S',
        explanation: '主句核心主语。',
      },
      {
        text: 'discovered',
        role: '谓语 (Verb)',
        roleCode: 'V',
        explanation: '一般过去时及物动词。',
      },
      {
        text: 'a sunken merchant vessel',
        role: '宾语 (Object)',
        roleCode: 'O',
        explanation: '直接宾语，同时充当定语从句的先行词。',
      },
      {
        text: 'that dated back to the Bronze Age.',
        role: '定语从句 (Attributive Clause)',
        roleCode: 'Attr',
        explanation: '限制性定语从句，修饰先行词 merchant vessel。',
      },
    ],
    steps: [
      {
        step: 1,
        title: '核心主干 (Core Trunk)',
        description: 'the marine archaeologists (S) + discovered (V) + a sunken merchant vessel (O)',
        highlightRoles: ['S', 'V', 'O'],
      },
      {
        step: 2,
        title: '修饰成分 (Modifiers)',
        description: 'Equipped with advanced sonar instruments (过去分词短语作状语)',
        highlightRoles: ['Adv'],
      },
      {
        step: 3,
        title: '从句结构 (Subordinate Clause)',
        description: 'that dated back to the Bronze Age (限制性定语从句)',
        highlightRoles: ['Attr'],
      },
    ],
    syntaxTree: {
      id: 'g2-s',
      label: 'S (Sentence)',
      role: 'Clause',
      text: 'Equipped with..., the marine archaeologists discovered...',
      children: [
        {
          id: 'g2-adv',
          label: 'Participle Phrase (Adverbial)',
          role: 'Adv',
          text: '(Equipped with advanced sonar instruments)',
        },
        {
          id: 'g2-main',
          label: 'Main Clause',
          role: 'Clause',
          text: '(the marine archaeologists discovered...)',
          children: [
            { id: 'g2-subj', label: 'NP (Subject)', role: 'S', text: 'the marine archaeologists' },
            {
              id: 'g2-vp',
              label: 'VP (Predicate)',
              role: 'V',
              text: 'discovered a sunken merchant vessel that...',
              children: [
                { id: 'g2-v', label: 'V', role: 'V', text: 'discovered' },
                { id: 'g2-o-head', label: 'NP (Object)', role: 'O', text: 'a sunken merchant vessel' },
                { id: 'g2-rc', label: 'Cl (Relative Clause)', role: 'Attr', text: 'that dated back to the Bronze Age' },
              ],
            },
          ],
        },
      ],
    },
    dependencies: [
      { fromIndex: 2, toIndex: 0, label: '分词状语' },
      { fromIndex: 2, toIndex: 1, label: '主谓' },
      { fromIndex: 2, toIndex: 3, label: '动宾' },
      { fromIndex: 3, toIndex: 4, label: '定语从句' },
    ],
  },
  {
    id: 'gram-3',
    category: '虚拟语气与部分倒装',
    title: '深空探测器轨道校准假设',
    difficulty: '高级 (C1)',
    sentence:
      'Had the navigation team not calibrated the orbital trajectory in time, the deep-space probe would have missed its target planet entirely.',
    translation: '倘若导航团队未及时校准轨道轨迹，这颗深空探测器便会彻底错过目标行星。',
    pattern: '虚拟倒装条件从句 (Had + S + not + V-ed) + 主句主语 (S) + 虚拟谓语 (would have V-ed) + 宾语 (O) + 状语 (Adv)',
    summary:
      '与过去事实相反的虚拟条件句：从句省略连词 if，将过去完成时助动词 Had 提至主语 the navigation team 之前构成部分倒装；主句使用 would have missed 表示本会发生却未发生的过去结果。',
    keyPoints: [
      'Had the navigation team not calibrated...：等价于 If the navigation team had not calibrated...',
      'would have missed：情态动词 + 完成体，对应过去虚拟结果',
      'entirely：程度副词置于句尾修饰谓语动词',
    ],
    tokens: [
      {
        text: 'Had the navigation team not calibrated the orbital trajectory in time,',
        role: '虚拟条件从句 (Conditional Clause)',
        roleCode: 'Adv',
        explanation: '省略 if 的倒装虚拟条件状语从句，表示与过去事实相反的假设。',
      },
      {
        text: 'the deep-space probe',
        role: '主语 (Subject)',
        roleCode: 'S',
        explanation: '主句核心主语。',
      },
      {
        text: 'would have missed',
        role: '虚拟谓语 (Verb)',
        roleCode: 'V',
        explanation: '表示对过去未发生事件的结果推演。',
      },
      {
        text: 'its target planet',
        role: '宾语 (Object)',
        roleCode: 'O',
        explanation: '谓语动词 missed 的直接宾语。',
      },
      {
        text: 'entirely.',
        role: '状语 (Adverbial)',
        roleCode: 'Adv',
        explanation: '程度副词修饰谓语动词。',
      },
    ],
    steps: [
      {
        step: 1,
        title: '核心主干 (Core Trunk)',
        description: 'the deep-space probe (S) + would have missed (V) + its target planet (O)',
        highlightRoles: ['S', 'V', 'O'],
      },
      {
        step: 2,
        title: '从句与状语 (Clauses & Adverbials)',
        description: 'Had the navigation team not calibrated... (虚拟条件倒装从句) · entirely (程度状语)',
        highlightRoles: ['Adv'],
      },
    ],
    syntaxTree: {
      id: 'g4-s',
      label: 'S (Sentence)',
      role: 'Clause',
      text: 'Had the navigation team..., the deep-space probe would have missed...',
      children: [
        {
          id: 'g4-cond',
          label: 'Cl (Inverted Conditional)',
          role: 'Adv',
          text: '(Had the navigation team not calibrated...)',
        },
        {
          id: 'g4-main',
          label: 'Main Clause',
          role: 'Clause',
          text: '(the deep-space probe would have missed...)',
          children: [
            { id: 'g4-ms', label: 'NP (Subject)', role: 'S', text: 'the deep-space probe' },
            { id: 'g4-mvp', label: 'VP (Modal Perfect)', role: 'V', text: 'would have missed its target planet entirely' },
          ],
        },
      ],
    },
    dependencies: [
      { fromIndex: 2, toIndex: 0, label: '虚拟条件' },
      { fromIndex: 2, toIndex: 1, label: '主谓' },
      { fromIndex: 2, toIndex: 3, label: '动宾' },
      { fromIndex: 2, toIndex: 4, label: '程度状语' },
    ],
  },
];

export const TRANSLATION_ITEMS: TranslationItem[] = [
  {
    id: 'trans-adv-1',
    difficulty: 'advanced',
    difficultyLabel: '高级 · 文学修辞',
    sourceType: 'literature',
    workTitle: '《傲慢与偏见》',
    workTitleEn: 'Pride and Prejudice',
    creator: 'Jane Austen',
    year: '1813',
    characterOrScene: '第一卷第一章开篇导语',
    sourceIntro:
      '英国小说家简·奥斯汀代表作开篇句。以庄重的哲理命题句式反衬英国乡绅阶层的世俗联姻观念，是英文“形式主语 + 分词后置定语 + 同位/主语从句”的典范。',
    chinese: '凡是有钱的单身汉，总想娶位太太，这已经成了一条公认的真理。',
    referenceEnglish:
      'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    alternativeEnglish:
      'It is a universally acknowledged truth that a single man who possesses a large fortune must be in need of a wife.',
    grammarFocus: 'It is a truth universally acknowledged, that + 主语 + 介词短语后置定语 + must be in want of...',
    vocabHints: [
      { word: 'universally acknowledged', pos: 'phr.', meaning: '被普遍承认的 / 举世公认' },
      { word: 'in possession of', pos: 'phr.', meaning: '拥有 / 占有（作后置定语）' },
      { word: 'in want of', pos: 'phr.', meaning: '需要 / 渴望（作表语）' },
    ],
    literaryNote:
      '原文以静态介词短语 in possession of 与 in want of 替代普通动词 have 与 need，行文典雅克制，头轻脚重，层次分明。',
  },
  {
    id: 'trans-beg-1',
    difficulty: 'beginner',
    difficultyLabel: '初级 · 基础句式',
    sourceType: 'film',
    workTitle: '《肖申克的救赎》',
    workTitleEn: 'The Shawshank Redemption',
    creator: 'Frank Darabont',
    year: '1994',
    characterOrScene: '安迪致瑞德的信件独白',
    sourceIntro:
      '改编自斯蒂芬·金中篇小说。安迪重获自由后留给挚友瑞德的信件结语，以简练的并列主系表结构与否定主语句传递信念。',
    chinese: '希望是一件美好的事物，也许是世间最美好的事物，而美好的事物永不消逝。',
    referenceEnglish: 'Hope is a good thing, maybe the best of things, and no good thing ever dies.',
    alternativeEnglish: 'Hope is a wonderful thing, perhaps the best of all things, and good things never fade away.',
    grammarFocus: '主系表结构 (SVP) + 同位语补充 (maybe the best of things) + 完全否定分句 (no ... ever)',
    vocabHints: [
      { word: 'the best of things', pos: 'phr.', meaning: '世间最美好的事物' },
      { word: 'no ... ever', pos: 'phr.', meaning: '永不……（强否定结构）' },
      { word: 'die / fade away', pos: 'v.', meaning: '消逝 / 湮灭' },
    ],
    literaryNote:
      '三次复现核心词 thing 与 good/best，节奏简明凝练；句末采用 no good thing ever dies，比被动句更具箴言力量。',
  },
  {
    id: 'trans-beg-2',
    difficulty: 'beginner',
    difficultyLabel: '初级 · 基础句式',
    sourceType: 'film',
    workTitle: '《死亡诗社》',
    workTitleEn: 'Dead Poets Society',
    creator: 'Peter Weir',
    year: '1989',
    characterOrScene: '基廷教授首堂文学课寄语',
    sourceIntro:
      '基廷老师带领学生凝视百年前校友照片时吟诵拉丁格言 Carpe Diem，勉励学子把握当下，以简短祈使句与复合宾语结构收束。',
    chinese: '把握当下，孩子们，让你们的人生变得不同凡响。',
    referenceEnglish: 'Seize the day, boys. Make your lives extraordinary.',
    alternativeEnglish: 'Carpe diem, boys; make your lives truly extraordinary.',
    grammarFocus: '并列祈使句 + 复合宾语结构 (make + 宾语 your lives + 形容词补语 extraordinary)',
    vocabHints: [
      { word: 'seize the day', pos: 'idiom', meaning: '把握当下 / 珍惜今朝' },
      { word: 'extraordinary', pos: 'adj.', meaning: '非凡的 / 不同凡响的' },
    ],
    literaryNote:
      '英文以 make + 宾语 + 形容词补足语直接表达“使……变得……”，省去多余系动词，短促有力。',
  },
  {
    id: 'trans-int-1',
    difficulty: 'intermediate',
    difficultyLabel: '中级 · 复合从句',
    sourceType: 'literature',
    workTitle: '《了不起的盖茨比》',
    workTitleEn: 'The Great Gatsby',
    creator: 'F. Scott Fitzgerald',
    year: '1925',
    characterOrScene: '第一章开篇叙述者尼克引述父亲箴言',
    sourceIntro:
      '小说开篇第一段。尼克回忆父亲在他年少时给出的忠告，奠定全书克制而宽容的叙事基调，综合运用让步时间状语从句、宾语从句与定语从句。',
    chinese: '每当你想要批评别人的时候，要记住，这世上并非所有人都拥有你所占有的那些优越条件。',
    referenceEnglish:
      'Whenever you feel like criticizing any one, just remember that all the people in this world have not had the advantages that you have had.',
    alternativeEnglish:
      'Whenever you are inclined to criticize someone, remember that not everyone in the world has enjoyed the privileges you have had.',
    grammarFocus: 'Whenever 状语从句 + 祈使句 + that 宾语从句（含 all ... not 部分否定）+ that 定语从句',
    vocabHints: [
      { word: 'feel like doing', pos: 'phr.', meaning: '想要做某事 / 动念做某事' },
      { word: 'all ... not', pos: 'phr.', meaning: '并非所有人都（部分否定）' },
      { word: 'advantages', pos: 'n.', meaning: '优越条件 / 先天优势' },
    ],
    literaryNote:
      '以 all the people ... have not had 构成古典部分否定，句尾主从句叠用 have had，形成优雅的完成体呼应。',
  },
  {
    id: 'trans-int-2',
    difficulty: 'intermediate',
    difficultyLabel: '中级 · 复合从句',
    sourceType: 'literature',
    workTitle: '《杀死一只知更鸟》',
    workTitleEn: 'To Kill a Mockingbird',
    creator: 'Harper Lee',
    year: '1960',
    characterOrScene: '阿蒂克斯·芬奇向女儿阐释共情之道',
    sourceIntro:
      '普利策奖小说经典篇章。律师阿蒂克斯引导女儿学会站在他人立场审视世界，通过双 until 从句实现从抽象理念到具象隐喻的递进。',
    chinese: '你永远不可能真正了解一个人，除非你站在他的角度思考问题——钻进他的皮肤里，像他一样走来走去。',
    referenceEnglish:
      'You never really understand a person until you consider things from his point of view—until you climb into his skin and walk around in it.',
    grammarFocus: 'never ... until 条件时间状语从句 + 破折号同位递进重述',
    vocabHints: [
      { word: 'from one’s point of view', pos: 'phr.', meaning: '站在某人的角度 / 立场' },
      { word: 'climb into one’s skin', pos: 'idiom', meaning: '设身处地 / 深入他人处境' },
    ],
    literaryNote:
      '破折号前为抽象表述 consider things from his point of view，破折号后转为具象动作 climb into his skin，生动传神。',
  },
  {
    id: 'trans-adv-2',
    difficulty: 'advanced',
    difficultyLabel: '高级 · 文学修辞',
    sourceType: 'literature',
    workTitle: '《了不起的盖茨比》',
    workTitleEn: 'The Great Gatsby',
    creator: 'F. Scott Fitzgerald',
    year: '1925',
    characterOrScene: '全书终章结语',
    sourceIntro:
      '二十世纪英语文学最富盛名的结尾句。将人类对未来的追逐凝练为逆流而上的孤舟意象，兼具同位语隐喻、过去分词伴随状语与头韵修辞。',
    chinese: '于是我们奋力向前划桨，逆流而上的小舟，不停地被推回往昔岁月。',
    referenceEnglish: 'So we beat on, boats against the current, borne back ceaselessly into the past.',
    grammarFocus: '主谓核心 (we beat on) + 名词短语同位语隐喻 (boats against the current) + 过去分词状语 (borne back...)',
    vocabHints: [
      { word: 'beat on', pos: 'v.', meaning: '迎浪奋力前行 / 持续拍击' },
      { word: 'against the current', pos: 'phr.', meaning: '逆流而上' },
      { word: 'borne back ceaselessly', pos: 'phr.', meaning: '不停地被推回（bear 的过去分词）' },
    ],
    literaryNote:
      '全句仅十余词，通过 beat / boats / borne back 的双唇爆破音头韵（Alliteration），摹写出潮水反复推回小舟的律动感。',
  },
];

export const IELTS_LISTENING_ITEMS: IeltsListeningItem[] = [
  {
    id: 'listen-1',
    section: 'Part 1 · 生活咨询',
    title: '市政体育中心会员注册与健康核验',
    scenario: '新生致电社区体育中心咨询年度会员费率、学生折扣及入会引导课程安排。',
    accent: '英音 (UK)',
    audioScript:
      'Receptionist: Good morning, Westside Leisure Centre. You are inquiring about our student annual membership, right? Originally the standard fee was 240 pounds, wait—sorry, that was last year’s rate; for full-time students with a valid ID card, the discounted annual fee is 185 pounds. Also, please bring a passport photo and complete a health questionnaire before your first induction session on Thursday.',
    questionStem:
      'Student Membership Notes:\n1. Discounted annual membership fee: £ {{0}}\n2. Required document besides a photo: a health {{1}}\n3. Day of the first induction session: {{2}}',
    blanks: [
      {
        index: 0,
        answer: '185',
        synonymCue: 'discounted annual fee is 185 pounds',
        distractorTrap: '前文出现的 240 系旧费率（that was last year’s rate），属自我修正干扰项。',
      },
      {
        index: 1,
        answer: 'questionnaire',
        synonymCue: 'complete a health questionnaire',
        distractorTrap: '注意双写 n 与词尾 aire 拼写。',
      },
      {
        index: 2,
        answer: 'Thursday',
        synonymCue: 'first induction session on Thursday',
        distractorTrap: '星期专有名词首字母须大写。',
      },
    ],
    coreVocab: [
      { word: 'questionnaire', phonetic: '/ˌkwestʃəˈneə(r)/', meaning: 'n. 调查问卷、登记表' },
      { word: 'induction session', phonetic: '/ɪnˈdʌkʃn ˈseʃn/', meaning: 'n. 入门指导课' },
      { word: 'discounted rate', phonetic: '/ˈdɪskaʊntɪd reɪt/', meaning: 'n. 折扣费率' },
    ],
  },
  {
    id: 'listen-2',
    section: 'Part 4 · 学术讲座',
    title: '生态建筑与垂直森林外墙系统',
    scenario: '建筑学讲座探讨高层建筑垂直绿化如何吸收悬浮颗粒物并降低室内环境噪音。',
    accent: '英音 (UK)',
    audioScript:
      'Professor: In today’s lecture on sustainable urban architecture, we examine vertical forests. Contrary to early skepticism regarding structural weight, reinforced balconies can easily support medium-sized shrubs. The primary environmental benefit is not merely aesthetic; rather, the dense foliage acts as a natural filter that absorbs fine particulate matter and significantly reduces ambient noise levels inside residential apartments.',
    questionStem:
      'Vertical Forest Architecture:\n1. Reinforced balconies support medium-sized {{0}}.\n2. Dense foliage functions as a natural {{1}} against pollutants.\n3. Greenery also lowers indoor {{2}} levels.',
    blanks: [
      {
        index: 0,
        answer: 'shrubs',
        synonymCue: 'support medium-sized shrubs',
        distractorTrap: '注意复数词尾 -s。',
      },
      {
        index: 1,
        answer: 'filter',
        synonymCue: 'acts as a natural filter',
        distractorTrap: '题干 functions as 同义替换原文 acts as。',
      },
      {
        index: 2,
        answer: 'noise',
        synonymCue: 'reduces ambient noise levels inside residential apartments',
        distractorTrap: '题干 lowers indoor 同义替换 reduces ... inside。',
      },
    ],
    coreVocab: [
      { word: 'foliage', phonetic: '/ˈfəʊliɪdʒ/', meaning: 'n. 植物枝叶（集合名词）' },
      { word: 'particulate matter', phonetic: '/pɑːˈtɪkjələt ˈmætə/', meaning: 'n. 悬浮颗粒物' },
      { word: 'ambient', phonetic: '/ˈæmbiənt/', meaning: 'adj. 周围环境的' },
    ],
  },
];

export const IELTS_READING_ITEMS: IeltsReadingItem[] = [
  {
    id: 'read-1',
    topic: '认知神经科学 · Cognitive Neuroscience',
    title: '双语经验对大脑执行控制网络的塑造',
    passageExcerpt:
      'For decades, early developmental psychologists assumed that exposing infants to two languages simultaneously might induce linguistic confusion and delay vocabulary acquisition. However, contemporary neuroimaging studies utilizing functional MRI have thoroughly debunked this hypothesis. Because bilingual speakers must constantly inhibit one active language system while selecting lexical items from another, their dorsolateral prefrontal cortex undergoes continuous executive training. Consequently, lifelong bilinguals typically exhibit delayed onset of neurodegenerative symptoms by an average of four to five years compared to monolingual peers, even when underlying brain pathology is already present.',
    longSentenceAnalysis: {
      sentence:
        'Because bilingual speakers must constantly inhibit one active language system while selecting lexical items from another, their dorsolateral prefrontal cortex undergoes continuous executive training.',
      translation:
        '由于双语者在从一套语言系统中提取词汇的同时必须持续抑制另一套激活的语言系统，其背外侧前额叶皮层得以接受持续的执行控制训练。',
      breakdown:
        'Because 引导原因状语从句，内嵌连词分词结构 while selecting lexical items from another；主句主干为 their dorsolateral prefrontal cortex (主语) + undergoes (谓语) + continuous executive training (宾语)。',
    },
    paraphrasePairs: [
      {
        passageExpr: 'thoroughly debunked this hypothesis',
        questionExpr: 'proved the early assumption to be false',
        type: '动词与宾语同义转换',
      },
      {
        passageExpr: 'constantly inhibit',
        questionExpr: 'suppress on a regular basis',
        type: '学术高频词汇替换',
      },
      {
        passageExpr: 'delayed onset of neurodegenerative symptoms',
        questionExpr: 'postponed appearance of cognitive decline signs',
        type: '词根与上下义替换',
      },
    ],
    questions: [
      {
        id: 'rq-1',
        statement:
          'Modern brain-scanning technology has confirmed the early belief that learning two languages in infancy slows down language development.',
        answer: 'FALSE',
        explanation:
          '原文指出神经影像研究已彻底推翻（thoroughly debunked）该早期假设，与题干 confirmed 直接抵触。',
      },
      {
        id: 'rq-2',
        statement:
          'Bilingual individuals develop symptoms of neurodegenerative diseases several years later than people who speak only one language.',
        answer: 'TRUE',
        explanation:
          '原文末句指出终身双语者比单语者出现神经退行性症状的时间平均推迟 4 至 5 年，语义完全对应。',
      },
      {
        id: 'rq-3',
        statement:
          'Speaking three or more languages provides twice as much cognitive protection as speaking only two languages.',
        answer: 'NOT GIVEN',
        explanation:
          '原文仅对比双语者与单语者，未提及掌握三门及以上语言的保护倍率。',
      },
    ],
  },
];

export const IELTS_WRITING_PROMPTS: IeltsWritingPrompt[] = [
  {
    id: 'write-1',
    taskType: 'Task 2 (大作文议论文)',
    topicCategory: '科技与就业结构',
    title: '人工智能与自动化对人类工作形态的影响',
    question:
      'Some people believe that the rapid advancement of artificial intelligence and automation will inevitably lead to widespread unemployment, while others argue that it will liberate humans to pursue more creative and fulfilling work. Discuss both views and give your own opinion.',
    outlineSteps: [
      '引言段 (Introduction)：改写题干争议背景，确立“短期存在替代阵痛，长期结合教育转型可释放创造力”的平衡立场。',
      '主体段一 (Body 1)：剖析自动化对程序化岗位（routine manual and cognitive tasks）的替代效应及技能错配风险。',
      '主体段二 (Body 2)：论述智能系统接管繁琐计算后，人类得以聚焦于跨学科创新、伦理决策与共情服务。',
      '结论段 (Conclusion)：归纳双边视野，强调终身职业重培训（lifelong reskilling initiatives）的必要性。',
    ],
    band6Excerpt:
      'Nowadays, AI is developing very fast. Many people think robots will take away our jobs. However, other people think AI is very helpful because it can do boring work for us, so we can have more time to do creative things.',
    band85Model:
      'The exponential proliferation of artificial intelligence has ignited a polarized debate regarding the future of human labor. While concerns over the displacement of routine occupations are well-founded in the short term, I contend that algorithmic automation, when coupled with proactive educational reform, ultimately empowers the workforce to engage in higher-order creative endeavors.\n\nAdmittedly, anxieties surrounding technological unemployment stem from tangible structural shifts. Unlike previous industrial revolutions that primarily mechanized physical toil, contemporary machine-learning models can execute complex analytical and administrative tasks with unprecedented precision. Consequently, workers entrenched in standardized roles face an acute risk of redundancy unless vocational retraining is swiftly implemented.\n\nNevertheless, viewing technological progress solely through the lens of job destruction overlooks its capacity to augment human potential. By delegating repetitive, data-intensive calculations to intelligent systems, professionals are liberated to focus on conceptual innovation, ethical judgment, and interpersonal empathy.',
    upgradeHighlights: [
      {
        band6: 'AI is developing very fast',
        band85: 'The exponential proliferation of artificial intelligence',
        reason: '以名词化短语确立学术书面语域',
      },
      {
        band6: 'take away our jobs',
        band85: 'the displacement of routine occupations / acute risk of redundancy',
        reason: '使用经济学精准搭配提升词汇评分 (LR)',
      },
      {
        band6: 'do boring work for us, so we can have more time',
        band85: 'By delegating repetitive calculations to intelligent systems, professionals are liberated to...',
        reason: '运用方式状语与被动结构提升句法多样性 (GRA)',
      },
    ],
  },
  {
    id: 'write-2',
    taskType: 'Task 1 (学术图表/书信)',
    topicCategory: '动态折线图对比',
    title: '四国可再生能源发电占比三十年趋势',
    question:
      'The graph below shows the percentage of electricity generated from renewable sources in four countries (Norway, Germany, the UK, and Australia) between 1995 and 2025. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
    outlineSteps: [
      '首段改写 (Introduction)：同义转换题干核心词（percentage → proportion, generated from → derived from）。',
      '总体概述 (Overview)：提炼四国整体上升趋势，点明挪威始终居首、德英两国后半程增速最显著。',
      '细节段一 (Body 1)：描述挪威自 66% 稳步攀升至近 82% 的高位特征。',
      '细节段二 (Body 2)：对比德、英、澳三国自低基数起步并在 2010 年后显著分化的轨迹。',
    ],
    band6Excerpt:
      'From the line graph we can see that renewable energy increased in all four countries from 1995 to 2025. Norway was always the highest one. Germany and the UK went up very fast after 2010.',
    band85Model:
      'The line graph illustrates the proportion of electricity derived from renewable energy across four nations—namely Norway, Germany, the UK, and Australia—over a thirty-year span from 1995 to 2025.\n\nOverall, all four countries experienced an upward trajectory in clean power generation throughout the period. Notably, Norway consistently maintained a commanding lead, whereas Germany and the UK registered the most pronounced surges during the final fifteen years.\n\nIn 1995, Norway already generated approximately 66% of its electricity from renewables, dwarfing the other three nations, all of which stood below 8%. Over the subsequent three decades, Norway’s figure rose steadily, reaching a peak of nearly 82% in 2025.\n\nBy contrast, Germany and the UK began at negligible levels of roughly 4% and 2% respectively. Following a decade of modest growth, both nations witnessed an exponential climb after 2010, surging to 48% and 42% by 2025.',
    upgradeHighlights: [
      {
        band6: 'went up very fast after 2010',
        band85: 'witnessed an exponential climb / registered the most pronounced surges',
        reason: '替换单一趋势动词，丰富图表描写词汇',
      },
      {
        band6: 'Norway was always the highest one',
        band85: 'Norway consistently maintained a commanding lead, dwarfing the other three nations',
        reason: '引入现在分词伴随状语体现数据反差',
      },
    ],
  },
];

export const IELTS_SPEAKING_TOPICS: IeltsSpeakingTopic[] = [
  {
    id: 'speak-1',
    part: 'Part 2 · 个人陈述 (Cue Card)',
    topic: 'Describe a skill that took you a long time to learn',
    cueCardPrompt: 'Describe a practical or intellectual skill that took you a long time to learn.',
    bulletPoints: [
      'What the skill is and why you decided to learn it',
      'How and where you learned it step by step',
      'What difficulties or bottlenecks you encountered',
      'And explain how you felt once you finally mastered it',
    ],
    questions: [
      {
        q: 'Part 2 独白范式：耗时习得的技能',
        strategy: '按“初衷引入 → 初期瓶颈 → 突破契机 → 习得感悟”四层推进，自然嵌入地道习语。',
        sampleAnswer:
          'The first skill that springs to mind is algorithmic programming in Python, which took me well over a year of consistent practice to truly get the hang of. Initially, I embarked on this journey during my sophomore year to automate data analysis for my research projects. At first, the learning curve was steep—I kept hitting a plateau whenever I dealt with recursion. However, by breaking down problems into smaller modules every weekend, everything eventually clicked into place.',
        idioms: [
          { phrase: 'get the hang of', meaning: '掌握窍门 / 熟练上手' },
          { phrase: 'a steep learning curve', meaning: '陡峭的学习曲线' },
          { phrase: 'hit a plateau', meaning: '遭遇瓶颈期' },
          { phrase: 'click into place', meaning: '豁然开朗 / 融会贯通' },
        ],
      },
      {
        q: 'Part 3 深度思辨：Why do adults often find it harder to acquire new skills than children?',
        strategy: '从心理防线（自我意识与试错成本）与客观时间分配两个层面展开对比。',
        sampleAnswer:
          'That largely comes down to cognitive and practical factors. From a psychological standpoint, adults tend to be more self-conscious about making mistakes, whereas children learn through trial and error without fear of embarrassment. Furthermore, working professionals are constantly juggling career commitments and family responsibilities, making it difficult to carve out uninterrupted time for deliberate practice.',
        idioms: [
          { phrase: 'trial and error', meaning: '反复试错' },
          { phrase: 'juggle multiple commitments', meaning: '兼顾多项事务' },
          { phrase: 'deliberate practice', meaning: '刻意练习' },
        ],
      },
    ],
  },
];

export const AI_PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
    description: '标准 OpenAI 官方接口，由 Worker 边缘节点代理转发。',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    description: 'DeepSeek 官方兼容接口。',
  },
  {
    id: 'qwen',
    name: '通义千问 (DashScope)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    models: ['qwen-plus', 'qwen-max', 'qwen-turbo'],
    description: '阿里云百炼 OpenAI 兼容模式接口。',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    models: ['Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3'],
    description: '硅基流动 OpenAI 兼容接口。',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    models: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-001'],
    description: 'OpenRouter 多模型聚合网关。',
  },
  {
    id: 'custom',
    name: '自定义兼容网关',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini'],
    description: '兼容 /v1/chat/completions 协议的自建或第三方服务。',
  },
];
