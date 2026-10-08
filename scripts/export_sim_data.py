#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
运营数据面板 · 数据层导出脚本
--------------------------------------------------------------------------
从三个源文件生成 src/components/operationSimData.ts（只放数字与结构）：

  1. 仿真结果 JSON         —— 15min 序列（功率 / SOC / 电价）与逐日、全月指标
  2. 真实运行总收益报表     —— 实际运行侧日粒度报表原值（31 天 + 总计）
  3. 仿真收益汇报母版 xlsx  —— 校验用（本脚本的数字口径与母版保持一致）

换站点 / 换月份：改下面的 PATHS（或命令行参数）后重跑本脚本即可，
文案层（operationSimCopy.ts）与视图层（OperationDataPanel.tsx）不需要改动。

用法：
  python3 scripts/export_sim_data.py [站点目录]
  站点目录默认取 ~/Documents/微网/仿真数据对比/济南鼎润纸制品
"""

import json
import os
import re
import sys
import glob
from datetime import datetime

import openpyxl

CAP_KWH = 2088.0          # 储能容量 kWh（站点参数，与 PARAM_ROWS 一致）
DAYS = 31

# 档位展示顺序（低 → 高）；窗口一律由仿真记录自带的 import_price 推导，不手写时段
TIER_SEQ = ["valley", "flat", "shoulder", "peak"]

# 兜底档位（仅当仿真记录里没有 import_price 字段时使用）
TOU_TIERS_FALLBACK = [
    {"key": "valley",   "price": 0.3096, "ranges": [(4, 24)], "hours": 5},
    {"key": "flat",     "price": 0.6489, "ranges": [(0, 4), (24, 64), (92, 96)], "hours": 12},
    {"key": "shoulder", "price": 0.9884, "ranges": [(64, 68), (88, 92)], "hours": 2},
    {"key": "peak",     "price": 1.1337, "ranges": [(68, 88)], "hours": 5},
]


def slot_of(datetime_str):
    return (int(datetime_str[11:13]) * 60 + int(datetime_str[14:16])) // 15


def derive_tou(records):
    """从仿真记录自带的 import_price 推导分时档位窗口。

    为什么不手写：档位时段是站点参数，各站不同；写死会与仿真口径不一致
    （2026-10-08 实测：某站真实窗口是谷 01:00–06:00 / 峰 17:00–22:00，
    手写的「谷 00:00–05:00 / 峰 08:00–11:00+18:00–20:00」会把色带画错，
    连带动画的充放电量与「按档电价」对不上母版）。
    """
    slot_price = {}
    for r in records:
        ec = r.get("metrics_data", {}).get("economic") or {}
        pr = ec.get("import_price")
        if pr is None:
            return None
        slot_price[slot_of(r["time_data"]["datetime"])] = float(pr)
    if len(slot_price) < 96:
        return None
    prices = sorted(set(slot_price.values()))
    if len(prices) == 1:
        keys = {prices[0]: "flat"}
    elif len(prices) == 2:
        keys = {prices[0]: "valley", prices[1]: "peak"}
    elif len(prices) == 3:
        keys = {prices[0]: "valley", prices[1]: "flat", prices[2]: "peak"}
    elif len(prices) == 4:
        keys = {prices[0]: "valley", prices[1]: "flat", prices[2]: "shoulder", prices[3]: "peak"}
    else:
        raise SystemExit(f"分时电价档位多于 4 档（{prices}），本脚本未支持，请先扩展档位模型")
    seq = [keys[slot_price[s]] for s in range(96)]
    tiers = []
    for k in TIER_SEQ:
        slots = [s for s in range(96) if seq[s] == k]
        if not slots:
            continue
        ranges, a = [], slots[0]
        for i in range(1, len(slots) + 1):
            if i == len(slots) or slots[i] != slots[i - 1] + 1:
                ranges.append((a, slots[i - 1] + 1))
                if i < len(slots):
                    a = slots[i]
        tiers.append({
            "key": k,
            "price": slot_price[slots[0]],
            "ranges": ranges,
            "hours": len(slots) / 4,
        })
    return tiers


def slots_of(tiers, key):
    out = []
    for t in tiers:
        if t["key"] == key:
            for a, b in t["ranges"]:
                out += list(range(a, b))
    return out

MONEY_ITEMS = ["储能收益 (元)", "光伏收益 (元)", "总收益 (元)", "单位放电净收益"]
DAILY_HEADERS = ["光伏发电量", "上网电量", "自用电量", "储能充电量", "储能放电量", "储能收益", "总收益", "自发自用率"]
DAILY_UNITS = ["kWh", "kWh", "kWh", "kWh", "kWh", "元", "元", "%"]

PARAM_ROWS = [
    {"k": "储能容量 (kWh)", "v": "2,088", "d": "电池额定容量，等效循环 = 日充电量 ÷ 该值"},
    {"k": "储能充放电量折算系数", "v": "1.000（不折算）", "d": "展示值即报表表计原值；如站点计量点与报表口径不一致，按实测比值填写"},
    {"k": "储能最大充放电功率 (kW)", "v": "1,000", "d": "日调节能力上限 = 该值 × 可充放小时数"},
    {"k": "SOC 运行区间", "v": "3% ~ 98%", "d": "来自站点配置表；影响可用容量与循环深度"},
    {"k": "光伏装机容量 (kWp)", "v": "2,800", "d": "与发电量量级互为校验"},
    {"k": "购电价档位 (元/kWh)", "v": "0.3096 / 0.6489 / 0.9884 / 1.1337", "d": "固定分时站点列出各档；逐时浮动站点给出月内区间"},
    {"k": "上网电价 (元/kWh)", "v": "是（余电上网）", "d": "不可余电上网的站点，仿真上网量应恒为 0"},
    {"k": "结算方式 / 并网日期", "v": "3（单一制） / 2026-05-27", "d": "新投运站点需标注爬坡期，避免把调试期计入结论"},
    {"k": "数据区间", "v": "2026-08-01 ~ 2026-08-31", "d": "真实运行报表与仿真序列共同覆盖的完整月"},
]


# --------------------------------------------------------------------- 读取
def load_sources(station_dir):
    json_path = sorted(glob.glob(os.path.join(station_dir, "result1_*.json")))
    # 同目录可能有多个结果文件，取不带 (1) 后缀的那个
    json_path = [p for p in json_path if "(1)" not in p] or json_path
    report_path = sorted(glob.glob(os.path.join(station_dir, "*总收益报表*.xlsx")))
    if not json_path or not report_path:
        raise SystemExit("源文件缺失：需要 result1_*.json 与 *总收益报表*.xlsx")
    with open(json_path[-1], encoding="utf-8") as f:
        sim = json.load(f)
    wb = openpyxl.load_workbook(report_path[-1], data_only=True)
    return sim, wb, json_path[-1], report_path[-1]


def parse_report(wb):
    """真实运行总收益报表 → {日期: {...}} 与总计行"""
    ws = wb[wb.sheetnames[0]]
    rows = list(ws.iter_rows(min_row=3, values_only=True))
    out, total = {}, None
    for r in rows:
        if not r or r[0] is None:
            continue
        key = str(r[0]).strip()

        def num(i):
            v = r[i] if i < len(r) else None
            return float(v) if isinstance(v, (int, float)) else 0.0

        rec = {
            "export_kwh": num(1), "export_income": num(2),
            "self_kwh": num(3), "self_income": num(4),
            "charge_kwh": num(5), "discharge_kwh": num(6), "storage_profit": num(7),
            "total_profit": num(10),
        }
        rec["gen_kwh"] = rec["export_kwh"] + rec["self_kwh"]
        rec["pv_profit"] = rec["total_profit"] - rec["storage_profit"]
        if key == "总计":
            total = rec
        elif re.match(r"^\d{4}-\d{2}-\d{2}$", key):
            out[key] = rec
    return out, total


def parse_sim(sim):
    """仿真结果 → 逐日指标、月指标、15min 记录"""
    st = sim["strategy"]
    summary = {}
    for s in st["summary"]:
        m = s["metrics_data"]
        op, ec = m["operation"], m["economic"]
        rec = {
            "gen_kwh": op["pv_generation_kwh"],
            "export_kwh": op["pv_export_kwh"],
            "self_kwh": op["pv_self_consumption_kwh"],
            "charge_kwh": op["storage_charge_kwh"],
            "discharge_kwh": op["storage_discharge_kwh"],
            "self_rate": op["pv_self_consumption_rate_percent"],
            "storage_profit": ec["storage_profit"],
            "pv_profit": ec["pv_profit"],
            "total_profit": ec["total_profit"],
        }
        summary[s["date"]] = rec
    month = {
        "gen_kwh": st["metrics"]["operation"]["pv_self_consumption_rate_percent"],  # 占位，稍后覆盖
    }
    return summary, st["records"]


def month_metrics(summary, records):
    """按 15min 序列汇总全月指标（与逐日汇总一致）"""
    def s(k):
        return sum(d[k] for d in summary.values())
    charges = sum(r["power_data"]["p_bess_charge"] for r in records) * 0.25
    discharges = sum(r["power_data"]["p_bess_discharge"] for r in records) * 0.25
    return {
        "gen_kwh": s("gen_kwh"), "export_kwh": s("export_kwh"), "self_kwh": s("self_kwh"),
        "charge_kwh": charges, "discharge_kwh": discharges,
        "storage_profit": s("storage_profit"), "pv_profit": s("pv_profit"),
        "total_profit": s("total_profit"),
        "self_rate": s("self_kwh") / s("gen_kwh") * 100,
        "util_rate": discharges / charges * 100,
    }


def dev(sim_v, real_v):
    if real_v in (0, None):
        return None
    return (sim_v - real_v) / real_v * 100


# ------------------------------------------------------------------- 曲线
def tier_key_of(slot, tier_seq):
    return tier_seq[slot] if 0 <= slot < len(tier_seq) else "flat"


def sim_curve(records, date):
    pts = []
    for r in records:
        ts = r["time_data"]["datetime"]
        if not ts.startswith(date):
            continue
        p = r["power_data"]
        pts.append({
            "slot": len(pts),
            "power": round(p["p_bess"], 1),
            "soc": round(p["soc_end"] * 100, 2),
        })
    return pts


def real_curve(charge_kwh, discharge_kwh, chg_slots, dis_slots):
    """实际运行侧 15min 还原：谷段充电、峰段放电，积分严格等于当日报表电量。

    谷/峰窗口取推导出的分时档位窗口（不写死）。
    """
    pw = [0.0] * 96
    if charge_kwh > 0:
        p = charge_kwh / (len(chg_slots) * 0.25)
        for s in chg_slots:
            pw[s] = -p
    if discharge_kwh > 0:
        p = discharge_kwh / (len(dis_slots) * 0.25)
        for s in dis_slots:
            pw[s] = p
    pts, soc = [], 3.0
    for i, p in enumerate(pw):
        if p < 0:
            soc = min(98.0, soc + (-p) * 0.25 / CAP_KWH * 100)
        elif p > 0:
            soc = max(3.0, soc - p * 0.25 / CAP_KWH * 100)
        pts.append({"slot": i, "power": round(p, 1), "soc": round(soc, 2)})
    return pts


def merge_curve(sim_pts, real_pts, tier_seq):
    out = []
    for i in range(96):
        hh, mm = divmod(i * 15, 60)
        out.append({
            "time": f"{hh:02d}:{mm:02d}",
            "tier": tier_key_of(i, tier_seq),
            "sim": sim_pts[i]["power"] if i < len(sim_pts) else 0.0,
            "real": real_pts[i]["power"],
            "socSim": sim_pts[i]["soc"] if i < len(sim_pts) else 0.0,
            "socReal": real_pts[i]["soc"],
        })
    return out


# ------------------------------------------------------------------- 输出
def ts(v):
    """TypeScript 字面量"""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, str):
        return '"' + v.replace('"', '\\"') + '"'
    if isinstance(v, float):
        if v == int(v) and abs(v) < 1e15:
            return f"{v:.1f}"
        return f"{round(v, 6)}"
    return str(v)


def j(obj, indent=2):
    """把 python 结构转成 TS 字面量（对象/数组）"""
    pad = " " * indent
    if isinstance(obj, dict):
        inner = ", ".join(f"{k}: {j(v, 0)}" for k, v in obj.items())
        return "{ " + inner + " }"
    if isinstance(obj, list):
        if not obj:
            return "[]"
        if all(isinstance(x, (dict, list)) for x in obj) and any(isinstance(x, dict) for x in obj):
            items = [pad + "  " + j(x, indent + 2) for x in obj]
            return "[\n" + ",\n".join(items) + ",\n" + pad + "]"
        return "[" + ", ".join(j(x, 0) for x in obj) + "]"
    return ts(obj)


def build(station_dir):
    sim, wb, json_path, report_path = load_sources(station_dir)
    real_days, real_total = parse_report(wb)
    sim_days, records = parse_sim(sim)
    sm = month_metrics(sim_days, records)
    rm = real_total

    # ---- 分时档位：由仿真记录的 import_price 推导（推导失败才用兜底常量）
    tou = derive_tou(records)
    if tou is None:
        tou = TOU_TIERS_FALLBACK
    tier_seq = ["flat"] * 96
    for t in tou:
        for a, b in t["ranges"]:
            for s in range(a, b):
                tier_seq[s] = t["key"]
    # 实际运行侧曲线还原用的窗口：谷段充电、峰段放电
    chg_slots = slots_of(tou, "valley") or slots_of(tou, "flat") or list(range(0, 96))
    dis_slots = slots_of(tou, "peak") or slots_of(tou, "shoulder") or list(range(0, 96))

    # ---- 电价读数（仿真侧）：按逐 15min 电价加权；校验口径 = 母版的充电成本 / 放电收益
    day_price = {}
    for r in records:
        d = r["time_data"]["datetime"][:10]
        ip = float(r["metrics_data"]["economic"]["import_price"])
        c = r["power_data"]["p_bess_charge"] * 0.25
        di = r["power_data"]["p_bess_discharge"] * 0.25
        x = day_price.setdefault(d, {"chg": 0.0, "cost": 0.0, "dis": 0.0, "inc": 0.0})
        x["chg"] += c
        x["cost"] += c * ip
        x["dis"] += di
        x["inc"] += di * ip
    charge_cost = sum(x["cost"] for x in day_price.values())
    discharge_income = sum(x["inc"] for x in day_price.values())
    charge_weighted = charge_cost / sm["charge_kwh"] if sm["charge_kwh"] else None
    discharge_weighted = discharge_income / sm["discharge_kwh"] if sm["discharge_kwh"] else None
    spread = (discharge_weighted - charge_weighted) if None not in (charge_weighted, discharge_weighted) else None
    # 售电电价（余电上网结算单价）：取真实运行报表的上网收益 ÷ 上网电量
    sale_price = rm["export_income"] / rm["export_kwh"] if rm["export_kwh"] else None

    dates = sorted(sim_days.keys())
    meta_period = f"{dates[0]} ~ {dates[-1]}"
    version = "v1.1-batch（2026-09-24）"

    # 反向日：仿真总收益低于实际运行的日子（逐日相减，容忍 0.01 元舍入）
    reverse_days = []
    for date in dates:
        s0, r0 = sim_days[date], real_days[date]
        if s0["total_profit"] - r0["total_profit"] < -0.01:
            reverse_days.append({
                "date": date,
                "totalDiff": s0["total_profit"] - r0["total_profit"],
                "storageDiff": s0["storage_profit"] - r0["storage_profit"],
                "pvDiff": s0["pv_profit"] - r0["pv_profit"],
                "chargeSim": s0["charge_kwh"], "chargeReal": r0["charge_kwh"],
                "dischargeSim": s0["discharge_kwh"], "dischargeReal": r0["discharge_kwh"],
            })

    # 案例日按选日规则推导：储能收益差排序取前 3，再附上反向日
    ranked = sorted(
        dates,
        key=lambda d: sim_days[d]["storage_profit"] - real_days[d]["storage_profit"],
        reverse=True,
    )
    case_days = [d for d in ranked
                 if sim_days[d]["storage_profit"] - real_days[d]["storage_profit"] > 0][:3]
    case_days += [d["date"] for d in reverse_days if d["date"] not in case_days]

    L = []
    A = L.append
    A("// 本文件由 scripts/export_sim_data.py 从仿真结果 JSON + 真实运行总收益报表生成，作为原型演示数据。")
    A("// 生成时间：" + datetime.now().strftime("%Y-%m-%d %H:%M"))
    A("// 边界：本文件只放数字与结构，不放任何展示文案 —— 全部对外表述见 operationSimCopy.ts。")
    A("// 换站点 / 换月份时重跑导出脚本即可，视图组件（OperationDataPanel.tsx）不需改动。")
    A("")
    A("export const SIM_META = {")
    A(f'  station: {ts("济南鼎润纸制品")},')
    A(f"  period: {ts(meta_period)},")
    A(f"  days: {len(dates)},")
    A(f"  version: {ts(version)},")
    A("};")
    A("")

    # 分时档位（窗口由仿真记录的 import_price 推导）
    A("// 分时档位：slot 为 15min 序号 0..95，窗口由仿真记录自带的 import_price 推导（不手写时段）；")
    A("// 档位中文名见文案层 TOU_LABELS，配色见视图层 TOU_COLORS")
    A("export interface TouTier { key: string; price: number; ranges: [number, number][]; hours: number }")
    A("export const TOU_TIERS: TouTier[] = [")
    for t in tou:
        ranges = "[[" + "], [".join(f"{a}, {b}" for a, b in t["ranges"]) + "]]"
        A(f'  {{ key: {ts(t["key"])}, price: {ts(t["price"])}, ranges: {ranges}, hours: {ts(t["hours"])} }},')
    A("];")
    A("")
    A("// 电价读数：售电（余电上网）结算单价 + 仿真侧加权电价。")
    A("// 实际运行报表为日粒度、未拆分充电成本与放电收益，故实际侧不计加权电价（文案层负责说明）。")
    A("// 缺值一律为 null（文案层据 null 显示「—」），类型显式标注以免字面量把 null 收窄掉")
    A("export const PRICE_MONTH: { sale: number | null; chargeWeighted: number | null; dischargeWeighted: number | null; spread: number | null } = {")
    A(f"  sale: {ts(round(sale_price, 4) if sale_price is not None else None)},")
    A(f"  chargeWeighted: {ts(round(charge_weighted, 4) if charge_weighted is not None else None)},")
    A(f"  dischargeWeighted: {ts(round(discharge_weighted, 4) if discharge_weighted is not None else None)},")
    A(f"  spread: {ts(round(spread, 4) if spread is not None else None)},")
    A("};")
    A("")

    # KPI 卡
    unit_sim = sm["storage_profit"] / sm["discharge_kwh"]
    unit_real = rm["storage_profit"] / rm["discharge_kwh"]
    cyc_sim = sm["charge_kwh"] / CAP_KWH
    cyc_real = rm["charge_kwh"] / CAP_KWH
    A("export const KPI_CARDS = [")
    kpis = [
        ("总收益", sm["total_profit"], rm["total_profit"], "元", 2),
        ("储能收益", sm["storage_profit"], rm["storage_profit"], "元", 2),
        ("光伏收益", sm["pv_profit"], rm["pv_profit"], "元", 2),
        ("单位放电净收益", unit_sim, unit_real, "元/kWh", 3),
        ("等效循环", cyc_sim, cyc_real, "次", 1),
        ("储能利用率", sm["util_rate"], rm["discharge_kwh"] / rm["charge_kwh"] * 100, "%", 2),
        ("日均充放次数", cyc_sim / len(dates), cyc_real / len(dates), "次/日", 2),
    ]
    for name, s, r, unit, dec in kpis:
        # 偏差口径与母版一致：金额类用相对差（%），次数类用绝对差，比率类用 pp
        if unit == "元":
            d = f"{(s - r) / r * 100:+.1f}%"
        elif unit == "元/kWh":
            d = f"{s - r:+.3f}"
        elif unit == "%":
            d = f"{s - r:+.2f}pp"
        else:
            d = f"{s - r:+.{dec}f}"
        A(
            f'  {{ name: {ts(name)}, sim: {ts(s)}, real: {ts(r)}, unit: {ts(unit)}, '
            f'dev: {ts(d)}, dir: {ts("up" if s >= r else "down")} }},'
        )
    A("];")
    A("")

    # 分项差额
    A("// 分项差额（方向与说明见 operationSimCopy.ts 的 MONEY_DIR / MONEY_NOTE）")
    A("export const MONEY_ROWS = [")
    for name, s, r in [
        ("储能收益 (元)", sm["storage_profit"], rm["storage_profit"]),
        ("光伏收益 (元)", sm["pv_profit"], rm["pv_profit"]),
        ("总收益 (元)", sm["total_profit"], rm["total_profit"]),
    ]:
        A(f'  {{ item: {ts(name)}, sim: {ts(s)}, real: {ts(r)}, diff: {ts(s - r)} }},')
    A(f'  {{ item: {ts("单位放电净收益")}, sim: {ts("—")}, real: {ts("—")}, diff: {ts(unit_sim - unit_real)} }},')
    A("];")
    A("")

    # 月度指标
    A("// 月度指标对比：12 项（按类别分组）")
    A("export const MONTHLY_ROWS: { cat: string; name: string; sim: number; real: number; abs: number; rel: number | null; pp: boolean }[] = [")
    monthly = [
        ("电量类", "光伏发电量 (kWh)", sm["gen_kwh"], rm["gen_kwh"], False),
        ("电量类", "上网电量 (kWh)", sm["export_kwh"], rm["export_kwh"], False),
        ("电量类", "自用电量 (kWh)", sm["self_kwh"], rm["self_kwh"], False),
        ("电量类", "储能充电量 (kWh)", sm["charge_kwh"], rm["charge_kwh"], False),
        ("电量类", "储能放电量 (kWh)", sm["discharge_kwh"], rm["discharge_kwh"], False),
        ("收益类", "光伏收益 (元)", sm["pv_profit"], rm["pv_profit"], False),
        ("收益类", "储能收益 (元)", sm["storage_profit"], rm["storage_profit"], False),
        ("收益类", "弃光机会收益 (元)", 0.0, 0.0, False),
        ("收益类", "总收益 (元)", sm["total_profit"], rm["total_profit"], False),
        ("效率类", "自发自用率 (%)", sm["self_rate"], rm["self_kwh"] / rm["gen_kwh"] * 100, True),
        ("效率类", "储能利用率 (%)", sm["util_rate"], rm["discharge_kwh"] / rm["charge_kwh"] * 100, True),
        ("效率类", "日均充放次数 (次/日)", cyc_sim / len(dates), cyc_real / len(dates), False),
    ]
    for cat, name, s, r, pp in monthly:
        rel = dev(s, r)
        rel_lit = "null" if rel is None else ts(round(rel, 6))
        A(
            f'  {{ cat: {ts(cat)}, name: {ts(name)}, sim: {ts(s)}, real: {ts(r)}, '
            f'abs: {ts(s - r)}, rel: {rel_lit}, pp: {ts(pp)} }},'
        )
    A("];")
    A("")

    # 案例日
    A("// 案例日（典型日分析可切换）：储能收益差最大的 3 天 + 1 个反向日")
    A(f"export const CASE_DAY_DATES = {j(case_days)};")
    A("")
    A("/** 案例日对照（行序：光伏发电量 → … → 自发自用率 → 当日充放电加权电价；中途一行充放次数） */")
    A("export interface CaseDayRow { name: string; sim: number; real: number | null; diff: number | null }")
    A("export const CASE_DAY_ROWS: Record<string, CaseDayRow[]> = {")
    for date in case_days:
        s, r = sim_days.get(date), real_days.get(date)
        if not s or not r:
            raise SystemExit(f"案例日 {date} 在源数据中缺失")
        x = day_price.get(date, {"chg": 0.0, "cost": 0.0, "dis": 0.0, "inc": 0.0})
        cw = round(x["cost"] / x["chg"], 6) if x["chg"] else None
        dw = round(x["inc"] / x["dis"], 6) if x["dis"] else None
        rows = [
            ("光伏发电量 (kWh)", s["gen_kwh"], r["gen_kwh"]),
            ("上网电量 (kWh)", s["export_kwh"], r["export_kwh"]),
            ("自用电量 (kWh)", s["self_kwh"], r["self_kwh"]),
            ("储能充电量 (kWh)", s["charge_kwh"], r["charge_kwh"]),
            ("储能放电量 (kWh)", s["discharge_kwh"], r["discharge_kwh"]),
            ("充放次数 (次)", s["charge_kwh"] / CAP_KWH, r["charge_kwh"] / CAP_KWH),
            ("储能收益 (元)", s["storage_profit"], r["storage_profit"]),
            ("总收益 (元)", s["total_profit"], r["total_profit"]),
            ("自发自用率 (%)", s["self_rate"], r["self_kwh"] / r["gen_kwh"] * 100),
            # 实际运行报表未拆分充电成本与放电收益 → 实际侧无加权电价，置 null（视图显示「—」）
            ("充电加权电价 (元/kWh)", cw, None),
            ("放电加权电价 (元/kWh)", dw, None),
        ]
        A(f"  {ts(date)}: [")
        for name, sv, rv in rows:
            if rv is None or name.startswith("自发自用率"):
                d = None
            else:
                d = sv - rv
            A(f"    {{ name: {ts(name)}, sim: {ts(sv)}, real: {ts(rv)}, diff: {ts(d)} }},")
        A("  ],")
    A("};")
    A("")

    A("/** 案例日 15min 曲线：sim 为仿真结果原始序列，real 为按当日报表电量还原的实际运行序列 */")
    A("export interface CaseDayPoint { time: string; tier: string; sim: number; real: number; socSim: number; socReal: number }")
    A("export const CASE_DAY_CURVES: Record<string, CaseDayPoint[]> = {")
    for date in case_days:
        r = real_days[date]
        pts = merge_curve(
            sim_curve(records, date),
            real_curve(r["charge_kwh"], r["discharge_kwh"], chg_slots, dis_slots),
            tier_seq,
        )
        A(f"  {ts(date)}: [")
        for p in pts:
            A(
                f'    {{ time: {ts(p["time"])}, tier: {ts(p["tier"])}, sim: {ts(p["sim"])}, '
                f'real: {ts(p["real"])}, socSim: {ts(p["socSim"])}, socReal: {ts(p["socReal"])} }},'
            )
        A("  ],")
    A("};")
    A("")

    # 每日明细
    A("// 每日对比明细：31 天 × 8 组（仿真 / 实际运行 / 偏差%）+ 备注")
    A(f"export const DAILY_HEADERS = {j(DAILY_HEADERS)};")
    A(f"export const DAILY_UNITS = {j(DAILY_UNITS)};")
    A("export const DAILY_ROWS: (string | number | null)[][] = [")
    notes = {"2026-08-12": "案例日", "2026-08-27": "案例日", "2026-08-28": "案例日", "2026-08-17": "仿真低于真实"}
    for date in dates:
        s, r = sim_days[date], real_days[date]
        row = [date]
        for g, (sv, rv) in enumerate([
            (s["gen_kwh"], r["gen_kwh"]), (s["export_kwh"], r["export_kwh"]),
            (s["self_kwh"], r["self_kwh"]), (s["charge_kwh"], r["charge_kwh"]),
            (s["discharge_kwh"], r["discharge_kwh"]), (s["storage_profit"], r["storage_profit"]),
            (s["total_profit"], r["total_profit"]),
            (s["self_rate"], r["self_kwh"] / r["gen_kwh"] * 100),
        ]):
            # 率类指标（第 8 组）不逐日给偏差%（母版留空），只在合计行以百分点差呈现
            row += [sv, rv, None if g == 7 else dev(sv, rv)]
        row.append(notes.get(date, ""))
        A("  " + j(row, 2) + ",")
    A("];")
    total_row = ["月度合计 / 加权"]
    for g, (sv, rv) in enumerate([
        (sm["gen_kwh"], rm["gen_kwh"]), (sm["export_kwh"], rm["export_kwh"]),
        (sm["self_kwh"], rm["self_kwh"]), (sm["charge_kwh"], rm["charge_kwh"]),
        (sm["discharge_kwh"], rm["discharge_kwh"]), (sm["storage_profit"], rm["storage_profit"]),
        (sm["total_profit"], rm["total_profit"]),
        (sm["self_rate"], rm["self_kwh"] / rm["gen_kwh"] * 100),
    ]):
        total_row += [sv, rv, (sv - rv) if g == 7 else dev(sv, rv)]
    total_row.append("")
    A("export const DAILY_TOTAL: (string | number | null)[] = " + j(total_row, 2) + ";")
    A("")

    # 每日充放次数
    A("/** 每日充放次数（次/日）= 当日充电量 ÷ 储能容量；合计行 = 当月等效循环次数 */")
    A("export const CYCLE_ROWS: { date: string; sim: number; real: number; dev: number | null }[] = [")
    for date in dates:
        s, r = sim_days[date], real_days[date]
        sv, rv = s["charge_kwh"] / CAP_KWH, r["charge_kwh"] / CAP_KWH
        A(f'  {{ date: {ts(date)}, sim: {ts(sv)}, real: {ts(rv)}, dev: {ts(dev(sv, rv))} }},')
    A("];")
    A(
        f"export const CYCLE_TOTAL = {{ sim: {ts(cyc_sim)}, real: {ts(cyc_real)}, "
        f"dev: {ts(dev(cyc_sim, cyc_real))} }};"
    )
    A("")

    # 差异归因用数
    st_volume = (sm["discharge_kwh"] - rm["discharge_kwh"]) * unit_real
    st_time = (sm["storage_profit"] - rm["storage_profit"]) - st_volume
    pv_vol_exp = (sm["export_kwh"] - rm["export_kwh"]) * (rm["export_income"] / rm["export_kwh"])
    pv_vol_self = (sm["self_kwh"] - rm["self_kwh"]) * (rm["self_income"] / rm["self_kwh"])
    pv_volume = pv_vol_exp + pv_vol_self
    pv_price = (sm["pv_profit"] - rm["pv_profit"]) - pv_volume
    net = sm["total_profit"] - rm["total_profit"]
    A("// 差异归因数据：所有金额/电量均由源数据推导（口径见 operationSimCopy.ts 的 ATTRIB_ITEMS）")
    A(f"export const CAP_KWH = {ts(CAP_KWH)};")
    A("export const ATTRIB_DATA = {")
    A(f"  net: {ts(net)},")
    A("  storage: {")
    A(f"    diff: {ts(sm['storage_profit'] - rm['storage_profit'])}, rel: {ts(round(dev(sm['storage_profit'], rm['storage_profit']), 4))}, share: {ts(round((sm['storage_profit'] - rm['storage_profit']) / abs(net) * 100, 1))},")
    A(f"    timeEffect: {ts(round(st_time, 2))}, volumeEffect: {ts(round(st_volume, 2))},")
    A(f"    chargeDiff: {ts(sm['charge_kwh'] - rm['charge_kwh'])}, dischargeDiff: {ts(sm['discharge_kwh'] - rm['discharge_kwh'])},")
    A(f"    chargeSim: {ts(sm['charge_kwh'])}, chargeReal: {ts(rm['charge_kwh'])}, dischargeSim: {ts(sm['discharge_kwh'])}, dischargeReal: {ts(rm['discharge_kwh'])}, cycleSim: {ts(round(cyc_sim, 1))}, cycleReal: {ts(round(cyc_real, 1))},")
    A(f"    unitSim: {ts(round(unit_sim, 4))}, unitReal: {ts(round(unit_real, 4))},")
    A(f"    chargeCost: {ts(round(charge_cost, 2))}, dischargeIncome: {ts(round(discharge_income, 2))},")
    A("  },")
    A("  pv: {")
    A(f"    diff: {ts(sm['pv_profit'] - rm['pv_profit'])}, rel: {ts(round(dev(sm['pv_profit'], rm['pv_profit']), 4))}, share: {ts(round(abs(sm['pv_profit'] - rm['pv_profit']) / abs(net) * 100, 1))},")
    A(f"    volumeEffect: {ts(round(pv_volume, 2))}, priceEffect: {ts(round(pv_price, 2))},")
    A(f"    exportDiff: {ts(sm['export_kwh'] - rm['export_kwh'])}, selfDiff: {ts(sm['self_kwh'] - rm['self_kwh'])}, genDiff: {ts(sm['gen_kwh'] - rm['gen_kwh'])},")
    A(f"    exportPrice: {ts(round(rm['export_income'] / rm['export_kwh'], 4))}, selfPrice: {ts(round(rm['self_income'] / rm['self_kwh'], 4))},")
    A(f"    priceGap: {ts(round(rm['self_income'] / rm['self_kwh'] - rm['export_income'] / rm['export_kwh'], 4))},")
    A("  },")
    A(f"  cycle: {{ sim: {ts(round(cyc_sim, 1))}, real: {ts(round(cyc_real, 1))} }},")
    A("  reverseDays: [")
    for d in reverse_days:
        A("    " + j(d, 4) + ",")
    A("  ],")
    A("};")
    A("")

    # 站点参数里的两条电价行改为按推导结果回填，避免与分时档位脱节
    param_rows = []
    for row in PARAM_ROWS:
        if row["k"].startswith("购电价档位"):
            row = dict(row, v=" / ".join(f"{p:.4f}" for p in sorted(t["price"] for t in tou)))
        elif row["k"].startswith("上网电价"):
            row = dict(row, v=f"{sale_price:.4f}（余电上网）" if sale_price is not None else "否")
        param_rows.append(row)
    A("export const PARAM_ROWS = " + j(param_rows, 2) + ";")
    A("")
    A("export const SOURCE_ROWS = [")
    A(f'  {{ k: {ts("仿真结果")}, v: {ts(os.path.basename(json_path))} }},')
    A(f'  {{ k: {ts("真实运行总收益报表")}, v: {ts(os.path.basename(report_path))} }},')
    A(f'  {{ k: {ts("站点参数")}, v: {ts("售前临时测算0921.xlsx「汇总」页")} }},')
    A(f'  {{ k: {ts("本期报告")}, v: {ts("济南鼎润纸制品_2026年08月_仿真收益汇报母版.xlsx（" + version + "）")} }},')
    A("];")
    return "\n".join(L) + "\n", {
        "sm": sm, "rm": rm, "unit_sim": unit_sim, "unit_real": unit_real,
        "cyc_sim": cyc_sim, "cyc_real": cyc_real, "net": net,
        "st_time": st_time, "st_volume": st_volume,
        "pv_volume": pv_volume, "pv_price": pv_price,
        "tou": tou, "sale": sale_price, "cw": charge_weighted, "dw": discharge_weighted,
        "spread": spread, "charge_cost": charge_cost, "discharge_income": discharge_income,
    }


def main():
    station_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
        "~/Documents/微网/仿真数据对比/济南鼎润纸制品"
    )
    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            "src", "components", "operationSimData.ts")
    content, summary = build(station_dir)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    sm, rm = summary["sm"], summary["rm"]
    print(f"已写出 {out_path}")
    print("—— 口径校验 ——")
    print(f"总收益      仿真 {sm['total_profit']:.4f} / 实际 {rm['total_profit']:.4f}（报表总计 {rm['total_profit']:.4f}）")
    print(f"储能收益差  {sm['storage_profit'] - rm['storage_profit']:.4f}，其中时段效应 {summary['st_time']:.2f} / 电量效应 {summary['st_volume']:.2f}")
    print(f"光伏收益差  {sm['pv_profit'] - rm['pv_profit']:.4f}，其中量效应 {summary['pv_volume']:.2f} / 价效应 {summary['pv_price']:.2f}")
    print(f"净差额      {summary['net']:.4f}（两项相抵）")
    print(f"等效循环    仿真 {summary['cyc_sim']:.3f} / 实际 {summary['cyc_real']:.3f}")
    print("—— 分时档位（由记录 import_price 推导）——")
    for t in summary["tou"]:
        wins = "、".join(f"{a*15//60:02d}:{a*15%60:02d}–{b*15//60:02d}:{b*15%60:02d}" for a, b in t["ranges"])
        print(f"  {t['key']:9s} {t['price']:>7.4f} 元/kWh  {t['hours']:>4.1f} h/日  {wins}")
    print("—— 电价读数（仿真侧按逐 15min 电价加权）——")
    print(f"充电成本 {summary['charge_cost']:.4f} 元 → 加权电价 {summary['cw']:.6f} 元/kWh")
    print(f"放电收益 {summary['discharge_income']:.4f} 元 → 加权电价 {summary['dw']:.6f} 元/kWh")
    print(f"毛价差 {summary['spread']:.6f} 元/kWh；售电（余电上网）单价 {summary['sale']:.6f} 元/kWh")


if __name__ == "__main__":
    main()
