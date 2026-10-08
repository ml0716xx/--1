/* ==========================================================================
   推送仿真报告 · 弹窗
   --------------------------------------------------------------------------
   职责：① 按报告章节勾选推送模块；② 推送前预览接收方（用户端）看到的效果。
   遵循三层结构：数字取自 operationSimData.ts，表述取自 operationSimCopy.ts，
   本文件只负责排版与交互。

   推送语义：本原型不落地用户端页面，推送为一次性下发动作，
   确认后由调用方（OperationDataPanel）给出结果反馈。
   ========================================================================== */

import React, { useState } from 'react';
import { X, Send, Square, CheckSquare, RefreshCw, Smartphone } from 'lucide-react';
import {
  SIM_META, KPI_CARDS, MONEY_ROWS, PARAM_ROWS, CASE_DAY_DATES, CASE_DAY_ROWS,
  TOU_TIERS, PRICE_MONTH,
} from './operationSimData';
import {
  PUSH_SECTIONS,
  PUSH_COPY,
  COPY,
  COL_LABELS,
  CAPACITY_ITEMS,
  SIM_SCENARIOS,
  CASE_DAY_TEXT,
  CYCLE_TEXT,
  PRICE_TEXT,
  TOU_LABELS,
  tierWindow,
  caseDayReading,
  otherCaseDays,
} from './operationSimCopy';

/** 千分位格式化（缺值显示「—」，与面板一致） */
const nf = (v: number | null | undefined, d = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
};

/** 按单位决定小数位 */
const decimalsFor = (unit: string) => {
  if (unit === '元/kWh') return 3;
  if (unit === '次') return 1;
  if (unit === '%') return 2;
  return 2;
};

/** 从 key 的括号里取单位 */
const unitOf = (key: string) => key.match(/\(([^)]+)\)/)?.[1] ?? '';

const U = '元';

/** 「储能充电量 (kWh)」→「储能充电量」 */
const shortName = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '');

/** 「储能充电量 (kWh)」→「kWh」 */
const unitOfName = (name: string) => name.match(/\(([^)]+)\)/)?.[1] ?? '';

/**
 * 窄屏数值：比率取整，其余整数不留小数、非整数留 1 位
 * 例 1,690 → 1,690；2,301.497 → 2,301.5；100 → 100
 */
const smart = (v: number | null | undefined, pct = false) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  if (pct) return nf(v, 0);
  return Number.isInteger(v) ? nf(v, 0) : nf(v, 1);
};

/** 当前可用场景，用于标注预览里的对比基准 */
const readyScenario = SIM_SCENARIOS.find(s => s.status === 'ready') ?? SIM_SCENARIOS[0];

/** 缩略小节：预览里每个内容块的外壳 */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500">
        {title}
      </div>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}

/* ------------------------ 预览：单个章节的内容 ------------------------ */
function SectionPreview({ id }: { id: string }) {
  const meta = PUSH_SECTIONS.find(s => s.id === id);
  if (!meta) return null;

  const total = KPI_CARDS.find(c => c.name === '总收益')!;
  const perUnit = KPI_CARDS.find(c => c.name === '单位放电净收益')!;
  const storageDiff = MONEY_ROWS.find(r => r.item.startsWith('储能收益'))!;
  const pvDiff = MONEY_ROWS.find(r => r.item.startsWith('光伏收益'))!;
  /** 推送预览取主案例日（数据层第一个案例日） */
  const caseDate = CASE_DAY_DATES[0];
  const caseRows = CASE_DAY_ROWS[caseDate] ?? [];
  const caseDiff = caseRows.find(r => r.name.startsWith('储能收益'))!;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1.5 px-0.5">
        <span className="w-1 h-3 bg-blue-500 rounded-full" />
        <span className="text-[11px] font-bold text-gray-800">{meta.name}</span>
      </div>

      {id === 'overview' && (
        <>
          <Block title={COPY.capacityTitle}>
            <div className="grid grid-cols-2 gap-2">
              {CAPACITY_ITEMS.map(it => {
                const row = PARAM_ROWS.find(p => p.k === it.key);
                const u = unitOf(it.key);
                return (
                  <div key={it.key}>
                    <div className="text-[10px] text-gray-400">{it.label}</div>
                    <div className="text-xs font-black font-mono text-gray-700">
                      {row?.v}
                      {u && <span className="text-[9px] font-normal text-gray-400 ml-0.5">{u}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Block>

          <Block title={COPY.standardTitle}>
            <div className="grid grid-cols-2 gap-2">
              {KPI_CARDS.map(c => (
                <div key={c.name}>
                  <div className="text-[10px] text-gray-400">{c.name}</div>
                  <div className="text-xs font-black font-mono text-gray-700">
                    {nf(c.real, decimalsFor(c.unit))}
                    <span className="text-[9px] font-normal text-gray-400 ml-0.5">{c.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </Block>
        </>
      )}

      {id === 'benefit' && (
        <>
          <Block title={COPY.simTitle}>
            <div className="text-[10px] text-gray-400">{PUSH_COPY.totalLabel}</div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-sm font-black font-mono text-gray-500">
                {nf(total.real, 0)}
              </span>
              <span className="text-[10px] text-gray-300">→</span>
              <span className="text-base font-black font-mono text-gray-900">
                {nf(total.sim, 0)}
              </span>
              <span className="text-[10px] text-gray-400">{total.unit}</span>
            </div>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold font-mono">
                {total.dev}
              </span>
              <span className="text-[10px] text-gray-500">
                {PUSH_COPY.deltaLabel} +21,087 元
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">储能收益</span>
                <span className="font-mono font-bold text-red-600">+{nf(storageDiff.diff, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">光伏收益</span>
                <span className="font-mono font-bold text-emerald-600">{nf(pvDiff.diff, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">单位放电净收益</span>
                <span className="font-mono font-bold text-gray-700">
                  {nf(perUnit.real, 3)} → {nf(perUnit.sim, 3)} {perUnit.unit}
                </span>
              </div>
            </div>
          </Block>

          <Block title={COPY.bridgeTitle}>
            <div className="space-y-1.5">
              {[
                { label: COPY.bridgeRows[0], value: `${nf(total.real, 0)} 元`, tone: 'text-gray-500' },
                { label: COPY.bridgeRows[1], value: `+${nf(storageDiff.diff, 0)} 元`, tone: 'text-red-600' },
                { label: COPY.bridgeRows[2], value: `${nf(pvDiff.diff, 0)} 元`, tone: 'text-emerald-600' },
                {
                  label: COPY.bridgeRows[3],
                  value: `${nf(total.sim, 0)} 元`,
                  tone: 'text-gray-900',
                  strong: true,
                },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">{r.label}</span>
                  <span
                    className={`font-mono ${r.tone} ${r.strong ? 'text-xs font-black' : 'text-[11px] font-bold'}`}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </Block>

          {/* 电价口径：差额由价差与时段结构产生，先把两侧采用的电价摆出来 */}
          <Block title={PUSH_COPY.priceBlockTitle}>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{PRICE_TEXT.purchaseLabel}</span>
                <span className="text-[11px] font-mono font-bold text-gray-800">
                  {nf(Math.min(...TOU_TIERS.map(t => t.price)), 4)} ~ {nf(Math.max(...TOU_TIERS.map(t => t.price)), 4)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400">　</span>
                <span className="text-gray-500 leading-relaxed text-right">
                  {TOU_TIERS.map(t => `${TOU_LABELS[t.key]} ${nf(t.price, 4)}（${tierWindow(t.ranges)}）`).join('　')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-[10px] text-gray-500">{PRICE_TEXT.saleLabel}</span>
                <span className="text-[11px] font-mono font-bold text-gray-800">{nf(PRICE_MONTH.sale, 4)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{PRICE_TEXT.chargeWeighted} / {PRICE_TEXT.dischargeWeighted}</span>
                <span className="text-[11px] font-mono font-bold text-gray-800">
                  {nf(PRICE_MONTH.chargeWeighted, 4)} / {nf(PRICE_MONTH.dischargeWeighted, 4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">{PRICE_TEXT.spread}</span>
                <span className="text-[11px] font-mono font-bold text-blue-600">{nf(PRICE_MONTH.spread, 4)}</span>
              </div>
              <div className="text-[9px] text-gray-400 leading-relaxed pt-0.5">{PRICE_TEXT.noRealNote}</div>
            </div>
          </Block>
        </>
      )}

      {id === 'caseday' && (
        <>
          <Block title={PUSH_COPY.caseDayBlockTitle}>
            {/* 案例日与当日储能收益差 */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">{PUSH_COPY.caseDayLabel}</span>
              <span className="text-[11px] font-black font-mono text-gray-800">{caseDate}</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-gray-400">{PUSH_COPY.storageDeltaLabel}</span>
              <span className="text-[11px] font-black font-mono text-red-600">
                +{nf(caseDiff.diff, 0)} {U}
              </span>
            </div>

            {/* 案例日两侧逐项对照 */}
            <div className="mt-2.5 overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-1.5 py-1 text-[9px] font-bold text-gray-500 w-[94px]">
                      {COL_LABELS.item}
                    </th>
                    <th className="text-right px-1 py-1 text-[9px] font-bold text-gray-500">
                      {COL_LABELS.actual}
                    </th>
                    <th className="text-right px-1 py-1 text-[9px] font-bold text-gray-500">
                      {COL_LABELS.sim}
                    </th>
                    <th className="text-right px-1.5 py-1 text-[9px] font-bold text-gray-500 w-[62px]">
                      {COL_LABELS.diff}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {caseRows.map(r => {
                    const u = unitOfName(r.name);
                    const pct = u === '%';
                    const tone =
                      r.diff === null || r.diff === 0
                        ? 'text-gray-400'
                        : r.diff > 0
                          ? 'text-red-600'
                          : 'text-emerald-600';
                    return (
                      <tr key={r.name} className="border-t border-gray-100">
                        <td className="px-1.5 py-1 text-[9px] text-gray-600 whitespace-nowrap">
                          {shortName(r.name)}
                          {u && <span className="text-gray-300 ml-0.5">{u}</span>}
                        </td>
                        <td className="px-1 py-1 text-right text-[9px] font-mono text-gray-500">
                          {smart(r.real, pct)}
                        </td>
                        <td className="px-1 py-1 text-right text-[9px] font-mono font-bold text-gray-800">
                          {smart(r.sim, pct)}
                        </td>
                        <td className={`px-1.5 py-1 text-right text-[9px] font-mono font-bold ${tone}`}>
                          {r.diff === null
                            ? '—'
                            : `${r.diff > 0 ? '+' : ''}${smart(r.diff, pct)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="text-[9px] text-gray-400 mt-1 leading-relaxed">{CYCLE_TEXT.caseNote}</div>

            {/* 其余案例日与判读方法 */}
            <div className="mt-2.5 pt-2 border-t border-gray-100 space-y-2">
              <div>
                <div className="text-[9px] font-bold text-gray-400">
                  {CASE_DAY_TEXT.othersTitle}
                </div>
                <div className="text-[9px] text-gray-500 leading-relaxed mt-0.5">
                  {otherCaseDays(caseDate)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-gray-400">
                  {CASE_DAY_TEXT.readingTitle}
                </div>
                <div className="text-[9px] text-gray-500 leading-relaxed mt-0.5">
                  {caseDayReading(caseDate)}
                </div>
              </div>
              <div className="text-[9px] text-gray-400">
                {COPY.benchmarkLabel}：{readyScenario.benchmark}
              </div>
            </div>
          </Block>
        </>
      )}
    </div>
  );
}

/* ================================ 主弹窗 ================================ */
interface PushReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 推送完成回调，返回本次推送的章节 id 列表 */
  onPushed: (sectionIds: string[]) => void;
  /** 默认勾选的章节，缺省全选 */
  defaultSelected?: string[];
}

export function PushReportModal({
  isOpen,
  onClose,
  onPushed,
  defaultSelected,
}: PushReportModalProps) {
  const allIds = PUSH_SECTIONS.map(s => s.id);
  const [selected, setSelected] = useState<string[]>(defaultSelected ?? allIds);
  const [pushing, setPushing] = useState(false);

  if (!isOpen) return null;

  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const reportNo = `${PUSH_COPY.reportNoPrefix}-${SIM_META.period.slice(0, 7).replace('-', '')}-01`;

  const handlePush = () => {
    if (selected.length === 0 || pushing) return;
    setPushing(true);
    window.setTimeout(() => {
      setPushing(false);
      onPushed(selected);
    }, 1200);
  };

  /** 预览按注册表顺序渲染，不受勾选先后影响 */
  const previewIds = allIds.filter(id => selected.includes(id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-[1000px] h-[800px] max-h-[92vh] flex flex-col overflow-hidden">
        {/* 标题 */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <h3 className="font-black text-gray-900 text-sm flex items-center space-x-2">
              <Send size={15} className="text-blue-600" />
              <span>{PUSH_COPY.title}</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-1">{PUSH_COPY.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* 主体：左选模块，右看效果 */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* 推送内容 */}
          <div className="lg:w-[372px] shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col min-h-0">
            <div className="px-5 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <span className="w-1 h-3.5 bg-blue-500 rounded-full" />
                <span className="text-xs font-bold text-gray-700">{PUSH_COPY.sectionTitle}</span>
                <span className="text-[11px] text-gray-400">
                  {PUSH_COPY.selectedPrefix} {selected.length} / {PUSH_SECTIONS.length}{' '}
                  {PUSH_COPY.selectedUnit}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelected(allIds)}
                  className="px-1.5 py-1 rounded text-blue-600 hover:bg-blue-50 font-bold transition"
                >
                  {PUSH_COPY.selectAll}
                </button>
                <span className="text-gray-200">|</span>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="px-1.5 py-1 rounded text-gray-500 hover:bg-gray-50 font-bold transition"
                >
                  {PUSH_COPY.clearAll}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-2.5">
              {PUSH_SECTIONS.map(s => {
                const on = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      on
                        ? 'border-blue-500 bg-blue-50/40'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <span className={`mt-0.5 shrink-0 ${on ? 'text-blue-600' : 'text-gray-300'}`}>
                        {on ? <CheckSquare size={15} /> : <Square size={15} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-800">{s.name}</span>
                          <span className="text-[10px] text-gray-400">
                            {s.items.length} {PUSH_COPY.itemUnit}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {s.items.map(it => (
                            <span
                              key={it}
                              className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px] text-gray-500"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 用户端预览 */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="px-5 py-3 flex items-center space-x-2 shrink-0">
              <Smartphone size={13} className="text-gray-400" />
              <span className="text-xs font-bold text-gray-700">{PUSH_COPY.previewTitle}</span>
              <span className="text-[11px] text-gray-400">{PUSH_COPY.previewHint}</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 bg-gray-50/60">
              <div className="w-[336px] mx-auto">
                <div className="rounded-[28px] border-[6px] border-gray-800 bg-gray-100 shadow-xl overflow-hidden">
                  <div className="h-5 bg-gray-800 flex items-center justify-center">
                    <div className="w-14 h-1.5 rounded-full bg-gray-600" />
                  </div>
                  {/* 屏高随视口收缩，矮屏上不至于只剩一条缝 */}
                  <div className="h-[min(600px,calc(92vh-200px))] overflow-y-auto px-3 py-3 space-y-3">
                    {/* 报告头部 */}
                    <div className="rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white px-3.5 py-3">
                      <div className="text-[10px] opacity-70">{PUSH_COPY.reportHeadTitle}</div>
                      <div className="text-sm font-black mt-0.5">{SIM_META.station}</div>
                      <div className="text-[10px] opacity-70 mt-1">
                        {SIM_META.period} · {SIM_META.version}
                      </div>
                    </div>

                    {previewIds.map(id => (
                      <React.Fragment key={id}>
                        <SectionPreview id={id} />
                      </React.Fragment>
                    ))}

                    {previewIds.length === 0 && (
                      <div className="rounded-xl border border-dashed border-gray-300 px-4 py-12 text-center">
                        <div className="text-xs font-bold text-gray-700">
                          {PUSH_COPY.previewEmptyTitle}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1.5">
                          {PUSH_COPY.previewEmptyDesc}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="text-[11px] text-gray-500">
            {PUSH_COPY.receiverLabel}：
            <span className="font-semibold text-gray-700">{PUSH_COPY.receiverValue}</span>
            <span className="mx-2 text-gray-300">·</span>
            {PUSH_COPY.reportNoLabel}：
            <span className="font-mono text-gray-700">{reportNo}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
            >
              {PUSH_COPY.cancel}
            </button>
            <button
              type="button"
              onClick={handlePush}
              disabled={selected.length === 0 || pushing}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs transition border ${
                selected.length === 0 || pushing
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm'
              }`}
            >
              {pushing ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              <span>{pushing ? PUSH_COPY.pushing : PUSH_COPY.confirm}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PushReportModal;
