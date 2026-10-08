import React, { useState, useMemo } from 'react';
import {
  Sparkles, RefreshCw, Calendar, CheckCircle2,
  Wallet, ArrowUpRight, ArrowDownRight, Activity, Target,
  Sun, BatteryCharging, Cpu, Gauge, Send
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  SIM_META, KPI_CARDS, MONEY_ROWS, MONTHLY_ROWS, PRICE_MONTH,
  TOU_TIERS, CASE_DAY_DATES, CASE_DAY_ROWS, CASE_DAY_CURVES,
  CYCLE_ROWS, CYCLE_TOTAL, DAILY_HEADERS, DAILY_UNITS, DAILY_ROWS, DAILY_TOTAL,
  PARAM_ROWS
} from './operationSimData';
import {
  SIM_SCENARIOS, VIEW_META, COPY, KPI_NOTE, MONEY_DIR, MONEY_NOTE,
  WHY_ITEMS, WHY_CONCLUSIONS, MONTHLY_NOTE, MONTHLY_FOOTNOTE,
  CASE_DAY_TEXT, DAILY_TEXT, CYCLE_TEXT, PRICE_TEXT, PRICE_ROWS,
  TOU_LABELS, tierWindow, caseDayReading, otherCaseDays,
  CAPACITY_ITEMS, COL_LABELS, PUSH_COPY,
} from './operationSimCopy';
import { PushReportModal } from './PushReportModal';

/* ==========================================================================
   运营数据 · 策略仿真
   --------------------------------------------------------------------------
   三层结构，便于标准化拓展：
     1. 数据层  operationSimData.ts —— 由母版 Excel 导出，只放数字；
     2. 文案层  operationSimCopy.ts —— 全部对外表述 + 场景注册表；
     3. 视图层  本文件 —— 只负责排版与交互，不含业务文案。
   换站点 / 换月份 / 新增仿真场景时，只改前两层，本文件无需改动。
   指标口径：全部电量取报表表计原值，两侧同口径，不做折算。
   ========================================================================== */

/** 取文案键：把「储能收益 (元)」归一为「储能收益」 */
const copyKey = (item: string) => item.replace(/\s*\([^)]*\)\s*$/, '').trim();


/** 金额/电量：千分位，默认 2 位小数 */
const nf = (v: number | null | undefined, d = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
};

/** 带符号偏差 */
const sf = (v: number | null | undefined, d = 2, suffix = '%') => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return (v > 0 ? '+' : '') + nf(v, d) + suffix;
};

/** 涨红跌绿：仿真更高的项用红色，更低的用绿色（与母版一致） */
const toneOf = (v: number) => (v > 0 ? 'up' : v < 0 ? 'down' : 'flat');
const TONE_TEXT: Record<string, string> = {
  up: 'text-red-600',
  down: 'text-emerald-600',
  flat: 'text-gray-500',
};
const TONE_BG: Record<string, string> = {
  up: 'bg-red-500',
  down: 'bg-emerald-500',
  flat: 'bg-gray-300',
  base: 'bg-slate-500',
};
const TONE_SOFT: Record<string, string> = {
  up: 'bg-red-50 text-red-700 border-red-200',
  down: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  flat: 'bg-gray-50 text-gray-600 border-gray-200',
};

/** KPI 卡按单位决定小数位（新增单位务必在此登记，否则会被取整成 0 位小数） */
const decimalsFor = (unit: string) => {
  if (unit === '元/kWh') return 3;
  if (unit === '次/日') return 2;
  if (unit === '次') return 1;
  if (unit === '%') return 2;
  return 0;
};

/* ---------- 分时档位色带（档位与电价取自数据层，颜色与中文名在此配） ---------- */
const TOU_COLORS: Record<string, string> = {
  valley: '#34d399',
  flat: '#60a5fa',
  shoulder: '#fbbf24',
  peak: '#f87171',
};


/** 24h 档位色带：必须按时间顺序排（不能按档位顺序，否则色带时序错乱） */
const TOU_SEGMENTS = TOU_TIERS
  .flatMap(t => t.ranges.map(([a, b]) => ({ key: t.key, price: t.price, a, b })))
  .sort((x, y) => x.a - y.a);

/* ---------------------------- 电价口径条 ---------------------------- */
/** 三视图共用：购电分时四档（含时段窗口）+ 售电（余电上网）单价 + 可选的当期加权电价读数。只排版，数字来自数据层。 */
function PriceStrip({ readouts }: { readouts?: { label: string; value: string }[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <span className="w-1 h-3.5 bg-slate-400 rounded-full" />
        <h3 className="text-xs font-bold text-gray-700">{PRICE_TEXT.stripTitle}</h3>
      </div>

      <div className="flex items-start flex-wrap gap-x-4 gap-y-1.5">
        <span className="text-[11px] text-gray-400 shrink-0">{PRICE_TEXT.purchaseLabel}</span>
        {TOU_TIERS.map(t => (
          <span key={t.key} className="flex items-center space-x-1.5 text-[11px] text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: TOU_COLORS[t.key] }} />
            <span className="font-bold">{TOU_LABELS[t.key]}</span>
            <span className="font-mono">{t.price.toFixed(4)}</span>
            <span className="text-gray-400">{tierWindow(t.ranges)}</span>
          </span>
        ))}
      </div>

      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 border-t border-gray-100 pt-2">
        <span className="text-[11px] text-gray-400 shrink-0">{PRICE_TEXT.saleLabel}</span>
        <span className="flex items-center space-x-1.5 text-[11px] text-gray-600">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 shrink-0" />
          <span className="font-mono font-bold">
            {PRICE_MONTH.sale === null ? '—' : PRICE_MONTH.sale.toFixed(4)}
          </span>
          <span>{PRICE_TEXT.unit}</span>
        </span>
        <span className="text-[11px] text-gray-400">{PRICE_TEXT.saleNote}</span>
        {readouts && readouts.length > 0 && (
          <span className="flex items-center flex-wrap gap-x-3 gap-y-1 md:ml-auto">
            {readouts.map(r => (
              <span key={r.label} className="flex items-center space-x-1 text-[11px]">
                <span className="text-gray-400">{r.label}</span>
                <span className="font-mono font-bold text-blue-600">{r.value}</span>
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

/** 按月电价读数（收益差额构成、月度指标对比用） */
const monthPriceReadouts = () => [
  {
    label: PRICE_TEXT.chargeWeighted,
    value: PRICE_MONTH.chargeWeighted === null ? '—' : PRICE_MONTH.chargeWeighted.toFixed(4),
  },
  {
    label: PRICE_TEXT.dischargeWeighted,
    value: PRICE_MONTH.dischargeWeighted === null ? '—' : PRICE_MONTH.dischargeWeighted.toFixed(4),
  },
  {
    label: PRICE_TEXT.spread,
    value: PRICE_MONTH.spread === null ? '—' : PRICE_MONTH.spread.toFixed(4),
  },
];

/* ============================ 子视图 1：收益差额构成 ============================ */
function MoneyView() {
  const [L1, L2, L3, L4] = COPY.bridgeRows;
  /** 桥图数字全部取数据层（不写死），柱高量程按数量级向上取整 */
  const totalRow = MONEY_ROWS.find(r => copyKey(r.item) === '总收益');
  const stRow = MONEY_ROWS.find(r => copyKey(r.item) === '储能收益');
  const pvRow = MONEY_ROWS.find(r => copyKey(r.item) === '光伏收益');
  const baseReal = Number(totalRow?.real ?? 0);
  const baseSim = Number(totalRow?.sim ?? 0);
  const bridge = [
    { label: L1, value: baseReal, tone: 'base' as const },
    { label: L2, value: stRow?.diff ?? 0, tone: 'up' as const, delta: true },
    { label: L3, value: pvRow?.diff ?? 0, tone: 'down' as const, delta: true },
    { label: L4, value: baseSim, tone: 'base' as const },
  ];
  const MAX = Math.max(50000, Math.ceil(baseSim / 50000) * 50000);
  const DELTA_MAX = Math.max(10000, Math.ceil(Math.abs(stRow?.diff ?? 0) / 10000) * 10000);
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
            <Wallet size={15} className="text-blue-600" />
            <span>{COPY.bridgeTitle}</span>
          </h3>
          <span className="text-[11px] text-gray-400">{COPY.moneyUnitLine}</span>
        </div>

        <div className="space-y-2.5">
          {bridge.map((b, idx) => {
            const isDelta = !!b.delta;
            // 基准柱与差额柱量程不同，不按同一标尺比柱高（说明里已交代）
            const denom = isDelta ? DELTA_MAX : MAX;
            const widthPct = Math.abs(b.value) / denom * 100;
            return (
              <div key={idx} className="flex items-center space-x-3">
                <span className="w-24 shrink-0 text-xs text-gray-500 text-right">{b.label}</span>
                <div className="flex-1 h-6 bg-gray-50 rounded-md relative overflow-hidden border border-gray-100">
                  <div
                    className={`h-full rounded-md ${TONE_BG[b.tone]} ${isDelta ? 'opacity-90' : 'opacity-100'}`}
                    style={{ width: `${Math.max(widthPct, 0.6)}%` }}
                  />
                </div>
                <span className={`w-28 shrink-0 text-xs font-mono font-bold text-right ${isDelta ? TONE_TEXT[b.tone] : 'text-gray-800'}`}>
                  {isDelta ? sf(b.value, 0, '') : nf(b.value, 0)}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
          {COPY.bridgeNote}
        </p>
      </div>

      {/* 电价口径：差额由价差与时段结构产生，先把两侧采用的电价摆出来 */}
      <div className="bg-white px-5 py-3.5 rounded-xl border border-gray-200 shadow-sm">
        <PriceStrip readouts={monthPriceReadouts()} />
      </div>

      {/* 分项对比 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">{COPY.moneyTableTitle}</h3>
          <span className="text-[11px] text-gray-400">{COPY.moneyUnitHint}</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/70 text-gray-500">
              <th className="text-left px-5 py-2.5 font-semibold">项目</th>
              <th className="text-right px-3 py-2.5 font-semibold">{COL_LABELS.actual}</th>
              <th className="text-right px-3 py-2.5 font-semibold">{COL_LABELS.sim}</th>
              <th className="text-right px-3 py-2.5 font-semibold">差额</th>
              <th className="text-left px-3 py-2.5 font-semibold w-[92px]">方向</th>
              <th className="text-left px-5 py-2.5 font-semibold">说明</th>
            </tr>
          </thead>
          <tbody>
            {MONEY_ROWS.map((r, i) => {
              const key = copyKey(r.item);
              const isLast = i === MONEY_ROWS.length - 1;
              const tone = isLast ? 'flat' : toneOf(r.diff);
              return (
                <tr key={r.item} className={`border-t border-gray-100 ${i === 2 ? 'bg-blue-50/40' : ''}`}>
                  <td className="px-5 py-3 font-semibold text-gray-800 whitespace-nowrap">{r.item}</td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700">
                    {isLast ? '—' : nf(r.real as number, 2)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700">
                    {isLast ? '—' : nf(r.sim as number, 2)}
                  </td>
                  <td className={`px-3 py-3 text-right font-mono font-bold ${isLast ? TONE_TEXT.flat : TONE_TEXT[tone]}`}>
                    {isLast ? '+' + nf(r.diff, 3) : sf(r.diff, 2, '')}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold ${TONE_SOFT[isLast ? 'flat' : tone]}`}>
                      {MONEY_DIR[key]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 leading-relaxed">{MONEY_NOTE[key]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 收益增量来源 */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="w-1 h-3.5 bg-slate-400 rounded-full" />
          <h3 className="text-xs font-bold text-gray-700">{COPY.whyTitle}</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {WHY_ITEMS.map(r => (
            <div key={r.no} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${TONE_SOFT[r.tone]}`}>
                  {r.no}
                </span>
                <span className="font-bold text-gray-900 text-sm">{r.title}</span>
                <span className={`font-mono font-black text-sm ${TONE_TEXT[r.tone]}`}>{r.amount}</span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-400 mb-1">机制</div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.mechanism}</p>
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-400 mb-1">证据</div>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{r.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WHY_CONCLUSIONS.map(q => (
          <div key={q.tag} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-start space-x-3">
            <Target size={15} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-gray-400 mb-0.5">{q.tag} · 结论</div>
              <div className="text-xs font-semibold text-gray-800 leading-relaxed">{q.text}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

/* ============================ 子视图 2：月度指标对比 ============================ */
function MonthlyView() {
  const rowSpan = useMemo(() => {
    const m: Record<string, number> = {};
    MONTHLY_ROWS.forEach(r => { m[r.cat] = (m[r.cat] || 0) + 1; });
    return m;
  }, []);

  return (
    <div className="space-y-4">
      {/* 电价口径 */}
      <div className="bg-white px-5 py-3.5 rounded-xl border border-gray-200 shadow-sm">
        <PriceStrip />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-gray-900 text-sm">月度指标对比（{SIM_META.period.split(' ~ ')[0].slice(0, 7)}）</h3>
          <span className="text-[11px] text-gray-400">偏差 =（仿真 − 实际运行）÷ 实际运行；效率类指标的绝对差以 pp（百分点）计</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/70 text-gray-500">
                <th className="text-left px-4 py-2.5 font-semibold w-[68px]">类别</th>
                <th className="text-left px-3 py-2.5 font-semibold w-[168px]">指标</th>
                <th className="text-right px-3 py-2.5 font-semibold">{COL_LABELS.actual}</th>
                <th className="text-right px-3 py-2.5 font-semibold">{COL_LABELS.sim}</th>
                <th className="text-right px-3 py-2.5 font-semibold">绝对差</th>
                <th className="text-right px-3 py-2.5 font-semibold">相对差</th>
                <th className="text-left px-4 py-2.5 font-semibold">说明</th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY_ROWS.map((r, idx) => {
                const firstOfCat = idx === 0 || MONTHLY_ROWS[idx - 1].cat !== r.cat;
                const isEff = r.pp;
                // 母版「相对差」列存的已是百分数（如 31.77 表示 31.77%），不再 ×100
                const relPct = r.rel;
                const tone = r.abs === 0 ? 'flat' : toneOf(r.abs);
                const dec = r.cat === '效率类' ? 2 : (r.cat === '收益类' ? 2 : 2);
                return (
                  <tr key={r.name} className="border-t border-gray-100 hover:bg-gray-50/60">
                    {firstOfCat && (
                      <td rowSpan={rowSpan[r.cat]} className="px-4 py-3 text-gray-500 font-semibold align-top bg-gray-50/40">
                        {r.cat}
                      </td>
                    )}
                    <td className="px-3 py-3 text-gray-800 font-medium">{r.name}</td>
                    <td className="px-3 py-3 text-right font-mono text-gray-700">{nf(r.real, dec)}</td>
                    <td className="px-3 py-3 text-right font-mono text-gray-700">{nf(r.sim, dec)}</td>
                    <td className={`px-3 py-3 text-right font-mono font-bold ${TONE_TEXT[tone]}`}>
                      {isEff ? sf(r.abs, 2, 'pp') : sf(r.abs, 2, '')}
                    </td>
                    <td className={`px-3 py-3 text-right font-mono font-bold ${TONE_TEXT[tone]}`}>
                      {relPct === null ? '—' : sf(relPct, 1, '%')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 leading-relaxed">{MONTHLY_NOTE[r.name]}</td>
                  </tr>
                );
              })}

              {/* 电价类：购电/售电为站点价格基准（两侧同值），加权电价为仿真侧读数 */}
              {PRICE_ROWS.map((r, i) => (
                <tr key={r.name} className="border-t border-gray-100 hover:bg-gray-50/60">
                  {i === 0 && (
                    <td
                      rowSpan={PRICE_ROWS.length}
                      className="px-4 py-3 text-gray-500 font-semibold align-top bg-gray-50/40"
                    >
                      {PRICE_TEXT.groupLabel}
                    </td>
                  )}
                  <td className="px-3 py-3 text-gray-800 font-medium whitespace-nowrap">{r.name}</td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700 whitespace-nowrap">{r.real}</td>
                  <td className="px-3 py-3 text-right font-mono text-gray-700 whitespace-nowrap">{r.sim}</td>
                  <td className={`px-3 py-3 text-right font-mono font-bold ${TONE_TEXT[r.tone]}`}>{r.diff}</td>
                  <td className={`px-3 py-3 text-right font-mono font-bold ${TONE_TEXT[r.tone]}`}>{r.rel}</td>
                  <td className="px-4 py-3 text-gray-500 leading-relaxed">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-500 leading-relaxed">
          {MONTHLY_FOOTNOTE}
        </div>
      </div>

      {/* 每日对比明细 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-gray-900 text-sm">{DAILY_TEXT.title}</h3>
          <span className="text-[11px] text-gray-400">{DAILY_TEXT.hint}</span>
        </div>
        <div className="overflow-auto max-h-[560px]">
          <table className="text-[11px] border-collapse min-w-[1700px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 text-gray-600">
                <th rowSpan={2} className="px-3 py-2 border border-gray-200 font-semibold sticky left-0 bg-gray-100 z-20">日期</th>
                {DAILY_HEADERS.map((h, i) => (
                  <th key={h} colSpan={3} className="px-2 py-1.5 border border-gray-200 font-semibold text-center whitespace-nowrap">
                    {h} <span className="text-gray-400 font-normal">({DAILY_UNITS[i]})</span>
                  </th>
                ))}
                <th colSpan={3} className="px-2 py-1.5 border border-gray-200 font-semibold text-center whitespace-nowrap bg-blue-50 text-blue-800">
                  {CYCLE_TEXT.header} <span className="text-blue-400 font-normal">({CYCLE_TEXT.unit})</span>
                </th>
                <th rowSpan={2} className="px-3 py-2 border border-gray-200 font-semibold">备注</th>
              </tr>
              <tr className="bg-gray-50 text-gray-500">
                {DAILY_HEADERS.map(h => (
                  <React.Fragment key={h}>
                    <th className="px-2 py-1 border border-gray-200 font-normal whitespace-nowrap">{COL_LABELS.actual}</th>
                    <th className="px-2 py-1 border border-gray-200 font-normal whitespace-nowrap">{COL_LABELS.sim}</th>
                    <th className="px-2 py-1 border border-gray-200 font-normal whitespace-nowrap">偏差%</th>
                  </React.Fragment>
                ))}
                <th className="px-2 py-1 border border-gray-200 font-normal whitespace-nowrap bg-blue-50/60">{COL_LABELS.actual}</th>
                <th className="px-2 py-1 border border-gray-200 font-normal whitespace-nowrap bg-blue-50/60">{COL_LABELS.sim}</th>
                <th className="px-2 py-1 border border-gray-200 font-normal whitespace-nowrap bg-blue-50/60">偏差%</th>
              </tr>
            </thead>
            <tbody>
              {DAILY_ROWS.map((row, ri) => {
                const date = row[0] as string;
                const note = row[25] as string;
                const cyc = CYCLE_ROWS[ri];
                return (
                  <tr key={date} className={`hover:bg-blue-50/40 ${note ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-3 py-1.5 border border-gray-200 font-mono text-gray-700 whitespace-nowrap sticky left-0 bg-white z-10">{date}</td>
                    {DAILY_HEADERS.map((h, g) => {
                      const sim = row[1 + g * 3] as number | null;
                      const real = row[2 + g * 3] as number | null;
                      const dev = row[3 + g * 3] as number | null;
                      return (
                        <React.Fragment key={h}>
                          <td className="px-2 py-1.5 border border-gray-200 text-right font-mono text-gray-700">{nf(real, g === 7 ? 2 : 1)}</td>
                          <td className="px-2 py-1.5 border border-gray-200 text-right font-mono text-gray-700">{nf(sim, g === 7 ? 2 : 1)}</td>
                          <td className={`px-2 py-1.5 border border-gray-200 text-right font-mono font-semibold ${dev === null ? 'text-gray-300' : TONE_TEXT[toneOf(dev)]}`}>
                            {dev === null ? '—' : sf(dev, 2, '')}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-2 py-1.5 border border-gray-200 text-right font-mono font-semibold text-gray-800 bg-blue-50/30">{nf(cyc?.real ?? 0, 2)}</td>
                    <td className="px-2 py-1.5 border border-gray-200 text-right font-mono font-semibold text-gray-800 bg-blue-50/30">{nf(cyc?.sim ?? 0, 2)}</td>
                    <td className={`px-2 py-1.5 border border-gray-200 text-right font-mono font-semibold bg-blue-50/30 ${cyc?.dev === null || cyc?.dev === undefined ? 'text-gray-300' : TONE_TEXT[toneOf(cyc.dev)]}`}>
                      {cyc?.dev === null || cyc?.dev === undefined ? '—' : sf(cyc.dev, 2, '')}
                    </td>
                    <td className="px-3 py-1.5 border border-gray-200 whitespace-nowrap">
                      {note ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">{note}</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-yellow-50 font-bold">
                <td className="px-3 py-2 border border-gray-200 whitespace-nowrap sticky left-0 bg-yellow-50 z-10">
                  {(DAILY_TOTAL[0] as string)}
                </td>
                {DAILY_HEADERS.map((h, g) => (
                  <React.Fragment key={h}>
                    <td className="px-2 py-2 border border-gray-200 text-right font-mono text-gray-800">{nf(DAILY_TOTAL[2 + g * 3] as number, g === 7 ? 2 : 1)}</td>
                    <td className="px-2 py-2 border border-gray-200 text-right font-mono text-gray-800">{nf(DAILY_TOTAL[1 + g * 3] as number, g === 7 ? 2 : 1)}</td>
                    <td className={`px-2 py-2 border border-gray-200 text-right font-mono ${TONE_TEXT[toneOf((DAILY_TOTAL[3 + g * 3] as number) || 0)]}`}>
                      {DAILY_TOTAL[3 + g * 3] === null ? '—' : sf(DAILY_TOTAL[3 + g * 3] as number, 2, '')}
                    </td>
                  </React.Fragment>
                ))}
                <td className="px-2 py-2 border border-gray-200 text-right font-mono text-gray-800 bg-yellow-100">{nf(CYCLE_TOTAL.real, 2)}</td>
                <td className="px-2 py-2 border border-gray-200 text-right font-mono text-gray-800 bg-yellow-100">{nf(CYCLE_TOTAL.sim, 2)}</td>
                <td className={`px-2 py-2 border border-gray-200 text-right font-mono bg-yellow-100 ${TONE_TEXT[toneOf(CYCLE_TOTAL.dev ?? 0)]}`}>
                  {CYCLE_TOTAL.dev === null ? '—' : sf(CYCLE_TOTAL.dev, 2, '')}
                </td>
                <td className="px-3 py-2 border border-gray-200"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-500 flex items-center justify-between flex-wrap gap-2">
          <span>
            {DAILY_TEXT.devNote}<span className="text-red-600 font-semibold">{DAILY_TEXT.devUp}</span>、
            <span className="text-emerald-600 font-semibold">{DAILY_TEXT.devDown}</span>。
          </span>
          <span>{DAILY_TEXT.cycleNote}</span>
          <span>{DAILY_TEXT.checkNote}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================ 子视图 3：典型日 ============================ */
function DayView() {
  /** 案例日切换：默认取数据层第一个案例日（储能收益差最大） */
  const [date, setDate] = useState<string>(CASE_DAY_DATES[0]);
  const curve = CASE_DAY_CURVES[date] ?? [];
  const rows = CASE_DAY_ROWS[date] ?? [];
  const pick = (kw: string) => rows.find(r => r.name.startsWith(kw));
  const ch = pick('储能充电量');
  const dis = pick('储能放电量');
  const cyc = pick('充放次数');
  const cw = pick('充电加权电价');
  const dw = pick('放电加权电价');
  /** 实际运行侧当日无充放 → 曲线为 0 线，需给出说明 */
  const realIdle = (ch?.real ?? 0) === 0 && (dis?.real ?? 0) === 0;
  /** 当日电价读数：只有仿真侧算得出（实际侧报表未拆分成本与收益） */
  const dayPriceReadouts = [
    { label: PRICE_TEXT.chargeWeighted, value: cw?.sim === null || cw?.sim === undefined ? '—' : cw.sim.toFixed(4) },
    { label: PRICE_TEXT.dischargeWeighted, value: dw?.sim === null || dw?.sim === undefined ? '—' : dw.sim.toFixed(4) },
  ];
  /** 案例日表的取值精度：电价 4 位、率类 0 位、其余 2 位 */
  const decOf = (name: string) => (name.includes('电价') ? 4 : name.includes('率') ? 0 : 2);

  const f1 = (v: number | undefined) => nf(v ?? 0, 1);
  const f2 = (v: number | undefined) => nf(v ?? 0, 2);
  const pw = (v: number) => (v === 0 ? '0.0' : (v > 0 ? '+' : '') + v.toFixed(1));
  const pwTag = (v: number) => (v < 0 ? CASE_DAY_TEXT.pwState.charge : v > 0 ? CASE_DAY_TEXT.pwState.discharge : CASE_DAY_TEXT.pwState.idle);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{CASE_DAY_TEXT.chartTitle} · {date}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{CASE_DAY_TEXT.rule}</p>
          </div>
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-[11px] text-gray-400">{CASE_DAY_TEXT.switchLabel}：</span>
            {CASE_DAY_DATES.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDate(d)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  d === date ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                }`}
              >
                {d.slice(5)}
                <span className={`ml-1 text-[10px] font-normal ${d === date ? 'text-blue-100' : 'text-gray-400'}`}>
                  {CASE_DAY_TEXT.tags[d]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pt-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 8, right: 20, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  interval={7}
                />
                <YAxis
                  yAxisId="left"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={46}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-xs space-y-1">
                        <div className="font-bold text-gray-800">
                          {label}　<span className="text-gray-400 font-normal">{TOU_LABELS[p.tier]}段</span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-500">{CASE_DAY_TEXT.legend.realPower}</span>
                          <span className="font-mono font-bold text-slate-500">
                            {pw(p.real)} kW
                            <span className="ml-1 text-[10px] font-normal text-gray-400">{pwTag(p.real)}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-500">{CASE_DAY_TEXT.legend.simPower}</span>
                          <span className="font-mono font-bold text-blue-600">
                            {pw(p.sim)} kW
                            <span className="ml-1 text-[10px] font-normal text-gray-400">{pwTag(p.sim)}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between space-x-4">
                          <span className="text-gray-500">SOC</span>
                          <span className="font-mono font-bold text-gray-800">
                            {p.socReal.toFixed(1)} % <span className="text-gray-300">/</span> {p.socSim.toFixed(1)} %
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                  formatter={(v: string) => <span className="text-gray-600">{v}</span>}
                />
                <Line yAxisId="left" type="stepAfter" dataKey="real" name={CASE_DAY_TEXT.legend.realPower} stroke="#94a3b8" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="stepAfter" dataKey="sim" name={CASE_DAY_TEXT.legend.simPower} stroke="#2f5cff" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="socReal" name={CASE_DAY_TEXT.legend.realSoc} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="socSim" name={CASE_DAY_TEXT.legend.simSoc} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24h 电价档位色带 */}
        <div className="px-5 pb-4 space-y-2">
          <div className="flex h-3 rounded-md overflow-hidden border border-gray-100">
            {TOU_SEGMENTS.map((t, k) => (
              <div
                key={`${t.key}-${k}`}
                title={`${TOU_LABELS[t.key]} ${String(Math.floor(t.a / 4)).padStart(2, '0')}:00–${String(Math.floor(t.b / 4)).padStart(2, '0')}:00　${t.price} 元/kWh`}
                style={{ width: `${((t.b - t.a) / 96) * 100}%`, background: TOU_COLORS[t.key] }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
          </div>
          <div className="flex items-center space-x-4 flex-wrap pt-0.5">
            <span className="flex items-center space-x-1.5 text-[11px] text-gray-500">
              <span className="w-4 h-0.5 bg-slate-400" /><span>{CASE_DAY_TEXT.legend.realPower}{CASE_DAY_TEXT.powerNote}</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[11px] text-gray-500">
              <span className="w-4 h-0.5 bg-blue-600" /><span>{CASE_DAY_TEXT.legend.simPower}{CASE_DAY_TEXT.powerNote}</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[11px] text-gray-500">
              <span className="w-4 h-0.5 bg-amber-500" style={{ borderTop: '1px dashed' }} /><span>SOC</span>
            </span>
          </div>
        </div>

        {/* 电价口径：档位价与时段窗口 + 售电单价 + 当日加权电价（增益差额即由这套电价产生） */}
        <div className="px-5 py-3 border-t border-gray-100">
          <PriceStrip readouts={dayPriceReadouts} />
        </div>

        {/* 曲线口径说明 */}
        <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-500 leading-relaxed">
          {CASE_DAY_TEXT.curveCaliber}
          {realIdle && <span className="ml-1 text-amber-600">{CASE_DAY_TEXT.idleNote(ch?.real ?? 0, dis?.real ?? 0)}</span>}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center space-x-6 flex-wrap text-[11px] text-gray-500">
          <span>
            {CASE_DAY_TEXT.footLabels.charge} {CASE_DAY_TEXT.footLabels.real}{' '}
            <span className="font-mono font-bold text-gray-800">{f1(ch?.real)}</span> / {CASE_DAY_TEXT.footLabels.sim}
            <span className="font-mono font-bold text-gray-800"> {f1(ch?.sim)}</span> kWh
          </span>
          <span>
            {CASE_DAY_TEXT.footLabels.discharge} {CASE_DAY_TEXT.footLabels.real}{' '}
            <span className="font-mono font-bold text-gray-800">{f1(dis?.real)}</span> / {CASE_DAY_TEXT.footLabels.sim}
            <span className="font-mono font-bold text-gray-800"> {f1(dis?.sim)}</span> kWh
          </span>
          <span>
            {CYCLE_TEXT.label} {CASE_DAY_TEXT.footLabels.real}{' '}
            <span className="font-mono font-bold text-gray-800">{f2(cyc?.real)}</span> / {CASE_DAY_TEXT.footLabels.sim}
            <span className="font-mono font-bold text-gray-800"> {f2(cyc?.sim)}</span> {CYCLE_TEXT.unit}
          </span>
          <span>{CASE_DAY_TEXT.socNote}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">{CASE_DAY_TEXT.tableTitle} · {date}</h3>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50/70 text-gray-500">
                <th className="text-left px-4 py-2 font-semibold">{COL_LABELS.item}</th>
                <th className="text-right px-3 py-2 font-semibold">{COL_LABELS.actual}</th>
                <th className="text-right px-3 py-2 font-semibold">{COL_LABELS.sim}</th>
                <th className="text-right px-4 py-2 font-semibold">{COL_LABELS.diff}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isCycle = r.name.startsWith(CYCLE_TEXT.label);
                return (
                  <tr key={r.name} className={`border-t border-gray-100 ${isCycle ? 'bg-blue-50/40' : ''}`}>
                    <td className={`px-4 py-2 ${isCycle ? 'font-bold text-gray-800' : 'text-gray-700'}`}>{r.name}</td>
                    <td className={`px-3 py-2 text-right font-mono ${r.real === null ? 'text-gray-300' : 'text-gray-700'}`}>
                      {nf(r.real, decOf(r.name))}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-700">{nf(r.sim, decOf(r.name))}</td>
                    <td className={`px-4 py-2 text-right font-mono font-bold ${r.diff === 0 ? 'text-gray-400' : TONE_TEXT[toneOf(r.diff ?? 0)]}`}>
                      {r.diff === null ? '—' : r.diff === 0 ? '0' : sf(r.diff, 2, '')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50 text-[11px] text-gray-500 space-y-1">
            <div>{CYCLE_TEXT.caseNote}</div>
            <div>{CASE_DAY_TEXT.priceNote}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <div className="text-[11px] font-bold text-gray-400 mb-1">{CASE_DAY_TEXT.readingTitle}</div>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{caseDayReading(date)}</p>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="text-[11px] font-bold text-gray-400 mb-1">{CASE_DAY_TEXT.othersTitle}</div>
            <p className="text-xs text-gray-600 leading-relaxed">{otherCaseDays(date)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================ 主面板 ================================ */
/** 子视图顺序在此固定，名称与提示统一取文案层 VIEW_META */
const SIM_VIEWS: { id: string; label: string; hint: string }[] = (
  ['money', 'monthly', 'day'] as const
).map(id => ({ id, ...VIEW_META[id] }));

/** 各类设备容量的取值键与展示名在文案层（CAPACITY_ITEMS），此处按 index 配图标与配色 */
const CAPACITY_ICONS = [Sun, BatteryCharging, Cpu, Gauge];
const CAPACITY_TONES = [
  'bg-amber-50 text-amber-600',
  'bg-purple-50 text-purple-600',
  'bg-indigo-50 text-indigo-600',
  'bg-sky-50 text-sky-600',
];

export function OperationDataPanel({ station }: { station?: any }) {
  const [view, setView] = useState<string>('money');
  const [running, setRunning] = useState(false);
  /** 仿真不是必选项：未运行时本页只展示设备容量与原始运行指标 */
  const [simulated, setSimulated] = useState(false);
  /** 当前场景：默认取场景注册表中第一个可用场景 */
  const [scenarioId, setScenarioId] = useState<string>(
    SIM_SCENARIOS.find(s => s.status === 'ready')?.id ?? SIM_SCENARIOS[0].id,
  );

  /** 推送仿真报告：弹窗内先选模块、先看效果，确认后才下发 */
  const [pushOpen, setPushOpen] = useState(false);
  /** 推送结果提示 */
  const [toast, setToast] = useState<string | null>(null);

  const active = SIM_VIEWS.find(v => v.id === view) || SIM_VIEWS[0];
  const scenario = SIM_SCENARIOS.find(s => s.id === scenarioId) ?? SIM_SCENARIOS[0];

  const runSim = () => {
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      setSimulated(true);
    }, 1400);
  };

  const handlePushed = (sectionIds: string[]) => {
    setPushOpen(false);
    setToast(`${PUSH_COPY.toastTitle}（${sectionIds.length} ${PUSH_COPY.selectedUnit}）`);
    window.setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="space-y-4">
      {/* 顶部：站点与数据区间 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0">
              <Activity size={19} className="text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="font-black text-gray-900 text-base">{COPY.panelTitle}</h2>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold">
                  {COPY.panelBadge}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {SIM_META.station}　·　{COPY.periodLabel} {SIM_META.period}（{SIM_META.days} 天）
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white">
              <Calendar size={12} className="text-gray-400" />
              <span className="text-xs font-mono text-gray-700">2026-08</span>
            </div>
            {simulated && (
              <button
                type="button"
                onClick={() => setSimulated(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition"
              >
                {COPY.collapse}
              </button>
            )}
            <button
              type="button"
              onClick={runSim}
              disabled={running}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition border ${
                running
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'
              }`}
            >
              {running ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{running ? COPY.running : simulated ? COPY.rerun : scenario.name}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 一、各类设备容量 */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="w-1 h-3.5 bg-slate-400 rounded-full" />
          <h3 className="text-xs font-bold text-gray-700">{COPY.capacityTitle}</h3>
          <span className="text-[11px] text-gray-400">{COPY.capacityHint}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CAPACITY_ITEMS.map((it, i) => {
            const row = PARAM_ROWS.find(p => p.k === it.key);
            const Icon = CAPACITY_ICONS[i];
            const m = it.key.match(/\(([^)]+)\)/);
            return (
              <div key={it.key} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start space-x-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${CAPACITY_TONES[i]}`}>
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-500 font-semibold">{it.label}</div>
                  <div className="text-lg font-black font-mono text-gray-800 mt-0.5">
                    {row?.v}
                    {m && <span className="text-[10px] font-normal text-gray-400 ml-1">{m[1]}</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-snug">{row?.d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 二、原始运行指标 */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="w-1 h-3.5 bg-slate-400 rounded-full" />
          <h3 className="text-xs font-bold text-gray-700">{COPY.standardTitle}</h3>
          <span className="text-[11px] text-gray-400">{SIM_META.period} · {COPY.standardHint}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {KPI_CARDS.map(c => (
            <div key={c.name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[11px] text-gray-500 font-semibold">{c.name}</div>
              <div className="text-lg font-black font-mono mt-1 text-gray-800">
                {nf(c.real, decimalsFor(c.unit))}
                <span className="text-[10px] font-normal text-gray-400 ml-1">{c.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 三、仿真场景：按需触发，未运行不影响上方原始指标 */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="w-1 h-3.5 bg-blue-400 rounded-full" />
          <h3 className="text-xs font-bold text-gray-700">{COPY.simSectionTitle}</h3>
          <span className="text-[11px] text-gray-400">{COPY.simSectionHint}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SIM_SCENARIOS.map(s => {
            const isReady = s.status === 'ready';
            const isActive = s.id === scenarioId;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!isReady || running}
                onClick={() => {
                  setScenarioId(s.id);
                  runSim();
                }}
                className={`text-left bg-white p-4 rounded-xl border shadow-sm transition ${
                  isActive && isReady ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200'
                } ${isReady ? 'hover:border-blue-300' : 'opacity-60 cursor-not-allowed'}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-800">{s.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      isReady
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-100 border-gray-200 text-gray-500'
                    }`}
                  >
                    {isReady ? COPY.scenarioReady : COPY.scenarioPlanned}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">{s.desc}</p>
                <div className="text-[10px] text-gray-400 mt-1.5">
                  {COPY.benchmarkLabel}：{s.benchmark}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 四、仿真结果：未运行时给入口，运行后展示效果 */}
      {!simulated ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 px-6 py-11 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
            <Sparkles size={22} className="text-blue-500" />
          </div>
          <div className="text-sm font-bold text-gray-800">{COPY.emptyTitle}</div>
          <p className="text-xs text-gray-500 mt-1.5 mb-4 max-w-[560px] leading-relaxed">
            {COPY.emptyDesc}
          </p>
          <button
            type="button"
            onClick={runSim}
            disabled={running}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs transition border ${
              running
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'
            }`}
          >
            {running ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{running ? COPY.running : COPY.emptyAction}</span>
          </button>
        </div>
      ) : (
        <>
          {/* 仿真效果 */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="w-1 h-3.5 bg-blue-500 rounded-full" />
              <h3 className="text-xs font-bold text-gray-700">{COPY.simTitle}</h3>
              <span className="text-[11px] text-gray-400">{COPY.benchmarkLabel}：{scenario.benchmark}</span>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                {SIM_META.version}
              </span>
              <button
                type="button"
                onClick={() => setPushOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition border bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm"
              >
                <Send size={13} />
                <span>{PUSH_COPY.action}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
              {KPI_CARDS.map(c => {
                const dec = decimalsFor(c.unit);
                const tone = c.dir === 'up' ? 'up' : 'down';
                return (
                  <div key={c.name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-[11px] text-gray-500 font-semibold">{c.name}</div>
                    <div className={`text-lg font-black font-mono mt-1 ${TONE_TEXT[tone]}`}>
                      {nf(c.sim, dec)}
                      <span className="text-[10px] font-normal text-gray-400 ml-1">{c.unit}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      {c.dir === 'up' ? <ArrowUpRight size={12} className="text-red-500" /> : <ArrowDownRight size={12} className="text-emerald-500" />}
                      <span className={`text-xs font-bold font-mono ${TONE_TEXT[tone]}`}>{c.dev}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1.5 leading-snug">{KPI_NOTE[c.name]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 子视图导航 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1.5 flex items-center space-x-1 overflow-x-auto">
            {SIM_VIEWS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                title={v.hint}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  view === v.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-black ${
                  view === v.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{i + 1}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          {/* 当前视图说明 */}
          <div className="flex items-center space-x-2 text-[11px] text-gray-400 px-1">
            <span className="font-semibold text-gray-600">{COPY.focusLabel}：{active.label}</span>
            <span className="text-gray-300">·</span>
            <span>{active.hint}</span>
          </div>

          {view === 'money' && <MoneyView />}
          {view === 'monthly' && <MonthlyView />}
          {view === 'day' && <DayView />}
        </>
      )}

      {/* 推送仿真报告：选择模块 → 预览用户端效果 → 下发
          按需挂载，每次打开都回到默认全选，不带上次的勾选残留 */}
      {pushOpen && (
        <PushReportModal
          isOpen
          onClose={() => setPushOpen(false)}
          onPushed={handlePushed}
        />
      )}

      {/* 推送结果提示 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center space-x-2.5 px-4 py-3 rounded-xl bg-gray-900 text-white shadow-2xl">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toast}</span>
        </div>
      )}
    </div>
  );
}

export default OperationDataPanel;
