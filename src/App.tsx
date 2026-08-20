import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  Building2, MapPin, Server, BadgeDollarSign, ChevronLeft, Search, RotateCcw, Plus, User, Bell, Calendar, X, ChevronDown, RefreshCw,
  ChevronRight, Check, AlertTriangle, Info, Sliders, Database, Play, Pause, Trash2, ArrowLeft, ExternalLink, Lock, Unlock, Package, LogOut,
  Users, CheckSquare, Square, ShieldCheck, History, BookOpen, Sparkles, Send, Layout 
} from 'lucide-react';
import { GridWorkspaceContainer } from './components/GridWorkspace';
import { StationSetupWizard } from './components/StationSetupWizard';

// --- Types & Mock Data ---

export type Province = {
  id: string;
  name: string;
  level1Region: string;
  priceName: string;
  usageType1: string;
  usageType2: string;
  voltage: string;
  boundStationsCount: number;
  latestMonth: string;
  latestPredictedDate: string;
  latestActualDate: string;
};

export type SalesPrice = {
  id: string;
  level1Region: string;
  latestPredictedDate: string;
  latestSettlementDate: string;
  boundStationsCount: number;
};

type Station = {
  id: string;
  name: string;
  enterpriseName: string;
  emsSn: string;
  address: string;
  managerName: string;
  phone: string;
  status: 'normal' | 'fault' | 'offline';
  purchasePriceType: string;
  feedInPriceType: string;
  createdAt: string;
};

const STATIONS: Station[] = [
  { 
    id: 'CS1779066353', 
    name: '1#站', 
    enterpriseName: '湖北省黄冈市蕲春县向桥乡田铺储能项目', 
    emsSn: 'c8a14fa230eed878', 
    address: '湖北省黄冈市蕲春县向桥乡田铺', 
    managerName: '郑国胜', 
    phone: '13991159819', 
    status: 'normal', 
    purchasePriceType: '固定分时电价', 
    feedInPriceType: '固定价格',
    createdAt: '2026-05-18 09:07:50' 
  },
  { 
    id: 'CS1778824319', 
    name: '江苏镇江丹阳莱顿光学', 
    enterpriseName: '江苏镇江丹阳莱顿光学', 
    emsSn: 'TRINASTORAGE51', 
    address: '江苏省镇江市丹阳市中国石油朝阳加油站(东风村)', 
    managerName: '吕漫', 
    phone: '18896606961', 
    status: 'normal', 
    purchasePriceType: '固定分时电价', 
    feedInPriceType: '固定价格',
    createdAt: '2026-05-15 13:56:07' 
  },
  { 
    id: 'CS1778807721', 
    name: '1#站点', 
    enterpriseName: '安徽滁州城投大厦储能项目', 
    emsSn: '801159020a7e3857', 
    address: '安徽省滁州市南谯区碧桂园住所公馆', 
    managerName: '杨经理', 
    phone: '18005600445', 
    status: 'normal', 
    purchasePriceType: '固定分时电价', 
    feedInPriceType: '市场化价格',
    createdAt: '2026-05-15 09:16:14' 
  },
  { 
    id: 'CS1778482663', 
    name: '常州裕洋不锈钢储能国能日新验证', 
    enterpriseName: '微网验证企业', 
    emsSn: 'TRINASTORAGE75', 
    address: '江苏省常州市新北区常州裕洋不锈钢制品有限公司', 
    managerName: '薛易立', 
    phone: '15006118608', 
    status: 'normal', 
    purchasePriceType: '固定分时电价', 
    feedInPriceType: '固定价格',
    createdAt: '2026-05-11 15:00:07' 
  },
  { 
    id: 'CS1778305427', 
    name: '1#站点', 
    enterpriseName: '山东省青岛厂能橡胶制造有限公司光储项目', 
    emsSn: '9b8baecc4342a40f', 
    address: '山东省青岛市黄岛区青岛广能橡胶制造有限公司', 
    managerName: '高峰', 
    phone: '15244266163', 
    status: 'fault', 
    purchasePriceType: '固定分时电价', 
    feedInPriceType: '市场化价格',
    createdAt: '2026-05-09 13:45:42' 
  }
];

export const SALES_PRICES: SalesPrice[] = [
  { id: '1', level1Region: '湖北省', latestPredictedDate: '2026-05-21', latestSettlementDate: '2026-05-15', boundStationsCount: 3 },
  { id: '2', level1Region: '河南省', latestPredictedDate: '2026-05-24', latestSettlementDate: '2026-05-18', boundStationsCount: 0 },
  { id: '3', level1Region: '湖南省', latestPredictedDate: '2026-05-24', latestSettlementDate: '2026-05-18', boundStationsCount: 1 },
];

export const PROVINCES: Province[] = [
  { id: '1', level1Region: '江苏省', name: '江苏省', priceName: '江苏省固定分时', usageType1: '单一制(100千伏安及以上)', usageType2: '工商业', voltage: '1~10（20）千伏', boundStationsCount: 1, latestMonth: '2026-05', latestPredictedDate: '2026-05-21', latestActualDate: '2026-05-18' },
  { id: '2', level1Region: '山东省', name: '山东省', priceName: '山东电价07', usageType1: '单一制', usageType2: '工商业', voltage: '1~10千伏', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24', latestActualDate: '2026-05-19' },
  { id: '3', level1Region: '山东省', name: '山东省', priceName: '山东电价06', usageType1: '单一制', usageType2: '工商业', voltage: '不满1千伏', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24', latestActualDate: '2026-05-19' },
  { id: '4', level1Region: '山东省', name: '山东省', priceName: '山东电价05', usageType1: '两部制', usageType2: '工商业', voltage: '220千伏及以上', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24', latestActualDate: '2026-05-19' },
  { id: '5', level1Region: '山东省', name: '山东省', priceName: '山东电价04', usageType1: '两部制', usageType2: '工商业', voltage: '110~220千伏以下', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24', latestActualDate: '2026-05-19' },
  { id: '6', level1Region: '山东省', name: '山东省', priceName: '山东电价03', usageType1: '两部制', usageType2: '工商业', voltage: '1~10千伏', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24', latestActualDate: '2026-05-19' },
  { id: '7', level1Region: '山东省', name: '山东省', priceName: '山东电价02', usageType1: '两部制', usageType2: '工商业', voltage: '35~110千伏以下', boundStationsCount: 1, latestMonth: '2026-05', latestPredictedDate: '2026-05-24', latestActualDate: '2026-05-19' },
  { id: '8', level1Region: '山东省', name: '山东省', priceName: '山东电价01', usageType1: '单一制', usageType2: '工商业', voltage: '35千伏及以上', boundStationsCount: 1, latestMonth: '2026-05', latestPredictedDate: '2026-05-24', latestActualDate: '2026-05-19' },
];

const PARAM_LABELS: Record<string, string> = {
  p2: '当月平均购电价格',
  p3: '容量补偿电价',
  p4: '历史偏差电费折算',
  p5: '代理工商业上网环节线损费用折价',
  p6: '抽水蓄能容量电费折合度电水平',
  p7: '煤电容量折合度电水平',
  p8: '新能源可持续发展差价结算折合度电水平',
  p9: '各类分摊损益折合度电水平',
  p10: '政府性基金及附加',
  p11: '输配电价',
};

const DEFAULT_PARAMS: Record<string, number> = {
  p2: 0.4200, p3: 0.0500, p4: 0.0100, p5: 0.0200,
  p6: 0.0150, p7: 0.0250, p8: 0.0100, p9: 0.0050, p10: 0.0300, p11: 0.1500,
};

const getMockParams = (month: string, elecType: string, voltage: string) => {
  const base = { ...DEFAULT_PARAMS };
  
  // 模拟不同月份的基础购电价格
  if (month === '2026-02') {
    base.p2 = 0.4500;
  } else {
    base.p2 = 0.4200;
  }

  // 模拟不同用电类别的容量补偿等参数
  if (elecType === 'single') {
    base.p3 = 0.0500;
    base.p5 = 0.0200;
  } else {
    base.p3 = 0.0350; // 两部制通常容量补偿不同
    base.p5 = 0.0150;
  }

  // 模拟不同电压等级的输配电价 (电压越高，输配电价通常越低)
  if (voltage === '不满1千伏') {
    base.p11 = 0.2200;
  } else if (voltage === '1-10千伏') {
    base.p11 = elecType === 'single' ? 0.2000 : 0.1850;
  } else if (voltage === '35千伏') {
    base.p11 = elecType === 'single' ? 0.1800 : 0.1650;
  } else if (voltage === '110千伏') {
    base.p11 = 0.1450;
  } else if (voltage === '220千伏及以上') {
    base.p11 = 0.1250;
  }

  // 增加一些微小的随机性差异（基于字符串长度等确定性因素，保证每次渲染一致）
  const voltageHash = voltage.length;
  base.p4 = Number((0.0100 + (voltageHash * 0.001)).toFixed(4));
  base.p7 = Number((0.0250 - (elecType === 'two-part' ? 0.002 : 0)).toFixed(4));

  return base;
};

const PERIODS = [
  { id: 'jianfeng', name: '尖峰', color: '#ef4444' },
  { id: 'gaofeng', name: '高峰', color: '#f97316' },
  { id: 'pingduan', name: '平段', color: '#10b981' },
  { id: 'digu', name: '低谷', color: '#3b82f6' },
  { id: 'shengu', name: '深谷', color: '#8b5cf6' },
];

const DEFAULT_FORMULAS: Record<string, string> = {
  jianfeng: 'p2 * 1.8 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
  gaofeng: 'p2 * 1.5 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
  pingduan: 'p2 * 1.0 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
  digu: 'p2 * 0.5 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
  shengu: 'p2 * 0.2 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
};

const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#6366f1', '#84cc16', '#06b6d4', '#d946ef', '#f43f5e', '#0ea5e9', '#10b981', '#eab308'
];

const ELECTRICITY_TYPES = [
  {
    id: 'single',
    name: '单一制',
    voltages: ['不满1千伏', '1-10千伏', '35千伏']
  },
  {
    id: 'two-part',
    name: '两部制',
    voltages: ['1-10千伏', '35千伏', '110千伏', '220千伏及以上']
  }
];

// Mock TOU Schedule
const getPeriodForHour = (hour: number) => {
  if (hour >= 19 && hour < 21) return 'jianfeng';
  if ((hour >= 8 && hour < 11) || (hour >= 15 && hour < 19)) return 'gaofeng';
  if ((hour >= 7 && hour < 8) || (hour >= 11 && hour < 15) || (hour >= 21 && hour < 23)) return 'pingduan';
  if (hour >= 2 && hour < 4) return 'shengu';
  return 'digu';
};

// --- Utils ---
const evaluateFormula = (formula: string, params: Record<string, number>, overrideParams?: Record<string, number>) => {
  if (!formula) return 0;
  try {
    const evalParams = { ...params, ...overrideParams };
    const keys = Object.keys(evalParams);
    const values = Object.values(evalParams);
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `return ${formula}`);
    const result = fn(...values);
    return isNaN(result) ? 0 : Number(result.toFixed(4));
  } catch (e) {
    return 0;
  }
};

// --- Version & Feature Types ---
export type Version = {
  id: string;
  name: string;
  code: string;
  order: number;
  description: string;
  permissions: string[];
  createdAt: string;
};

export type FeaturePack = {
  id: string;
  name: string;
  code: string;
  category: 'architecture' | 'strategy' | 'basic';
  description: string;
  order: number;
  permissions: string[];
  createdAt: string;
};

export type EnterpriseFeature = {
  featureId: string; // references FeaturePack.code
  startDate: string;
  endDate: string;
  status: 'active' | 'warning' | 'expired';
};

export type EnterpriseAssign = {
  id: string;
  name: string;
  baseVersionId: string; // references Version.code
  validityStart: string;
  validityEnd: string;
  features: EnterpriseFeature[];
};

export type PermissionItem = {
  code: string;
  name: string;
};

export type PermissionCategory = {
  category: string;
  items: PermissionItem[];
};

export type PushRecord = {
  id: string;
  time: string;
  content: string;
  target: string;
  status: 'success' | 'fail';
  payload: string; // stringified JSON
};

// --- Version & Feature Mock Data ---
export const ALL_PERMISSIONS: PermissionCategory[] = [
  {
    category: '仪表盘',
    items: [
      { code: 'dash:overview', name: '微网总览' },
      { code: 'dash:multi', name: '多站总览' },
      { code: 'dash:single', name: '单站总览' },
      { code: 'dash:screen', name: '监控大屏' },
      { code: 'dash:trina_screen', name: '天合储能监控大屏' }
    ]
  },
  {
    category: '盈利方 AI',
    items: [
      { code: 'profit:cube', name: '天合盈立方' },
      { code: 'profit:overview', name: '运行概览' },
      { code: 'profit:algo', name: '算法监控' },
      { code: 'profit:algo_strategy_tab', name: '算法监控-策略监控Tab (按钮574)' }
    ]
  },
  {
    category: '监控中心',
    items: [
      { code: 'monitor:overview', name: '监控概览' },
      { code: 'monitor:wiring', name: '主接线图' },
      { code: 'monitor:predict', name: '算法预测监控' },
      { code: 'monitor:run_overview', name: '运行概览' },
      { code: 'monitor:strategy', name: '策略监控' },
      { code: 'monitor:global_tab', name: '全局视角标签页 (按钮390)' },
      { code: 'monitor:single_strategy_tab', name: '单策略视角标签页 (按钮391)' },
      { code: 'monitor:algo_monitor', name: '算法监控' },
      { code: 'monitor:device', name: '设备监控' },
      { code: 'monitor:dev_edit', name: '前往编辑 (按钮226)' },
      { code: 'monitor:dev_view', name: '查看 (按钮227)' },
      { code: 'monitor:ctrl_pv', name: '远程控制-光伏 (按钮273)' },
      { code: 'monitor:ctrl_storage', name: '远程控制-储能 (按钮519)' },
      { code: 'monitor:ctrl_v2g', name: '远程控制-V2G充电枪 (按钮520)' },
      { code: 'monitor:dev_data', name: '设备监控-设备数据 (按钮525)' },
      { code: 'monitor:dev_compare', name: '设备监控-对比分析 (按钮526)' },
      { code: 'monitor:sys', name: '系统监控' },
      { code: 'monitor:pv_sys', name: '光伏监控' },
      { code: 'monitor:pv_tab_dev', name: '设备tab页 (按钮344)' },
      { code: 'monitor:pv_tab_power', name: '功率tab页 (按钮345)' },
      { code: 'monitor:pv_tab_eff', name: '能效tab页 (按钮346)' },
      { code: 'monitor:pv_tab_disp', name: '离散率tab页 (按钮347)' },
      { code: 'monitor:storage_sys', name: '储能监控' },
      { code: 'monitor:storage_eff', name: '充放效率分析 (按钮501)' },
      { code: 'monitor:storage_voltage', name: '电压即时监控 (按钮502)' },
      { code: 'monitor:storage_temp', name: '温度即时监控 (按钮503)' },
      { code: 'monitor:storage_cell_v', name: '电芯电压分析 (按钮504)' },
      { code: 'monitor:storage_cell_temp', name: '电芯温差统计 (按钮505)' },
      { code: 'monitor:storage_topo', name: '储能拓扑监控 (按钮522)' },
      { code: 'monitor:ev_sys', name: '充电桩监控' }
    ]
  },
  {
    category: '报警管理',
    items: [
      { code: 'alarm:fault', name: '故障报警' },
      { code: 'alarm:dev', name: '设备报警 (按钮523)' },
      { code: 'alarm:event', name: '事件报警 (按钮524)' }
    ]
  },
  {
    category: '统计报表',
    items: [
      { code: 'report:elec', name: '电量报表' },
      { code: 'report:elec_gen', name: '生成报表 (按钮247)' },
      { code: 'report:revenue', name: '收益报表' },
      { code: 'report:rev_total', name: '总收益报表 (按钮298)' },
      { code: 'report:rev_total_export', name: '总收益报表-导出 (按钮299)' },
      { code: 'report:rev_pv', name: '光伏收益报表 (按钮300)' },
      { code: 'report:rev_pv_export', name: '光伏收益报表-导出 (按钮301)' },
      { code: 'report:rev_storage', name: '储能收益 (按钮302)' },
      { code: 'report:rev_storage_export', name: '储能收益报表-导出 (按钮303)' },
      { code: 'report:rev_ev', name: '充电收益报表 (按钮304)' },
      { code: 'report:rev_ev_export', name: '充电收益报表-导出 (按钮305)' }
    ]
  },
  {
    category: '智能报告',
    items: [
      { code: 'smart:strategy_run', name: '策略运行报告' },
      { code: 'smart:ai_light', name: 'AI轻智能分析报告' },
      { code: 'smart:biz_analysis', name: '经营分析报告' },
      { code: 'smart:biz_export', name: '经营分析报告-导出 (按钮350)' },
      { code: 'smart:dev_diag', name: '设备诊断报告' },
      { code: 'smart:dev_diag_export', name: '设备诊断报告-导出 (按钮296)' },
      { code: 'smart:ai_dispatch', name: 'AI调度策略报告' },
      { code: 'smart:ai_dispatch_export', name: 'AI调度策略报告-导出 (按钮489)' }
    ]
  },
  {
    category: '策略管理',
    items: [
      { code: 'strategy:config', name: '策略配置' },
      { code: 'strategy:tab_common', name: '公共配置tab (按钮249)' },
      { code: 'strategy:edit_common', name: '公共配置-编辑 (按钮250)' },
      { code: 'strategy:tab_arbitrage', name: '峰谷套利tab (按钮251)' },
      { code: 'strategy:tab_dynamic', name: '动态增容tab (按钮256)' },
      { code: 'strategy:tab_transformer', name: '台区配储tab (按钮258)' },
      { code: 'strategy:edit_transformer', name: '台区配储-编辑 (按钮259)' },
      { code: 'strategy:tab_demand', name: '需量控制tab (按钮337)' },
      { code: 'strategy:tab_self', name: '自发自用tab (按钮343)' },
      { code: 'strategy:surplus_grid', name: '余电上网策略 (按钮493)' },
      { code: 'strategy:reverse_flow_param', name: '公共配置可逆流参数 (按钮518)' },
      { code: 'strategy:ai_param', name: 'AI相关参数标签页 (按钮969)' },
      { code: 'strategy:demand_mode', name: '需量更新模式切换 (按钮968)' },
      { code: 'strategy:run', name: '策略运行' },
      { code: 'strategy:combo_del', name: '策略组合-删除 (按钮330)' },
      { code: 'strategy:combo_edit', name: '策略组合-编辑 (按钮331)' },
      { code: 'strategy:combo_add', name: '策略组合-新增 (按钮332)' },
      { code: 'strategy:batch_apply', name: '策略排期-批量应用 (按钮334)' },
      { code: 'strategy:tab_combo', name: '策略组合标签页 (按钮335)' },
      { code: 'strategy:tab_schedule', name: '策略排期标签页 (按钮336)' },
      { code: 'strategy:capacity_reserve', name: '预留容量 (按钮462)' },
      { code: 'strategy:period_add', name: '时段新增策略 (按钮463)' },
      { code: 'strategy:custom_strategy', name: '策略排期-自定义策略 (按钮464)' },
      { code: 'strategy:ai_dispatch', name: '策略排期-AI调度 (按钮491)' },
      { code: 'strategy:light_strategy', name: '策略排期-轻智能 (按钮492)' },
      { code: 'strategy:ai_switch', name: 'AI排程开关 (按钮970)' },
      { code: 'strategy:light_smart', name: '轻智能' },
      { code: 'strategy:light_edit', name: '轻智能-编辑 (按钮486)' },
      { code: 'strategy:light_switch', name: 'AI轻智能-开关 (按钮565)' }
    ]
  },
  {
    category: '微网管理',
    items: [
      { code: 'grid:site', name: '站点管理' },
      { code: 'grid:site_view', name: '站点查看 (按钮239)' },
      { code: 'grid:site_del', name: '站点删除 (按钮240)' },
      { code: 'grid:site_edit', name: '站点编辑 (按钮241)' },
      { code: 'grid:site_add', name: '站点新增 (按钮242)' },
      { code: 'grid:device', name: '设备管理' },
      { code: 'grid:device_view', name: '设备查看 (按钮235)' },
      { code: 'grid:device_del', name: '设备删除 (按钮236)' },
      { code: 'grid:device_edit', name: '设备编辑 (按钮237)' },
      { code: 'grid:device_add', name: '设备新增 (按钮238)' },
      { code: 'grid:transformer_sub_add', name: '二级变压器-新增 (按钮521)' },
      { code: 'grid:topo', name: '拓扑管理' },
      { code: 'grid:topo_view', name: '拓扑查看 (按钮232)' },
      { code: 'grid:topo_apply', name: '拓扑下发 (按钮233)' },
      { code: 'grid:topo_edit', name: '拓扑编辑 (按钮234)' },
      { code: 'grid:price', name: '电价配置' },
      { code: 'grid:buy_view', name: '购电电价-查看 (按钮228)' },
      { code: 'grid:buy_del', name: '购电电价-删除 (按钮229)' },
      { code: 'grid:buy_edit', name: '购电电价-编辑 (按钮230)' },
      { code: 'grid:buy_add', name: '购电电价-新增 (按钮231)' },
      { code: 'grid:buy_tab', name: '购电电价标签页 (按钮306)' },
      { code: 'grid:sell_tab', name: '售电电价标签页 (按钮307)' },
      { code: 'grid:sell_edit', name: '售电电价-编辑 (按钮308)' },
      { code: 'grid:ev_sell_tab', name: '充电站售电标签页 (按钮435)' },
      { code: 'grid:ev_sell_add', name: '充电站售电电价-新增 (按钮436)' },
      { code: 'grid:ev_sell_edit', name: '充电站售电电价-编辑 (按钮437)' },
      { code: 'grid:ev_sell_del', name: '充电站售电电价-删除 (按钮438)' },
      { code: 'grid:metrics', name: '指标配置' },
      { code: 'grid:metrics_pv', name: '光伏指标编辑 (按钮271)' },
      { code: 'grid:metrics_storage', name: '储能指标编辑 (按钮272)' },
      { code: 'grid:demand_response', name: '需求响应' },
      { code: 'grid:demand_add', name: '需求响应-新增 (按钮432)' },
      { code: 'grid:demand_edit', name: '需求响应-编辑 (按钮433)' },
      { code: 'grid:demand_del', name: '需求响应-删除 (按钮434)' },
      { code: 'grid:schedule_mgt', name: '排班管理' },
      { code: 'grid:schedule_add', name: '排班管理-新增 (按钮468)' },
      { code: 'grid:schedule_edit', name: '排班管理-编辑 (按钮469)' },
      { code: 'grid:schedule_del', name: '排班管理-删除 (按钮470)' }
    ]
  },
  {
    category: '系统日志',
    items: [
      { code: 'log:operation', name: '操作日志' },
      { code: 'log:exception', name: '系统日志-异常数据处理日志' }
    ]
  }
];

export const INITIAL_VERSIONS: Version[] = [
  {
    id: 'V1',
    name: '基础版',
    code: 'basic',
    order: 1,
    description: '基础可用版，提供电量/收益报表、基础监控及核心控制策略。',
    permissions: [
      'dash:overview', 'dash:multi', 'dash:single',
      'monitor:run_overview', 'monitor:strategy', 'monitor:global_tab', 'monitor:single_strategy_tab',
      'monitor:device', 'monitor:dev_view', 'monitor:dev_edit', 'monitor:ctrl_pv', 'monitor:ctrl_storage',
      'alarm:fault',
      'report:elec', 'report:elec_gen', 'report:revenue', 'report:rev_total', 'report:rev_total_export', 'report:rev_pv', 'report:rev_pv_export', 'report:rev_storage', 'report:rev_storage_export', 'report:rev_ev', 'report:rev_ev_export',
      'strategy:config', 'strategy:tab_common', 'strategy:edit_common', 'strategy:tab_arbitrage', 'strategy:tab_dynamic', 'strategy:tab_transformer', 'strategy:edit_transformer', 'strategy:tab_demand', 'strategy:tab_self',
      'strategy:run', 'strategy:combo_del', 'strategy:combo_edit', 'strategy:combo_add', 'strategy:batch_apply', 'strategy:tab_combo', 'strategy:tab_schedule', 'strategy:capacity_reserve', 'strategy:period_add', 'strategy:custom_strategy',
      'grid:site', 'grid:site_view', 'grid:site_del', 'grid:site_edit', 'grid:site_add',
      'grid:device', 'grid:device_view', 'grid:device_del', 'grid:device_edit', 'grid:device_add',
      'grid:topo', 'grid:topo_view', 'grid:topo_apply', 'grid:topo_edit',
      'grid:price', 'grid:buy_view', 'grid:buy_del', 'grid:buy_edit', 'grid:buy_add', 'grid:buy_tab', 'grid:sell_tab', 'grid:sell_edit'
    ],
    createdAt: '2026-06-10 14:30'
  },
  {
    id: 'V2',
    name: '标准版',
    code: 'standard',
    order: 2,
    description: '主流全套监控与高级控制版本，包含监控大屏、系统监控、AI相关策略以及异常日志。',
    permissions: [
      'dash:overview', 'dash:multi', 'dash:single', 'dash:screen',
      'monitor:overview', 'monitor:strategy', 'monitor:global_tab', 'monitor:single_strategy_tab', 'monitor:algo_monitor',
      'monitor:device', 'monitor:dev_view', 'monitor:dev_edit', 'monitor:ctrl_pv', 'monitor:ctrl_storage', 'monitor:dev_data', 'monitor:dev_compare',
      'monitor:sys', 'monitor:pv_sys', 'monitor:pv_tab_dev', 'monitor:pv_tab_power', 'monitor:pv_tab_eff', 'monitor:pv_tab_disp', 'monitor:storage_sys', 'monitor:storage_eff', 'monitor:storage_voltage', 'monitor:storage_temp', 'monitor:storage_cell_v', 'monitor:storage_cell_temp', 'monitor:storage_topo', 'monitor:ev_sys',
      'alarm:fault', 'alarm:dev', 'alarm:event',
      'report:elec', 'report:elec_gen', 'report:revenue', 'report:rev_total', 'report:rev_total_export', 'report:rev_pv', 'report:rev_pv_export', 'report:rev_storage', 'report:rev_storage_export', 'report:rev_ev', 'report:rev_ev_export',
      'smart:ai_dispatch',
      'strategy:config', 'strategy:tab_common', 'strategy:edit_common', 'strategy:tab_arbitrage', 'strategy:tab_dynamic', 'strategy:tab_demand', 'strategy:tab_self', 'strategy:surplus_grid', 'strategy:reverse_flow_param', 'strategy:ai_param',
      'strategy:run', 'strategy:combo_del', 'strategy:combo_edit', 'strategy:combo_add', 'strategy:batch_apply', 'strategy:tab_combo', 'strategy:tab_schedule', 'strategy:capacity_reserve', 'strategy:period_add', 'strategy:custom_strategy', 'strategy:ai_dispatch', 'strategy:light_strategy', 'strategy:ai_switch',
      'strategy:light_smart', 'strategy:light_edit', 'strategy:light_switch',
      'grid:site', 'grid:site_view', 'grid:site_del', 'grid:site_edit', 'grid:site_add',
      'grid:device', 'grid:device_view', 'grid:device_del', 'grid:device_edit', 'grid:device_add', 'grid:transformer_sub_add',
      'grid:topo', 'grid:topo_view', 'grid:topo_apply', 'grid:topo_edit',
      'grid:price', 'grid:buy_view', 'grid:buy_del', 'grid:buy_edit', 'grid:buy_add', 'grid:buy_tab', 'grid:sell_tab', 'grid:sell_edit', 'grid:ev_sell_tab', 'grid:ev_sell_add', 'grid:ev_sell_edit', 'grid:ev_sell_del',
      'grid:metrics', 'grid:metrics_pv', 'grid:metrics_storage', 'grid:schedule_mgt', 'grid:schedule_add', 'grid:schedule_edit', 'grid:schedule_del',
      'log:operation', 'log:exception'
    ],
    createdAt: '2026-06-15 10:20'
  },
  {
    id: 'V3',
    name: '高级版',
    code: 'advanced',
    order: 3,
    description: '尊享全功能版，支持深度智能经营分析、设备诊断、需求响应及高权限精细指标。',
    permissions: [
      'dash:overview', 'dash:multi', 'dash:single', 'dash:screen',
      'monitor:run_overview', 'monitor:strategy', 'monitor:global_tab', 'monitor:single_strategy_tab',
      'monitor:device', 'monitor:dev_view', 'monitor:dev_edit', 'monitor:ctrl_pv', 'monitor:ctrl_storage',
      'monitor:sys', 'monitor:pv_sys', 'monitor:pv_tab_dev', 'monitor:pv_tab_power', 'monitor:pv_tab_eff', 'monitor:pv_tab_disp',
      'alarm:fault',
      'report:elec', 'report:elec_gen', 'report:revenue', 'report:rev_total', 'report:rev_total_export', 'report:rev_pv', 'report:rev_pv_export', 'report:rev_storage', 'report:rev_storage_export', 'report:rev_ev', 'report:rev_ev_export',
      'smart:biz_analysis', 'smart:biz_export', 'smart:dev_diag', 'smart:dev_diag_export',
      'strategy:config', 'strategy:tab_common', 'strategy:edit_common', 'strategy:tab_arbitrage', 'strategy:tab_dynamic', 'strategy:tab_demand', 'strategy:tab_self',
      'strategy:run', 'strategy:combo_del', 'strategy:combo_edit', 'strategy:combo_add', 'strategy:batch_apply', 'strategy:tab_combo', 'strategy:tab_schedule', 'strategy:capacity_reserve', 'strategy:period_add', 'strategy:custom_strategy',
      'grid:site', 'grid:site_view', 'grid:site_del', 'grid:site_edit', 'grid:site_add',
      'grid:device', 'grid:device_view', 'grid:device_del', 'grid:device_edit', 'grid:device_add',
      'grid:topo', 'grid:topo_view', 'grid:topo_apply', 'grid:topo_edit',
      'grid:price', 'grid:buy_view', 'grid:buy_del', 'grid:buy_edit', 'grid:buy_add', 'grid:buy_tab', 'grid:sell_tab', 'grid:sell_edit', 'grid:ev_sell_tab', 'grid:ev_sell_add', 'grid:ev_sell_edit', 'grid:ev_sell_del',
      'grid:metrics', 'grid:metrics_pv', 'grid:metrics_storage',
      'grid:demand_response', 'grid:demand_add', 'grid:demand_edit', 'grid:demand_del',
      'log:operation'
    ],
    createdAt: '2026-06-25 09:15'
  },
  {
    id: 'V4',
    name: '天合新场景BU版',
    code: 'trina-bu',
    order: 4,
    description: '新场景业务专用版本，深度集成盈立方AI智能预测与轻调度。',
    permissions: [
      'dash:overview', 'dash:single',
      'profit:cube', 'profit:overview', 'profit:algo', 'profit:algo_strategy_tab',
      'monitor:run_overview', 'monitor:strategy', 'monitor:dev_data', 'monitor:dev_compare',
      'monitor:sys', 'monitor:storage_sys', 'monitor:storage_eff', 'monitor:storage_voltage', 'monitor:storage_temp', 'monitor:storage_cell_v', 'monitor:storage_cell_temp', 'monitor:storage_topo',
      'smart:ai_dispatch',
      'strategy:demand_mode'
    ],
    createdAt: '2026-07-01 11:30'
  },
  {
    id: 'V5',
    name: '天合储能版',
    code: 'trina-storage',
    order: 5,
    description: '储能定制版，带有定制的储能大屏、全套拓扑与核心指标管理。',
    permissions: [
      'dash:overview', 'dash:single', 'dash:trina_screen',
      'monitor:run_overview', 'monitor:strategy', 'monitor:dev_data', 'monitor:dev_compare',
      'monitor:sys', 'monitor:pv_sys', 'monitor:storage_sys', 'monitor:storage_eff', 'monitor:storage_voltage', 'monitor:storage_temp', 'monitor:storage_cell_v', 'monitor:storage_cell_temp', 'monitor:storage_topo',
      'alarm:fault', 'alarm:dev', 'alarm:event',
      'report:elec', 'report:revenue',
      'strategy:run', 'strategy:capacity_reserve', 'strategy:period_add',
      'grid:site', 'grid:device', 'grid:topo', 'grid:price', 'grid:metrics_storage'
    ],
    createdAt: '2026-07-02 14:00'
  },
  {
    id: 'V6',
    name: '天合储能扩展版',
    code: 'trina-storage-ext',
    order: 6,
    description: '储能深度扩展版，融合了售电配置、二级多变压器支持以及全部调控策略。',
    permissions: [
      'dash:overview', 'dash:single', 'dash:screen', 'dash:trina_screen',
      'monitor:overview',
      'monitor:sys', 'monitor:pv_sys', 'monitor:storage_sys',
      'alarm:fault', 'alarm:dev', 'alarm:event',
      'report:elec', 'report:revenue',
      'strategy:config', 'strategy:tab_common', 'strategy:edit_common', 'strategy:tab_arbitrage', 'strategy:tab_dynamic', 'strategy:tab_demand', 'strategy:tab_self', 'strategy:surplus_grid',
      'grid:site', 'grid:device', 'grid:transformer_sub_add', 'grid:topo', 'grid:sell_tab', 'grid:metrics_storage',
      'log:operation'
    ],
    createdAt: '2026-07-05 09:00'
  },
  {
    id: 'V7',
    name: '盈利方版本',
    code: 'profit-owner',
    order: 7,
    description: '盈利方轻量定制版，拥有简洁的核心看板与基础配置。',
    permissions: [
      'dash:overview', 'dash:single',
      'monitor:run_overview', 'monitor:strategy', 'monitor:device'
    ],
    createdAt: '2026-07-08 15:30'
  },
  {
    id: 'V8',
    name: '测试用版本',
    code: 'test-version',
    order: 8,
    description: '演示与验证全功能测试版。',
    permissions: [
      'dash:overview', 'dash:multi', 'dash:single', 'dash:screen', 'dash:trina_screen',
      'profit:cube', 'profit:overview', 'profit:algo', 'profit:algo_strategy_tab',
      'monitor:overview', 'monitor:run_overview', 'monitor:strategy', 'monitor:global_tab', 'monitor:single_strategy_tab', 'monitor:algo_monitor', 'monitor:device', 'monitor:dev_view', 'monitor:dev_edit', 'monitor:ctrl_pv', 'monitor:ctrl_storage', 'monitor:dev_data', 'monitor:dev_compare',
      'monitor:sys', 'monitor:pv_sys', 'monitor:pv_tab_dev', 'monitor:pv_tab_power', 'monitor:pv_tab_eff', 'monitor:pv_tab_disp', 'monitor:storage_sys', 'monitor:storage_eff', 'monitor:storage_voltage', 'monitor:storage_temp', 'monitor:storage_cell_v', 'monitor:storage_cell_temp', 'monitor:storage_topo', 'monitor:ev_sys',
      'alarm:fault', 'alarm:dev', 'alarm:event',
      'report:elec', 'report:elec_gen', 'report:revenue', 'report:rev_total', 'report:rev_total_export', 'report:rev_pv', 'report:rev_pv_export', 'report:rev_storage', 'report:rev_storage_export', 'report:rev_ev', 'report:rev_ev_export',
      'smart:strategy_run', 'smart:ai_light', 'smart:biz_analysis', 'smart:biz_export', 'smart:dev_diag', 'smart:dev_diag_export', 'smart:ai_dispatch', 'smart:ai_dispatch_export',
      'strategy:config', 'strategy:tab_common', 'strategy:edit_common', 'strategy:tab_arbitrage', 'strategy:tab_dynamic', 'strategy:tab_transformer', 'strategy:edit_transformer', 'strategy:tab_demand', 'strategy:tab_self', 'strategy:surplus_grid', 'strategy:reverse_flow_param', 'strategy:ai_param', 'strategy:demand_mode',
      'strategy:run', 'strategy:combo_del', 'strategy:combo_edit', 'strategy:combo_add', 'strategy:batch_apply', 'strategy:tab_combo', 'strategy:tab_schedule', 'strategy:capacity_reserve', 'strategy:period_add', 'strategy:custom_strategy', 'strategy:ai_dispatch', 'strategy:light_strategy', 'strategy:ai_switch',
      'strategy:light_smart', 'strategy:light_edit', 'strategy:light_switch',
      'grid:site', 'grid:site_view', 'grid:site_del', 'grid:site_edit', 'grid:site_add',
      'grid:device', 'grid:device_view', 'grid:device_del', 'grid:device_edit', 'grid:device_add', 'grid:transformer_sub_add',
      'grid:topo', 'grid:topo_view', 'grid:topo_apply', 'grid:topo_edit',
      'grid:price', 'grid:buy_view', 'grid:buy_del', 'grid:buy_edit', 'grid:buy_add', 'grid:buy_tab', 'grid:sell_tab', 'grid:sell_edit', 'grid:ev_sell_tab', 'grid:ev_sell_add', 'grid:ev_sell_edit', 'grid:ev_sell_del',
      'grid:metrics', 'grid:metrics_pv', 'grid:metrics_storage',
      'grid:demand_response', 'grid:demand_add', 'grid:demand_edit', 'grid:demand_del',
      'grid:schedule_mgt', 'grid:schedule_add', 'grid:schedule_edit', 'grid:schedule_del',
      'log:operation', 'log:exception'
    ],
    createdAt: '2026-07-10 16:00'
  }
];

export const INITIAL_FEATURE_PACKS: FeaturePack[] = [
  {
    id: 'FP1',
    name: '多级变压器',
    code: 'multi-transformer',
    category: 'architecture',
    description: '支持多层级变压器拓扑关系建立，在设备管理中增加二级变压器新增与统计。',
    order: 1,
    permissions: ['grid:transformer_sub_add'],
    createdAt: '2026-06-12 11:30'
  },
  {
    id: 'FP2',
    name: 'AI排程',
    code: 'ai-scheduler',
    category: 'strategy',
    description: '智能AI排程，支持在排期中应用AI调度，结合光伏与负荷预测进行决策。',
    order: 2,
    permissions: ['strategy:ai_dispatch', 'strategy:ai_switch'],
    createdAt: '2026-06-15 09:00'
  },
  {
    id: 'FP3',
    name: 'AI调度',
    code: 'ai-dispatch',
    category: 'strategy',
    description: '高维度AI调度报告与策略执行，结合天气及运行实绩给出建议。',
    order: 3,
    permissions: ['strategy:ai_dispatch', 'smart:ai_dispatch'],
    createdAt: '2026-06-16 14:00'
  },
  {
    id: 'FP4',
    name: '峰谷套利',
    code: 'peak-valley',
    category: 'strategy',
    description: '开通峰谷套利控制选项，在策略配置中启用专属配置标签页。',
    order: 4,
    permissions: ['strategy:tab_arbitrage'],
    createdAt: '2026-06-18 10:00'
  },
  {
    id: 'FP5',
    name: '动态增容',
    code: 'dynamic-capacity',
    category: 'strategy',
    description: '协调储能系统瞬时充放电，避免重载过载及容量费罚款。',
    order: 5,
    permissions: ['strategy:tab_dynamic'],
    createdAt: '2026-06-20 15:30'
  },
  {
    id: 'FP6',
    name: '需量控制',
    code: 'demand-control',
    category: 'strategy',
    description: '提供需量状态预测及异常限制，允许切换需量更新模式。',
    order: 6,
    permissions: ['strategy:tab_demand', 'strategy:demand_mode'],
    createdAt: '2026-06-22 17:00'
  },
  {
    id: 'FP7',
    name: '余电上网',
    code: 'surplus-grid',
    category: 'strategy',
    description: '允许在峰值或特定时段将富余电量上报电网以增加电站收益。',
    order: 7,
    permissions: ['strategy:surplus_grid'],
    createdAt: '2026-06-23 10:00'
  },
  {
    id: 'FP8',
    name: '轻智能',
    code: 'light-smart',
    category: 'strategy',
    description: '支持AI轻智能开关与参数快捷自适应，提升运行效能。',
    order: 8,
    permissions: ['strategy:light_smart', 'strategy:light_edit', 'strategy:light_switch'],
    createdAt: '2026-06-24 11:00'
  },
  {
    id: 'FP9',
    name: '监控大屏',
    code: 'monitoring-screen',
    category: 'basic',
    description: '开通精美的多端适配可视化大屏及天合储能专用监控大屏。',
    order: 9,
    permissions: ['dash:screen'],
    createdAt: '2026-07-02 08:30'
  },
  {
    id: 'FP10',
    name: '自动电价同步',
    code: 'price-sync',
    category: 'basic',
    description: '自动同步电力交易中心的售电/购电分时电价。',
    order: 10,
    permissions: ['grid:sell_tab', 'grid:sell_edit'],
    createdAt: '2026-07-03 09:00'
  },
  {
    id: 'FP11',
    name: '智能报告',
    code: 'smart-reports',
    category: 'strategy',
    description: '开通深度经营分析、运行报告与设备诊断大报告。',
    order: 11,
    permissions: ['smart:biz_analysis', 'smart:dev_diag'],
    createdAt: '2026-07-04 10:30'
  },
  {
    id: 'FP12',
    name: '需求响应',
    code: 'demand-response',
    category: 'strategy',
    description: '支持响应电网或调度中心的削峰填谷指令以获取辅助服务补偿。',
    order: 12,
    permissions: ['grid:demand_response', 'grid:demand_add', 'grid:demand_edit', 'grid:demand_del'],
    createdAt: '2026-07-05 13:00'
  },
  {
    id: 'FP13',
    name: '排班管理',
    code: 'schedule-management',
    category: 'strategy',
    description: '提供针对现场值守或特定策略周期的自动与人工排班运维机制。',
    order: 13,
    permissions: ['grid:schedule_mgt', 'grid:schedule_add', 'grid:schedule_edit', 'grid:schedule_del'],
    createdAt: '2026-07-06 15:00'
  }
];

export const INITIAL_ENTERPRISES: EnterpriseAssign[] = [
  {
    id: 'E1',
    name: '天合富家能源股份有限公司',
    baseVersionId: 'standard',
    validityStart: '2026-01-01',
    validityEnd: '2026-12-31',
    features: []
  },
  {
    id: 'E2',
    name: '天合富家演示',
    baseVersionId: 'test-version',
    validityStart: '2026-01-01',
    validityEnd: '2027-01-01',
    features: [
      { featureId: 'ai-scheduler', startDate: '2026-01-01', endDate: '2027-01-01', status: 'active' },
      { featureId: 'peak-valley', startDate: '2026-01-01', endDate: '2027-01-01', status: 'active' },
      { featureId: 'demand-control', startDate: '2026-01-01', endDate: '2027-01-01', status: 'active' },
      { featureId: 'monitoring-screen', startDate: '2026-01-01', endDate: '2027-01-01', status: 'active' }
    ]
  },
  {
    id: 'E3',
    name: '微网验证企业',
    baseVersionId: 'test-version',
    validityStart: '2026-03-15',
    validityEnd: '2027-03-15',
    features: [
      { featureId: 'multi-transformer', startDate: '2026-03-15', endDate: '2027-03-15', status: 'active' }
    ]
  },
  {
    id: 'E4',
    name: '河北泽熙新能源有限公司',
    baseVersionId: 'standard',
    validityStart: '2026-05-01',
    validityEnd: '2026-12-31',
    features: []
  },
  {
    id: 'E5',
    name: '常州益达利科技有限公司',
    baseVersionId: 'standard',
    validityStart: '2026-04-01',
    validityEnd: '2027-04-01',
    features: [
      { featureId: 'monitoring-screen', startDate: '2026-04-01', endDate: '2027-04-01', status: 'active' }
    ]
  },
  {
    id: 'E6',
    name: '烟台孚瑞克森汽车部件有限公司',
    baseVersionId: 'standard',
    validityStart: '2026-05-10',
    validityEnd: '2027-05-10',
    features: []
  },
  {
    id: 'E7',
    name: '山东潍坊世宇生物科技有限公司',
    baseVersionId: 'trina-storage-ext',
    validityStart: '2026-06-01',
    validityEnd: '2027-06-01',
    features: [
      { featureId: 'peak-valley', startDate: '2026-06-01', endDate: '2027-06-01', status: 'active' }
    ]
  },
  {
    id: 'E8',
    name: '河南洛阳福瑞可汽车零部件项目',
    baseVersionId: 'trina-storage-ext',
    validityStart: '2026-06-15',
    validityEnd: '2027-06-15',
    features: []
  },
  {
    id: 'E9',
    name: '江苏无锡宁宇包装有限公司',
    baseVersionId: 'trina-storage-ext',
    validityStart: '2026-06-20',
    validityEnd: '2027-06-20',
    features: []
  },
  {
    id: 'E10',
    name: '山东潍坊中国中药谷项目',
    baseVersionId: 'trina-storage-ext',
    validityStart: '2026-07-01',
    validityEnd: '2027-07-01',
    features: []
  }
];

export const INITIAL_PUSH_RECORDS: PushRecord[] = [
  {
    id: 'P1001',
    time: '2026-07-13 10:30',
    content: '天合富家能源股份有限公司 基础版本分配为：标准版',
    target: '零碳运营管理平台',
    status: 'success',
    payload: JSON.stringify({
      enterprise: '天合富家能源股份有限公司',
      action: 'UPDATE_BASE_VERSION',
      baseVersionId: 'standard',
      validity: '2026-01-01 ~ 2026-12-31',
      activeFeatures: []
    }, null, 2)
  },
  {
    id: 'P1002',
    time: '2026-07-12 14:28',
    content: '微网验证企业 启用特性包：多级变压器',
    target: '零碳运营管理平台',
    status: 'success',
    payload: JSON.stringify({
      enterprise: '微网验证企业',
      action: 'ENABLE_FEATURE',
      featureCode: 'multi-transformer',
      validity: '2026-03-15 ~ 2027-03-15'
    }, null, 2)
  },
  {
    id: 'P1003',
    time: '2026-07-11 09:15',
    content: '天合富家演示 开通特性包：AI排程、监控大屏',
    target: '零碳运营管理平台',
    status: 'success',
    payload: JSON.stringify({
      enterprise: '天合富家演示',
      action: 'ENABLE_MULTIPLE_FEATURES',
      featureCodes: ['ai-scheduler', 'monitoring-screen'],
      validity: '2026-01-01 ~ 2027-01-01'
    }, null, 2)
  },
  {
    id: 'P1004',
    time: '2026-07-10 16:00',
    content: '河北泽熙新能源有限公司 分配版本：标准版 推送',
    target: '零碳运营管理平台',
    status: 'success',
    payload: JSON.stringify({
      enterprise: '河北泽熙新能源有限公司',
      action: 'UPDATE_BASE_VERSION',
      baseVersionId: 'standard',
      validity: '2026-05-01 ~ 2026-12-31'
    }, null, 2)
  },
  {
    id: 'P1005',
    time: '2026-07-09 11:20',
    content: '常州益达利科技有限公司 启用特性包：监控大屏',
    target: '零碳运营管理平台',
    status: 'success',
    payload: JSON.stringify({
      enterprise: '常州益达利科技有限公司',
      action: 'ENABLE_FEATURE',
      featureCode: 'monitoring-screen',
      validity: '2026-04-01 ~ 2027-04-01'
    }, null, 2)
  }
];

// --- Components ---

export default function App() {
  const [activeMenu, setActiveMenu] = useState('wizard');
  const [priceSubMenuOpen, setPriceSubMenuOpen] = useState(true);
  const [autoOpenStation, setAutoOpenStation] = useState<any>(null);
  const [versionFeatureSubMenuOpen, setVersionFeatureSubMenuOpen] = useState(true);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedSalesPrice, setSelectedSalesPrice] = useState<SalesPrice | null>(null);

  // Authentication & Password Management State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('admin_logged_in') !== 'false';
  });
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('admin_password') || 'admin123';
  });
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState<string>('admin');
  const [loginPasswordInput, setLoginPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Change Password Form States
  const [oldPasswordInput, setOldPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername !== 'admin') {
      setLoginError('用户名错误，目前仅支持系统内置管理员账号 admin');
      return;
    }
    if (loginPasswordInput === adminPassword) {
      setIsLoggedIn(true);
      localStorage.setItem('admin_logged_in', 'true');
      setLoginPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('密码输入错误，请重新输入');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('admin_logged_in', 'false');
    setUserDropdownOpen(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (oldPasswordInput !== adminPassword) {
      setPasswordError('原密码输入错误');
      return;
    }
    if (!newPasswordInput) {
      setPasswordError('新密码不能为空');
      return;
    }
    if (newPasswordInput.length < 6) {
      setPasswordError('新密码长度不能少于6位');
      return;
    }
    if (newPasswordInput === oldPasswordInput) {
      setPasswordError('新密码不能与原密码相同');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    // Success! Update password
    setAdminPassword(newPasswordInput);
    localStorage.setItem('admin_password', newPasswordInput);
    setPasswordSuccess('密码修改成功！');
    
    // Clear inputs
    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');

    // Close modal after 1.5s
    setTimeout(() => {
      setShowChangePasswordModal(false);
      setPasswordSuccess('');
    }, 1500);
  };

  // Versions & Features State Management
  const [versions, setVersions] = useState<Version[]>(INITIAL_VERSIONS);
  const [featurePacks, setFeaturePacks] = useState<FeaturePack[]>(INITIAL_FEATURE_PACKS);
  const [enterprises, setEnterprises] = useState<EnterpriseAssign[]>(INITIAL_ENTERPRISES);
  const [pushRecords, setPushRecords] = useState<PushRecord[]>(INITIAL_PUSH_RECORDS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('2026-07-13 11:00');

  const handleViewDetails = (province: Province) => {
    setSelectedProvince(province);
    setView('detail');
  };

  const handleViewSalesDetails = (salesPrice: SalesPrice) => {
    setSelectedSalesPrice(salesPrice);
    setPriceSubMenuOpen(true);
    setActiveMenu('sales-price');
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedProvince(null);
    setSelectedSalesPrice(null);
  };

  const navTo = (menu: string) => {
    setActiveMenu(menu);
    setView('list');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-gray-800">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md mb-4">
                <div className="w-5 h-5 bg-white rounded"></div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">智能微网管理后台</h2>
              <p className="text-xs text-gray-400 mt-1">Microgrid Intelligent Management System</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                  账号
                </label>
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 font-medium text-gray-800"
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                  密码
                </label>
                <input 
                  type="password" 
                  value={loginPasswordInput}
                  onChange={(e) => setLoginPasswordInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 font-medium text-gray-800"
                  placeholder="请输入密码"
                  required
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium flex items-center space-x-1.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors mt-6"
              >
                登录系统
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <div className="inline-block px-3 py-1.5 bg-blue-50/50 rounded-full border border-blue-100/50">
                <span className="text-[10px] text-blue-600 font-medium">
                  💡 默认管理员账号: <strong className="font-bold">admin</strong> / 默认初始密码: <strong className="font-bold">admin123</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <div className="flex items-center text-blue-600 font-bold text-lg">
            <div className="w-6 h-6 bg-blue-600 rounded-md mr-2 flex items-center justify-center shadow-sm">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            智能微网
          </div>
        </div>

        <div className="p-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider block">导航菜单</div>
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto pb-4">
          <NavItem icon={<Sparkles size={16} />} label="建站向导" active={activeMenu === 'wizard'} onClick={() => navTo('wizard')} />
          <NavItem icon={<Building2 size={16} />} label="企业管理" active={activeMenu === 'enterprise'} onClick={() => navTo('enterprise')} />
          <NavItem icon={<MapPin size={16} />} label="站点管理" active={activeMenu === 'site'} onClick={() => navTo('site')} />
          <NavItem icon={<Server size={16} />} label="设备管理" active={activeMenu === 'device'} onClick={() => navTo('device')} />
          
          <div>
            <button
              onClick={() => setPriceSubMenuOpen(!priceSubMenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMenu.includes('price') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <span>电价管理</span>
              </div>
              <ChevronDown size={14} className={`transform transition-transform ${priceSubMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {priceSubMenuOpen && (
              <div className="mt-1 ml-4 space-y-1">
                <button
                  onClick={() => navTo('purchase-price')}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-xs transition-colors text-left ${
                    activeMenu === 'purchase-price' 
                      ? 'text-blue-600 font-semibold bg-blue-50/50' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/30'
                  }`}
                >
                  购电电价管理
                </button>
                <button
                  onClick={() => navTo('sales-price')}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-xs transition-colors text-left ${
                    activeMenu === 'sales-price' 
                      ? 'text-blue-600 font-semibold bg-blue-50/50' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/30'
                  }`}
                >
                  售电价格管理
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setVersionFeatureSubMenuOpen(!versionFeatureSubMenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                ['version-manage', 'feature-manage', 'enterprise-assign', 'permission-directory'].includes(activeMenu)
                  ? 'bg-blue-50 text-blue-600 font-bold' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <span>版本特性管理</span>
              </div>
              <ChevronDown size={14} className={`transform transition-transform ${versionFeatureSubMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {versionFeatureSubMenuOpen && (
              <div className="mt-1 ml-4 space-y-1">
                <button
                  onClick={() => navTo('version-manage')}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-xs transition-colors text-left ${
                    activeMenu === 'version-manage' 
                      ? 'text-blue-600 font-semibold bg-blue-50/50' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/30'
                  }`}
                >
                  版本管理
                </button>
                <button
                  onClick={() => navTo('feature-manage')}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-xs transition-colors text-left ${
                    activeMenu === 'feature-manage' 
                      ? 'text-blue-600 font-semibold bg-blue-50/50' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/30'
                  }`}
                >
                  特性包管理
                </button>
                <button
                  onClick={() => navTo('enterprise-assign')}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-xs transition-colors text-left ${
                    activeMenu === 'enterprise-assign' 
                      ? 'text-blue-600 font-semibold bg-blue-50/50' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/30'
                  }`}
                >
                  企业版本分配
                </button>
                <button
                  onClick={() => navTo('permission-directory')}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-xs transition-colors text-left ${
                    activeMenu === 'permission-directory' 
                      ? 'text-blue-600 font-semibold bg-blue-50/50' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/30'
                  }`}
                >
                  权限目录
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-gray-400">当前位置：</span>
            <span className="text-gray-600 font-medium">
              🔧 微网管理后台
            </span>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-800">
              {activeMenu === 'purchase-price' ? '购电电价管理' :
               activeMenu === 'sales-price' ? '售电价格管理' :
               activeMenu === 'version-manage' ? '版本管理' :
               activeMenu === 'feature-manage' ? '特性包管理' :
               activeMenu === 'enterprise-assign' ? '企业版本分配' :
               activeMenu === 'permission-directory' ? '权限目录' :
               activeMenu === 'site' ? '站点管理' :
               activeMenu === 'device' ? '设备管理' :
               activeMenu === 'enterprise' ? '企业管理' :
               activeMenu === 'wizard' ? '建站向导' : '后台模块'}
            </span>
            {view === 'detail' && (selectedProvince || selectedSalesPrice) && (
              <>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-blue-600">
                  {selectedProvince ? selectedProvince.priceName : selectedSalesPrice?.level1Region}详情
                </span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-500 hover:text-gray-700">
              <Bell size={18} />
            </button>
            
            {/* User Profile Dropdown */}
            <div className="relative">
              <div 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors select-none"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 shadow-inner">
                  <User size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700">管理员</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {userDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 z-50 text-xs text-gray-700 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button 
                      onClick={() => {
                        setShowChangePasswordModal(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-3 py-2 hover:bg-gray-50 text-left transition-colors font-medium text-gray-600 hover:text-gray-900"
                    >
                      <Lock size={14} className="mr-2 text-gray-400" />
                      修改密码
                    </button>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2 hover:bg-red-50 text-red-600 text-left transition-colors font-medium"
                    >
                      <LogOut size={14} className="mr-2 text-red-400" />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6 relative">
          {activeMenu === 'purchase-price' ? (
            view === 'list' ? (
              <PriceList onViewDetails={handleViewDetails} />
            ) : (
              <PriceDetail province={selectedProvince!} onBack={handleBack} />
            )
          ) : activeMenu === 'sales-price' ? (
            view === 'list' ? (
              <SalesPriceList onViewDetails={handleViewSalesDetails} />
            ) : (
              <SalesPriceDetail salesPrice={selectedSalesPrice!} onBack={handleBack} />
            )
          ) : ['enterprise', 'site', 'device', 'device-apply', 'topo'].includes(activeMenu) ? (
            <GridWorkspaceContainer 
              activeTab={activeMenu}
              setActiveTab={setActiveMenu}
              initialWorkspaceStation={autoOpenStation}
              clearInitialWorkspaceStation={() => setAutoOpenStation(null)}
              versions={versions}
              featurePacks={featurePacks}
            />
          ) : activeMenu === 'wizard' ? (
            <StationSetupWizard 
              onComplete={(station) => {
                setAutoOpenStation(station);
                setActiveMenu('site');
              }} 
              versions={versions}
              featurePacks={featurePacks}
              enterprises={enterprises}
            />
          ) : activeMenu === 'version-manage' ? (
            <VersionManagePanel 
              versions={versions} 
              setVersions={setVersions} 
              enterprises={enterprises}
            />
          ) : activeMenu === 'feature-manage' ? (
            <FeatureManagePanel 
              featurePacks={featurePacks} 
              setFeaturePacks={setFeaturePacks} 
              enterprises={enterprises}
            />
          ) : activeMenu === 'enterprise-assign' ? (
            <EnterpriseAssignPanel 
              enterprises={enterprises} 
              setEnterprises={setEnterprises} 
              versions={versions}
              featurePacks={featurePacks}
              pushRecords={pushRecords}
              setPushRecords={setPushRecords}
            />
          ) : activeMenu === 'permission-directory' ? (
            <PermissionDirectoryPanel 
              isSyncing={isSyncing} 
              setIsSyncing={setIsSyncing}
              lastSyncTime={lastSyncTime}
              setLastSyncTime={setLastSyncTime}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              请选择左侧菜单查看功能
            </div>
          )}
        </main>
      </div>

      {/* 3. Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-xs flex items-center space-x-1">
                <Lock size={14} className="text-blue-500" />
                <span>修改管理员密码</span>
              </h3>
              <button 
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPasswordError('');
                  setPasswordSuccess('');
                }} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    原密码
                  </label>
                  <input 
                    type="password"
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    required
                    placeholder="请输入当前密码"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    新密码 (不低于6位)
                  </label>
                  <input 
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required
                    placeholder="请输入新密码"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    确认新密码
                  </label>
                  <input 
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    required
                    placeholder="请再次输入新密码"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {passwordError && (
                  <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium flex items-center space-x-1">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-2.5 bg-green-50 border border-green-100 rounded-lg text-xs text-green-600 font-medium flex items-center space-x-1">
                    <Check size={13} className="shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="px-3 py-1.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  disabled={!!passwordSuccess}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors disabled:opacity-55"
                >
                  确认修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon?: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-all ${
        active 
          ? 'bg-blue-50 text-blue-600 font-bold' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
      }`}
    >
      <span>{label}</span>
    </button>
  );
}

function SalesPriceList({ onViewDetails }: { onViewDetails: (s: SalesPrice) => void }) {
  const [salesPrices, setSalesPrices] = useState<SalesPrice[]>(SALES_PRICES);
  const [filterRegion, setFilterRegion] = useState('');

  const filtered = salesPrices.filter(s => !filterRegion || s.level1Region.includes(filterRegion));

  const handleDelete = (id: string) => {
    setSalesPrices(salesPrices.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium whitespace-nowrap text-gray-700 w-24 text-right">1级行政地区：</span>
            <input 
              type="text" 
              placeholder="请输入" 
              className="px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm w-48"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
            />
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
              查询
            </button>
            <button 
              onClick={() => setFilterRegion('')}
              className="px-4 py-1.5 bg-white border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors flex items-center"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-end items-center">
          <button className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <RefreshCw size={16} className="mr-1.5" />
            手动更新
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">1级行政地区</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">最新预测数据日期</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">最新结算数据日期</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{price.level1Region}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-xs">{price.latestPredictedDate}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-xs">{price.latestSettlementDate}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                       <button 
                        onClick={() => onViewDetails(price)}
                        className="px-2 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-xs"
                      >
                        详情
                      </button>
                      <button 
                        onClick={() => handleDelete(price.id)}
                        className="px-2 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 text-xs"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SalesPriceDetail({ salesPrice, onBack }: { salesPrice: SalesPrice, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'details' | 'stations'>('details');
  const [month, setMonth] = useState('2026-05');
  const [selectedDates, setSelectedDates] = useState<string[]>([`${month}-18`]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = React.useRef<HTMLDivElement>(null);
  
  const [isBindStationModalOpen, setIsBindStationModalOpen] = useState(false);
  const [bindConfirmModalOpen, setBindConfirmModalOpen] = useState(false);
  const [unbindConfirmModalOpen, setUnbindConfirmModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allDaysInMonth = useMemo(() => {
    const [yearStr, monthStr] = month.split('-');
    const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => `${month}-${(i + 1).toString().padStart(2, '0')}`);
  }, [month]);

  useEffect(() => {
    setSelectedDates([`${month}-18`]);
  }, [month]);

  const mockHourlyData = useMemo(() => {
    const days = month === '2026-05' ? 31 : 30; // Simplified
    const data = [];
    for (let d = 1; d <= days; d++) {
      const dateStr = `${month}-${d.toString().padStart(2, '0')}`;
      for (let h = 0; h < 24; h++) {
        data.push({
          targetDate: dateStr,
          time: `${h.toString().padStart(2, '0')}:00`,
          hour: h,
          realtimePrice: Number((0.2 + Math.random() * 0.3 + (Math.sin(h/4) * 0.1)).toFixed(4)),
          dayAheadPrice: Number((0.15 + Math.random() * 0.2 + (Math.cos(h/4) * 0.08)).toFixed(4)),
        });
      }
    }
    return data;
  }, [month]);

  const chartData = useMemo(() => {
    const dataByHour: any[] = Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      hour: i
    }));

    selectedDates.forEach(date => {
      const dayData = mockHourlyData.filter(d => d.targetDate === date);
      dayData.forEach(d => {
        const hourItem = dataByHour[d.hour];
        hourItem[`realtime_${date}`] = d.realtimePrice;
        hourItem[`dayAhead_${date}`] = d.dayAheadPrice;
      });
    });

    return dataByHour;
  }, [mockHourlyData, selectedDates]);

  const detailListData = useMemo(() => {
    return mockHourlyData.filter(d => selectedDates.includes(d.targetDate));
  }, [mockHourlyData, selectedDates]);

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Header */}
      <div className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 shrink-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors text-sm cursor-pointer">
              <ChevronLeft size={18} className="mr-1" />
              返回
            </button>
            <h1 className="text-base font-medium text-gray-800 ml-4">{salesPrice.level1Region} 售电价格配置</h1>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex mr-4">
              <button 
                onClick={() => setActiveTab('details')}
                className={`px-4 py-1.5 text-sm transition-all border ${activeTab === 'details' ? 'border-blue-600 text-blue-600 z-10' : 'border-gray-200 text-gray-600 hover:text-gray-900'} rounded-l-md cursor-pointer`}
              >
                电价详情
              </button>
              <button 
                onClick={() => setActiveTab('stations')}
                className={`px-4 py-1.5 text-sm transition-all border -ml-px ${activeTab === 'stations' ? 'border-blue-600 text-blue-600 z-10' : 'border-gray-200 text-gray-600 hover:text-gray-900'} rounded-r-md cursor-pointer`}
              >
                绑定电站
              </button>
            </div>
            <label className="text-sm font-medium text-gray-600">选择月份：</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="2026-05">2026-05</option>
              <option value="2026-04">2026-04</option>
            </select>
          </div>
        </div>
      </div>

      {activeTab === 'details' ? (
        <div className="flex-1 overflow-auto flex flex-col space-y-4">
          {/* Date Selection Consistent with Buy Price */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800 flex items-center">
                <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
                选择展示日期
              </h3>
              <div className="flex space-x-2">
                <button onClick={() => setSelectedDates(allDaysInMonth)} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">全选本月</button>
                <button onClick={() => setSelectedDates([`${month}-18`])} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">重置</button>
              </div>
            </div>
            <div className="relative" ref={datePickerRef}>
              <div 
                className="min-h-[42px] w-full border border-gray-300 rounded-md bg-white px-3 py-2 flex flex-wrap gap-2 items-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              >
                <Calendar size={16} className="text-gray-400 shrink-0" />
                {selectedDates.length === 0 ? (
                  <span className="text-sm text-gray-400">请选择日期...</span>
                ) : (
                  selectedDates.map(date => (
                    <span key={date} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      {date}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDates(prev => {
                            const next = prev.filter(d => d !== date);
                            return next.length > 0 ? next : prev;
                          });
                        }}
                        className="ml-1 hover:text-blue-900 focus:outline-none"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
                <div className="flex-1"></div>
                <ChevronDown size={16} className="text-gray-400 shrink-0" />
              </div>
              
              {isDatePickerOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3 border-b pb-2">{month} 可选日期</div>
                  <div className="grid grid-cols-7 gap-2">
                    {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>
                    ))}
                    {Array.from({ length: 1 /* simplified dynamic empty */ }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2"></div>
                    ))}
                    {allDaysInMonth.map(date => {
                      const isSelected = selectedDates.includes(date);
                      const dayNum = parseInt(date.split('-')[2], 10);
                      return (
                        <button
                          key={date}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDates(prev => {
                              if (prev.includes(date)) {
                                const next = prev.filter(d => d !== date);
                                return next.length > 0 ? next : prev;
                              }
                              return [...prev, date].sort();
                            });
                          }}
                          className={`h-8 w-full flex items-center justify-center text-sm rounded-md transition-colors ${
                            isSelected 
                              ? 'bg-blue-600 text-white font-bold shadow-sm' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center">
                <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
                交易电价曲线
              </h3>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-400 mr-1"></div>
                  <span>实时价格</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
                  <span>日前价格</span>
                </div>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  {selectedDates.map((date, idx) => {
                    const colors = [
                      { rt: '#f87171', da: '#60a5fa' },
                      { rt: '#fb923c', da: '#34d399' },
                      { rt: '#f472b6', da: '#a78bfa' },
                      { rt: '#fbbf24', da: '#2dd4bf' },
                    ];
                    const colorSet = colors[idx % colors.length];
                    return (
                      <React.Fragment key={date}>
                        <Line 
                          type="monotone" 
                          dataKey={`realtime_${date}`} 
                          stroke={colorSet.rt} 
                          strokeWidth={2} 
                          dot={false} 
                          name={`实时 (${date})`} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey={`dayAhead_${date}`} 
                          stroke={colorSet.da} 
                          strokeWidth={2} 
                          dot={false} 
                          strokeDasharray="5 5"
                          name={`日前 (${date})`} 
                        />
                      </React.Fragment>
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800">数据明细</h3>
              <button className="text-blue-600 text-sm hover:underline">导出数据</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">日期</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">时间</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-200 text-right">实时价格(元/kWh)</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-200 text-right">日前价格(元/kWh)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detailListData.length > 0 ? (
                    detailListData.slice(0, 48).map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{item.targetDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">{item.time}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 text-right font-mono">{item.realtimePrice.toFixed(4)}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 text-right font-mono">{item.dayAheadPrice.toFixed(4)}</td>
                      </tr>
                    ))
                  ) : (
                     <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-500 text-sm">
                        请选择日期查看数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {detailListData.length > 48 && (
              <div className="p-4 border-t border-gray-100 flex justify-center italic text-xs text-gray-400">
                仅展示部分数据...
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-gray-600">已绑定电站列表</h3>
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                placeholder="请输入站点名称/企业..." 
                className="px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm w-64"
              />
              <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 cursor-pointer">查询</button>
              <button 
                onClick={() => setIsBindStationModalOpen(true)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center cursor-pointer"
              >
                <Plus size={16} className="mr-1" />
                绑定新电站
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1 border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#fcfcfc]">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200">所属企业</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200">电站名称</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {salesPrice.boundStationsCount > 0 ? (
                  Array.from({ length: salesPrice.boundStationsCount }).map((_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-600">常州好迪机械有限公司</td>
                      <td className="px-4 py-4 text-sm text-gray-600">常州好迪机械有限公司</td>
                      <td className="px-4 py-4 text-sm font-medium">
                        <button 
                          onClick={() => setUnbindConfirmModalOpen(true)}
                          className="text-[#ff4d4f] hover:text-[#ff7875]"
                        >
                          解绑
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-gray-500 text-sm">
                      暂无绑定的电站
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>共 {salesPrice.boundStationsCount} 条记录 第 1/1 页</div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center border border-blue-600 text-blue-600 rounded bg-white cursor-pointer font-medium">1</div>
              <div className="flex items-center px-2 py-1 border border-gray-300 rounded bg-white cursor-pointer hover:border-gray-400">
                10 条/页 <ChevronDown size={14} className="ml-1 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bind/Unbind Modals */}
      {isBindStationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsBindStationModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">绑定新电站</h2>
              <button onClick={() => setIsBindStationModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 w-12 text-center border-b border-gray-200">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">所属企业</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">电站名称</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{salesPrice.level1Region}新能源科技</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">未绑定电站 {i + 10} 号</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
              <button onClick={() => setIsBindStationModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded text-sm">取消</button>
              <button onClick={() => {setIsBindStationModalOpen(false); setBindConfirmModalOpen(true);}} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">确认绑定</button>
            </div>
          </div>
        </div>
      )}

      {bindConfirmModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setBindConfirmModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[400px] p-6">
            <h3 className="text-lg font-bold mb-4">确认绑定</h3>
            <p className="text-gray-600 mb-6">确定要将选中的电站绑定到该售电价格配置吗？</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setBindConfirmModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm">取消</button>
              <button onClick={() => setBindConfirmModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">确认</button>
            </div>
          </div>
        </div>
      )}

      {unbindConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setUnbindConfirmModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[400px] p-6">
            <h3 className="text-lg font-bold mb-4">确认解绑</h3>
            <p className="text-gray-600 mb-6">确定要解除该电站的绑定吗？</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setUnbindConfirmModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm">取消</button>
              <button onClick={() => setUnbindConfirmModalOpen(false)} className="px-4 py-2 bg-red-600 text-white rounded text-sm">确认解绑</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StationManagement() {
  return null;
}

function OldStationManagement() {
  const [stations, setStations] = useState<Station[]>(STATIONS);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  
  // Filters
  const [filterId, setFilterId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterEnterprise, setFilterEnterprise] = useState('');
  const [filterPhone, setFilterPhone] = useState('');

  const filtered = stations.filter(s => 
    (!filterId || s.id.includes(filterId)) &&
    (!filterName || s.name.includes(filterName)) &&
    (!filterEnterprise || s.enterpriseName.includes(filterEnterprise)) &&
    (!filterPhone || s.phone.includes(filterPhone))
  );

  const handleEdit = (station: Station) => {
    setEditingStation(station);
    setIsDrawerOpen(true);
  };

  const handleAdd = () => {
    setEditingStation(null);
    setIsDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该站点吗？')) {
      setStations(stations.filter(s => s.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Filters Consistent with Screenshot 1 */}
      <div className="bg-white p-5 rounded shadow-sm border border-gray-200">
        <div className="grid grid-cols-4 gap-6 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">站点编号：</label>
            <input 
              type="text" 
              placeholder="请输入" 
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">站点名称：</label>
            <input 
              type="text" 
              placeholder="请输入" 
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">企业名称：</label>
            <select 
              value={filterEnterprise}
              onChange={(e) => setFilterEnterprise(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">请选择</option>
              <option value="湖北">湖北省黄冈市...</option>
              <option value="江苏">江苏镇江...</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">手机号：</label>
            <input 
              type="text" 
              placeholder="请输入" 
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-3">
          <button className="px-5 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center">
            搜索
          </button>
          <button 
            onClick={() => { setFilterId(''); setFilterName(''); setFilterEnterprise(''); setFilterPhone(''); }}
            className="px-5 py-1.5 bg-white border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            重置
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-end items-center">
          <button 
            onClick={handleAdd}
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center"
          >
            <Plus size={16} className="mr-1.5" />
            新增站点
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="bg-[#fcfcfc] sticky top-0 z-10 font-bold">
              <tr>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">站点编号</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">站点名称</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">企业名称</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">主EMS网关SN</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">站点地址</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">负责人名称</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">手机号</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">站点状态</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">电价类型</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">创建时间</th>
                <th className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200 sticky right-0 bg-[#fcfcfc] shadow-[-2px_0_4px_rgba(0,0,0,0.05)] text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-600">{s.id}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{s.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={s.enterpriseName}>{s.enterpriseName}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 font-mono text-xs">{s.emsSn}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={s.address}>{s.address}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{s.managerName}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{s.phone}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`flex items-center space-x-1.5 ${
                      s.status === 'normal' ? 'text-green-600' : s.status === 'fault' ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        s.status === 'normal' ? 'bg-green-500' : s.status === 'fault' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></span>
                      <span>{s.status === 'normal' ? '正常' : s.status === 'fault' ? '故障' : '离线'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{s.purchasePriceType}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 font-mono text-xs">{s.createdAt}</td>
                  <td className="px-4 py-4 text-sm font-medium sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                    <div className="flex space-x-1 items-center justify-center">
                      <button 
                         onClick={() => handleEdit(s)}
                         className="px-2 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 text-xs transition-colors"
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="px-2 py-1 text-[#ff4d4f] border border-red-100 rounded hover:bg-red-50 text-xs transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 font-medium">
          <div>共 {filtered.length} 条记录 第 1/1 页</div>
          <div className="flex items-center space-x-2">
            <button className="w-8 h-8 flex items-center justify-center border border-blue-600 text-blue-600 rounded bg-white shadow-sm">1</button>
            <div className="flex items-center px-3 py-1 border border-gray-300 rounded bg-white cursor-pointer hover:border-gray-400">
              10 条/页 <ChevronDown size={14} className="ml-2 text-gray-400" />
            </div>
            <div className="flex items-center">
              跳至 <input type="text" className="w-10 h-8 border border-gray-300 rounded mx-1 text-center" defaultValue="1" /> 页
            </div>
          </div>
        </div>
      </div>

      {/* Station Drawer Consistent with Screenshot 2 */}
      {isDrawerOpen && (
        <StationDrawer 
          station={editingStation} 
          onClose={() => setIsDrawerOpen(false)} 
          onSave={(data) => {
            if (editingStation) {
              setStations(stations.map(s => s.id === editingStation.id ? { ...s, ...data } : s));
            } else {
              const newS: Station = {
                ...data,
                id: `CS${Date.now().toString().slice(-10)}`,
                createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
                status: 'normal',
                emsSn: 'EMS-' + Math.random().toString(36).substring(7).toUpperCase()
              } as Station;
              setStations([newS, ...stations]);
            }
            setIsDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function StationDrawer({ station, onClose, onSave }: { station: Station | null, onClose: () => void, onSave: (data: Partial<Station>) => void }) {
  const [formData, setFormData] = useState<Partial<Station>>(
    station ? { ...station } : {
      name: '',
      enterpriseName: '',
      emsSn: '',
      address: '',
      managerName: '',
      phone: '',
      status: 'normal',
      purchasePriceType: '固定分时电价',
      feedInPriceType: '固定价格'
    }
  );

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-[800px] bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out translate-x-0">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">编辑基础信息</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-10">
          {/* Basic Info */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
              <span className="w-1 h-3 bg-blue-600 rounded-full mr-2"></span>
              基本信息
            </h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700"><span className="text-red-500 mr-1">*</span>所属企业</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  value={formData.enterpriseName}
                  onChange={(e) => setFormData({ ...formData, enterpriseName: e.target.value })}
                >
                  <option value="">请选择</option>
                  <option value="湖北省黄冈市蕲春县向桥乡田铺储能项目">湖北省黄冈市蕲春县向桥乡田铺储能项目</option>
                  <option value="江苏镇江丹阳莱顿光学">江苏镇江丹阳莱顿光学</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700"><span className="text-red-500 mr-1">*</span>站点分类</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white">
                  <option value="storage">光储电站</option>
                  <option value="pv">纯光伏站</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">站点编号</label>
                <input 
                  type="text" 
                  value={formData.id || '自动生成'} 
                  readOnly 
                  className="w-full px-3 py-2 border border-gray-100 rounded text-sm bg-gray-50 text-gray-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700"><span className="text-red-500 mr-1">*</span>站点名称</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700"><span className="text-red-500 mr-1">*</span>负责人名称</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700"><span className="text-red-500 mr-1">*</span>手机号</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700"><span className="text-red-500 mr-1">*</span>购电电价类型</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.purchasePriceType}
                  onChange={(e) => setFormData({ ...formData, purchasePriceType: e.target.value })}
                >
                  <option value="固定分时电价">固定分时电价</option>
                  <option value="市场化价格">市场化价格</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-red-500"><span className="text-red-500 mr-1">*</span>上网电价类型</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.feedInPriceType}
                  onChange={(e) => setFormData({ ...formData, feedInPriceType: e.target.value })}
                >
                  <option value="固定价格">固定价格</option>
                  <option value="市场化价格">市场化价格</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700"><span className="text-red-500 mr-1">*</span>站点地址</label>
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="p-3 bg-white flex items-center">
                  <input 
                    type="text" 
                    placeholder="请输入站点地址"
                    className="flex-1 text-sm outline-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="h-64 bg-[#f0f2f5] relative flex flex-col items-center justify-center group overflow-hidden">
                   <div className="text-xs text-gray-500 mb-2 font-mono">MAP VIEW AREA</div>
                   <MapPin className="text-blue-500 opacity-60" size={32} />
                   <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/80 rounded text-[10px] text-gray-500 border border-gray-200 shadow-sm transition-all hover:bg-white cursor-pointer">
                     高德地图 © 2026 AutoNavi - GS(2025)5996号
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* PV Info */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-900 flex items-center">
              <span className="w-1 h-3 bg-blue-600 rounded-full mr-2"></span>
              光伏信息
            </h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700"><span className="text-red-500 mr-1">*</span>光伏装机容量</label>
                <div className="relative">
                  <input type="text" defaultValue="140000" className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400">Wp</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">逆变器数量</label>
                <div className="relative">
                  <input type="text" defaultValue="1" className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400">台</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700"><span className="text-red-500 mr-1">*</span>是否配置福照仪</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white">
                  <option value="no">否</option>
                  <option value="yes">是</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">是否允许光伏上网</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none bg-white">
                  <option value="no">否</option>
                  <option value="yes">是</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">光伏安装倾斜角度</label>
                <div className="relative">
                  <input type="text" placeholder="0~90度" className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                  <div className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-help"><RefreshCw size={12} /></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">光伏朝向角度</label>
                <div className="relative">
                  <input type="text" placeholder="-180~180度, 0度为正南" className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none" />
                  <div className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-help"><RefreshCw size={12} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-600 transition-all">
            取消
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceList({ onViewDetails }: { onViewDetails: (p: Province) => void }) {
  const [provinces, setProvinces] = useState<Province[]>(PROVINCES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel1, setFilterLevel1] = useState('');
  const [filterType1, setFilterType1] = useState('');
  const [filterType2, setFilterType2] = useState('');
  const [filterVoltage, setFilterVoltage] = useState('');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvinceForModal, setSelectedProvinceForModal] = useState<Province | null>(null);
  const [deleteErrorModalOpen, setDeleteErrorModalOpen] = useState(false);
  
  const [newPriceName, setNewPriceName] = useState('');
  const [priceNameError, setPriceNameError] = useState(false);
  const [newElecType, setNewElecType] = useState(ELECTRICITY_TYPES[0].id);
  const [newVoltage, setNewVoltage] = useState(ELECTRICITY_TYPES[0].voltages[0]);
  const [newProvinceId, setNewProvinceId] = useState('');
  const [provinceError, setProvinceError] = useState(false);

  const filteredProvinces = provinces.filter(p => {
    const matchSearch = !searchTerm || p.priceName.includes(searchTerm);
    const matchLevel1 = !filterLevel1 || p.level1Region === filterLevel1;
    const matchType1 = !filterType1 || p.usageType1 === filterType1;
    const matchType2 = !filterType2 || p.usageType2 === filterType2;
    const matchVoltage = !filterVoltage || p.voltage === filterVoltage;
    return matchSearch && matchLevel1 && matchType1 && matchType2 && matchVoltage;
  });

  const level1Options = useMemo(() => Array.from(new Set(PROVINCES.map(p => p.level1Region))), []);
  const type1Options = useMemo(() => Array.from(new Set(PROVINCES.map(p => p.usageType1))), []);
  const type2Options = useMemo(() => Array.from(new Set(PROVINCES.map(p => p.usageType2))), []);
  const voltageOptions = useMemo(() => Array.from(new Set(PROVINCES.map(p => p.voltage))), []);

  const handleOpenModal = (province: Province) => {
    setSelectedProvinceForModal(province);
    setIsModalOpen(true);
  };

  const handleDelete = (province: Province) => {
    if (province.boundStationsCount > 0) {
      setDeleteErrorModalOpen(true);
    } else {
      setProvinces(provinces.filter(p => p.id !== province.id));
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setNewPriceName('');
    setPriceNameError(false);
    setNewElecType(ELECTRICITY_TYPES[0].id);
    setNewVoltage(ELECTRICITY_TYPES[0].voltages[0]);
    setNewProvinceId('');
    setProvinceError(false);
  };

  const handleSaveConfig = () => {
    let hasError = false;
    if (!newPriceName.trim()) {
      setPriceNameError(true);
      hasError = true;
    }
    if (!newProvinceId) {
      setProvinceError(true);
      hasError = true;
    }
    
    if (hasError) return;

    // Find the selected province to pass to details view
    const selectedProvince = PROVINCES.find(p => p.id === newProvinceId);
    
    if (selectedProvince) {
      // Mock creating a new config by updating the selected province
      // In a real app, this would create a new record
      const typeObj = ELECTRICITY_TYPES.find(t => t.id === newElecType);
      const updatedProvince = {
        ...selectedProvince,
        priceName: newPriceName,
        usageType1: typeObj?.name || newElecType,
        usageType2: '工商业',
        voltage: newVoltage,
        latestMonth: '2026-05',
        latestPredictedDate: '2026-05-21'
      };
      
      closeDrawer();
      onViewDetails(updatedProvince);
    } else {
      closeDrawer();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-4 gap-x-6 gap-y-4 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium whitespace-nowrap text-gray-700 w-20 text-right">电价名称：</span>
            <input 
              type="text" 
              placeholder="请输入" 
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium whitespace-nowrap text-gray-700 w-24 text-right">1级行政地区：</span>
            <select
              value={filterLevel1}
              onChange={(e) => setFilterLevel1(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">请输入</option>
              {level1Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium whitespace-nowrap text-gray-700 w-20 text-right">用电类型I：</span>
            <select
              value={filterType1}
              onChange={(e) => setFilterType1(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">请输入</option>
              {type1Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium whitespace-nowrap text-gray-700 w-20 text-right">用电类型II：</span>
            <select
              value={filterType2}
              onChange={(e) => setFilterType2(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">请输入</option>
              {type2Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium whitespace-nowrap text-gray-700 w-20 text-right">电压等级：</span>
            <select
              value={filterVoltage}
              onChange={(e) => setFilterVoltage(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">请输入</option>
              {voltageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="col-span-3 flex justify-end space-x-3">
            <button 
              className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
            >
              搜索
            </button>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterLevel1('');
                setFilterType1('');
                setFilterType2('');
                setFilterVoltage('');
              }}
              className="px-4 py-1.5 bg-white border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors flex items-center"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-end items-center">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm"
          >
            <Plus size={16} className="mr-1.5" />
            新增配置
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-48">电价名称</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">1级行政地区</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-48">用电类型I</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">用电类型II</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">电压等级</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">最新基础电价月份</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">最新预测数据日期</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">最新实际电价日期</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">绑定电站数量</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProvinces.map((province) => (
                <tr key={province.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 truncate text-sm text-gray-900" title={province.priceName}>{province.priceName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{province.level1Region}</td>
                  <td className="px-4 py-4 text-sm text-gray-700 truncate" title={province.usageType1}>{province.usageType1}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{province.usageType2}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-mono text-xs">{province.voltage}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {province.latestMonth}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-xs">
                    {province.latestPredictedDate}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono text-xs">
                    {province.latestActualDate}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex justify-start">
                      {province.boundStationsCount > 0 ? (
                        <button 
                          onClick={() => handleOpenModal(province)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {province.boundStationsCount}
                        </button>
                      ) : (
                        <span className="text-gray-400 font-medium px-1">0</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                       <button 
                        onClick={() => onViewDetails(province)}
                        className="px-2 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-xs"
                      >
                        详情
                      </button>
                      <button 
                        onClick={() => handleDelete(province)}
                        className="px-2 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 text-xs"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProvinces.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500 text-sm italic">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 bg-white">
          <div className="flex items-center space-x-2">
            <span>共 {filteredProvinces.length} 条记录 第1/1页</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <button disabled className="px-2.5 py-1.5 border border-gray-200 rounded text-gray-300 cursor-not-allowed">
                <ChevronLeft size={14} />
              </button>
              <button className="px-3 py-1 border border-blue-600 bg-blue-50 text-blue-600 rounded font-medium">1</button>
              <button disabled className="px-2.5 py-1.5 border border-gray-200 rounded text-gray-300 cursor-not-allowed transform rotate-180">
                <ChevronLeft size={14} />
              </button>
            </div>
            <select className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none bg-white">
              <option>10 条/页</option>
              <option>20 条/页</option>
              <option>50 条/页</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Config Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={closeDrawer}></div>
          <div className="relative w-96 bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">新增电价配置</h2>
              <button onClick={closeDrawer} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="text-red-500 mr-1">*</span>电价名称
                </label>
                <input 
                  type="text" 
                  placeholder="请输入电价名称" 
                  value={newPriceName}
                  onChange={(e) => {
                    setNewPriceName(e.target.value);
                    if (e.target.value.trim()) setPriceNameError(false);
                  }}
                  className={`w-full border ${priceNameError ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {priceNameError && <p className="text-xs text-red-500 mt-1">电价名称不能为空</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="text-red-500 mr-1">*</span>1级行政地区
                </label>
                <select 
                  value={newProvinceId}
                  onChange={(e) => {
                    setNewProvinceId(e.target.value);
                    if (e.target.value) setProvinceError(false);
                  }}
                  className={`w-full border ${provinceError ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white`}
                >
                  <option value="">请选择省市</option>
                  {PROVINCES.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {provinceError && <p className="text-xs text-red-500 mt-1">请选择省市</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="text-red-500 mr-1">*</span>用电类型I
                </label>
                <select 
                  value={newElecType}
                  onChange={(e) => {
                    const typeId = e.target.value;
                    setNewElecType(typeId);
                    const typeObj = ELECTRICITY_TYPES.find(t => t.id === typeId);
                    if (typeObj && !typeObj.voltages.includes(newVoltage)) {
                      setNewVoltage(typeObj.voltages[0]);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {ELECTRICITY_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  用电类型II
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  disabled
                >
                  <option>工商业</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span className="text-red-500 mr-1">*</span>电压等级
                </label>
                <select 
                  value={newVoltage}
                  onChange={(e) => setNewVoltage(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {ELECTRICITY_TYPES.find(t => t.id === newElecType)?.voltages.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
              <button 
                onClick={closeDrawer}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button 
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bound Stations Modal */}
      {isModalOpen && selectedProvinceForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                {selectedProvinceForModal.name} - 绑定电站列表
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md">
                {Array.from({ length: selectedProvinceForModal.boundStationsCount }).map((_, i) => (
                  <li key={i} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">
                      {selectedProvinceForModal.name}储能电站 {i + 1} 号
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">运行中</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Error Modal */}
      {deleteErrorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteErrorModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[400px] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">提示</h2>
              <button onClick={() => setDeleteErrorModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-gray-700">
              该电价配置存在绑定的电站，无法删除。请先解除绑定后再尝试删除。
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setDeleteErrorModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type FormulaConfig = {
  id: string;
  startDate: string;
  endDate: string;
  formulas: Record<string, string>;
  updateTime: string;
  creator: string;
};

const INITIAL_FORMULA_CONFIGS: FormulaConfig[] = [
  {
    id: '1',
    startDate: '2025-07-01',
    endDate: '2026-06-30',
    formulas: {
      jianfeng: 'p2 * 1.8 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
      gaofeng: 'p2 * 1.5 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
      pingduan: 'p2 * 1.0 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
      digu: 'p2 * 0.5 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
      shengu: 'p2 * 0.2 + p11 + p10 + p3 + p4 + p5 + p6 + p7 + p8 + p9',
    },
    updateTime: '2025-05-01 12:00',
    creator: '薛易立',
  }
];

function PriceDetail({ province, onBack }: { province: Province, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'details' | 'formula' | 'stations'>('details');
  const [month, setMonth] = useState('2026-05');
  const [isBindStationModalOpen, setIsBindStationModalOpen] = useState(false);
  const [bindConfirmModalOpen, setBindConfirmModalOpen] = useState(false);
  const [unbindConfirmModalOpen, setUnbindConfirmModalOpen] = useState(false);
  const [stationToUnbind, setStationToUnbind] = useState<number | null>(null);
  
  const elecType = province.usageType1.includes('单一制') ? 'single' : 'two-part';
  const voltage = province.voltage;
  
  const [allParams, setAllParams] = useState<Record<string, Record<string, number>>>({});

  const [formulaConfigs, setFormulaConfigs] = useState<FormulaConfig[]>(INITIAL_FORMULA_CONFIGS);
  
  const [selectedDates, setSelectedDates] = useState<string[]>([`${month}-01`]);
  const [predictedParamKey, setPredictedParamKey] = useState<string>('p2');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeConfig = useMemo(() => {
    return formulaConfigs.find(c => {
      const startMonth = c.startDate.substring(0, 7);
      const endMonth = c.endDate.substring(0, 7);
      return month >= startMonth && month <= endMonth;
    }) || formulaConfigs[0] || {
      startDate: '未知',
      endDate: '未知',
      formulas: DEFAULT_FORMULAS
    };
  }, [formulaConfigs, month]);

  const formulas = activeConfig.formulas;

  useEffect(() => {
    setSelectedDates([`${month}-01`]);
  }, [month]);

  const currentParamKey = `${month}_${elecType}_${voltage}`;
  
  const params = useMemo(() => {
    if (allParams[currentParamKey]) return allParams[currentParamKey];
    return getMockParams(month, elecType, voltage);
  }, [allParams, currentParamKey, month, elecType, voltage]);

  const handleParamChange = (key: string, value: string) => {
    const num = parseFloat(value);
    setAllParams(prev => {
      const current = prev[currentParamKey] || getMockParams(month, elecType, voltage);
      return {
        ...prev,
        [currentParamKey]: {
          ...current,
          [key]: isNaN(num) ? 0 : num
        }
      };
    });
  };

  const handleQuickFormulaEdit = (periodId: string, newFormula: string) => {
    setFormulaConfigs(prev => prev.map(c => 
      c.id === activeConfig.id ? { ...c, formulas: { ...c.formulas, [periodId]: newFormula }, updateTime: new Date().toISOString().replace('T', ' ').substring(0, 16) } : c
    ));
  };

  const calculatedPrices = useMemo(() => {
    const res: Record<string, number> = {};
    PERIODS.forEach(p => {
      res[p.id] = evaluateFormula(formulas[p.id], params);
    });
    return res;
  }, [formulas, params]);

  const monthHourlyData = useMemo(() => {
    const days = month === '2026-02' ? 28 : 31;
    const data = [];
    
    // 模拟历史月在当时预测时的参数（与实际参数有偏差）
    const predictedBaseParams = { ...params };
    if (predictedParamKey && predictedBaseParams[predictedParamKey] !== undefined) {
      predictedBaseParams[predictedParamKey] = predictedBaseParams[predictedParamKey] * 1.05;
    }

    for (let d = 1; d <= days; d++) {
      const dateStr = `${month}-${d.toString().padStart(2, '0')}`;
      for (let h = 0; h < 24; h++) {
        const periodId = getPeriodForHour(h);
        const formula = formulas[periodId];
        
        // 预测数据是按小时进行预测的，模拟每小时不同的预测购电价格
        let hourlyPredictedParams: Record<string, number> | undefined = undefined;
        if (predictedParamKey && predictedBaseParams[predictedParamKey] !== undefined) {
          const baseVal = predictedBaseParams[predictedParamKey];
          hourlyPredictedParams = {
            [predictedParamKey]: baseVal * (1 + Math.sin((h - 6) / 24 * Math.PI * 2) * 0.08)
          };
        }
        
        const predictedPrice = evaluateFormula(formula, predictedBaseParams, hourlyPredictedParams);
        
        // 实际参数计算出的实际值
        const baseActualPrice = evaluateFormula(formula, params);
        // 为模拟数据，增加一点随机波动，使实际电价与预测电价不完全一致
        const simulationActualPrice = baseActualPrice * (1 + (Math.random() - 0.5) * 0.05);
        const hasActual = dateStr <= (province.latestActualDate || '2026-02-28');

        data.push({
          datetime: `${dateStr} ${h.toString().padStart(2, '0')}:00`,
          hour: h,
          periodId,
          periodName: PERIODS.find(p => p.id === periodId)?.name,
          predictedPrice,
          actualPrice: hasActual ? baseActualPrice : simulationActualPrice,
        });
      }
    }
    return data;
  }, [month, params, formulas, predictedParamKey]);

  const allDaysInMonth = useMemo(() => {
    const [yearStr, monthStr] = month.split('-');
    const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => `${month}-${(i + 1).toString().padStart(2, '0')}`);
  }, [month]);

  const selectedHourlyData = useMemo(() => {
    return monthHourlyData.filter(d => selectedDates.includes(d.datetime.split(' ')[0]));
  }, [monthHourlyData, selectedDates]);

  const chartData = useMemo(() => {
    const dataByHour: any[] = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      hourNum: i
    }));

    selectedDates.forEach(date => {
      const dayData = monthHourlyData.filter(d => d.datetime.startsWith(date));
      dayData.forEach(d => {
        const hourItem = dataByHour[d.hour];
        hourItem[`predicted_${date}`] = d.predictedPrice;
        hourItem[`actual_${date}`] = d.actualPrice;
        if (!hourItem.periodName) {
          hourItem.periodName = d.periodName;
        }
      });
    });

    return dataByHour;
  }, [monthHourlyData, selectedDates]);

  const isCurrentMonth = month >= '2026-05';

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Header */}
      <div className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 shrink-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-blue-600 transition-colors text-sm cursor-pointer">
              <ChevronLeft size={18} className="mr-1" />
              返回
            </button>
            <h2 className="text-base font-medium text-gray-800 ml-4">{province.priceName}</h2>
            <div className="flex ml-8">
              <button 
                onClick={() => setActiveTab('details')}
                className={`px-4 py-1.5 text-sm transition-all border ${activeTab === 'details' ? 'border-blue-600 text-blue-600 z-10' : 'border-gray-200 text-gray-600 hover:text-gray-900'} rounded-l-md cursor-pointer`}
              >
                电价详情
              </button>
              <button 
                onClick={() => setActiveTab('formula')}
                className={`px-4 py-1.5 text-sm transition-all border -ml-px ${activeTab === 'formula' ? 'border-blue-600 text-blue-600 z-10' : 'border-gray-200 text-gray-600 hover:text-gray-900'} cursor-pointer`}
              >
                公式配置
              </button>
              <button 
                onClick={() => setActiveTab('stations')}
                className={`px-4 py-1.5 text-sm transition-all border -ml-px ${activeTab === 'stations' ? 'border-blue-600 text-blue-600 z-10' : 'border-gray-200 text-gray-600 hover:text-gray-900'} rounded-r-md cursor-pointer`}
              >
                绑定电站
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <label className="text-sm font-medium text-gray-600">选择月份：</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="2026-05">2026-05 (预测月)</option>
              <option value="2026-04">2026-04 (历史月)</option>
              <option value="2026-03">2026-03 (历史月)</option>
              <option value="2026-02">2026-02 (历史月)</option>
            </select>
            <button className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
              保存配置
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'details' ? (
        <div className="flex-1 overflow-auto flex flex-col space-y-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 shrink-0 flex flex-col xl:flex-row gap-8">
            {/* Parameters Section */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center">
                  <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
                  参数配置 (元/kWh)
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-blue-50 px-2 py-1 rounded-md">
                    <label className="text-xs font-medium text-blue-800">预测参数替换：</label>
                    <select
                      value={predictedParamKey}
                      onChange={(e) => setPredictedParamKey(e.target.value)}
                      className="border border-blue-200 rounded text-xs px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-blue-900"
                    >
                      <option value="">无 (不替换)</option>
                      {Object.entries(PARAM_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{key} - {label}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    当前: {elecType} - {province.voltage}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {Object.entries(PARAM_LABELS).map(([key, label]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex justify-between">
                      <span className="truncate pr-2" title={label}>{label}</span>
                      <span className="text-gray-400 font-mono">{key}</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={params[key]}
                      onChange={(e) => handleParamChange(key, e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden xl:block w-px bg-gray-200 shrink-0"></div>

            {/* Formulas Section */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center">
                  <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
                  公式配置与计算结果
                  <span className="ml-3 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md font-normal border border-blue-100">
                    适用日期: {activeConfig.startDate} ~ {activeConfig.endDate}
                  </span>
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  适用于该月所有用电类别和电压等级
                </span>
              </div>
              <div className="flex-1 flex flex-col space-y-2.5">
                {PERIODS.map((period) => (
                  <div key={period.id} className="flex items-center space-x-4">
                    <div className="w-12 shrink-0">
                      <span 
                        className="px-2 py-1 rounded text-xs font-bold text-white block text-center"
                        style={{ backgroundColor: period.color }}
                      >
                        {period.name}
                      </span>
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text"
                        value={formulas[period.id]}
                        onChange={(e) => handleQuickFormulaEdit(period.id, e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm font-mono text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
                        title={formulas[period.id]}
                      />
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <span className="text-sm font-bold text-gray-800">
                        {calculatedPrices[period.id].toFixed(4)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">元</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                提示：在公式中使用参数代号（如 p2, p3）进行计算。支持基础数学运算符 (+, -, *, /, ()).
              </div>
            </div>
          </div>

        {/* Date Selector Section */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-800 flex items-center">
              <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
              选择展示日期
            </h3>
            <div className="flex space-x-2">
              <button onClick={() => setSelectedDates(allDaysInMonth)} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">全选本月</button>
              <button onClick={() => setSelectedDates([`${month}-01`])} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">重置</button>
            </div>
          </div>
          <div className="relative" ref={datePickerRef}>
            <div 
              className="min-h-[42px] w-full border border-gray-300 rounded-md bg-white px-3 py-2 flex flex-wrap gap-2 items-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            >
              <Calendar size={16} className="text-gray-400 shrink-0" />
              {selectedDates.length === 0 ? (
                <span className="text-sm text-gray-400">请选择日期...</span>
              ) : (
                selectedDates.map(date => (
                  <span key={date} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                    {date}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDates(prev => {
                          const next = prev.filter(d => d !== date);
                          return next.length > 0 ? next : prev;
                        });
                      }}
                      className="ml-1 hover:text-blue-900 focus:outline-none"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
              <div className="flex-1"></div>
              <ChevronDown size={16} className="text-gray-400 shrink-0" />
            </div>
            
            {isDatePickerOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-3 border-b pb-2">{month} 可选日期</div>
                <div className="grid grid-cols-7 gap-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>
                  ))}
                  {Array.from({ length: new Date(month + '-01').getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2"></div>
                  ))}
                  {allDaysInMonth.map(date => {
                    const isSelected = selectedDates.includes(date);
                    const dayNum = parseInt(date.split('-')[2], 10);
                    return (
                      <button
                        key={date}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDates(prev => {
                            if (prev.includes(date)) {
                              const next = prev.filter(d => d !== date);
                              return next.length > 0 ? next : prev;
                            }
                            return [...prev, date].sort();
                          });
                        }}
                        className={`h-8 w-full flex items-center justify-center text-sm rounded-md transition-colors ${
                          isSelected 
                            ? 'bg-blue-600 text-white font-bold shadow-sm' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center">
              <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
              24小时电价曲线
            </h3>
            <div className="flex space-x-3">
              {PERIODS.map(p => (
                <div key={p.id} className="flex items-center text-xs">
                  <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: p.color }}></span>
                  {p.name}
                </div>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => val.toFixed(2)}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md max-h-96 overflow-y-auto">
                          <p className="text-sm font-medium mb-2">{label} ({data.periodName})</p>
                          <div className="flex flex-col space-y-2">
                            {selectedDates.map((date, idx) => {
                              const color = CHART_COLORS[idx % CHART_COLORS.length];
                              const predicted = data[`predicted_${date}`];
                              const actual = data[`actual_${date}`];
                              if (predicted === undefined) return null;
                              return (
                                <div key={date} className="text-xs border-l-2 pl-2" style={{ borderColor: color }}>
                                  <div className="font-bold text-gray-700 mb-1">{date}</div>
                                  <div className="flex justify-between space-x-4">
                                    <span className="text-gray-600">预测:</span>
                                    <span className="font-mono text-blue-600">{predicted.toFixed(4)} 元/kWh</span>
                                  </div>
                                  {!isCurrentMonth && actual !== undefined && actual !== null && (
                                    <div className="flex justify-between space-x-4">
                                      <span className="text-gray-600">实际:</span>
                                      <span className="font-mono text-emerald-600">{actual.toFixed(4)} 元/kWh</span>
                                    </div>
                                  )}
                                  {isCurrentMonth && actual !== undefined && actual !== null && (
                                    <div className="flex justify-between space-x-4">
                                      <span className="text-gray-600">实际:</span>
                                      <span className="font-mono text-emerald-600">{actual.toFixed(4)} 元/kWh</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                  {selectedDates.flatMap((date, index) => {
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  const hasActualForThisDate = monthHourlyData.some(d => d.datetime.startsWith(date) && d.actualPrice !== null);
                  const lines = [
                    <Line 
                      key={`predicted_${date}`}
                      name={`${date.slice(5)} 预测`}
                      type="stepAfter" 
                      dataKey={`predicted_${date}`} 
                      stroke={color} 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }} 
                    />
                  ];
                  if (hasActualForThisDate) {
                    lines.push(
                      <Line 
                        key={`actual_${date}`}
                        name={`${date.slice(5)} 实际`}
                        type="stepAfter" 
                        dataKey={`actual_${date}`} 
                        stroke={color} 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }} 
                      />
                    );
                  }
                  return lines;
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">
            {isCurrentMonth ? '当前展示为预测电价曲线' : '当前展示为历史实际电价与当时预测电价的对比曲线'}
          </div>
        </div>

        {/* Hourly Data Table Section */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center">
              <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
              每小时电价明细
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">时间</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">时段</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">预测电价 (元/kWh)</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">实际电价 (元/kWh)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedHourlyData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 text-xs">
                    <td className="px-4 py-3 text-gray-900 font-mono">{row.datetime}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-[10px] font-bold text-white" style={{ backgroundColor: PERIODS.find(p => p.id === row.periodId)?.color }}>
                        {row.periodName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-blue-600 font-medium">{row.predictedPrice.toFixed(4)}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">
                      {row.actualPrice !== null ? row.actualPrice.toFixed(4) : '--'}
                    </td>
                  </tr>
                ))}
                {selectedHourlyData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">
                      暂无该日数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      ) : activeTab === 'formula' ? (
        <div className="flex-1 overflow-hidden">
          <FormulaConfigTab params={params} configs={formulaConfigs} setConfigs={setFormulaConfigs} />
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-gray-600">已绑定电站列表</h3>
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                placeholder="请输入站点名称/企业..." 
                className="px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm w-64"
              />
              <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 cursor-pointer">查询</button>
              <button 
                onClick={() => setIsBindStationModalOpen(true)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center cursor-pointer"
              >
                <Plus size={16} className="mr-1" />
                绑定新电站
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1 border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#fcfcfc]">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200">所属企业</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200">电站名称</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-700 border-b border-gray-200">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {province.boundStationsCount > 0 ? (
                  Array.from({ length: province.boundStationsCount }).map((_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-600">常州好迪机械有限公司</td>
                      <td className="px-4 py-4 text-sm text-gray-600">常州好迪机械有限公司</td>
                      <td className="px-4 py-4 text-sm font-medium">
                        <button 
                          onClick={() => {
                            setStationToUnbind(i);
                            setUnbindConfirmModalOpen(true);
                          }}
                          className="text-[#ff4d4f] hover:text-[#ff7875]"
                        >
                          解绑
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-gray-500 text-sm">
                      暂无绑定的电站
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>共 {province.boundStationsCount} 条记录 第 1/1 页</div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center border border-blue-600 text-blue-600 rounded bg-white cursor-pointer font-medium">1</div>
              <div className="flex items-center px-2 py-1 border border-gray-300 rounded bg-white cursor-pointer hover:border-gray-400">
                10 条/页 <ChevronDown size={14} className="ml-1 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bind New Station Modal */}
      {isBindStationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsBindStationModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                绑定新电站
              </h2>
              <button onClick={() => setIsBindStationModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="relative w-64">
                <input 
                  type="text" 
                  placeholder="搜索可绑定电站..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 w-12 text-center border-b border-gray-200">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">所属企业</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">电站名称</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{province.name}新能源发展有限公司</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{province.name}未绑定储能电站 {i + 1} 号</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setIsBindStationModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button 
                onClick={() => setBindConfirmModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                确认绑定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bind Confirmation Modal */}
      {bindConfirmModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setBindConfirmModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[400px] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">确认绑定</h2>
              <button onClick={() => setBindConfirmModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-gray-700">
              确定要将选中的电站绑定到该电价配置吗？
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setBindConfirmModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  setBindConfirmModalOpen(false);
                  setIsBindStationModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unbind Confirmation Modal */}
      {unbindConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setUnbindConfirmModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[400px] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">确认解绑</h2>
              <button onClick={() => setUnbindConfirmModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-gray-700">
              确定要解除该电站的绑定吗？解除绑定后，该电站将不再使用此电价配置。
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setUnbindConfirmModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  setUnbindConfirmModalOpen(false);
                  setStationToUnbind(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                确认解绑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormulaConfigTab({ params, configs, setConfigs }: { params: Record<string, number>, configs: FormulaConfig[], setConfigs: (configs: FormulaConfig[]) => void }) {
  const [editingConfig, setEditingConfig] = useState<FormulaConfig | null>(null);
  
  const handleEdit = (config: FormulaConfig) => {
    setEditingConfig({ ...config });
  };

  const handleAdd = () => {
    setEditingConfig({
      id: Date.now().toString(),
      startDate: '',
      endDate: '',
      formulas: { ...DEFAULT_FORMULAS },
      updateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      creator: '管理员',
    });
  };

  const handleDelete = (id: string) => {
    setConfigs(configs.filter(c => c.id !== id));
  };

  const handleSave = () => {
    if (editingConfig) {
      const isExisting = configs.some(c => c.id === editingConfig.id);
      if (isExisting) {
        setConfigs(configs.map(c => c.id === editingConfig.id ? editingConfig : c));
      } else {
        setConfigs([...configs, editingConfig]);
      }
      setEditingConfig(null);
    }
  };

  return (
    <div className="flex h-full space-x-4 overflow-hidden">
      {/* Left Table */}
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col ${editingConfig ? 'w-2/3' : 'w-full'}`}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <h3 className="text-base font-bold text-gray-800 flex items-center">
            <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
            公式配置列表
          </h3>
          <button onClick={handleAdd} className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
            <Plus size={16} className="mr-1" />
            新增配置
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-center border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-200">适用日期</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-200">时段</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-200">公式</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-200">计算结果(元)</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-200">更新时间</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-200">创建人</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-200">操作</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <React.Fragment key={config.id}>
                  {PERIODS.map((period, index) => (
                    <tr key={`${config.id}-${period.id}`} className="hover:bg-gray-50">
                      {index === 0 && (
                        <td rowSpan={PERIODS.length} className="px-4 py-3 text-sm text-gray-900 border-b border-r border-gray-200 align-middle">
                          {config.startDate} ~ {config.endDate}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-r border-gray-200">{period.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-r border-gray-200 text-left font-mono text-xs">
                        {config.formulas[period.id]}
                      </td>
                      <td className="px-4 py-3 text-sm text-emerald-600 border-b border-r border-gray-200 font-mono font-bold">
                        {evaluateFormula(config.formulas[period.id], params)}
                      </td>
                      {index === 0 && (
                        <td rowSpan={PERIODS.length} className="px-4 py-3 text-sm text-gray-500 border-b border-r border-gray-200 align-middle">
                          {config.updateTime}
                        </td>
                      )}
                      {index === 0 && (
                        <td rowSpan={PERIODS.length} className="px-4 py-3 text-sm text-gray-900 border-b border-r border-gray-200 align-middle">
                          {config.creator}
                        </td>
                      )}
                      {index === 0 && (
                        <td rowSpan={PERIODS.length} className="px-4 py-3 text-sm font-medium border-b border-gray-200 align-middle">
                          <button onClick={() => handleEdit(config)} className="text-emerald-600 hover:text-emerald-800 mr-3">编辑</button>
                          <button onClick={() => handleDelete(config.id)} className="text-red-600 hover:text-red-800">删除</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              {configs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm border-b border-gray-200">
                    暂无公式配置
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Edit Panel */}
      {editingConfig && (
        <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
            <h3 className="text-base font-bold text-gray-800">
              {configs.some(c => c.id === editingConfig.id) ? '编辑配置' : '新增配置'}
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-auto flex flex-col space-y-6">
            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 w-16 shrink-0">适用日期:</label>
              <div className="flex items-center space-x-2 flex-1">
                <input 
                  type="date" 
                  value={editingConfig.startDate}
                  onChange={(e) => setEditingConfig({...editingConfig, startDate: e.target.value})}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-0"
                />
                <span className="text-gray-400">~</span>
                <input 
                  type="date" 
                  value={editingConfig.endDate}
                  onChange={(e) => setEditingConfig({...editingConfig, endDate: e.target.value})}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-0"
                />
              </div>
            </div>

            {/* Formulas */}
            <div className="space-y-3">
              {PERIODS.map(period => (
                <div key={period.id} className="flex items-center space-x-3">
                  <span 
                    className="px-2 py-1 rounded text-xs font-bold text-white w-12 text-center shrink-0" 
                    style={{ backgroundColor: period.color }}
                  >
                    {period.name}
                  </span>
                  <input
                    type="text"
                    value={editingConfig.formulas[period.id]}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig, 
                      formulas: { ...editingConfig.formulas, [period.id]: e.target.value }
                    })}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setEditingConfig(null)} className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                取消
              </button>
              <button onClick={handleSave} className="px-4 py-1.5 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors">
                保存
              </button>
            </div>

            <hr className="border-gray-200" />

            {/* Reference Params */}
            <div>
              <h4 className="text-sm font-bold text-gray-800 mb-3">最新参考参数配置</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {Object.entries(PARAM_LABELS).map(([key, label]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <label className="text-xs font-medium text-gray-600 flex justify-between">
                      <span className="truncate pr-2" title={label}>{label}</span>
                      <span className="text-gray-400 font-mono">{key}</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={params[key]}
                      className="border border-gray-200 bg-gray-50 rounded-md px-3 py-1.5 text-sm text-gray-500 font-mono cursor-not-allowed"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// --- Version & Feature management subcomponents ---
// ==========================================

// --- Global Perm Checklist helper ---
interface PermissionSelectionTreeProps {
  selectedPerms: string[];
  onChange: (perms: string[]) => void;
  searchQuery?: string;
}

function PermissionSelectionTree({ selectedPerms, onChange, searchQuery = '' }: PermissionSelectionTreeProps) {
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return ALL_PERMISSIONS;
    return ALL_PERMISSIONS.map(cat => ({
      ...cat,
      items: cat.items.filter(item => 
        item.name.includes(searchQuery) || item.code.includes(searchQuery)
      )
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  const handleCategoryToggle = (categoryName: string, items: PermissionItem[]) => {
    const itemCodes = items.map(i => i.code);
    const allSelected = itemCodes.every(code => selectedPerms.includes(code));
    
    if (allSelected) {
      // Unselect all in category
      onChange(selectedPerms.filter(code => !itemCodes.includes(code)));
    } else {
      // Select all in category (avoid duplicates)
      const otherPerms = selectedPerms.filter(code => !itemCodes.includes(code));
      onChange([...otherPerms, ...itemCodes]);
    }
  };

  const handleItemToggle = (code: string) => {
    if (selectedPerms.includes(code)) {
      onChange(selectedPerms.filter(c => c !== code));
    } else {
      onChange([...selectedPerms, code]);
    }
  };

  return (
    <div className="space-y-4 max-h-[350px] overflow-auto border border-gray-200 rounded p-3 bg-gray-50/50">
      {filteredPermissions.map(cat => {
        const catCodes = cat.items.map(i => i.code);
        const allChecked = catCodes.every(code => selectedPerms.includes(code));
        const someChecked = catCodes.some(code => selectedPerms.includes(code)) && !allChecked;

        return (
          <div key={cat.category} className="border-b border-gray-100 last:border-b-0 pb-3 mb-3 last:mb-0 last:pb-0">
            <div className="flex items-center mb-2 bg-gray-100/60 p-1.5 rounded">
              <input
                type="checkbox"
                id={`cat-${cat.category}`}
                checked={allChecked}
                ref={el => {
                  if (el) el.indeterminate = someChecked;
                }}
                onChange={() => handleCategoryToggle(cat.category, cat.items)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <label htmlFor={`cat-${cat.category}`} className="ml-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                📁 {cat.category} ({cat.items.length}项)
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-6">
              {cat.items.map(item => {
                const checked = selectedPerms.includes(item.code);
                return (
                  <label key={item.code} className={`flex items-center p-1.5 rounded border text-xs cursor-pointer select-none transition-colors ${checked ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:bg-gray-50 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleItemToggle(item.code)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <div className="ml-2 flex flex-col">
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className="text-[10px] font-mono text-gray-400">{item.code}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ==========================================
// 1. 版本管理 (VersionManagePanel)
// ==========================================
interface VersionManagePanelProps {
  versions: Version[];
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
  enterprises: EnterpriseAssign[];
}

function VersionManagePanel({ versions, setVersions, enterprises }: VersionManagePanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<Version | null>(null);
  const [permSearch, setPermSearch] = useState('');

  // Delete modal state
  const [confirmDeleteVersion, setConfirmDeleteVersion] = useState<Version | null>(null);
  const [showDeleteDetails, setShowDeleteDetails] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const openCreateModal = () => {
    setEditingVersion(null);
    setName('');
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    setCode(`VER_${randomSuffix}`);
    setOrder(versions.length + 1);
    setDescription('');
    setSelectedPerms([]);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (v: Version) => {
    setEditingVersion(v);
    setName(v.name);
    setCode(v.code);
    setOrder(v.order);
    setDescription(v.description);
    setSelectedPerms(v.permissions);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !code) {
      setErrorMsg('版本名称和编码为必填项');
      return;
    }

    const isDuplicateCode = versions.some(v => v.code === code && (!editingVersion || v.id !== editingVersion.id));
    if (isDuplicateCode) {
      setErrorMsg('版本编码已存在，请勿重复创建');
      return;
    }

    if (editingVersion) {
      // Edit
      setVersions(prev => prev.map(v => v.id === editingVersion.id ? {
        ...v,
        name,
        code,
        order,
        description,
        permissions: selectedPerms
      } : v));
    } else {
      // Create
      const newV: Version = {
        id: `V${Date.now().toString().slice(-4)}`,
        name,
        code,
        order,
        description,
        permissions: selectedPerms,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      setVersions(prev => [...prev, newV].sort((a,b) => a.order - b.order));
    }

    setIsModalOpen(false);
  };

  const handleDelete = (v: Version) => {
    setConfirmDeleteVersion(v);
    setShowDeleteDetails(false);
  };

  const executeDelete = () => {
    if (confirmDeleteVersion) {
      setVersions(prev => prev.filter(v => v.id !== confirmDeleteVersion.id));
      setConfirmDeleteVersion(null);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-gray-950">版本管理</h2>
          <p className="text-[11px] text-gray-500">创建、编辑并排序系统基础版本权限配置</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center shadow-sm cursor-pointer"
        >
          <Plus size={14} className="mr-1" />
          新建版本
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">排序</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">版本名称</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">版本编码</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">关联权限数</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">说明</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">创建时间</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {versions.map(v => {
              const menuCount = ALL_PERMISSIONS.filter(cat => 
                cat.items.some(i => v.permissions.includes(i.code))
              ).length;
              const buttonCount = v.permissions.length;

              return (
                <tr key={v.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono font-bold text-gray-500">{v.order}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-gray-900">{v.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-mono text-[10px] rounded font-semibold">{v.code}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {menuCount}项主菜单 / {buttonCount}个动作权限
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-xs text-gray-500" title={v.description}>
                    {v.description}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{v.createdAt}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEditModal(v)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">编辑</button>
                    <button onClick={() => handleDelete(v)} className="text-xs text-red-600 hover:text-red-800 font-semibold">删除</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="w-[500px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-sm">
                {editingVersion ? `📝 编辑版本：${editingVersion.name}` : '➕ 新建版本'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-600 text-[11px] rounded border border-red-200 flex items-center">
                  <AlertTriangle size={12} className="mr-2 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">版本名称 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="如：标准版"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">唯一编码 (系统自动生成) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="系统自动生成"
                    value={code}
                    disabled={true}
                    readOnly={true}
                    className="w-full border border-gray-200 bg-gray-100 text-gray-500 font-mono rounded px-2.5 py-1 text-xs cursor-not-allowed outline-none select-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">排序优先级</label>
                  <input 
                    type="number" 
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">描述信息</label>
                <textarea 
                  rows={2}
                  placeholder="请输入对该版本的说明"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-gray-850">
                    权限配置 <span className="text-gray-400 font-normal">(勾选关联权限)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="检索权限..."
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 bg-white"
                  />
                </div>

                <PermissionSelectionTree 
                  selectedPerms={selectedPerms} 
                  onChange={setSelectedPerms}
                  searchQuery={permSearch}
                />
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
              >
                保存版本
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Enterprise Details */}
      {confirmDeleteVersion && (() => {
        const boundEnts = enterprises.filter(e => e.baseVersionId === confirmDeleteVersion.code);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">确认删除版本</h3>
                  <p className="text-[10px] text-gray-400">请核对受影响的绑定企业信息</p>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg text-xs text-amber-800 leading-relaxed">
                  您正在尝试删除版本 <strong className="font-bold text-gray-900">[{confirmDeleteVersion.name}]</strong> (编码: <span className="font-mono text-gray-700 bg-white px-1 py-0.5 rounded text-[10px] border border-gray-200">{confirmDeleteVersion.code}</span>)。
                  <div className="mt-1.5 font-semibold text-gray-950 flex items-center">
                    🚨 当前有 <span className="text-red-600 text-sm font-bold mx-1">{boundEnts.length}</span> 家企业绑定了该版本。
                  </div>
                </div>

                {boundEnts.length > 0 && (
                  <div className="space-y-2">
                    <button 
                      type="button"
                      onClick={() => setShowDeleteDetails(!showDeleteDetails)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center focus:outline-none"
                    >
                      <span>{showDeleteDetails ? '收起企业明细' : '展开查看企业明细'}</span>
                      <ChevronRight size={14} className={`ml-0.5 transition-transform ${showDeleteDetails ? 'rotate-90' : ''}`} />
                    </button>

                    {showDeleteDetails && (
                      <div className="border border-gray-200 rounded-lg bg-gray-50/50 max-h-[160px] overflow-y-auto p-2 space-y-1.5 divide-y divide-gray-100">
                        {boundEnts.map(ent => (
                          <div key={ent.id} className="text-[11px] pt-1.5 first:pt-0 flex justify-between items-center text-gray-750">
                            <span className="font-semibold text-gray-900 truncate max-w-[240px]">{ent.name}</span>
                            <span className="text-gray-500 font-mono text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm shrink-0">
                              {ent.validityEnd === '无限期' ? '无限期' : `${ent.validityStart} ~ ${ent.validityEnd}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-gray-50 border-t border-gray-150 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setConfirmDeleteVersion(null)}
                  className="px-3.5 py-1.5 border border-gray-350 bg-white rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="button"
                  onClick={executeDelete}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


// ==========================================
// 2. 特性包管理 (FeatureManagePanel)
// ==========================================
interface FeatureManagePanelProps {
  featurePacks: FeaturePack[];
  setFeaturePacks: React.Dispatch<React.SetStateAction<FeaturePack[]>>;
  enterprises: EnterpriseAssign[];
}

function FeatureManagePanel({ featurePacks, setFeaturePacks, enterprises }: FeatureManagePanelProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'architecture' | 'strategy' | 'basic'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<FeaturePack | null>(null);
  const [permSearch, setPermSearch] = useState('');

  // Delete modal state
  const [confirmDeletePack, setConfirmDeletePack] = useState<FeaturePack | null>(null);
  const [showDeleteDetails, setShowDeleteDetails] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'architecture' | 'strategy' | 'basic'>('strategy');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredPacks = featurePacks.filter(p => activeTab === 'all' || p.category === activeTab);

  const openCreateModal = () => {
    setEditingPack(null);
    setName('');
    const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    setCode(`FEAT_${randomSuffix}`);
    setCategory('strategy');
    setDescription('');
    setOrder(featurePacks.length + 1);
    setSelectedPerms([]);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: FeaturePack) => {
    setEditingPack(p);
    setName(p.name);
    setCode(p.code);
    setCategory(p.category);
    setDescription(p.description);
    setOrder(p.order);
    setSelectedPerms(p.permissions);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !code) {
      setErrorMsg('特性包名称和编码为必填项');
      return;
    }

    const isDuplicateCode = featurePacks.some(p => p.code === code && (!editingPack || p.id !== editingPack.id));
    if (isDuplicateCode) {
      setErrorMsg('此特性编码已存在，请更换');
      return;
    }

    if (editingPack) {
      setFeaturePacks(prev => prev.map(p => p.id === editingPack.id ? {
        ...p,
        name,
        code,
        category,
        description,
        order,
        permissions: selectedPerms
      } : p));
    } else {
      const newPack: FeaturePack = {
        id: `FP${Date.now().toString().slice(-4)}`,
        name,
        code,
        category,
        description,
        order,
        permissions: selectedPerms,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      setFeaturePacks(prev => [...prev, newPack].sort((a,b) => a.order - b.order));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (pack: FeaturePack, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeletePack(pack);
    setShowDeleteDetails(false);
  };

  const executeDelete = () => {
    if (confirmDeletePack) {
      setFeaturePacks(prev => prev.filter(p => p.id !== confirmDeletePack.id));
      setConfirmDeletePack(null);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-gray-950">特性包管理</h2>
          <p className="text-[11px] text-gray-500">创建并归类微网增值高级特性功能</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center shadow-sm cursor-pointer"
        >
          <Plus size={14} className="mr-1" />
          新建特性包
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex space-x-2 border-b border-gray-200">
        {[
          { key: 'all', label: '全部特性' },
          { key: 'architecture', label: '🏢 架构能力' },
          { key: 'strategy', label: '💡 策略类' },
          { key: 'basic', label: '🛠 基础服务' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key 
                ? 'border-blue-600 text-blue-600 font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredPacks.map(pack => {
          const catColors = {
            architecture: { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', name: '架构能力' },
            strategy: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', name: '策略类' },
            basic: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500', name: '基础服务' }
          }[pack.category];

          const matchedPermissions = pack.permissions.map(code => 
            ALL_PERMISSIONS.flatMap(cat => cat.items).find(i => i.code === code)?.name || code
          );

          return (
            <div 
              key={pack.id} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-xs leading-tight">{pack.name}</h3>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center ${catColors.bg}`}>
                    <span className={`w-1 h-1 rounded-full mr-1 ${catColors.dot}`} />
                    {catColors.name}
                  </span>
                </div>
                
                <p className="text-[11px] text-gray-500 line-clamp-2 h-7" title={pack.description}>
                  {pack.description}
                </p>

                <div className="space-y-1.5 border-t border-gray-100 pt-2 text-[10px]">
                  <div className="flex justify-between text-gray-400">
                    <span>编码: <span className="font-mono text-gray-600 font-semibold">{pack.code}</span></span>
                    <span>关联权限: <span className="text-gray-700 font-bold">{pack.permissions.length}个</span></span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-[36px] overflow-hidden">
                    {matchedPermissions.slice(0, 3).map((name, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[9px] text-gray-500 font-medium">
                        {name}
                      </span>
                    ))}
                    {matchedPermissions.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-gray-50 text-[9px] text-gray-400">
                        +{matchedPermissions.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2.5 mt-2.5 border-t border-gray-50">
                <button 
                  onClick={() => openEditModal(pack)}
                  className="px-2.5 py-0.5 border border-gray-200 rounded text-[11px] text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  配置编辑
                </button>
                <button 
                  onClick={(e) => handleDelete(pack, e)}
                  className="p-1 text-red-600 hover:text-red-800 rounded transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredPacks.length === 0 && (
          <div className="col-span-full py-12 bg-white border border-gray-200 rounded-lg text-center">
            <Package size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-xs font-medium">该分类下暂无特性包，点击右上角新建</p>
          </div>
        )}
      </div>

      {/* Drawer Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="w-[500px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-sm">
                {editingPack ? `📝 编辑特性包：${editingPack.name}` : '📦 新建高级特性包'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-600 text-[11px] rounded border border-red-200 flex items-center">
                  <AlertTriangle size={12} className="mr-2" />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">特性包名称 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="如：AI排程"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">特性编码 (系统自动生成) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="系统自动生成"
                    value={code}
                    disabled={true}
                    readOnly={true}
                    className="w-full border border-gray-200 bg-gray-100 text-gray-500 font-mono rounded px-2.5 py-1 text-xs cursor-not-allowed outline-none select-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">所属分类</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="architecture">🏢 架构能力 (设备及物理层拓扑)</option>
                    <option value="strategy">💡 策略类 (储能控制、AI调度优化)</option>
                    <option value="basic">🛠 基础服务 (数据自动化、第三方对接)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">排序优先级</label>
                  <input 
                    type="number" 
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">说明描述</label>
                <textarea 
                  rows={2}
                  placeholder="简述该特性的功能与运行逻辑"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-gray-850">
                    包含的功能权限 <span className="text-gray-400 font-normal">(当分配此包时用户开通的底层权限)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="检索权限..."
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 bg-white"
                  />
                </div>

                <PermissionSelectionTree 
                  selectedPerms={selectedPerms} 
                  onChange={setSelectedPerms}
                  searchQuery={permSearch}
                />
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
              >
                保存特性
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Enterprise Details */}
      {confirmDeletePack && (() => {
        const boundEnts = enterprises.filter(ent => ent.features.some(f => f.featureId === confirmDeletePack.code));
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">确认删除特性包</h3>
                  <p className="text-[10px] text-gray-400">请核对受影响的绑定企业信息</p>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg text-xs text-amber-800 leading-relaxed">
                  您正在尝试删除特性包 <strong className="font-bold text-gray-900">[{confirmDeletePack.name}]</strong> (编码: <span className="font-mono text-gray-700 bg-white px-1 py-0.5 rounded text-[10px] border border-gray-200">{confirmDeletePack.code}</span>)。
                  <div className="mt-1.5 font-semibold text-gray-950 flex items-center">
                    🚨 当前有 <span className="text-red-600 text-sm font-bold mx-1">{boundEnts.length}</span> 家企业绑定了该特性包。
                  </div>
                </div>

                {boundEnts.length > 0 && (
                  <div className="space-y-2">
                    <button 
                      type="button"
                      onClick={() => setShowDeleteDetails(!showDeleteDetails)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center focus:outline-none"
                    >
                      <span>{showDeleteDetails ? '收起企业明细' : '展开查看企业明细'}</span>
                      <ChevronRight size={14} className={`ml-0.5 transition-transform ${showDeleteDetails ? 'rotate-90' : ''}`} />
                    </button>

                    {showDeleteDetails && (
                      <div className="border border-gray-200 rounded-lg bg-gray-50/50 max-h-[160px] overflow-y-auto p-2 space-y-1.5 divide-y divide-gray-100">
                        {boundEnts.map(ent => {
                          const activeFeat = ent.features.find(f => f.featureId === confirmDeletePack.code);
                          return (
                            <div key={ent.id} className="text-[11px] pt-1.5 first:pt-0 flex justify-between items-center text-gray-750">
                              <span className="font-semibold text-gray-900 truncate max-w-[240px]">{ent.name}</span>
                              <span className="text-gray-500 font-mono text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm shrink-0">
                                {activeFeat ? `${activeFeat.startDate} ~ ${activeFeat.endDate}` : '已开通'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-gray-50 border-t border-gray-150 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setConfirmDeletePack(null)}
                  className="px-3.5 py-1.5 border border-gray-350 bg-white rounded text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="button"
                  onClick={executeDelete}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


// ==========================================
// 3. 企业版本分配 (EnterpriseAssignPanel)
// ==========================================
interface EnterpriseAssignPanelProps {
  enterprises: EnterpriseAssign[];
  setEnterprises: React.Dispatch<React.SetStateAction<EnterpriseAssign[]>>;
  versions: Version[];
  featurePacks: FeaturePack[];
  pushRecords: PushRecord[];
  setPushRecords: React.Dispatch<React.SetStateAction<PushRecord[]>>;
}

function EnterpriseAssignPanel({ enterprises, setEnterprises, versions, featurePacks, pushRecords, setPushRecords }: EnterpriseAssignPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedEnt, setSelectedEnt] = useState<EnterpriseAssign | null>(null);
  const [historyEnt, setHistoryEnt] = useState<EnterpriseAssign | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);
  
  // Modals Visibility
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);

  // Version form fields
  const [verBaseId, setVerBaseId] = useState('');
  const [verStart, setVerStart] = useState('');
  const [verEnd, setVerEnd] = useState('');
  const [isVerPermanent, setIsVerPermanent] = useState(false);

  // Feature Configuration Temp State
  const [configFeatures, setConfigFeatures] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({});

  const filteredEnts = enterprises.filter(e => e.name.includes(search));

  const openVersionModal = (ent: EnterpriseAssign) => {
    setSelectedEnt(ent);
    setVerBaseId(ent.baseVersionId);
    setVerStart(ent.validityStart);
    setVerEnd(ent.validityEnd);
    setIsVerPermanent(ent.validityEnd === '无限期');
    setIsVersionModalOpen(true);
  };

  const handleSaveVersion = () => {
    if (!selectedEnt) return;

    const finalVerEnd = isVerPermanent ? '无限期' : verEnd;

    setEnterprises(prev => prev.map(ent => ent.id === selectedEnt.id ? {
      ...ent,
      baseVersionId: verBaseId,
      validityStart: verStart,
      validityEnd: finalVerEnd
    } : ent));

    // Log a Push Record to Zero Carbon
    const verName = versions.find(v => v.code === verBaseId)?.name || verBaseId;
    const newRecord: PushRecord = {
      id: `P${Date.now().toString().slice(-4)}`,
      time: new Date().toISOString().replace('T', ' ').slice(0, 16),
      content: `${selectedEnt.name} 升级分配为[${verName}]`,
      target: '零碳运营服务',
      status: 'success',
      payload: JSON.stringify({
        enterprise: selectedEnt.name,
        action: 'UPDATE_BASE_VERSION',
        baseVersion: verBaseId,
        validity: `${verStart} ~ ${finalVerEnd}`,
        pushedAt: new Date().toISOString()
      }, null, 2)
    };
    setPushRecords(prev => [newRecord, ...prev]);

    setIsVersionModalOpen(false);
  };

  const openFeatureModal = (ent: EnterpriseAssign) => {
    setSelectedEnt(ent);
    const initialConfig: Record<string, { enabled: boolean; start: string; end: string }> = {};
    
    featurePacks.forEach(pack => {
      const existing = ent.features.find(f => f.featureId === pack.code);
      initialConfig[pack.code] = {
        enabled: !!existing,
        start: existing?.startDate || ent.validityStart,
        end: existing?.endDate || ent.validityEnd
      };
    });

    setConfigFeatures(initialConfig);
    setIsFeatureModalOpen(true);
  };

  const handleSaveFeatures = () => {
    if (!selectedEnt) return;

    const newFeaturesList: EnterpriseFeature[] = [];
    Object.entries(configFeatures).forEach(([code, rawData]) => {
      const data = rawData as { enabled: boolean; start: string; end: string };
      if (data.enabled) {
        // Calculate status dynamically based on current date
        const today = '2026-07-12'; // simulated current local date
        let status: 'active' | 'warning' | 'expired' = 'active';
        if (data.end === '无限期') {
          status = 'active';
        } else if (data.end < today) {
          status = 'expired';
        } else {
          const endDateObj = new Date(data.end);
          const todayDateObj = new Date(today);
          const diffDays = Math.ceil((endDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 7) {
            status = 'warning';
          }
        }

        newFeaturesList.push({
          featureId: code,
          startDate: data.start,
          endDate: data.end,
          status
        });
      }
    });

    setEnterprises(prev => prev.map(ent => ent.id === selectedEnt.id ? {
      ...ent,
      features: newFeaturesList
    } : ent));

    // Log push record
    const newRecord: PushRecord = {
      id: `P${Date.now().toString().slice(-4)}`,
      time: new Date().toISOString().replace('T', ' ').slice(0, 16),
      content: `${selectedEnt.name} 特性包功能调整推送`,
      target: '零碳运营服务',
      status: 'success',
      payload: JSON.stringify({
        enterprise: selectedEnt.name,
        action: 'RECONFIGURE_FEATURES',
        activeFeatures: newFeaturesList.map(f => ({
          code: f.featureId,
          validity: `${f.startDate} ~ ${f.endDate}`
        })),
        pushedAt: new Date().toISOString()
      }, null, 2)
    };
    setPushRecords(prev => [newRecord, ...prev]);

    setIsFeatureModalOpen(false);
  };

  return (
    <div className="space-y-4 text-xs">
      <div>
        <h2 className="text-base font-bold text-gray-950">企业版本分配</h2>
        <p className="text-[11px] text-gray-500">为入驻企业分发系统等级并开通/截止特性功能权限</p>
      </div>

      {/* Filter and search */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-600">搜索企业：</span>
          <div className="relative">
            <input 
              type="text"
              placeholder="输入企业名称关键字"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1 border border-gray-300 rounded text-xs w-48 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <Search size={12} className="absolute left-2.5 top-2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase">企业名称</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase">基础版本</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase">开通特性功能</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase">版本有效期</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEnts.map(ent => {
              const baseVer = versions.find(v => v.code === ent.baseVersionId);

              return (
                <tr key={ent.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-gray-900">{ent.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold">
                      🛡️ {baseVer?.name || ent.baseVersionId}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {ent.features.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">尚未开通高级特性</span>
                      ) : (
                        ent.features.map(f => {
                          const pack = featurePacks.find(p => p.code === f.featureId);
                          const isWarning = f.status === 'warning';
                          const isExpired = f.status === 'expired';
                          return (
                            <span 
                              key={f.featureId}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                isExpired 
                                  ? 'bg-red-50 text-red-600 border-red-200' 
                                  : isWarning 
                                    ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                                    : 'bg-green-50 text-green-600 border-green-200'
                              }`}
                              title={`有效期: ${f.startDate} ~ ${f.endDate}`}
                            >
                              {pack?.name || f.featureId}
                              {isWarning && <span className="ml-1">⏳ 即期</span>}
                              {isExpired && <span className="ml-1">🚫 到期</span>}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                    {ent.validityStart} <span className="text-gray-300">~</span> {ent.validityEnd}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      onClick={() => openVersionModal(ent)}
                      className="px-2 py-0.5 bg-white border border-blue-600 text-blue-600 rounded text-xs font-bold hover:bg-blue-50 transition-colors"
                    >
                      分配版本
                    </button>
                    <button 
                      onClick={() => openFeatureModal(ent)}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      开通特性包 [+]
                    </button>
                    <button 
                      onClick={() => setHistoryEnt(ent)}
                      className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                      修改记录
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 1. Version Assign Modal */}
      {isVersionModalOpen && selectedEnt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[450px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col border border-gray-100">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-xs">分配版本 - {selectedEnt.name}</h3>
              <button onClick={() => setIsVersionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3.5 flex-1 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">选择目标版本</label>
                <select 
                  value={verBaseId}
                  onChange={(e) => setVerBaseId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {versions.map(v => (
                    <option key={v.id} value={v.code}>{v.name} ({v.description.slice(0, 15)}...)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">生效开始日期</label>
                  <input 
                    type="date"
                    value={verStart}
                    onChange={(e) => setVerStart(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-gray-700">失效结束日期</label>
                    <label className="flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isVerPermanent}
                        onChange={(e) => {
                          setIsVerPermanent(e.target.checked);
                          if (e.target.checked) {
                            setVerEnd('无限期');
                          } else {
                            setVerEnd(selectedEnt.validityEnd === '无限期' ? '2026-12-31' : selectedEnt.validityEnd);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3 cursor-pointer"
                      />
                      <span className="ml-1 text-[10px] text-gray-500 font-bold">无限期</span>
                    </label>
                  </div>
                  <input 
                    type="date"
                    disabled={isVerPermanent}
                    value={isVerPermanent ? '' : verEnd}
                    onChange={(e) => setVerEnd(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Version Preview */}
              <div className="border border-gray-100 bg-gray-50 rounded-md p-3 space-y-2">
                <h4 className="text-[11px] font-bold text-gray-700 flex items-center">
                  <Info size={12} className="text-blue-500 mr-1" />
                  所选版本权限配置预览：
                </h4>
                <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 text-[10px]">
                  {(() => {
                    const selectedV = versions.find(v => v.code === verBaseId);
                    if (!selectedV) return <span className="text-gray-400">未知版本</span>;
                    
                    return ALL_PERMISSIONS.map(cat => {
                      const hasAny = cat.items.some(i => selectedV.permissions.includes(i.code));
                      if (!hasAny) return null;

                      return (
                        <div key={cat.category} className="space-y-0.5">
                          <span className="font-bold text-gray-700 text-[10px]">📁 {cat.category}</span>
                          <div className="grid grid-cols-2 gap-0.5 pl-2 text-[9px]">
                            {cat.items.map(i => {
                              const included = selectedV.permissions.includes(i.code);
                              return (
                                <div key={i.code} className="flex items-center space-x-1">
                                  {included ? (
                                    <Check size={9} className="text-green-500 shrink-0" />
                                  ) : (
                                    <span className="text-red-500 font-bold text-[9px] w-2 text-center shrink-0">×</span>
                                  )}
                                  <span className={included ? 'text-gray-700' : 'text-gray-300 line-through'}>{i.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2">
              <button 
                onClick={() => setIsVersionModalOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveVersion}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
              >
                推送并分配
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Feature packs configure Modal */}
      {isFeatureModalOpen && selectedEnt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[520px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col border border-gray-100">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-xs">配置高级特性包 - {selectedEnt.name}</h3>
              <button onClick={() => setIsFeatureModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 max-h-[400px]">
              <div className="bg-blue-50/50 rounded-md p-2 text-xs border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-gray-500">当前基础版本：</span>
                  <span className="font-bold text-blue-600">{versions.find(v => v.code === selectedEnt.baseVersionId)?.name || selectedEnt.baseVersionId}</span>
                </div>
                <div className="text-gray-400 font-mono text-[9px]">
                  主版本到期: {selectedEnt.validityEnd}
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold text-gray-700">可用特性包配置：</h4>
                
                {featurePacks.map(pack => {
                  const config = configFeatures[pack.code] || { enabled: false, start: selectedEnt.validityStart, end: selectedEnt.validityEnd };
                  
                  return (
                    <div 
                      key={pack.code}
                      className={`p-3 border rounded-md transition-all flex flex-col space-y-2 ${config.enabled ? 'border-blue-200 bg-blue-50/10' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => {
                              setConfigFeatures(prev => ({
                                ...prev,
                                [pack.code]: { ...prev[pack.code], enabled: e.target.checked }
                              }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <div className="ml-2">
                            <span className="text-xs font-bold text-gray-800 mr-2">{pack.name}</span>
                            <span className="text-[8px] bg-gray-100 border text-gray-500 px-1 py-0.5 rounded font-mono font-bold uppercase">{pack.category}</span>
                          </div>
                        </label>
                        {config.enabled && <Lock size={11} className="text-blue-500" title="生效中" />}
                      </div>

                      <p className="text-[10px] text-gray-400 pl-5 h-4 truncate leading-tight" title={pack.description}>
                        {pack.description}
                      </p>

                      {config.enabled && (
                        <div className="grid grid-cols-2 gap-2 pl-5 border-t border-gray-100 pt-2 transition-all text-[10px]">
                          <div>
                            <label className="block text-[9px] text-gray-400 font-bold mb-0.5">特性生效时间</label>
                            <input 
                              type="date"
                              value={config.start}
                              onChange={(e) => {
                                setConfigFeatures(prev => ({
                                  ...prev,
                                  [pack.code]: { ...prev[pack.code], start: e.target.value }
                                }));
                              }}
                              className="w-full border border-gray-200 rounded px-2 py-0.5 text-[10px] font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-0.5">
                              <label className="block text-[9px] text-gray-400 font-bold">特性到期时间</label>
                              <label className="flex items-center cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  checked={config.end === '无限期'}
                                  onChange={(e) => {
                                    setConfigFeatures(prev => ({
                                      ...prev,
                                      [pack.code]: { 
                                        ...prev[pack.code], 
                                        end: e.target.checked ? '无限期' : (selectedEnt.validityEnd === '无限期' ? '2026-12-31' : selectedEnt.validityEnd)
                                      }
                                    }));
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-2.5 w-2.5 cursor-pointer"
                                />
                                <span className="ml-0.5 text-[8px] text-gray-500 font-bold">无限期</span>
                              </label>
                            </div>
                            <input 
                              type="date"
                              disabled={config.end === '无限期'}
                              value={config.end === '无限期' ? '' : config.end}
                              onChange={(e) => {
                                setConfigFeatures(prev => ({
                                  ...prev,
                                  [pack.code]: { ...prev[pack.code], end: e.target.value }
                                }));
                              }}
                              className="w-full border border-gray-200 rounded px-2 py-0.5 text-[10px] font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2">
              <button 
                onClick={() => setIsFeatureModalOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveFeatures}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
              >
                配置并推送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Enterprise Modification History Modal */}
      {historyEnt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[600px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col border border-gray-100 max-h-[85vh]">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-xs flex items-center">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded mr-2"></span>
                🏢 版本与特性修改记录 - {historyEnt.name}
              </h3>
              <button onClick={() => setHistoryEnt(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="flex justify-between items-center text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-100">
                <div>当前基础版本：<span className="font-bold text-blue-600">🛡️ {versions.find(v => v.code === historyEnt.baseVersionId)?.name || historyEnt.baseVersionId}</span></div>
                <div>版本有效期：<span className="font-mono text-gray-700 font-bold">{historyEnt.validityStart} ~ {historyEnt.validityEnd}</span></div>
              </div>

              {(() => {
                const entHistoryRecords = pushRecords.filter(rec => {
                  try {
                    const data = JSON.parse(rec.payload);
                    return data.enterprise === historyEnt.name;
                  } catch {
                    return rec.content.includes(historyEnt.name);
                  }
                });

                if (entHistoryRecords.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-400">
                      <History size={24} className="mx-auto mb-2 text-gray-300 animate-pulse" />
                      <p className="text-xs">暂无该企业的版本或特性修改推送记录</p>
                    </div>
                  );
                }

                return (
                  <div className="border border-gray-150 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600">
                          <th className="px-3 py-2 font-bold text-gray-500">变更时间</th>
                          <th className="px-3 py-2 font-bold text-gray-500">操作描述</th>
                          <th className="px-3 py-2 font-bold text-gray-500">状态</th>
                          <th className="px-3 py-2 font-bold text-gray-500 text-right">API数据</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {entHistoryRecords.map(rec => {
                          const isSuccess = rec.status === 'success';
                          return (
                            <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-3 py-2.5 font-mono text-gray-400 text-[10px] whitespace-nowrap">{rec.time}</td>
                              <td className="px-3 py-2.5 font-bold text-gray-800">{rec.content}</td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${isSuccess ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                  {isSuccess ? '推送成功' : '推送失败'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button 
                                  onClick={() => setSelectedPayload(rec.payload)}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                                >
                                  查看报文
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setHistoryEnt(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-xs font-semibold shadow-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. API Request Payload Viewer Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="w-[450px] bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-85 text-xs flex items-center">
                <span>📡 API 原始请求数据包 (Payload)</span>
              </h3>
              <button onClick={() => setSelectedPayload(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-2 text-xs">
              <pre className="p-3 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-[260px] border border-gray-800 shadow-inner">
                <code>{selectedPayload}</code>
              </pre>
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedPayload(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-xs font-semibold"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ==========================================
// 4. 权限目录 (PermissionDirectoryPanel)
// ==========================================
interface PermissionDirectoryPanelProps {
  isSyncing: boolean;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  lastSyncTime: string;
  setLastSyncTime: React.Dispatch<React.SetStateAction<string>>;
}

function PermissionDirectoryPanel({ isSyncing, setIsSyncing, lastSyncTime, setLastSyncTime }: PermissionDirectoryPanelProps) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    '仪表盘': true,
    '设备管理': true
  });

  const totalCount = ALL_PERMISSIONS.reduce((sum, cat) => sum + cat.items.length, 0);

  const filteredPermissions = useMemo(() => {
    if (!search) return ALL_PERMISSIONS;
    return ALL_PERMISSIONS.map(cat => ({
      ...cat,
      items: cat.items.filter(i => 
        i.name.includes(search) || i.code.includes(search)
      )
    })).filter(cat => cat.items.length > 0);
  }, [search]);

  const handleSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toISOString().replace('T', ' ').slice(0, 16));
      alert('从零碳运营管理平台拉取全量最新目录成功！');
    }, 1200);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-start bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="text-base font-bold text-gray-950">权限目录</h2>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
            <span className="font-bold text-gray-700">📡 同步源：</span>
            <span>零碳运营管理平台</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold">最后同步时间：</span>
            <span className="font-mono text-gray-600 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">{lastSyncTime}</span>
          </div>
        </div>
        <button 
          onClick={handleSync}
          className={`px-3 py-1.5 bg-white border rounded-md text-xs font-bold shadow-sm flex items-center transition-colors cursor-pointer ${
            isSyncing 
              ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
              : 'text-blue-600 border-blue-600 hover:bg-blue-50'
          }`}
        >
          <RefreshCw size={13} className={`mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? '同步中...' : '同步权限'}
        </button>
      </div>

      {/* Directory Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-gray-700 flex items-center">
            <Database size={13} className="text-blue-600 mr-1" />
            全量权限清单：共 {totalCount} 项可用功能元素
          </div>
          <div className="relative">
            <input 
              type="text"
              placeholder="搜索权限名称/编码"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1 border border-gray-300 rounded text-xs w-44 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <Search size={12} className="absolute left-2.5 top-2 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          {filteredPermissions.map(cat => {
            const isExpanded = !!expandedCategories[cat.category];

            return (
              <div key={cat.category} className="border border-gray-100 rounded-md overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="w-full flex justify-between items-center bg-gray-50/70 p-2.5 text-xs font-bold text-gray-800 border-b border-gray-100 hover:bg-gray-100/50 transition-colors"
                >
                  <span className="flex items-center text-xs">
                    <span className="mr-1.5 text-sm">📁</span>
                    {cat.category}
                    <span className="ml-1.5 font-normal text-gray-400">({cat.items.length}项权限)</span>
                  </span>
                  <ChevronDown size={13} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="p-2.5 bg-white grid grid-cols-1 md:grid-cols-3 gap-2">
                    {cat.items.map(item => (
                      <div 
                        key={item.code}
                        className="p-2 border border-gray-100 rounded bg-gray-50/30 hover:bg-gray-50 transition-all hover:shadow-sm text-[11px]"
                      >
                        <div className="font-bold text-gray-800">{item.name}</div>
                        <div className="text-[9px] font-mono text-gray-400 mt-0.5 flex justify-between">
                          <span>标识: {item.code}</span>
                          <span className="text-blue-500 font-bold uppercase">Button</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ==========================================
// 5. 推送记录 (PushHistoryPanel)
// ==========================================
interface PushHistoryPanelProps {
  pushRecords: PushRecord[];
  setPushRecords: React.Dispatch<React.SetStateAction<PushRecord[]>>;
}

function PushHistoryPanel({ pushRecords, setPushRecords }: PushHistoryPanelProps) {
  const [selectedRecord, setSelectedRecord] = useState<PushRecord | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  const handleRetry = (id: string) => {
    setIsRetrying(id);
    setTimeout(() => {
      setPushRecords(prev => prev.map(rec => rec.id === id ? {
        ...rec,
        status: 'success'
      } : rec));
      setIsRetrying(null);
      alert('推送重试成功！权限同步状态已在零碳端更新。');
    }, 1000);
  };

  const handleManualPushAll = () => {
    alert('正在发起全量微网租户版本和特性状态同步...');
    setTimeout(() => {
      alert('全量推送成功！');
    }, 800);
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-gray-950">推送记录</h2>
          <p className="text-[11px] text-gray-500">记录微网管理后台每次向零碳同步版本分配、特性授权的详细历史</p>
        </div>
        <button 
          onClick={handleManualPushAll}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center shadow-sm cursor-pointer"
        >
          <Send size={13} className="mr-1" />
          全量手动推送
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">时间</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">推送内容</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">目标系统</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">状态</th>
              <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pushRecords.map(rec => {
              const isSuccess = rec.status === 'success';

              return (
                <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors text-xs">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{rec.time}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-gray-850">{rec.content}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">{rec.target}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${isSuccess ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {isSuccess ? (
                        <>
                          <Check size={9} className="mr-1" />
                          成功
                        </>
                      ) : (
                        <>
                          <span className="mr-1">×</span>
                          失败
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {!isSuccess && (
                      <button 
                        onClick={() => handleRetry(rec.id)}
                        disabled={isRetrying === rec.id}
                        className="text-xs font-bold text-orange-600 hover:text-orange-850 disabled:text-gray-300"
                      >
                        {isRetrying === rec.id ? '正在重试...' : '重试'}
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedRecord(rec)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-850"
                    >
                      查看
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* JSON Viewer Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[450px] bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-850 text-xs">📡 推送详情 (零碳API数据包)</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex-1 space-y-2 text-xs">
              <div className="flex justify-between text-xs text-gray-400 border-b border-gray-100 pb-2">
                <span>推送编号: <span className="font-mono text-gray-600 font-bold">{selectedRecord.id}</span></span>
                <span>时间: {selectedRecord.time}</span>
              </div>
              <div className="text-xs font-bold text-gray-700">推送 Payload：</div>
              <pre className="p-3 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-[220px] border border-gray-800 shadow-inner">
                <code>{selectedRecord.payload}</code>
              </pre>
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-xs font-semibold"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ==========================================
// 6-7. SaaS 用户端与生命周期管理 (SaaSClientSimulation)
// ==========================================
interface SaaSClientSimulationProps {
  saasMenu: string;
  setSaasMenu: (m: string) => void;
  saasAlert: { type: 'info' | 'warning' | 'error'; message: string; show: boolean } | null;
  setSaasAlert: (a: any) => void;
  simulatedAISchedulerActive: boolean;
  setSimulatedAISchedulerActive: (a: boolean) => void;
  versions: Version[];
  featurePacks: FeaturePack[];
}

function SaaSClientSimulation({ 
  saasMenu, 
  setSaasMenu, 
  saasAlert, 
  setSaasAlert, 
  simulatedAISchedulerActive, 
  setSimulatedAISchedulerActive,
  versions,
  featurePacks
}: SaaSClientSimulationProps) {
  
  const [showPermPreview, setShowPermPreview] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Hardcode client's simulated settings
  const simulatedVersionId = 'standard'; // Trina energy simulated standard version
  const matchedVersion = versions.find(v => v.code === simulatedVersionId) || versions[0];

  const handleOpenPermPreview = () => setShowPermPreview(true);

  return (
    <div className="space-y-4 text-xs">
      {/* Simulation Helper Panel */}
      <div className="bg-gradient-to-r from-purple-950 to-slate-900 rounded-lg p-3.5 text-white shadow-md border border-purple-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2.5 md:space-y-0">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h3 className="font-bold text-xs text-purple-200">SaaS 端仿真生命周期控制器</h3>
            </div>
            <p className="text-[10px] text-purple-300">
              您当前身处<b>天合能源</b>企业SaaS端。切换以下按钮可以触发微网特性的各种<b>开通、即期、到期生命周期提醒</b>
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button 
              onClick={() => {
                setSimulatedAISchedulerActive(true);
                setSaasAlert({
                  type: 'info',
                  message: '🎉 新特性已开启：AI智能排程已为天合能源开通，即日起生效！有效期至 2026-12-31。',
                  show: true
                });
              }}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-semibold rounded border border-white/20 text-white transition-all cursor-pointer"
            >
              🎉 开通新特性
            </button>
            <button 
              onClick={() => {
                setSimulatedAISchedulerActive(true);
                setSaasAlert({
                  type: 'warning',
                  message: '⚠️ 需量控制即将到期 [还有3天]，到期后该模块将不可用 [联系续费]！',
                  show: true
                });
              }}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-semibold rounded border border-white/20 text-white transition-all cursor-pointer"
            >
              ⚠️ 3天后到期
            </button>
            <button 
              onClick={() => {
                setSimulatedAISchedulerActive(false); // hides menu!
                setSaasAlert({
                  type: 'error',
                  message: '🔴 需量控制已到期，相关策略逻辑已关闭，请联系客户经理重新开通 [我知道了]。',
                  show: true
                });
              }}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-semibold rounded border border-white/20 text-white transition-all cursor-pointer"
            >
              🔴 特性已到期
            </button>
          </div>
        </div>
      </div>

      {/* Top Warning Banner / Toast (Position 7) */}
      {saasAlert && saasAlert.show && (
        <div className={`p-3 rounded-lg shadow-sm border flex items-center justify-between transition-all ${
          saasAlert.type === 'info' 
            ? 'bg-blue-50 border-blue-200 text-blue-800' 
            : saasAlert.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center space-x-2 text-xs">
            {saasAlert.type === 'info' && <Sparkles size={14} className="text-blue-500 animate-pulse" />}
            {saasAlert.type === 'warning' && <AlertTriangle size={14} className="text-amber-500 animate-pulse" />}
            {saasAlert.type === 'error' && <X size={14} className="text-red-500" />}
            <span className="font-bold">{saasAlert.message}</span>
          </div>
          <div className="flex items-center space-x-1.5 shrink-0">
            {saasAlert.type === 'warning' && (
              <button 
                onClick={() => setShowContactModal(true)} 
                className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded text-[10px] font-bold"
              >
                联系续费
              </button>
            )}
            <button 
              onClick={() => setSaasAlert({ ...saasAlert, show: false })}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Real SaaS portal layout container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 min-h-[400px]">
        
        {/* Render SaaS pages */}
        {saasMenu === 'saas-version' ? (
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <h2 className="text-sm font-bold text-gray-900 flex items-center">
                <ShieldCheck size={16} className="text-blue-600 mr-1.5" />
                我的版本与特性功能
              </h2>
              <span className="text-xs text-gray-400">企业: 天合能源</span>
            </div>

            {/* Current version block (Page 6 - 当前版本) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-4 text-white space-y-3 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 rotate-12 opacity-10">
                  <ShieldCheck size={120} />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-100 tracking-wider">天合能源 · 基础系统</span>
                    <h3 className="text-lg font-black mt-0.5">{matchedVersion.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-black uppercase">
                    PROV_01
                  </span>
                </div>
                <div className="text-xs text-blue-100/90 leading-relaxed">
                  该系统授权由“零碳运营管理平台”统一分发并推送，到期将自动回归基础版本。
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-white/20">
                  <span className="text-[10px] text-blue-100 font-semibold font-mono">
                    有效期至 2026-12-31
                  </span>
                  <button 
                    onClick={handleOpenPermPreview}
                    className="px-2.5 py-1 bg-white text-blue-600 hover:bg-blue-50 rounded text-xs font-black transition-all shadow-sm cursor-pointer"
                  >
                    查看权限详情
                  </button>
                </div>
              </div>

              {/* Contact card */}
              <div className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between bg-gray-50/50 space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-800 text-xs">需要更高级的微网运行策略？</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    当前版本不满足运行负荷？您可以申请开通“专业版”，全方位解锁高精度AI负荷预测与AI智能储能排程控制，平均提升储能套利收益 15%~25%
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    升级专业版本
                  </button>
                  <span className="text-[10px] text-gray-400">专属客户经理: 郑经理 (13991159819)</span>
                </div>
              </div>
            </div>

            {/* Activated Features Block (Page 6 - 已开通特性) */}
            <div className="space-y-2.5">
              <h3 className="font-bold text-gray-800 text-xs flex items-center">
                <Package size={14} className="text-emerald-500 mr-1.5" />
                已开通增值特性功能 (共 3 项)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Feature 1 */}
                <div className="p-3 border border-gray-200 rounded-lg space-y-2 bg-white hover:border-gray-300 transition-colors shadow-sm relative">
                  <div className="flex justify-between items-center">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold border border-blue-100 font-mono uppercase">
                      STRATEGY (策略)
                    </span>
                    <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[8px] font-bold border border-green-100 flex items-center">
                      <span className="w-1 h-1 bg-green-500 rounded-full mr-1" />
                      生效中
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">📊 AI排程</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 h-6 line-clamp-2 leading-tight">
                      智能排程算法，根据未来24小时光伏出力与负荷预测，动态优化储能放电策略。
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 border-t border-gray-50 pt-2 font-mono">
                    <span>剩余 174 天</span>
                    <span>到期: 2026-12-31</span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-3 border border-gray-200 rounded-lg space-y-2 bg-white hover:border-gray-300 transition-colors shadow-sm relative">
                  <div className="flex justify-between items-center">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold border border-blue-100 font-mono uppercase">
                      STRATEGY (策略)
                    </span>
                    <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[8px] font-bold border border-green-100 flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
                      生效中
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">📊 峰谷套利</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 h-6 line-clamp-2 leading-tight">
                      基于最新省级分时电价，自动执行两充两放充电策略，赚取高额差价收益。
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 border-t border-gray-50 pt-2 font-mono">
                    <span>剩余 89 天</span>
                    <span>到期: 2026-10-10</span>
                  </div>
                </div>

                {/* Feature 3 - This might warning or show expired based on simulated state */}
                <div className={`p-3 border rounded-lg space-y-2 bg-white transition-all shadow-sm relative ${
                  simulatedAISchedulerActive 
                    ? 'border-amber-200 bg-amber-50/5' 
                    : 'border-red-100 bg-red-50/5 opacity-60'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold border border-blue-100 font-mono uppercase">
                      STRATEGY (策略)
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border flex items-center ${
                      simulatedAISchedulerActive 
                        ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' 
                        : 'bg-red-50 text-red-600 border-red-200 font-bold'
                    }`}>
                      <span className={`w-1 h-1 rounded-full mr-1 ${simulatedAISchedulerActive ? 'bg-amber-500' : 'bg-red-500'}`} />
                      {simulatedAISchedulerActive ? '即将到期' : '已到期关闭'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">🔴 需量控制</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 h-6 line-clamp-2 leading-tight">
                      高精度需量控制逻辑，超出额定变压器负荷时自动切断二级低负荷。
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 border-t border-gray-50 pt-2 font-mono">
                    <span>{simulatedAISchedulerActive ? '剩余 3 天' : '已失效'}</span>
                    <span>到期: 2026-07-16</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Browsable Market Block (Page 6 - 特性市场) */}
            <div className="space-y-2.5">
              <h3 className="font-bold text-gray-800 text-xs flex items-center">
                <Sparkles size={14} className="text-purple-600 mr-1.5" />
                微网高级增值特性市场 (可浏览开通)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                {featurePacks.map(pack => {
                  const alreadyOpen = ['ai-scheduler', 'peak-valley', 'demand-control'].includes(pack.code);
                  
                  return (
                    <div 
                      key={pack.code}
                      className="border border-gray-100 rounded-lg p-3 bg-white hover:border-gray-200 transition-colors flex flex-col justify-between space-y-2 shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 text-[10px]">{pack.name}</span>
                          <span className="px-1 py-0.5 bg-purple-50 text-purple-600 rounded text-[7px] font-bold border border-purple-100 uppercase font-mono">
                            {pack.category.slice(0, 4)}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-2 h-6 leading-tight" title={pack.description}>
                          {pack.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[9px] text-gray-400">增值包</span>
                        <button 
                          onClick={() => {
                            if (alreadyOpen) {
                              alert('该特性您已经开通啦！可在上方面板中查看有效期。');
                            } else {
                              setShowContactModal(true);
                            }
                          }}
                          className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${
                            alreadyOpen 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {alreadyOpen ? '已开通' : '申请开通'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : saasMenu === 'saas-dashboard' ? (
          /* Simulated Dashboard screen to show realistic look & feel */
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-gray-800 text-xs">💡 实时看板 - 天合微网变电所 1# 站</h3>
              <span className="text-[10px] text-gray-400">更新时间：2026-07-12 20:13</span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                <div className="text-[10px] text-gray-400">当前负载率</div>
                <div className="text-base font-bold text-gray-800 mt-0.5 font-mono">54.2 %</div>
                <span className="text-[8px] text-green-500">● 变压器正常</span>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                <div className="text-[10px] text-gray-400">储能 SOC</div>
                <div className="text-base font-bold text-gray-800 mt-0.5 font-mono">78.5 %</div>
                <span className="text-[8px] text-blue-500">● 充电阶段</span>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                <div className="text-[10px] text-gray-400">光伏当前功率</div>
                <div className="text-base font-bold text-gray-800 mt-0.5 font-mono">142.5 kW</div>
                <span className="text-[8px] text-orange-500">☼ 日照充足</span>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                <div className="text-[10px] text-gray-400">本日预计套利收益</div>
                <div className="text-base font-bold text-emerald-600 mt-0.5 font-mono">¥ 1,842.50</div>
                <span className="text-[8px] text-emerald-600">↑ 提升 14.5%</span>
              </div>
            </div>

            {/* Simulation of Active Strategy */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-2 bg-white">
              <h4 className="text-[11px] font-bold text-gray-800">当前运行控制策略状态</h4>
              <div className="text-[10px] text-gray-500 leading-relaxed grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>峰谷套利策略：运行中 (电网平段以100kW补充)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>AI智能预测：正常运行中，光伏拟合度 98.42%</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>多级变压器层级展示：未启用此高级架构</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${simulatedAISchedulerActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>
                    安全需量自动切除：
                    {simulatedAISchedulerActive ? '运行中 (设定阈值：400kVA)' : '已到期关闭 (请联系客服重新开通包)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : saasMenu === 'saas-ai-scheduler' ? (
          /* Simulated AI Scheduler view when unlocked! */
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="text-purple-600 animate-pulse" size={16} />
                <h3 className="font-bold text-gray-900 text-xs">🤖 AI智能排程与充放电调控</h3>
              </div>
              <span className="text-[9px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 animate-pulse">
                AI排程特性包：生效中 (剩174天)
              </span>
            </div>

            <p className="text-[11px] text-gray-500">
              AI排程引擎根据未来24小时负荷和天气预报，自动生成并向储能系统下发最优的充放电指令策略，最大化降低大工业需量费和提升分时电价差价。
            </p>

            <div className="border border-purple-100 rounded-lg p-4 bg-gradient-to-br from-purple-50/50 to-indigo-50/10 space-y-3">
              <div className="flex justify-between items-center font-bold text-gray-800 text-[11px]">
                <span>智能优化运行曲线：2026-07-13 充放电AI规划</span>
                <button 
                  onClick={() => alert('已重新触发AI预测并向边缘网关同步最新调度排程指令包！')}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold shadow-sm"
                >
                  🚀 立即重新进行AI优化排程
                </button>
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                <div className="border border-purple-200 rounded p-2 bg-white">
                  <div className="text-gray-400 text-[9px]">00:00 - 07:00 (深谷)</div>
                  <div className="font-bold text-blue-600 mt-0.5 text-[10px]">满功率充电</div>
                </div>
                <div className="border border-purple-200 rounded p-2 bg-white">
                  <div className="text-gray-400 text-[9px]">08:00 - 11:00 (高峰)</div>
                  <div className="font-bold text-red-600 mt-0.5 text-[10px]">满功率放电</div>
                </div>
                <div className="border border-purple-200 rounded p-2 bg-white">
                  <div className="text-gray-400 text-[9px]">11:00 - 15:00 (平段)</div>
                  <div className="font-bold text-blue-600 mt-0.5 text-[10px]">低功率充电</div>
                </div>
                <div className="border border-purple-200 rounded p-2 bg-white">
                  <div className="text-gray-400 text-[9px]">15:00 - 19:00 (高峰)</div>
                  <div className="font-bold text-red-600 mt-0.5 text-[10px]">满功率放电</div>
                </div>
                <div className="border border-purple-200 rounded p-2 bg-white">
                  <div className="text-gray-400 text-[9px]">19:00 - 21:00 (尖峰)</div>
                  <div className="font-bold text-red-700 mt-0.5 text-[10px] font-black">削峰放电</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <Sliders size={28} className="text-gray-300" />
            <h4 className="font-bold text-gray-700 text-xs">该模拟子页面暂不需要原型界面</h4>
            <p className="text-[10px] text-gray-400 max-w-xs">您可以在左侧菜单中进入“版本与特性”或“实时看板”查看已请求的核心原型页面。</p>
          </div>
        )}
      </div>

      {/* Popups inside SaaS Portal */}
      
      {/* 1. View Version Perms list */}
      {showPermPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[380px] bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-xs">🛡️ 我的系统版本包含权限</h3>
              <button onClick={() => setShowPermPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-[250px] overflow-y-auto space-y-2 text-xs">
              {ALL_PERMISSIONS.map(cat => {
                const items = cat.items.filter(i => matchedVersion.permissions.includes(i.code));
                if (items.length === 0) return null;

                return (
                  <div key={cat.category} className="space-y-1 bg-gray-50 p-2 rounded border border-gray-100">
                    <span className="font-bold text-gray-700">📁 {cat.category}</span>
                    <div className="grid grid-cols-2 gap-1 pl-2 mt-0.5 text-[10px]">
                      {items.map(i => (
                        <div key={i.code} className="flex items-center text-gray-600 font-medium">
                          <span className="text-green-500 font-bold mr-1">✓</span>
                          {i.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowPermPreview(false)}
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Contact Support renew or upgrade modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-[360px] bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-4 text-center space-y-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Building2 size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-xs">提交升级/续费开通申请</h3>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                  我们已收到您的申请意向。根据“零碳”分级运营规则，我们将安排您的微网专属大客户服务经理为您办理开通合同：
                </p>
              </div>

              <div className="bg-gray-50 rounded-md p-2 text-left border border-gray-100 text-[10px] space-y-1 font-medium text-gray-600 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span>🏢 企业名称:</span>
                  <span className="font-bold text-gray-800">天合能源有限公司</span>
                </div>
                <div className="flex justify-between">
                  <span>📡 当前系统:</span>
                  <span className="font-bold text-gray-800">标准版</span>
                </div>
                <div className="flex justify-between">
                  <span>📞 经理热线:</span>
                  <span className="font-bold text-blue-600 hover:underline">13991159819 (郑经理)</span>
                </div>
              </div>

              <div className="pt-1.5 text-[9px] text-gray-400">
                后台管理员也直接可通过管理后台左侧导航的“企业版本分配”一键开通和延期哦！
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-150 flex justify-end space-x-1.5">
              <button 
                onClick={() => setShowContactModal(false)}
                className="px-2.5 py-1 border border-gray-300 rounded text-[10px] text-gray-600 hover:bg-gray-100 font-semibold"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  setShowContactModal(false);
                  alert('升级意向已记录，并向客服总监和郑经理下发跟进通知工单！');
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-semibold hover:bg-blue-700"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

