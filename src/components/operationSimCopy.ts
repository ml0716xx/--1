/* ==========================================================================
   策略仿真 · 展示文案层
   --------------------------------------------------------------------------
   与数据层（operationSimData.ts）分离，目的有三：
     1. 数据层由导出脚本生成，只承载数字；本文案层承载全部对外表述。
     2. 表述统一为客观陈述，不出现口语化、拟人化、对仗排比式写法。
     3. 新增站点 / 月份 / 仿真场景时，只替换数据层数字；
        本文案层的句式与结构复用，组件（OperationDataPanel.tsx）不需改动。
   ========================================================================== */

import {
  ATTRIB_DATA,
  CAP_KWH,
  CASE_DAY_ROWS,
  DAILY_HEADERS,
  DAILY_ROWS,
  MARKET_PRICE,
  PRICE_MODE,
  PRICE_MONTH,
  SIM_META,
  TOU_TIERS,
} from './operationSimData';

/* ---------------------------- 数字格式化 ---------------------------- */
const n0 = (v: number) => Math.round(v).toLocaleString('zh-CN');
const n1 = (v: number) => v.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n3 = (v: number) => v.toLocaleString('zh-CN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const n4 = (v: number) => v.toLocaleString('zh-CN', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
/** 带符号整数金额 */
const sg0 = (v: number) => (v > 0 ? '+' : '') + n0(v);

/* ---------------------- 差额构成数值简写（供下方各文案块共用） ---------------------- */
/** 数据层简写：差额构成类文案必须从这里取数，避免同一数字在两处写法不一致 */
const A = ATTRIB_DATA;
const stTimeShare = Math.round((A.storage.timeEffect / A.storage.diff) * 100);
const stVolShare = 100 - stTimeShare;
/** 光伏量效应按消纳去向拆成上网侧与自用侧两项金额 */
const pvExportAmt = A.pv.exportDiff * A.pv.exportPrice;
const pvSelfAmt = A.pv.selfDiff * A.pv.selfPrice;

/* ---------------------------- 场景注册表 ---------------------------- */
/** 后续拓展新仿真场景：在此追加一条即可，组件按 status 渲染可用/规划中。 */
export interface SimScenario {
  id: string;
  name: string;
  desc: string;
  /** 对比基准 */
  benchmark: string;
  status: 'ready' | 'planned';
}

export const SIM_SCENARIOS: SimScenario[] = [
  {
    id: 'ai_strategy',
    name: 'AI 策略仿真',
    desc: '在相同负荷与光伏输入下，按分时电价信号重排储能充放电计划',
    benchmark: '站点实际运行',
    status: 'ready',
  },
  // 「人工策略回放」「多策略比选」已按 2026-10-20 领导要求从本期范围去掉，不要再加回。
  // 场景注册表结构保留（status 仍支持 'planned'），后续新增场景直接追加一条即可。
];

/* ---------------------------- 设备容量项 ---------------------------- */
/** 视图层按 index 配图标与配色，键与展示名统一放这里 */
export const CAPACITY_ITEMS: { key: string; label: string }[] = [
  { key: '光伏装机容量 (kWp)', label: '光伏装机' },
  { key: '储能容量 (kWh)', label: '储能电池' },
  { key: '储能最大充放电功率 (kW)', label: '储能变流器 PCS' },
  { key: 'SOC 运行区间', label: 'SOC 运行区间' },
];

/* ---------------------------- 通用对照标签 ---------------------------- */
/** 表格列头与两侧对照统一用这一组，避免同一概念多种写法 */
export const COL_LABELS = {
  item: '指标',
  actual: '实际运行',
  sim: '仿真',
  diff: '绝对差',
  pct: '相对差',
} as const;

/* ---------------------------- 分时档位名称 ---------------------------- */
/** 档位中文名与配色分离：名称在此，颜色在视图层（按 key 取） */
export const TOU_LABELS: Record<string, string> = {
  valley: '谷',
  flat: '平',
  shoulder: '肩',
  peak: '峰',
};

/** 档位时段窗口格式化：slot 区间 → 「01:00–06:00」，多段用「、」连接（窗口本身来自数据层） */
const slotHM = (s: number) =>
  `${String(Math.floor(s / 4)).padStart(2, '0')}:${String((s % 4) * 15).padStart(2, '0')}`;
export const tierWindow = (ranges: [number, number][]) =>
  ranges.map(([a, b]) => `${slotHM(a)}–${slotHM(b)}`).join('、');

/* ---------------------------- 电价口径 ---------------------------- */
/** 电价机制来自数据层：tou = 固定分时档位，market = 市场化（现货/中长期）逐 15min 变价 */
const isMarket = PRICE_MODE === 'market';
const purchasePrices = TOU_TIERS.map(t => t.price);
const purchaseLow = isMarket ? (MARKET_PRICE?.min ?? 0) : Math.min(...purchasePrices);
const purchaseHigh = isMarket ? (MARKET_PRICE?.max ?? 0) : Math.max(...purchasePrices);
/** 购电价格的紧凑写法：分时站列四档，市场化站列区间 + 均价 + 变价点位数 */
const purchaseTierText = isMarket
  ? `${n4(purchaseLow)} ~ ${n4(purchaseHigh)}，时间加权均价 ${n4(MARKET_PRICE?.avg ?? 0)}，${MARKET_PRICE?.distinct ?? 0} 个价格点位`
  : TOU_TIERS.map(t => `${TOU_LABELS[t.key]} ${n4(t.price)}`).join(' / ');

export const PRICE_TEXT = {
  stripTitle: '电价口径',
  /** 购电价标签随机制变：分时站写「分时」，市场化站写「市场化」 */
  purchaseLabel: isMarket ? '购电电价（市场化）' : '购电电价（分时）',
  saleLabel: '售电电价（余电上网）',
  groupLabel: '电价类',
  saleNote: '余电上网结算单价，两侧同口径',
  chargeWeighted: '充电加权电价',
  dischargeWeighted: '放电加权电价',
  spread: '充放电毛价差',
  // 收益差额构成里的「充放电加权电价」块已按 2026-10-20 领导要求整块去掉，
  // weightedTitle / weightedNote / spreadNote 随之删除；月度指标对比与推送弹窗仍在用上面三个标签。
  unit: '元/kWh',
  /** 实际侧没有加权电价时的说明（报表为日粒度，未拆分充电成本与放电收益） */
  noRealNote: '实际运行报表为日粒度，未拆分充电成本与放电收益，实际侧不计算加权电价',
  /** 当日口径提示：仿真侧逐 15min 加权，实际侧同因不计算 */
  dayNoRealNote: '实际运行侧同因不计算',
} as const;

export interface PriceRow {
  name: string;
  /** 已格式化的展示值；'—' 表示该侧不适用 */
  sim: string;
  real: string;
  diff: string;
  rel: string;
  /** 差异方向，仅决定配色 */
  tone: 'up' | 'down' | 'flat';
  note: string;
}

/**
 * 月度指标对比「电价类」行。
 * 购电/售电为站点价格基准（两侧同值）；充电/放电加权电价为仿真侧读数，
 * 实际侧因报表未拆分成本与收益而不可算，置「—」并在说明列交代口径。
 */
export const PRICE_ROWS: PriceRow[] = [
  {
    name: '购电电价 (元/kWh)',
    sim: `${n4(purchaseLow)} ~ ${n4(purchaseHigh)}`,
    real: `${n4(purchaseLow)} ~ ${n4(purchaseHigh)}`,
    diff: '—',
    rel: '—',
    tone: 'flat',
    note: isMarket
      ? `市场化购电：${purchaseTierText}，逐 15min 结算`
      : `站点固定分时四档：${purchaseTierText}，两侧同价`,
  },
  {
    name: '售电电价 (元/kWh)',
    sim: PRICE_MONTH.sale === null ? '—' : n4(PRICE_MONTH.sale),
    real: PRICE_MONTH.sale === null ? '—' : n4(PRICE_MONTH.sale),
    diff: PRICE_MONTH.sale === null ? '—' : '0.0000',
    rel: PRICE_MONTH.sale === null ? '—' : '0.0%',
    tone: 'flat',
    note: PRICE_TEXT.saleNote,
  },
  {
    name: '充电加权电价 (元/kWh)',
    sim: PRICE_MONTH.chargeWeighted === null ? '—' : n4(PRICE_MONTH.chargeWeighted),
    real: '—',
    diff: '—',
    rel: '—',
    tone: 'flat',
    note: `充电成本 ÷ 储能充电量（仿真侧按逐 15min 电价加权）。${PRICE_TEXT.noRealNote}`,
  },
  {
    name: '放电加权电价 (元/kWh)',
    sim: PRICE_MONTH.dischargeWeighted === null ? '—' : n4(PRICE_MONTH.dischargeWeighted),
    real: '—',
    diff: '—',
    rel: '—',
    tone: 'flat',
    note: '放电收益 ÷ 储能放电量；与充电加权电价之差即毛价差。',
  },
];

/* ---------------------------- 推送报告 ---------------------------- */
/** 推送模块按「报告章节」粒度勾选；新增章节只在这里追加一条 */
export interface PushSection {
  id: string;
  name: string;
  desc: string;
  /** 该章节包含的面板区块，用于勾选卡与预览分区标题 */
  items: string[];
}

export const PUSH_SECTIONS: PushSection[] = [
  {
    id: 'overview',
    name: '运行概况',
    desc: '站点基本信息、设备配置与实际运行指标',
    items: ['站点信息', '各类设备容量', '原始运行指标'],
  },
  {
    id: 'benefit',
    name: '仿真收益对比',
    desc: '仿真效果概览、收益差额构成、电价口径与月度指标对比',
    items: ['仿真效果概览', '收益差额构成', '电价口径', '月度指标对比'],
  },
  {
    id: 'caseday',
    name: '典型日分析',
    desc: '案例日逐 15min 实际运行与仿真对照',
    items: ['典型日分析'],
  },
];

export const PUSH_COPY = {
  action: '推送仿真报告',
  title: '推送仿真报告',
  subtitle: '接收方在用户端看到的完整内容，三章全量',
  sectionTitle: '推送内容',
  selectAll: '全选',
  clearAll: '清空',
  itemUnit: '项',
  previewTitle: '用户端预览',
  previewHint: '接收方在用户端看到的效果',
  previewEmptyTitle: '未选择推送内容',
  previewEmptyDesc: '请至少勾选一个报告章节后再推送。',
  receiverLabel: '接收方',
  receiverValue: '站点业主 · 用户端',
  reportNoLabel: '报告编号',
  reportNoPrefix: 'RPT',
  reportHeadTitle: '仿真收益报告',
  totalLabel: '总收益',
  deltaLabel: '净增',
  caseDayLabel: '案例日',
  storageDeltaLabel: '储能收益差',
  /** 预览分区标题（典型日章节） */
  caseDayBlockTitle: '典型日分析',
  /** 预览分区标题（仿真收益对比章节内的电价块） */
  priceBlockTitle: '电价口径',
  cancel: '取消',
  confirm: '确认推送',
  pushing: '推送中...',
  selectedPrefix: '已选',
  selectedUnit: '个章节',
  toastTitle: '仿真报告已推送至用户端',
} as const;

/* ---------------------------- 子视图 ---------------------------- */
export const VIEW_META: Record<string, { label: string; hint: string }> = {
  money: { label: '收益差额构成', hint: '分项差额、增量来源与电价口径' },
  monthly: { label: '月度指标对比', hint: '逐项偏差、电价与 31 天逐日明细' },
  day: { label: '典型日分析', hint: '案例日逐 15min 实际运行与仿真对照' },
};

/* ---------------------------- 面板文案 ---------------------------- */
export const COPY = {
  panelTitle: '运营数据',
  panelBadge: '标准站点视图',
  periodLabel: '数据区间',

  /* 设备容量 */
  capacityTitle: '各类设备容量',
  capacityHint: '站点配置参数',

  /* 原始运行指标 */
  standardTitle: '原始运行指标',
  standardHint: '实际运行 · 报表表计原值',

  /* 仿真区 */
  simTitle: '仿真效果',
  simSectionTitle: '仿真场景',
  benchmarkLabel: '对比基准',
  scenarioReady: '可用',
  scenarioPlanned: '规划中',
  emptyTitle: '策略仿真未运行',
  emptyDesc: '运行仿真后，在相同负荷与光伏输入下按分时电价重排储能充放电计划，与实际运行逐项对比。',
  emptyAction: '运行策略仿真',
  running: '仿真计算中...',
  rerun: '重跑仿真',
  collapse: '收起仿真',
  focusLabel: '当前视图',

  /* 差额构成 */
  bridgeTitle: '差额构成：实际运行 → 仿真调度',
  bridgeNote:
    '红色为正向差额（仿真高于实际），绿色为负向差额（仿真低于实际）。' +
    `储能 ${sg0(A.storage.diff)} 元、光伏 ${sg0(A.pv.diff)} 元，两项合计净增 ${n0(A.net)} 元。`,
  bridgeRows: ['实际运行', '储能收益差', '光伏收益差', '仿真运行'],

  /* 分项对比 */
  moneyTableTitle: '分项对比',
  moneyUnitHint: '差额 = 仿真 − 实际运行',
  moneyUnitLine: '单位：元（全月）',

  /* 增量来源 */
  whyTitle: '收益增量来源',
} as const;

/* ---------------------------- 指标卡说明 ---------------------------- */
// 2026-10-20 领导要求：仿真效果卡片去掉二级指标说明，改为主数值右侧并列实际值作对比。
// 卡片结构仅剩「指标名 / 仿真值 + 实际值 / 偏差」，此处不再维护逐卡说明文案。

/* ---------------------------- 充放次数口径 ---------------------------- */
/** 四处位置共用同一口径说明，避免同一指标多种说法 */
export const CYCLE_TEXT = {
  label: '充放次数',
  unit: '次/日',
  /** 日明细表新增列的列头（父列 + 单位） */
  header: '充放次数',
  /** 口径：脚本与文案层统一表述 */
  caliber: '充放次数 = 当日充电量 ÷ 储能容量 2,088 kWh；与「等效循环」同口径，粒度到日。',
  /** 典型日对照表脚注 */
  caseNote: '当日充放次数按当日充电量折算，两侧同口径。',
};

/* ---------------------------- 分项对比表 ---------------------------- */
export const MONEY_NOTE: Record<string, string> = {
  储能收益: `占净差额 ${n1(A.storage.share)}%（${sg0(A.storage.diff)} 元）`,
  光伏收益: `上网 ${sg0(A.pv.exportDiff)} kWh、自用 ${sg0(A.pv.selfDiff)} kWh`,
  总收益: `储能 ${sg0(A.storage.diff)} 元 + 光伏 ${sg0(A.pv.diff)} 元 = ${sg0(A.net)} 元`,
  // 「单位放电净收益」行已按 2026-10-20 领导要求从分项对比表去掉（KPI 卡里仍保留该指标）
};

/* ---------------------------- 增量来源 ---------------------------- */
export const WHY_ITEMS = [
  {
    no: '①',
    title: '储能',
    amount: `${sg0(A.storage.diff)} 元`,
    tone: 'up',
    evidence:
      `单位放电净收益 ${n3(A.storage.unitReal)} → ${n3(A.storage.unitSim)} 元/kWh，` +
      `贡献 ${sg0(A.storage.timeEffect)} 元（${n0(stTimeShare)}%）；` +
      `放电量 ${n0(A.storage.dischargeReal)} → ${n0(A.storage.dischargeSim)} kWh，` +
      `贡献 ${sg0(A.storage.volumeEffect)} 元（${n0(stVolShare)}%）。`,
  },
  {
    no: '②',
    title: '光伏',
    amount: `${sg0(A.pv.diff)} 元`,
    tone: 'down',
    evidence:
      `结算单价：自用 ${n4(A.pv.selfPrice)} 元/kWh，上网 ${n4(A.pv.exportPrice)} 元/kWh，单价差 ${n4(A.pv.priceGap)} 元/kWh。` +
      `仿真侧上网 ${sg0(A.pv.exportDiff)} kWh、自用 ${sg0(A.pv.selfDiff)} kWh。` +
      `按逐日结算单价分解：量效应 ${sg0(A.pv.volumeEffect)} 元（上网 ${sg0(pvExportAmt)} 元、自用 ${sg0(pvSelfAmt)} 元），` +
      `价格效应 ${sg0(A.pv.priceEffect)} 元，合计 ${sg0(A.pv.diff)} 元。`,
  },
];

export const WHY_CONCLUSIONS = [
  {
    tag: '储能',
    text: `收益增量的 ${n0(stTimeShare)}% 来自放电时段优化，${n0(stVolShare)}% 来自放电量增长。`,
  },
  {
    tag: '光伏',
    text: `自用结算单价 ${n4(A.pv.selfPrice)} 元/kWh、上网电价 ${n4(A.pv.exportPrice)} 元/kWh，单价差 ${n4(A.pv.priceGap)} 元/kWh。`,
  },
];

/* ---------------------------- 月度指标解读 ---------------------------- */
/** 每条说明以计算式开头（与 MONTHLY_FOOTNOTE 的关系：此处给单项公式，页脚只给全局口径） */
export const MONTHLY_NOTE: Record<string, string> = {
  '光伏发电量 (kWh)': '计算式：15s 逆变器测点上报值做差值累计。',
  '上网电量 (kWh)': '计算式：15s 关口表测点上报值做差值累计，即余电送出量。',
  '自用电量 (kWh)': '计算式：自用电量 = 发电量 − 上网电量。',
  '储能充电量 (kWh)': `计算式：15s 储能系统测点上报值做差值累计。月等效循环 仿真 ${n1(A.storage.cycleSim)} 次 / 实际 ${n1(A.storage.cycleReal)} 次（= 月充电量 ÷ 储能容量 2,088 kWh）。`,
  '储能放电量 (kWh)': `计算式：15s 储能系统测点上报值做差值累计。差 ${sg0(A.storage.dischargeDiff)} kWh。`,
  '光伏收益 (元)': `计算式：光伏收益 = 上网电量 × 上网电价 ${n4(A.pv.exportPrice)} + 自用电量 × 自用结算单价 ${n4(A.pv.selfPrice)}。`,
  '储能收益 (元)': `计算式：储能收益 = 放电收益 − 充电成本（逐 15min 按放电/充电电量 × 对应分时电价累加）。占净差额 ${n1(A.storage.share)}%（${sg0(A.storage.diff)} 元）；充电加权电价 ${n4(PRICE_MONTH.chargeWeighted ?? 0)} 元/kWh，单位放电净收益 仿真 ${n3(A.storage.unitSim)} / 实际 ${n3(A.storage.unitReal)} 元/kWh。`,
  '限电止损收益 (元)': `计算式：限电止损收益 = 限电电量 × 上网电价 ${n4(A.pv.exportPrice)}。全月无限电电量，该项为 0。`,
  '总收益 (元)': `计算式：总收益 = 储能收益 + 光伏收益 + 限电止损收益。储能 ${sg0(A.storage.diff)} 元 + 光伏 ${sg0(A.pv.diff)} 元 = ${sg0(A.net)} 元。`,
  '自发自用率 (%)': '计算式：自发自用率 = 自用电量 ÷ 发电量 × 100%。',
  '储能利用率 (%)': '计算式：储能利用率 = 储能放电量 ÷ 储能充电量 × 100%。',
  '日均充放次数 (次/日)': '计算式：日均充放次数 = 当月充电量 ÷ 储能容量 ÷ 当月天数（= 月等效循环 ÷ 天数）。' + CYCLE_TEXT.caliber,
};


export const MONTHLY_FOOTNOTE =
  '全局口径：全部电量取报表表计原值，两侧同口径、不做折算；各项计算式见右侧「说明」列。';


/* ---------------------------- 典型日 ---------------------------- */
/** 案例日切换：日期来自数据层，标签与说明在此 */
export const CASE_DAY_TEXT = {
  /** 案例日标签（按日期）；无额外标签的留空 */
  tags: {
    '2026-08-28': '差异最大',
    '2026-08-12': '',
    '2026-08-27': '',
    '2026-08-17': '反向日',
  } as Record<string, string>,
  chartTitle: '案例日逐 15min 充放电曲线',
  /** 图例名称 */
  legend: {
    realPower: '实际运行 · 储能功率',
    simPower: '仿真 · 储能功率',
    realSoc: '实际运行 · SOC',
    simSoc: '仿真 · SOC',
    buyPrice: '购电电价（分时）',
    sellPrice: '售电电价（余电上网）',
  },
  /** 功率数值的正负含义（图例与 tooltip 共用） */
  powerNote: '（正放负充）',
  /** tooltip 里的功率状态词 */
  pwState: { charge: '充电', discharge: '放电', idle: '待机' },
  // 曲线口径 / 电价曲线口径 / 实际侧未动作说明 / 图下读数标签，已按 2026-10-20 领导要求整块去掉，
  // 不再维护 priceCurveNote / curveCaliber / idleNote / footLabels 四个字段。
  switchLabel: '案例日',
  axisPower: '储能功率 (kW)',
  axisSoc: 'SOC (%)',
  axisTier: '电价档位',
  tableTitle: '案例日两侧对照（日粒度）',
  /** 案例日指标拆两卡：左侧电量与效率，右侧收益与电价 */
  energyTitle: '电量指标',
  moneyTitle: '收益与电价',
  /** 案例日数据块标题（只承载数据行，不含判读/结论） */
  dataTitle: '当日对照数据',
  othersTitle: '其余案例日',
  /** 案例日表的加权电价说明（放在表下） */
  priceNote:
    '充电/放电加权电价按逐 15min 电价加权（充电成本 ÷ 充电量、放电收益 ÷ 放电量）。' +
    '实际运行报表为日粒度，未拆分充电成本与放电收益，实际侧不计算。',
};

/** 案例日判读：按选中日期生成（数值取自数据层，句式固定，只出数据不出结论） */
export function caseDayReading(date: string): string {
  const rows = CASE_DAY_ROWS[date] ?? [];
  const pick = (kw: string) => rows.find(r => r.name.startsWith(kw));
  const ch = pick('储能充电量');
  const dis = pick('储能放电量');
  const st = pick('储能收益');
  const cw = pick('充电加权电价');
  const dw = pick('放电加权电价');
  const lines = [
    `${date} 储能收益差 ${sg0(st?.diff ?? 0)} 元：充电量 实际 ${n1(ch?.real ?? 0)} / 仿真 ${n1(ch?.sim ?? 0)} kWh，放电量 实际 ${n1(dis?.real ?? 0)} / 仿真 ${n1(dis?.sim ?? 0)} kWh。`,
    `仿真侧充电加权电价 ${n4(cw?.sim ?? 0)} 元/kWh，放电加权电价 ${n4(dw?.sim ?? 0)} 元/kWh，毛价差 ${n4((dw?.sim ?? 0) - (cw?.sim ?? 0))} 元/kWh。`,
  ];
  return lines.join('\n');
}

/** 其余案例日：由数据层生成，不需要手写 */
export function otherCaseDays(current: string): string {
  return Object.keys(CASE_DAY_ROWS)
    .filter(d => d !== current)
    .map(d => {
      const rows = CASE_DAY_ROWS[d];
      const st = rows.find(r => r.name.startsWith('储能收益'));
      const tt = rows.find(r => r.name.startsWith('总收益'));
      const tag = CASE_DAY_TEXT.tags[d] ?? '';
      return `${d}${tag ? `（${tag}）` : ''}：储能收益差 ${sg0(st?.diff ?? 0)} 元、总收益差 ${sg0(tt?.diff ?? 0)} 元`;
    })
    .join('；');
}

/* ---------------------------- 每日明细 ---------------------------- */
export const DAILY_TEXT = {
  title: `每日对比明细（${DAILY_ROWS.length} 天 × ${DAILY_HEADERS.length} 项指标）`,
  devNote: '偏差% =（仿真 − 实际运行）÷ 实际运行；效率类指标不逐日给偏差；',
  devUp: '正值标红',
  devDown: '负值标绿',
  cycleNote: CYCLE_TEXT.caliber,
};

/* ---------------------------- 光伏数据校对 ---------------------------- */
/**
 * 结果页的光伏数据校对：仿真的光伏发电量必须与微网真实发电量对得上，
 * 否则仿真结论建立在错误的输入上，后面所有对比都没有意义。
 * 阈值写死在文案层，改阈值不碰视图。
 */
export const PV_CHECK = {
  /** 差额率阈值（%），超过即判定为需要先校对 */
  threshold: 1,
  passLabel: '光伏数据校对通过',
  failTitle: '仿真与真实光伏电量存在差异，请先校对数据',
  diffLabel: '差额',
  rateLabel: '偏差',
  action: '查看每日对比',
  modalTitle: '光伏发电量 · 每日对比',
  modalHint: '校对口径：仿真光伏发电量 vs 微网真实发电量；偏差 =（仿真 − 真实）÷ 真实，超阈值的日子单独标出',
  columns: ['日期', '真实发电量', '仿真发电量', '差额', '偏差'],
  unit: 'kWh',
  totalLabel: '月度合计',
  overCount: (n: number) => (n > 0 ? `${n} 天超阈值` : '各日均在阈值内'),
  emptyText: '当月无光伏发电数据，无法校对',
  closeLabel: '关闭',
};
