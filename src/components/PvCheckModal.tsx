/* ==========================================================================
   光伏数据校对 · 每日对比弹层
   --------------------------------------------------------------------------
   职责：在结果页点「查看每日对比」后，按日列出仿真与真实光伏发电量，
   让运营能直接定位是哪几天把差额拉起来的，而不是只知道"总账对不上"。

   三层结构沿用：数字由调用方算好传入（operationSimData.ts），
   表述取自 operationSimCopy.ts（PV_CHECK），本文件只排版。
   ========================================================================== */

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { PV_CHECK } from './operationSimCopy';

export interface PvDayRow {
  date: string;
  real: number;
  sim: number;
  diff: number;
  /** 偏差率（%），真实值为 0 时给 null */
  rate: number | null;
}

interface PvCheckModalProps {
  open: boolean;
  onClose: () => void;
  rows: PvDayRow[];
  /** 月度合计三项 */
  total: { real: number; sim: number; diff: number; rate: number | null };
  threshold: number;
  nf: (v: number | null | undefined, d?: number) => string;
  sf: (v: number | null | undefined, d?: number, suffix?: string) => string;
}

export function PvCheckModal({
  open,
  onClose,
  rows,
  total,
  threshold,
  nf,
  sf,
}: PvCheckModalProps) {
  if (!open) return null;

  const over = rows.filter(r => r.rate !== null && Math.abs(r.rate) > threshold);
  const overSet = new Set(over.map(r => r.date));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* 标题 */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <h3 className="font-black text-gray-900 text-sm flex items-center space-x-2">
              <AlertTriangle size={15} className="text-amber-500" />
              <span>{PV_CHECK.modalTitle}</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{PV_CHECK.modalHint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
            aria-label={PV_CHECK.closeLabel}
          >
            <X size={16} />
          </button>
        </div>

        {/* 汇总 */}
        <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-4 gap-3 shrink-0 bg-gray-50/60">
          {[
            { label: '真实发电量', value: nf(total.real, 0), tone: 'text-gray-800' },
            { label: '仿真发电量', value: nf(total.sim, 0), tone: 'text-gray-800' },
            {
              label: PV_CHECK.diffLabel,
              value: sf(total.diff, 0, ''),
              tone: Math.abs(total.rate ?? 0) > threshold ? 'text-amber-600' : 'text-gray-800',
            },
            {
              label: PV_CHECK.rateLabel,
              value: sf(total.rate, 2),
              tone: Math.abs(total.rate ?? 0) > threshold ? 'text-amber-600' : 'text-emerald-600',
            },
          ].map(it => (
            <div key={it.label}>
              <div className="text-[10px] text-gray-400">{it.label}</div>
              <div className={`text-sm font-black font-mono mt-0.5 ${it.tone}`}>
                {it.value}
                <span className="text-[9px] font-normal text-gray-400 ml-0.5">
                  {it.label === PV_CHECK.rateLabel ? '' : PV_CHECK.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 明细 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs text-gray-400">{PV_CHECK.emptyText}</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white shadow-[0_1px_0_0_#F3F4F6]">
                <tr className="text-[10px] text-gray-400">
                  <th className="text-left font-bold px-5 py-2">{PV_CHECK.columns[0]}</th>
                  <th className="text-right font-bold px-2 py-2">
                    {PV_CHECK.columns[1]}（{PV_CHECK.unit}）
                  </th>
                  <th className="text-right font-bold px-2 py-2">
                    {PV_CHECK.columns[2]}（{PV_CHECK.unit}）
                  </th>
                  <th className="text-right font-bold px-2 py-2">
                    {PV_CHECK.columns[3]}（{PV_CHECK.unit}）
                  </th>
                  <th className="text-right font-bold px-5 py-2">{PV_CHECK.columns[4]}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const bad = overSet.has(r.date);
                  return (
                    <tr key={r.date} className={bad ? 'bg-amber-50/70' : ''}>
                      <td className="px-5 py-1.5 font-mono text-gray-600">{r.date.slice(5)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-gray-700">{nf(r.real, 0)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-gray-700">{nf(r.sim, 0)}</td>
                      <td
                        className={`px-2 py-1.5 text-right font-mono ${
                          bad ? 'text-amber-700 font-bold' : 'text-gray-500'
                        }`}
                      >
                        {sf(r.diff, 0, '')}
                      </td>
                      <td
                        className={`px-5 py-1.5 text-right font-mono ${
                          bad ? 'text-amber-700 font-bold' : 'text-gray-400'
                        }`}
                      >
                        {r.rate === null ? '—' : sf(r.rate, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-white shadow-[0_-1px_0_0_#F3F4F6]">
                <tr className="text-[11px] font-bold">
                  <td className="px-5 py-2 text-gray-700">{PV_CHECK.totalLabel}</td>
                  <td className="px-2 py-2 text-right font-mono text-gray-800">{nf(total.real, 0)}</td>
                  <td className="px-2 py-2 text-right font-mono text-gray-800">{nf(total.sim, 0)}</td>
                  <td
                    className={`px-2 py-2 text-right font-mono ${
                      Math.abs(total.rate ?? 0) > threshold ? 'text-amber-700' : 'text-gray-600'
                    }`}
                  >
                    {sf(total.diff, 0, '')}
                  </td>
                  <td
                    className={`px-5 py-2 text-right font-mono ${
                      Math.abs(total.rate ?? 0) > threshold ? 'text-amber-700' : 'text-emerald-600'
                    }`}
                  >
                    {sf(total.rate, 2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* 脚注 */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-gray-400">
            阈值 {threshold}%；{PV_CHECK.overCount(over.length)}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            {PV_CHECK.closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PvCheckModal;
