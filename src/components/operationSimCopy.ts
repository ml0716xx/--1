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
  PRICE_MONTH,
  SIM_META,
  TOU_TIERS,
} from './operationSimData';

/* ---------------------------- 数字格式化 ---------------------------- */
const n0 = (v: number) => Math.round(v).toLocaleString('zh-CN');
const n1 = (v: number) => v.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n2 = (v: number) => v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  {
    id: 'manual_replay',
    name: '人工策略回放',
    desc: '按人工制定的充放电计划回算收益，用于评估现场执行策略',
    benchmark: '站点实际运行',
    status: 'planned',
  },
  {
    id: 'multi_strategy',
    name: '多策略比选',
    desc: '多个候选策略并列计算，输出推荐方案与量化差异',
    benchmark: '站点实际运行',
    status: 'planned',
  },
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
const purchasePrices = TOU_TIERS.map(t => t.price);
const purchaseLow = Math.min(...purchasePrices);
const purchaseHigh = Math.max(...purchasePrices);
/** 购电分时四档的紧凑写法，如「谷 0.3096 / 平 0.6489 / 肩 0.9884 / 峰 1.1337」 */
const purchaseTierText = TOU_TIERS.map(t => `${TOU_LABELS[t.key]} ${n4(t.price)}`).join(' / ');

export const PRICE_TEXT = {
  stripTitle: '电价口径',
  purchaseLabel: '购电电价（分时）',
  saleLabel: '售电电价（余电上网）',
  groupLabel: '电价类',
  saleNote: '余电上网结算单价，两侧同口径',
  chargeWeighted: '充电加权电价',
  dischargeWeighted: '放电加权电价',
  spread: '充放电毛价差',
  spreadNote: '放电加权电价 − 充电加权电价',
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
    note: `站点固定分时四档：${purchaseTierText}，两侧同价`,
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
    note: '放电收益 ÷ 储能放电量；与充电加权电价之差即毛价差，是储能毛利的空间来源。',
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
  subtitle: '选择要推送的报告章节，右侧为接收方在用户端看到的内容',
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
  simSectionHint: '按需触发，未运行时不影响上方原始运行指标',
  benchmarkLabel: '对比基准',
  scenarioReady: '可用',
  scenarioPlanned: '规划中',
  emptyTitle: '策略仿真未运行',
  emptyDesc:
    '标准站点视图仅展示设备容量与实际运行指标。运行仿真后，将在相同的负荷与光伏输入条件下按分时电价重排储能充放电计划，并与实际运行指标逐项对比。',
  emptyAction: '运行策略仿真',
  running: '仿真计算中...',
  rerun: '重跑仿真',
  collapse: '收起仿真',
  focusLabel: '当前视图',

  /* 差额构成 */
  bridgeTitle: '差额构成：实际运行 → 仿真调度',
  bridgeNote:
    '红色为正向差额（仿真高于实际），绿色为负向差额（仿真低于实际）。' +
    `储能 ${sg0(A.storage.diff)} 元、光伏 ${sg0(A.pv.diff)} 元，两项相抵后净增 ${n0(A.net)} 元。` +
    '基准柱与差额柱采用不同量程，不按同一标尺比较柱高。',
  bridgeRows: ['实际运行', '储能收益差', '光伏收益差', '仿真运行'],

  /* 分项对比 */
  moneyTableTitle: '分项对比',
  moneyUnitHint: '差额 = 仿真 − 实际运行',
  moneyUnitLine: '单位：元（全月）',

  /* 增量来源 */
  whyTitle: '收益增量来源',
} as const;

/* ---------------------------- 指标卡说明 ---------------------------- */
export const KPI_NOTE: Record<string, string> = {
  总收益: '储能 +27,397 元，光伏 -6,310 元',
  储能收益: '收益差额主来源，+27,397 元',
  光伏收益: '余电去向结构变化所致',
  单位放电净收益: '储能收益 ÷ 储能放电量',
  等效循环: '月充电量 ÷ 储能容量 2,088 kWh',
  储能利用率: '放电量 ÷ 充电量，两侧同口径',
  日均充放次数: '月充电量 ÷ 储能容量 ÷ 天数（与等效循环同口径）',
};

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
export const MONEY_DIR: Record<string, string> = {
  储能收益: '仿真更高',
  光伏收益: '仿真更低',
  总收益: '净增',
  单位放电净收益: '仿真更高',
};

export const MONEY_NOTE: Record<string, string> = {
  储能收益: '占净差额 130%（以净差额绝对值为分母，单项可超过 100%）',
  光伏收益: '余电去向结构变化：上网 +24,441 kWh、自用 -24,516 kWh；自用结算单价高于上网电价',
  总收益: '储能 +27,397 元 + 光伏 -6,310 元 = +21,087 元（按日汇总校验一致）',
  单位放电净收益: '储能收益 ÷ 储能放电量（两侧同口径表计值）。仿真 0.612 元/kWh，实际运行 0.276 元/kWh',
};

/* ---------------------------- 增量来源 ---------------------------- */
export const WHY_ITEMS = [
  {
    no: '①',
    title: '储能',
    amount: `${sg0(A.storage.diff)} 元`,
    tone: 'up',
    mechanism: '低谷时段充电、高峰时段放电替代购电，收益来源为分时电价价差。',
    evidence:
      `谷段（0.3096 元/kWh）网充 60,020 kWh；峰段（1.1337 元/kWh）放电 48,426 kWh，占全月放电量 74.9%。` +
      `量价分解：单位放电净收益 ${n3(A.storage.unitReal)} → ${n3(A.storage.unitSim)} 元/kWh，` +
      `贡献 ${sg0(A.storage.timeEffect)} 元（${n0(stTimeShare)}%）；` +
      `放电量 ${n0(A.storage.dischargeReal)} → ${n0(A.storage.dischargeSim)} kWh，` +
      `贡献 ${sg0(A.storage.volumeEffect)} 元（${n0(stVolShare)}%）。`,
  },
  {
    no: '②',
    title: '光伏',
    amount: `${sg0(A.pv.diff)} 元`,
    tone: 'down',
    mechanism: '光伏电量结算单价取决于消纳去向：站内自用按购电电价抵扣，余电上网按上网电价结算。',
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
    text: `自用结算单价较上网电价高 ${n4(A.pv.priceGap)} 元/kWh，余电去向变化直接影响光伏收益。`,
  },
];

/* ---------------------------- 月度指标解读 ---------------------------- */
export const MONTHLY_NOTE: Record<string, string> = {
  '光伏发电量 (kWh)': '两侧发电量比值均值 100%，光伏输入一致。',
  '上网电量 (kWh)': '仿真余电全部上网；实际运行存在自用消耗，差值主要来自策略取向。',
  '自用电量 (kWh)': '与上网电量互为镜像：余电留站内计入自用，送出计入上网。',
  '储能充电量 (kWh)': '月等效循环 仿真 34.9 次 / 实际 23.2 次；日均充放次数 仿真 1.13 次 / 实际 0.75 次。',
  '储能放电量 (kWh)': '放电量差 +20,552 kWh。仿真放电集中于峰值时段并优先供负荷，为储能收益差的第一层来源。',
  '光伏收益 (元)': '上网与自用的结构决定结算单价，差异主要来自余电去向。',
  '储能收益 (元)': '月度收益差主来源（+27,397 元）。充电加权电价 0.3706 元/kWh，单位放电净收益 仿真 0.612 / 实际 0.276 元/kWh。',
  '弃光机会收益 (元)': '全月无弃用电量，该项为 0。',
  '总收益 (元)': '储能 +27,397 元 + 光伏 -6,310 元 = +21,087 元。',
  '自发自用率 (%)': '仿真偏低对应余电上网比例更高，属策略取向差异，非效率问题。',
  '储能利用率 (%)': '两侧利用率 88.7% / 91.1%，差异来自充放电时段安排，而非利用充分度。',
  '日均充放次数 (次/日)': CYCLE_TEXT.caliber,
};

export const MONTHLY_FOOTNOTE =
  '指标口径：发电量 = 上网电量 + 自用电量；光伏收益 = 上网收益 + 自用收益；自发自用率 = 自用电量 ÷ 发电量；储能利用率 = 储能放电量 ÷ 储能充电量；充放次数 = 充电量 ÷ 储能容量；偏差 =（仿真 − 实际运行）÷ 实际运行。全部电量取报表表计原值，两侧同口径，不做折算。';


/* ---------------------------- 典型日 ---------------------------- */
/** 案例日切换：日期来自数据层，标签与说明在此 */
export const CASE_DAY_TEXT = {
  rule: '案例日选取：按储能收益差排序取前 3，并排除“充放电量更高但收益更低”的反向日；另附 1 个反向日用于对照。',
  /** 案例日标签（按日期） */
  tags: {
    '2026-08-28': '差异最大',
    '2026-08-12': '案例日',
    '2026-08-27': '案例日',
    '2026-08-17': '反向日',
  } as Record<string, string>,
  chartTitle: '案例日逐 15min 充放电曲线',
  /** 图例名称 */
  legend: {
    realPower: '实际运行 · 储能功率',
    simPower: '仿真 · 储能功率',
    realSoc: '实际运行 · SOC',
    simSoc: '仿真 · SOC',
  },
  /** 功率数值的正负含义（图例与 tooltip 共用） */
  powerNote: '（正放负充）',
  /** tooltip 里的功率状态词 */
  pwState: { charge: '充电', discharge: '放电', idle: '待机' },
  /** 曲线口径：两侧来源与还原方式 */
  curveCaliber:
    '实际运行侧取当日表计电量并按分时档位还原到 15min；仿真侧取仿真结果原始 15min 序列。功率为正表示放电、为负表示充电。',
  /** 实际运行侧当日无充放时的说明 */
  idleNote: (charge: number, discharge: number) =>
    `当日实际运行侧储能未动作（充电 ${n1(charge)} kWh、放电 ${n1(discharge)} kWh），实际运行曲线为 0 线。`,
  switchLabel: '案例日',
  axisPower: '储能功率 (kW)',
  axisSoc: 'SOC (%)',
  axisTier: '电价档位',
  tableTitle: '案例日两侧对照（日粒度）',
  readingTitle: '判读要点',
  readingGuide: '判读方法：先看充放电分别落在哪个电价档位，再比对两侧充放电量；若电量接近而收益差显著，差异来自时段结构。',
  othersTitle: '其余案例日',
  socNote: 'SOC 全程落在 3%–98% 配置区间内。',
  /** 图下读数行的标签（视图只负责拼数与排版） */
  footLabels: { charge: '当日充电量', discharge: '当日放电量', real: '实际', sim: '仿真' },
  /** 案例日表的加权电价说明（放在表下） */
  priceNote:
    '充电/放电加权电价按逐 15min 电价加权（充电成本 ÷ 充电量、放电收益 ÷ 放电量）。' +
    '实际运行报表为日粒度，未拆分充电成本与放电收益，实际侧不计算。',
};

/** 案例日判读：按选中日期生成（数值取自数据层，句式固定） */
export function caseDayReading(date: string): string {
  const rows = CASE_DAY_ROWS[date] ?? [];
  const pick = (kw: string) => rows.find(r => r.name.startsWith(kw));
  const ch = pick('储能充电量');
  const dis = pick('储能放电量');
  const st = pick('储能收益');
  const cy = pick('充放次数');
  const cw = pick('充电加权电价');
  const dw = pick('放电加权电价');
  const lines = [
    `${date} 储能收益差 ${sg0(st?.diff ?? 0)} 元：充电量 实际 ${n1(ch?.real ?? 0)} / 仿真 ${n1(ch?.sim ?? 0)} kWh，放电量 实际 ${n1(dis?.real ?? 0)} / 仿真 ${n1(dis?.sim ?? 0)} kWh。`,
    `充放次数 实际 ${n2(cy?.real ?? 0)} / 仿真 ${n2(cy?.sim ?? 0)} 次。`,
    `仿真侧充电加权电价 ${n4(cw?.sim ?? 0)} 元/kWh，放电加权电价 ${n4(dw?.sim ?? 0)} 元/kWh，毛价差 ${n4((dw?.sim ?? 0) - (cw?.sim ?? 0))} 元/kWh。`,
    CASE_DAY_TEXT.readingGuide,
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
  title: '每日对比明细（31 天 × 9 项指标）',
  hint: '列序固定：实际运行 → 仿真 → 偏差%；合计行按月度口径取值，效率类指标取加权值',
  devNote: '偏差% =（仿真 − 实际运行）÷ 实际运行；效率类指标不逐日给偏差；',
  devUp: '正值标红',
  devDown: '负值标绿',
  checkNote: '合计行与月度指标对比同口径；逐日求和与合计行的差异应在日数 × 舍入误差以内。',
  cycleNote: CYCLE_TEXT.caliber,
};
