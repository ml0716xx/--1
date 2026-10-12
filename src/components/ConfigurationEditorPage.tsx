import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Cpu,
  Activity,
  ToggleLeft,
  RefreshCw,
  Sun,
  BatteryCharging,
  ZapOff,
  ArrowDown,
  Database,
  GitCommit,
  Minus,
  Settings,
  Save,
  Trash2,
  Plus,
  X,
  Sliders,
  Eye,
  Wrench,
  Undo,
  Redo,
  MousePointer,
  Check,
  Search,
  Upload,
  Copy,
  FolderPlus,
  Shield,
  User,
  AlertCircle,
  HelpCircle,
  Building,
  CheckCircle2,
  List,
  ChevronDown,
  Play,
  Pause,
  Flame,
  Droplets,
  Car,
  Factory,
  TrendingUp,
  Gauge,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Radio
} from 'lucide-react';
import { 
  getConfigs, 
  getEmbeddedConfig,
  getConfigById, 
  createConfig, 
  updateConfig, 
  updateConfigStatus,
  deleteConfig, 
  copyConfig, 
  resetToDefaultComprehensiveConfig,
  COMPREHENSIVE_SCADA_ELEMENTS,
  EMBEDDED_VIEWBOX,
  SiteConfig 
} from '../lib/configApi';
import { 
  getCurrentRole, 
  setCurrentRole, 
  hasButtonPermission, 
  UserRole 
} from '../lib/permission';

// Simulation Scenario Definition
export interface SimulationScenario {
  id: string;
  name: string;
  badge: string;
  iconType: 'sun' | 'zap' | 'moon' | 'droplet' | 'factory' | 'alert';
  description: string;
  timeSlot: string;
  telemetryOverrides: Record<string, string>;
}

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'midday_solar_peak',
    name: '午间光伏高峰·入储制氢',
    badge: '光伏消纳率 99.2%',
    iconType: 'sun',
    description: '12:00~14:00 辐照最强阶段，光伏全额满发，绿电优先入储充电并全负荷电解水制氢，实现零弃光与电网零反送。',
    timeSlot: '12:00 ~ 14:00 (光伏大发 / 绿电消纳高峰)',
    telemetryOverrides: {
      'meter_active_power': '12.5',
      'meter_reactive_power': '-15.0',
      'meter_pf': '0.99',
      'pv1_power': '245.0',
      'pv2_power': '215.5',
      'site_pv_total_power': '460.5',
      'bess_power': '-220.0',
      'bess_soc': '78.5',
      'h2_power': '200.0',
      'h2_rate': '40.0',
      'ev_power': '60.0',
      'load_power': '180.0',
      'site_daily_green_ratio': '99.2',
      'site_daily_co2_reduction': '4850',
      'site_overall_revenue': '4120.5',
      'site_transformer_load_rate': '42.5'
    }
  },
  {
    id: 'evening_peak_discharge',
    name: '晚间尖峰电价·储能顶峰',
    badge: '度电收益 0.85元',
    iconType: 'zap',
    description: '18:00~21:00 尖峰电价时段，光伏出力归零，储能系统大功率满发顶峰套利，制氢停机避峰，平抑厂区负荷与晚间下班充电高峰。',
    timeSlot: '18:00 ~ 21:00 (尖峰电价 1.48元/kWh)',
    telemetryOverrides: {
      'meter_active_power': '248.0',
      'meter_reactive_power': '-62.0',
      'meter_pf': '0.97',
      'pv1_power': '0.0',
      'pv2_power': '0.0',
      'site_pv_total_power': '0.0',
      'bess_power': '450.0',
      'bess_soc': '42.0',
      'h2_power': '0.0',
      'h2_rate': '0.0',
      'ev_power': '180.0',
      'load_power': '518.0',
      'site_daily_green_ratio': '76.5',
      'site_daily_co2_reduction': '3620',
      'site_overall_revenue': '3850.0',
      'site_transformer_load_rate': '68.4'
    }
  },
  {
    id: 'night_valley_charge',
    name: '夜间深谷电价·储能充电',
    badge: '谷电 0.28元/kWh',
    iconType: 'moon',
    description: '00:00~06:00 深谷电价时段，储能全功率接入电网充电储备电量，制氢设备低负荷经济保压运行，大幅降低次日用电成本。',
    timeSlot: '00:00 ~ 06:00 (低谷电价 0.28元/kWh)',
    telemetryOverrides: {
      'meter_active_power': '620.0',
      'meter_reactive_power': '-110.0',
      'meter_pf': '0.98',
      'pv1_power': '0.0',
      'pv2_power': '0.0',
      'site_pv_total_power': '0.0',
      'bess_power': '-400.0',
      'bess_soc': '32.0',
      'h2_power': '50.0',
      'h2_rate': '10.0',
      'ev_power': '20.0',
      'load_power': '150.0',
      'site_daily_green_ratio': '68.0',
      'site_daily_co2_reduction': '2150',
      'site_overall_revenue': '1980.0',
      'site_transformer_load_rate': '74.2'
    }
  },
  {
    id: 'h2_synergy_zerocarbon',
    name: '源网荷储氢协同·零碳闭环',
    badge: '100% 零碳绿氢',
    iconType: 'droplet',
    description: '源网荷储氢多能深度协同，光伏绿电全量用于电解水高负荷制氢，储能平抑光照波动，实现外部电网 0 交换的零碳自循环模式。',
    timeSlot: '10:00 ~ 16:00 (绿电制氢示范模式)',
    telemetryOverrides: {
      'meter_active_power': '0.0',
      'meter_reactive_power': '0.0',
      'meter_pf': '1.00',
      'pv1_power': '195.0',
      'pv2_power': '185.0',
      'site_pv_total_power': '380.0',
      'bess_power': '-60.0',
      'bess_soc': '82.0',
      'h2_power': '260.0',
      'h2_rate': '52.0',
      'ev_power': '0.0',
      'load_power': '60.0',
      'site_daily_green_ratio': '100.0',
      'site_daily_co2_reduction': '5200',
      'site_overall_revenue': '4890.0',
      'site_transformer_load_rate': '38.0'
    }
  },
  {
    id: 'peak_demand_shaving',
    name: '工业大负荷高峰·需量平抑',
    badge: '需量控制 ≤290kW',
    iconType: 'factory',
    description: '厂区生产车间满产重负荷冲击，系统自动触发储能毫秒级放电削峰与充电桩有序降载策略，将进线需量牢牢锁定在申报限额内。',
    timeSlot: '09:00 ~ 11:30 (车间重负荷生产)',
    telemetryOverrides: {
      'meter_active_power': '290.0',
      'meter_reactive_power': '-75.0',
      'meter_pf': '0.96',
      'pv1_power': '80.0',
      'pv2_power': '70.0',
      'site_pv_total_power': '150.0',
      'bess_power': '320.0',
      'bess_soc': '55.0',
      'h2_power': '0.0',
      'h2_rate': '0.0',
      'ev_power': '40.0',
      'load_power': '720.0',
      'site_daily_green_ratio': '85.0',
      'site_daily_co2_reduction': '3350',
      'site_overall_revenue': '3200.0',
      'site_transformer_load_rate': '89.5'
    }
  },
  {
    id: 'island_emergency_resilience',
    name: '微网防逆流·离网应急保供',
    badge: '离网自主 V/F 支撑',
    iconType: 'alert',
    description: '模拟市电检修断电工况，10kV进线断路器分闸，储能PCS切换为主控电源建立电压频率基准，光储协同为厂区一级保供负荷不间断供电。',
    timeSlot: '应急工况 / 防逆流微电网',
    telemetryOverrides: {
      'meter_active_power': '0.0',
      'meter_reactive_power': '0.0',
      'meter_pf': '1.00',
      'pv1_power': '140.0',
      'pv2_power': '120.0',
      'site_pv_total_power': '260.0',
      'bess_power': '80.0',
      'bess_soc': '65.0',
      'h2_power': '0.0',
      'h2_rate': '0.0',
      'ev_power': '0.0',
      'load_power': '340.0',
      'site_daily_green_ratio': '100.0',
      'site_daily_co2_reduction': '2800',
      'site_overall_revenue': '2450.0',
      'site_transformer_load_rate': '42.0'
    }
  }
];

// Direction Rule Interface
export interface DirectionRule {
  mode: 'sign' | 'threshold' | 'enum';
  positiveThreshold?: number;
  negativeThreshold?: number;
  positiveValue?: string;
  negativeValue?: string;
}

// Diagram Element Interface
export interface DiagramElement {
  id: string;
  type: 'Grid' | 'Transformer' | 'Meter' | 'Breaker' | 'Inverter' | 'PV' | 'Battery' | 'EVCharger' | 'Load' | 'DataBox' | 'FlowLine' | 'Busbar' | 'Hydrogen' | 'CustomDevice';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  label?: string;
  title?: string;
  color?: string;
  active?: boolean;
  powerPointKey?: string;
  directionRule?: DirectionRule;
  customIconUrl?: string;
  data?: { label: string; value: string; pointKey?: string }[];
  attachedStartId?: string;
  attachedEndId?: string;
}

// Electrical symbols render functions
const ElectricalSymbols = {
  FlowLine: ({ x1, y1, x2, y2, color = "#10b981", isStopped = false, isReversed = false }: any) => {
    const actX1 = isReversed ? x2 : x1;
    const actY1 = isReversed ? y2 : y1;
    const actX2 = isReversed ? x1 : x2;
    const actY2 = isReversed ? y1 : y2;
    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e2e8f0" strokeWidth="2.5" />
        {!isStopped && (
          <line 
            x1={actX1} y1={actY1} x2={actX2} y2={actY2} 
            stroke={color} 
            strokeWidth="2.5" 
            strokeDasharray="8 8" 
            className="flow-line" 
          />
        )}
      </g>
    );
  },
  Grid: ({ x, y, label = "市电网" }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="0" r="15" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
      <path d="M -10 0 Q -5 -10 0 0 T 10 0" fill="none" stroke="#10b981" strokeWidth="2.5" />
      {label && <text x="24" y="5" fill="#10b981" fontSize="13" fontWeight="bold">{label}</text>}
    </g>
  ),
  Meter: ({ x, y, label }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-12" y="-12" width="24" height="24" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" rx="2" />
      <text x="0" y="4" fill="#8b5cf6" fontSize="11" textAnchor="middle" fontWeight="bold">M</text>
      {label && <text x="20" y="4" fill="#475569" fontSize="11" fontWeight="500">{label}</text>}
    </g>
  ),
  Transformer: ({ x, y, label }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="-9" r="12" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="0" cy="9" r="12" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
      {label && <text x="24" y="4" fill="#3b82f6" fontSize="11" fontWeight="500">{label}</text>}
    </g>
  ),
  Breaker: ({ x, y, label }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-7" y="-7" width="14" height="14" fill="#ef4444" stroke="#fff" strokeWidth="1" rx="1" />
      {label && <text x="14" y="4" fill="#64748b" fontSize="10">{label}</text>}
    </g>
  ),
  Inverter: ({ x, y, label }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-16" y="-16" width="32" height="32" fill="#ffffff" stroke="#64748b" strokeWidth="2" rx="3" />
      <line x1="-16" y1="-16" x2="16" y2="16" stroke="#94a3b8" strokeWidth="1" />
      <text x="-10" y="-3" fill="#64748b" fontSize="9" fontWeight="bold">DC</text>
      <text x="1" y="10" fill="#64748b" fontSize="9" fontWeight="bold">AC</text>
      {label && <text x="22" y="4" fill="#475569" fontSize="11">{label}</text>}
    </g>
  ),
  PV: ({ x, y, label = "光伏阵列" }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-22" y="-11" width="44" height="22" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" rx="2" />
      <line x1="-11" y1="-11" x2="-11" y2="11" stroke="#3b82f6" strokeWidth="1" />
      <line x1="0" y1="-11" x2="0" y2="11" stroke="#3b82f6" strokeWidth="1" />
      <line x1="11" y1="-11" x2="11" y2="11" stroke="#3b82f6" strokeWidth="1" />
      <line x1="-22" y1="0" x2="22" y2="0" stroke="#3b82f6" strokeWidth="1" />
      <text x="0" y="26" fill="#3b82f6" fontSize="11" textAnchor="middle" fontWeight="bold">{label}</text>
    </g>
  ),
  Battery: ({ x, y, label = "储能电池" }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-14" y="-20" width="28" height="40" fill="#ffffff" stroke="#10b981" strokeWidth="2" rx="3" />
      <rect x="-5" y="-24" width="10" height="4" fill="#10b981" rx="1" />
      <line x1="-8" y1="-6" x2="8" y2="-6" stroke="#10b981" strokeWidth="2" />
      <line x1="0" y1="-11" x2="0" y2="-1" stroke="#10b981" strokeWidth="2" />
      <line x1="-8" y1="10" x2="8" y2="10" stroke="#10b981" strokeWidth="2" />
      <text x="0" y="34" fill="#10b981" fontSize="11" textAnchor="middle" fontWeight="bold">{label}</text>
    </g>
  ),
  EVCharger: ({ x, y, label = "充电桩群" }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-12" y="-20" width="24" height="40" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" rx="3" />
      <circle cx="0" cy="-8" r="4" fill="#f59e0b" />
      <path d="M 12 -4 Q 20 -4 20 4 L 20 12" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
      <rect x="17" y="12" width="6" height="8" fill="#f59e0b" rx="1" />
      <text x="0" y="34" fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="bold">{label}</text>
    </g>
  ),
  Load: ({ x, y, label = "常规负荷" }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <path d="M 0 -12 L 0 4 L -8 -4 M 0 4 L 8 -4" fill="none" stroke="#64748b" strokeWidth="2" />
      <rect x="-16" y="4" width="32" height="16" fill="#ffffff" stroke="#64748b" strokeWidth="2" rx="2" />
      <text x="0" y="34" fill="#64748b" fontSize="11" textAnchor="middle" fontWeight="bold">{label}</text>
    </g>
  ),
  Hydrogen: ({ x, y, label = "制氢设备" }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="-18" y="-20" width="36" height="40" fill="#ffffff" stroke="#0284c7" strokeWidth="2" rx="3" />
      <circle cx="-5" cy="-2" r="5" fill="none" stroke="#0284c7" strokeWidth="1.5" />
      <text x="-5" y="1" fill="#0284c7" fontSize="7" textAnchor="middle" fontWeight="bold">H</text>
      <circle cx="5" cy="4" r="5" fill="none" stroke="#0284c7" strokeWidth="1.5" />
      <text x="5" y="7" fill="#0284c7" fontSize="7" textAnchor="middle" fontWeight="bold">H</text>
      <line x1="-1" y1="0" x2="1" y2="2" stroke="#0284c7" strokeWidth="1.5" />
      <text x="0" y="34" fill="#0284c7" fontSize="11" textAnchor="middle" fontWeight="bold">{label}</text>
    </g>
  ),
  CustomDevice: ({ x, y, label = "自定义设备", customIconUrl }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      {customIconUrl ? (
        <image href={customIconUrl} x="-18" y="-18" width="36" height="36" />
      ) : (
        <rect x="-18" y="-18" width="36" height="36" fill="#ffffff" stroke="#6366f1" strokeWidth="2" rx="6" />
      )}
      <text x="0" y="30" fill="#4338ca" fontSize="11" textAnchor="middle" fontWeight="bold">{label}</text>
    </g>
  ),
  DataBox: ({ x, y, title, data = [], color = '#3b82f6', active = true }: any) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect x="0" y="0" width="160" height={24 + data.length * 20} fill="#ffffff" stroke={color} strokeWidth="1.5" rx="6" opacity="0.98" className="shadow-sm" />
      <rect x="0" y="0" width="160" height="24" fill={color} opacity="0.1" rx="6" />
      <text x="10" y="16" fill={color} fontSize="11" fontWeight="bold">{title}</text>
      {active && <circle cx="145" cy="12" r="3.5" fill="#10b981" className="animate-pulse" />}
      {data.map((item: any, i: number) => (
        <g key={i} transform={`translate(10, ${40 + i * 20})`}>
          <text x="0" y="0" fill="#64748b" fontSize="10" fontWeight="500">{item.label}</text>
          <text x="140" y="0" fill="#1e293b" fontSize="10.5" textAnchor="end" fontWeight="bold">{item.value || '-'}</text>
        </g>
      ))}
    </g>
  )
};

// Standard Asset Library
const ASSET_LIBRARY = [
  { type: 'Grid', name: '电网', icon: Zap, desc: '接入电力线路' },
  { type: 'Transformer', name: '变压器', icon: Cpu, desc: '降压变配电变压器' },
  { type: 'Meter', name: '关口表', icon: Activity, desc: '多功能关口电能计量表' },
  { type: 'Breaker', name: '断路器', icon: ToggleLeft, desc: '物理开关断路保护' },
  { type: 'Inverter', name: '变流器', icon: RefreshCw, desc: '双向储能变流器 (PCS)' },
  { type: 'PV', name: '光伏', icon: Sun, desc: '分布式光伏发电组件' },
  { type: 'Battery', name: '储能', icon: BatteryCharging, desc: '高压储能电池系统' },
  { type: 'Hydrogen', name: '制氢设备', icon: RefreshCw, desc: '电解水制氢设备' },
  { type: 'EVCharger', name: '充电桩', icon: ZapOff, desc: '充电设施终端用电设备' },
  { type: 'Load', name: '常规负荷', icon: ArrowDown, desc: '常规电力消费负荷' },
  { type: 'DataBox', name: '数据箱', icon: Database, desc: '遥测参数监视数据箱' },
  { type: 'FlowLine', name: '连线', icon: GitCommit, desc: '带潮流方向的拓扑连接线' },
  { type: 'Busbar', name: '母线', icon: Minus, desc: '高载流汇流铜母线' },
];

// Device & Telemetry Data Structures (Prompt 10: 1.1 Device binding with name/SN search; 1.2 Site-level metrics)
export interface DeviceInfo {
  id: string;
  name: string;
  sn: string;
  category: string;
  location?: string;
  points: { key: string; name: string; unit: string }[];
}

export interface SiteMetricInfo {
  key: string;
  name: string;
  unit: string;
  category: string;
}

export const DEVICE_LIST: DeviceInfo[] = [
  {
    id: 'dev_meter_01',
    name: '1# 高压关口表',
    sn: 'METER-2026-001',
    category: '电能计量仪表',
    location: '10kV 进线配电房',
    points: [
      { key: 'meter_active_power', name: '关口表有功功率', unit: 'kW' },
      { key: 'meter_reactive_power', name: '关口表无功功率', unit: 'kvar' },
      { key: 'meter_pf', name: '关口表功率因数', unit: '' },
      { key: 'meter_forward_active', name: '关口表正向有功电量', unit: 'kWh' },
      { key: 'meter_reverse_active', name: '关口表反向有功电量', unit: 'kWh' },
    ]
  },
  {
    id: 'dev_pv_inv_01',
    name: '1# 光伏逆变器 (500kW)',
    sn: 'PV-INV-2026-01',
    category: '光伏发电设备',
    location: '1# 厂房屋顶',
    points: [
      { key: 'pv1_power', name: '1# 光伏当前发电功率', unit: 'kW' },
      { key: 'pv1_daily_gen', name: '1# 光伏当日发电量', unit: 'kWh' },
      { key: 'pv1_total_gen', name: '1# 光伏累计发电量', unit: 'MWh' },
    ]
  },
  {
    id: 'dev_pv_inv_02',
    name: '2# 光伏逆变器 (500kW)',
    sn: 'PV-INV-2026-02',
    category: '光伏发电设备',
    location: '2# 厂房屋顶',
    points: [
      { key: 'pv2_power', name: '2# 光伏当前发电功率', unit: 'kW' },
      { key: 'pv2_daily_gen', name: '2# 光伏当日发电量', unit: 'kWh' },
      { key: 'pv2_total_gen', name: '2# 光伏累计发电量', unit: 'MWh' },
    ]
  },
  {
    id: 'dev_pv_inv_03',
    name: '3# 光伏逆变器 (500kW)',
    sn: 'PV-INV-2026-03',
    category: '光伏发电设备',
    location: '3# 车间屋顶',
    points: [
      { key: 'pv3_power', name: '3# 光伏当前发电功率', unit: 'kW' },
      { key: 'pv3_daily_gen', name: '3# 光伏当日发电量', unit: 'kWh' },
      { key: 'pv3_total_gen', name: '3# 光伏累计发电量', unit: 'MWh' },
    ]
  },
  {
    id: 'dev_bess_pcs_01',
    name: '1# 储能变流器 (PCS 1MW)',
    sn: 'BESS-PCS-2026-A1',
    category: '储能变流系统',
    location: '储能集装箱 A 区',
    points: [
      { key: 'bess_power', name: '储能当前充放功率', unit: 'kW' },
      { key: 'bess_pcs_freq', name: 'PCS 输出频率', unit: 'Hz' },
    ]
  },
  {
    id: 'dev_bess_bms_01',
    name: '1# 储能电池堆 (BMS)',
    sn: 'BESS-BMS-2026-B1',
    category: '电池管理系统',
    location: '储能集装箱 A 区',
    points: [
      { key: 'bess_soc', name: '储能电池 SOC 电量', unit: '%' },
      { key: 'bess_soh', name: '储能电池 SOH 健康度', unit: '%' },
      { key: 'bess_charge_daily', name: '储能当日充电量', unit: 'kWh' },
      { key: 'bess_discharge_daily', name: '储能当日放电量', unit: 'kWh' },
    ]
  },
  {
    id: 'dev_h2_01',
    name: '1# 电解水制氢系统',
    sn: 'H2-EL-2026-H1',
    category: '制氢设备',
    location: '制氢车间',
    points: [
      { key: 'h2_power', name: '制氢用电功率', unit: 'kW' },
      { key: 'h2_rate', name: '实时产氢速率', unit: 'Nm³/h' },
      { key: 'h2_daily_prod', name: '当日累计产氢量', unit: 'Nm³' },
      { key: 'h2_daily_power', name: '当日制氢用电量', unit: 'kWh' },
    ]
  },
  {
    id: 'dev_ev_charger_01',
    name: '1# 直流快充桩群',
    sn: 'EV-CHG-2026-C1',
    category: '充电基础设施',
    location: '园区地面停车场',
    points: [
      { key: 'ev_power', name: '充电桩群总功率', unit: 'kW' },
      { key: 'ev_daily_energy', name: '充电桩当日充电量', unit: 'kWh' },
    ]
  },
  {
    id: 'dev_trans_01',
    name: '1# 车间配电变压器',
    sn: 'TRANS-2026-T1',
    category: '变配电设备',
    location: '变电所 1# 变压器室',
    points: [
      { key: 'load_power', name: '厂区常规负荷功率', unit: 'kW' },
      { key: 'trans_load_rate', name: '变压器实时负荷率', unit: '%' },
    ]
  }
];

export const SITE_LEVEL_METRICS: SiteMetricInfo[] = [
  { key: 'site_active_power', name: '站点关口下网总功率', unit: 'kW', category: '总体负荷与功率' },
  { key: 'site_pv_total_power', name: '站点光伏实时总发功率', unit: 'kW', category: '总体负荷与功率' },
  { key: 'site_bess_total_power', name: '站点储能实时充放总功率', unit: 'kW', category: '总体负荷与功率' },
  { key: 'site_load_total_power', name: '站点全厂负荷总消耗功率', unit: 'kW', category: '总体负荷与功率' },
  { key: 'site_monthly_max_demand', name: '站点月度最大需量', unit: 'kW', category: '电量与需量' },
  { key: 'site_daily_green_ratio', name: '站点当日绿电消纳率', unit: '%', category: '电量与需量' },
  { key: 'site_daily_co2_reduction', name: '站点当日碳减排量', unit: 'kg', category: '能效与碳排' },
  { key: 'site_overall_revenue', name: '站点当日综合经济收益', unit: '元', category: '能效与碳排' },
  { key: 'site_transformer_load_rate', name: '站点主变压器平均负载率', unit: '%', category: '设备运行健康' },
];

export const UNIFIED_TELEMETRY_POINTS = [
  ...DEVICE_LIST.flatMap(dev =>
    dev.points.map(pt => ({
      key: pt.key,
      name: `[${dev.name}] ${pt.name}`,
      unit: pt.unit,
      category: dev.category
    }))
  ),
  ...SITE_LEVEL_METRICS.map(m => ({
    key: m.key,
    name: `[站点指标] ${m.name}`,
    unit: m.unit,
    category: m.category
  }))
];

export const getPointDisplayName = (pointKey?: string): string => {
  if (!pointKey) return '-- 未绑定 --';
  
  // 1. Search in Device Points
  for (const dev of DEVICE_LIST) {
    const pt = dev.points.find(p => p.key === pointKey);
    if (pt) {
      return `[${dev.name}] ${pt.name}`;
    }
  }

  // 2. Search in Site Level Metrics
  const sitePt = SITE_LEVEL_METRICS.find(m => m.key === pointKey);
  if (sitePt) {
    return `[站点指标] ${sitePt.name}`;
  }

  return pointKey;
};

interface ConfigurationEditorPageProps {
  isEmbedded?: boolean;
  /** 指定要打开的组态 id（站点工作台「组态管理」点编辑时由新标签页 URL 传入）；缺省取「使用中」的那一个 */
  configId?: string;
  /** 站点名，仅用于页头归属提示 */
  stationName?: string;
}

const ConfigurationEditorPage: React.FC<ConfigurationEditorPageProps> = ({
  isEmbedded = false,
  configId,
  stationName,
}) => {
  // Role & Permissions State
  const [userRole, setUserRole] = useState<UserRole>(getCurrentRole());
  // 独立编辑入口（带 configId）直接进入编辑态；内嵌展示视图保持只读
  const [isEditMode, setIsEditMode] = useState<boolean>(!isEmbedded && !!configId);

  // Site Configurations Management State
  const [configsList, setConfigsList] = useState<SiteConfig[]>([]);
  const [currentConfigId, setCurrentConfigId] = useState<string>('');
  const [isLoadingConfigs, setIsLoadingConfigs] = useState<boolean>(true);

  // Modals & Menus state
  const [showConfigManagerModal, setShowConfigManagerModal] = useState<boolean>(false);
  const [showConfigActionsMenu, setShowConfigActionsMenu] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newConfigName, setNewConfigName] = useState<string>('');
  const [showCustomDeviceModal, setShowCustomDeviceModal] = useState<boolean>(false);
  const [customDevName, setCustomDevName] = useState<string>('');
  const [customDevIconUrl, setCustomDevIconUrl] = useState<string>('');

  // Diagram Elements state (Initial state empty array as per Prompt 1)
  const [elements, setElements] = useState<DiagramElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('组态已保存至服务端');

  // Telemetry Binding Modal States (Prompt 10)
  const [showPointModal, setShowPointModal] = useState<boolean>(false);
  const [pointModalTarget, setPointModalTarget] = useState<{
    type: 'flowline' | 'databox_row';
    rowIndex?: number;
  } | null>(null);
  const [modalTab, setModalTab] = useState<'device' | 'site'>('device');
  const [deviceSearchQuery, setDeviceSearchQuery] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('dev_meter_01');
  const [siteMetricSearchQuery, setSiteMetricSearchQuery] = useState<string>('');

  // SCADA Simulation Engine States
  const [activeScenarioId, setActiveScenarioId] = useState<string>('midday_solar_peak');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [inspectingDeviceId, setInspectingDeviceId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showFlowAnimation, setShowFlowAnimation] = useState<boolean>(true);
  const [customDeviceTripped, setCustomDeviceTripped] = useState<Record<string, boolean>>({});

  // Telemetry real-time values (independent random fluctuations as per Prompt 6)
  const [telemetry, setTelemetry] = useState<Record<string, { name: string; value: string; unit: string }>>({
    'meter_active_power': { name: '关口表有功功率', value: '12.5', unit: 'kW' },
    'meter_reactive_power': { name: '关口表无功功率', value: '-15.0', unit: 'kvar' },
    'meter_pf': { name: '关口表功率因数', value: '0.99', unit: '' },
    'meter_forward_active': { name: '关口表正向有功电量', value: '45200', unit: 'kWh' },
    'meter_reverse_active': { name: '关口表反向有功电量', value: '1250', unit: 'kWh' },
    'pv1_power': { name: '1#屋顶光伏功率', value: '245.0', unit: 'kW' },
    'pv1_daily_gen': { name: '1#屋顶当日发电', value: '1120', unit: 'kWh' },
    'pv1_total_gen': { name: '1#光伏累计发电', value: '28.4', unit: 'MWh' },
    'pv2_power': { name: '2#车棚光伏功率', value: '215.5', unit: 'kW' },
    'pv2_daily_gen': { name: '2#车棚当日发电', value: '980', unit: 'kWh' },
    'pv2_total_gen': { name: '2#光伏累计发电', value: '24.1', unit: 'MWh' },
    'pv3_power': { name: '3#追踪光伏功率', value: '0.0', unit: 'kW' },
    'pv3_daily_gen': { name: '3#光伏当日发电', value: '0', unit: 'kWh' },
    'pv3_total_gen': { name: '3#光伏累计发电', value: '12.6', unit: 'MWh' },
    'bess_power': { name: '储能系统当前充放功率', value: '-220.0', unit: 'kW' },
    'bess_soc': { name: '储能电池 SOC 电量', value: '78.5', unit: '%' },
    'bess_soh': { name: '储能电池 SOH 健康度', value: '98.8', unit: '%' },
    'bess_charge_daily': { name: '储能当日充电量', value: '1650', unit: 'kWh' },
    'bess_discharge_daily': { name: '储能当日放电量', value: '920', unit: 'kWh' },
    'h2_power': { name: '制氢设备用电功率', value: '200.0', unit: 'kW' },
    'h2_rate': { name: '制氢设备实时产氢速率', value: '40.0', unit: 'Nm³/h' },
    'h2_daily_prod': { name: '制氢设备当日产氢量', value: '480', unit: 'Nm³' },
    'h2_daily_power': { name: '制氢设备当日用电量', value: '2400', unit: 'kWh' },
    'ev_power': { name: '充电桩群总功率', value: '60.0', unit: 'kW' },
    'load_power': { name: '厂区常规负荷功率', value: '180.0', unit: 'kW' },
    'site_active_power': { name: '站点关口下网总功率', value: '12.5', unit: 'kW' },
    'site_pv_total_power': { name: '站点光伏实时总发功率', value: '460.5', unit: 'kW' },
    'site_bess_total_power': { name: '站点储能实时充放总功率', value: '-220.0', unit: 'kW' },
    'site_load_total_power': { name: '站点全厂负荷总消耗功率', value: '440.0', unit: 'kW' },
    'site_monthly_max_demand': { name: '站点月度最大需量', value: '290.0', unit: 'kW' },
    'site_daily_green_ratio': { name: '站点当日绿电消纳率', value: '99.2', unit: '%' },
    'site_daily_co2_reduction': { name: '站点当日碳减排量', value: '4850', unit: 'kg' },
    'site_overall_revenue': { name: '站点当日综合经济收益', value: '4120.5', unit: '元' },
    'site_transformer_load_rate': { name: '站点主变压器平均负载率', value: '42.5', unit: '%' }
  });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // Mouse wheel zoom support for wiring diagram canvas
  useEffect(() => {
    // 内嵌视图整幅自适应卡片，不走缩放，也不拦截滚轮（否则卡片会吃掉页面滚动）
    if (isEmbedded) return;
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent parent scroll / browser zoom
      e.preventDefault();

      // Zoom step calculation: scroll up -> zoom in, scroll down -> zoom out
      const delta = e.deltaY;
      const step = delta < 0 ? 8 : -8;

      setZoomLevel(prev => {
        const next = prev + step;
        return Math.min(250, Math.max(40, next));
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [elements.length, isEmbedded]);

  // Drag states
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    startX2?: number;
    startY2?: number;
    startMouseX: number;
    startMouseY: number;
    type: 'component' | 'line-start' | 'line-end' | 'line-whole';
  } | null>(null);

  const [activeSnap, setActiveSnap] = useState<{ x: number; y: number; name: string } | null>(null);
  const [activeAlignmentLines, setActiveAlignmentLines] = useState<{ type: 'horizontal' | 'vertical'; value: number }[]>([]);

  // Undo / Redo stacks
  const [history, setHistory] = useState<DiagramElement[][]>([]);
  const [future, setFuture] = useState<DiagramElement[][]>([]);
  const originalElementsRef = useRef<DiagramElement[] | null>(null);

  // Listener for prototype role changes
  useEffect(() => {
    const handleRoleChange = () => {
      const role = getCurrentRole();
      setUserRole(role);
      if (role === 'viewer') {
        setIsEditMode(false);
      }
    };
    window.addEventListener('role_changed', handleRoleChange);
    return () => window.removeEventListener('role_changed', handleRoleChange);
  }, []);

  // Fetch initial configs list (Prompt 14, 16)
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingConfigs(true);
      try {
        // 内嵌视图（监控概览卡片内）使用精简组态，与整页全景组态解耦：
        // 全景组态元件多、画布大，塞进卡片会超框且缩到看不清。
        if (isEmbedded) {
          const embedded = await getEmbeddedConfig();
          setConfigsList([embedded]);
          setCurrentConfigId(embedded.id);
          setElements(embedded.elements || []);
          return;
        }
        const configs = await getConfigs('site-1');
        setConfigsList(configs);
        if (configs.length > 0) {
          // 指定了 configId 就直接定位到该组态，否则退回「使用中」的那一张
          const target = (configId && configs.find(c => c.id === configId))
            || configs.find(c => c.status === 'in_use')
            || configs[0];
          setCurrentConfigId(target.id);
          setElements(target.elements || []);
        } else {
          setElements([]);
        }
      } catch (err) {
        console.error('Failed to load site configs', err);
      } finally {
        setIsLoadingConfigs(false);
      }
    }
    loadInitialData();
  }, [isEmbedded, configId]);

  // Switch active config
  const handleSwitchConfig = async (configId: string) => {
    if (!configId) return;
    setIsLoadingConfigs(true);
    try {
      const config = await getConfigById(configId);
      if (config) {
        setCurrentConfigId(config.id);
        setElements(config.elements || []);
        setSelectedId(null);
        setHistory([]);
        setFuture([]);
      }
    } catch (e) {
      alert('切换组态失败');
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  // Create new config (Prompt 13)
  const handleConfirmCreateConfig = async () => {
    if (!newConfigName.trim()) {
      alert('请输入组态名称');
      return;
    }
    try {
      const created = await createConfig(newConfigName.trim());
      const updatedList = await getConfigs('site-1');
      setConfigsList(updatedList);
      setCurrentConfigId(created.id);
      setElements([]); // New config starts empty as per Prompt 1, 13
      setShowCreateModal(false);
      setNewConfigName('');
      setIsEditMode(true);
      setSelectedId(null);
      setHistory([]);
      setFuture([]);
    } catch (e) {
      alert('创建新组态失败');
    }
  };

  // Copy current config (Prompt 13)
  const handleCopyCurrentConfig = async () => {
    if (!currentConfigId) return;
    try {
      const copy = await copyConfig(currentConfigId);
      const updatedList = await getConfigs('site-1');
      setConfigsList(updatedList);
      setCurrentConfigId(copy.id);
      setElements(copy.elements || []);
      setToastMsg('已基于当前组态成功创建副本！');
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    } catch (e: any) {
      alert(e.message || '复制组态失败');
    }
  };

  // Switch status for a specific config or current config
  const handleStatusChange = async (targetConfigId: string, newStatus: 'in_use' | 'editing' | 'unused') => {
    if (!targetConfigId) return;
    const curr = configsList.find(c => c.id === targetConfigId);
    if (!curr) return;
    if (curr.status === newStatus) return;

    try {
      setIsLoadingConfigs(true);
      await updateConfigStatus(targetConfigId, newStatus);
      const updatedList = await getConfigs('site-1');
      setConfigsList(updatedList);
      
      const statusText = newStatus === 'in_use' ? '【使用中】主接线' : newStatus === 'editing' ? '【编辑中】' : '【未使用】';
      setToastMsg(`已将“${curr.name}”成功切换为 ${statusText}`);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2500);

      if (newStatus === 'in_use' && targetConfigId !== currentConfigId) {
        handleSwitchConfig(targetConfigId);
      }
    } catch (e: any) {
      alert(e.message || '状态切换失败');
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  // Delete current config or target config
  const handleDeleteConfigById = async (targetConfigId?: string) => {
    const idToDelete = targetConfigId || currentConfigId;
    if (!idToDelete) return;
    const curr = configsList.find(c => c.id === idToDelete);
    if (!curr) return;

    const confirmText = curr.status === 'in_use' && configsList.length > 1
      ? `确定要删除组态“${curr.name}”吗？\n该组态当前处于【使用中】状态，删除后系统将自动把另一个组态切换为【使用中】。`
      : `确定要删除组态“${curr.name}”吗？此操作无法撤销。`;

    if (window.confirm(confirmText)) {
      try {
        setIsLoadingConfigs(true);
        await deleteConfig(idToDelete);
        const updatedList = await getConfigs('site-1');
        setConfigsList(updatedList);
        setToastMsg(`已成功删除组态“${curr.name}”`);
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 2500);

        if (idToDelete === currentConfigId) {
          if (updatedList.length > 0) {
            const nextConfig = updatedList.find(c => c.status === 'in_use') || updatedList[0];
            setCurrentConfigId(nextConfig.id);
            setElements(nextConfig.elements || []);
          } else {
            setCurrentConfigId('');
            setElements([]);
          }
        }
      } catch (e: any) {
        alert(e.message || '删除失败');
      } finally {
        setIsLoadingConfigs(false);
      }
    }
  };

  // Save current config to mock backend API (Prompt 14)
  const handleSaveToBackend = async () => {
    if (!currentConfigId) return;
    try {
      await updateConfig(currentConfigId, { elements });
      const updatedList = await getConfigs('site-1');
      setConfigsList(updatedList);
      setToastMsg('组态已成功保存至服务端！');
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    } catch (e) {
      alert('保存失败，请重试');
    }
  };

  // Telemetry Auto Simulation: Independent fluctuations with scenario awareness & speed control
  useEffect(() => {
    if (isEditMode || !isSimulating) return;

    const intervalMs = Math.round(2500 / simSpeed);
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          const item = next[k];
          const val = parseFloat(item.value);
          if (!isNaN(val) && Math.abs(val) > 0.05) {
            // Independent small realistic random fluctuation
            const delta = (Math.random() - 0.5) * (Math.abs(val) * 0.018 || 0.5);
            next[k] = {
              ...item,
              value: (val + delta).toFixed(1)
            };
          }
        });
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isEditMode, isSimulating, simSpeed]);

  // Scenario Selection Handler
  const handleSelectScenario = (sc: SimulationScenario) => {
    setActiveScenarioId(sc.id);
    setTelemetry(prev => {
      const next = { ...prev };
      Object.entries(sc.telemetryOverrides).forEach(([k, v]) => {
        if (next[k]) {
          next[k] = { ...next[k], value: v };
        }
      });
      return next;
    });
    setToastMsg(`已切换至仿真工况：${sc.name}`);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2200);
  };

  // Restore Comprehensive Preset Configuration
  const handleRestoreComprehensiveConfig = async () => {
    if (window.confirm('确定要恢复预置的“源网荷储氢充”多能互补全景标准模拟组态吗？\n系统将自动生成包含 10kV高压进线、光伏阵列、储能PCS、电解水制氢站、直流超充群、厂区动力负荷及完整潮流监视的 SCADA 组态拓扑。')) {
      setIsLoadingConfigs(true);
      try {
        // 注意：本接口返回的是「整个组态列表」，不是单个组态（-2.0 原实现按单对象取值，取到 undefined）
        const restored = await resetToDefaultComprehensiveConfig();
        const updatedList = restored.length ? restored : await getConfigs('site-1');
        setConfigsList(updatedList);
        const target = updatedList.find(c => c.status === 'in_use') || updatedList[0];
        setCurrentConfigId(target?.id ?? '');
        setElements(target?.elements || []);
        setSelectedId(null);
        setInspectingDeviceId(null);
        setToastMsg('已恢复全景多能互补标准组态');
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 2500);
      } catch (e: any) {
        alert('恢复失败：' + (e.message || '未知错误'));
      } finally {
        setIsLoadingConfigs(false);
      }
    }
  };

  // Simulate Remote Control on Inspecting Device
  const handleSimulateDeviceControl = (actionType: string, payload?: any) => {
    if (!inspectingDeviceId) return;
    const targetEl = elements.find(el => el.id === inspectingDeviceId);
    const devName = targetEl?.label || targetEl?.title || targetEl?.type || '设备';

    if (actionType === 'toggle_trip') {
      const isTripped = !customDeviceTripped[inspectingDeviceId];
      setCustomDeviceTripped(prev => ({ ...prev, [inspectingDeviceId]: isTripped }));
      setToastMsg(`已模拟【${devName}】${isTripped ? '断路器分闸(断开支路)' : '断路器合闸(投入支路)'}`);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2500);
    } else if (actionType === 'bess_mode') {
      const mode = payload?.mode || 'charge';
      const powerVal = mode === 'charge' ? '-220.0' : mode === 'discharge' ? '350.0' : '0.0';
      setTelemetry(prev => ({
        ...prev,
        'bess_power': { ...prev['bess_power'], value: powerVal }
      }));
      setToastMsg(`储能 PCS 已下发模拟控制：${mode === 'charge' ? '充电 220kW' : mode === 'discharge' ? '放电 350kW' : '待机模式'}`);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2500);
    } else if (actionType === 'h2_adjust') {
      const delta = payload?.delta || 20;
      setTelemetry(prev => {
        const curPower = Math.max(0, Math.min(300, (parseFloat(prev['h2_power']?.value || '200') + delta)));
        const curRate = (curPower * 0.2).toFixed(1);
        return {
          ...prev,
          'h2_power': { ...prev['h2_power'], value: curPower.toFixed(1) },
          'h2_rate': { ...prev['h2_rate'], value: curRate }
        };
      });
      setToastMsg(`制氢站已模拟调节电解负荷：${payload?.delta > 0 ? '+' : ''}${payload?.delta} kW`);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    } else if (actionType === 'pv_mode') {
      const mode = payload?.mode || 'mppt';
      const pv1 = mode === 'mppt' ? '245.0' : '120.0';
      const pv2 = mode === 'mppt' ? '215.5' : '105.0';
      const total = mode === 'mppt' ? '460.5' : '225.0';
      setTelemetry(prev => ({
        ...prev,
        'pv1_power': { ...prev['pv1_power'], value: pv1 },
        'pv2_power': { ...prev['pv2_power'], value: pv2 },
        'site_pv_total_power': { ...prev['site_pv_total_power'], value: total }
      }));
      setToastMsg(`光伏逆变器已执行模拟策略：${mode === 'mppt' ? '全额最大功率跟踪 MPPT' : '限发 50% 降载'}`);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2500);
    }
  };

  const pushToHistory = (current: DiagramElement[]) => {
    setHistory(prev => {
      const next = [...prev, JSON.parse(JSON.stringify(current))];
      if (next.length > 50) return next.slice(next.length - 50);
      return next;
    });
    setFuture([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture(prev => [JSON.parse(JSON.stringify(elements)), ...prev]);
    setElements(previous);
    setHistory(prev => prev.slice(0, prev.length - 1));
    setSelectedId(null);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(elements))]);
    setElements(next);
    setFuture(prev => prev.slice(1));
    setSelectedId(null);
  };

  const handleClearCanvas = () => {
    if (window.confirm('确定要清空当前画布中的所有元件吗？')) {
      pushToHistory(elements);
      setElements([]);
      setSelectedId(null);
    }
  };

  // Add Element at Canvas Center with Offset (Prompt 11)
  const handleAddElement = (type: string, customIcon?: string, customLabel?: string) => {
    const id = `${type.toLowerCase()}-${Date.now()}`;
    let newEl: DiagramElement;

    // Center calculation logic
    let cx = 500;
    let cy = 300;

    // Offset if near existing center
    while (elements.some(e => e.x !== undefined && e.y !== undefined && Math.abs(e.x - cx) < 15 && Math.abs(e.y - cy) < 15)) {
      cx += 20;
      cy += 20;
    }

    if (type === 'FlowLine' || type === 'Busbar') {
      newEl = {
        id,
        type: type as any,
        x1: cx - 100,
        y1: cy,
        x2: cx + 100,
        y2: cy,
        color: type === 'Busbar' ? '#94a3b8' : '#10b981',
        label: type === 'Busbar' ? '母线' : undefined,
        powerPointKey: '',
        directionRule: { mode: 'sign' }
      };
    } else if (type === 'DataBox') {
      newEl = {
        id,
        type: 'DataBox',
        x: cx - 80,
        y: cy - 40,
        title: '数据监控',
        color: '#3b82f6',
        active: true,
        data: [
          { label: '功率', value: '0.0 kW', pointKey: '' },
          { label: '电压', value: '400 V', pointKey: '' }
        ]
      };
    } else if (type === 'CustomDevice') {
      newEl = {
        id,
        type: 'CustomDevice',
        x: cx,
        y: cy,
        label: customLabel || '自定义设备',
        customIconUrl: customIcon
      };
    } else {
      newEl = {
        id,
        type: type as any,
        x: cx,
        y: cy,
        label: type === 'Breaker' ? '断路器' : type === 'Transformer' ? '变压器' : type === 'Inverter' ? '变流器' : type === 'Grid' ? '电网' : type === 'Meter' ? '关口表' : ''
      };
    }

    pushToHistory(elements);
    setElements(prev => [...prev, newEl]);
    setSelectedId(id); // Auto select new element (Prompt 11)
  };

  // Upload Custom Icon & Add Custom Device (Prompt 10)
  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setCustomDevIconUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmAddCustomDevice = () => {
    if (!customDevName.trim()) {
      alert('请输入设备名称');
      return;
    }
    handleAddElement('CustomDevice', customDevIconUrl, customDevName.trim());
    setShowCustomDeviceModal(false);
    setCustomDevName('');
    setCustomDevIconUrl('');
  };

  const handleRemoveElement = (id: string) => {
    pushToHistory(elements);
    setElements(prev => prev
      .filter(el => el.id !== id)
      .map(el => {
        if (el.type === 'FlowLine' || el.type === 'Busbar') {
          const nextEl = { ...el };
          let changed = false;
          if (el.attachedStartId === id) {
            delete nextEl.attachedStartId;
            changed = true;
          }
          if (el.attachedEndId === id) {
            delete nextEl.attachedEndId;
            changed = true;
          }
          return changed ? nextEl : el;
        }
        return el;
      })
    );
    if (selectedId === id) setSelectedId(null);
  };

  const updateSelectedElement = (fields: Partial<DiagramElement>) => {
    if (!selectedId) return;
    pushToHistory(elements);
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        return { ...el, ...fields };
      }
      return el;
    }));
  };

  // Drag handlers
  const handleMouseDownComp = (e: React.MouseEvent, id: string, curX: number, curY: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedId(id);
    originalElementsRef.current = JSON.parse(JSON.stringify(elements));
    setDragging({
      id,
      startX: curX,
      startY: curY,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      type: 'component'
    });
  };

  const handleMouseDownLineWhole = (e: React.MouseEvent, id: string, x1: number, y1: number, x2: number, y2: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedId(id);
    originalElementsRef.current = JSON.parse(JSON.stringify(elements));
    setDragging({
      id,
      startX: x1,
      startY: y1,
      startX2: x2,
      startY2: y2,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      type: 'line-whole'
    });
  };

  const handleMouseDownAnchor = (e: React.MouseEvent, id: string, anchorType: 'line-start' | 'line-end', curX: number, curY: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedId(id);
    originalElementsRef.current = JSON.parse(JSON.stringify(elements));
    setDragging({
      id,
      startX: curX,
      startY: curY,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      type: anchorType
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startMouseX;
    const dy = e.clientY - dragging.startMouseY;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const scaleX = 1200 / svgRect.width;
    const scaleY = 850 / svgRect.height;

    const deltaX = Math.round(dx * scaleX);
    const deltaY = Math.round(dy * scaleY);

    const snapX = Math.round(deltaX / 5) * 5;
    const snapY = Math.round(deltaY / 5) * 5;

    let activeSnapObj: { x: number; y: number; name: string; targetId?: string } | null = null;

    if (dragging.type === 'line-start' || dragging.type === 'line-end') {
      const rawTargetX = dragging.startX + snapX;
      const rawTargetY = dragging.startY + snapY;

      let targetX = rawTargetX;
      let targetY = rawTargetY;
      let snapCandidate: { x: number; y: number; name: string; targetId?: string } | null = null;
      let closestDist = Infinity;

      elements.forEach(el => {
        if (el.id === dragging.id) return;
        if (el.x !== undefined && el.y !== undefined) {
          const dist = Math.hypot(rawTargetX - el.x, rawTargetY - el.y);
          if (dist < 30 && dist < closestDist) {
            closestDist = dist;
            snapCandidate = { x: el.x, y: el.y, name: el.label || el.title || el.type, targetId: el.id };
          }
        }
      });

      if (!snapCandidate) {
        elements.forEach(el => {
          if (el.id === dragging.id) return;
          if (el.type === 'FlowLine' || el.type === 'Busbar') {
            if (el.x1 !== undefined && el.y1 !== undefined) {
              const dist = Math.hypot(rawTargetX - el.x1, rawTargetY - el.y1);
              if (dist < 20 && dist < closestDist) {
                closestDist = dist;
                snapCandidate = { x: el.x1, y: el.y1, name: el.label || (el.type === 'Busbar' ? '母线端点' : '连线端点') };
              }
            }
            if (el.x2 !== undefined && el.y2 !== undefined) {
              const dist = Math.hypot(rawTargetX - el.x2, rawTargetY - el.y2);
              if (dist < 20 && dist < closestDist) {
                closestDist = dist;
                snapCandidate = { x: el.x2, y: el.y2, name: el.label || (el.type === 'Busbar' ? '母线端点' : '连线端点') };
              }
            }
          }
        });
      }

      if (snapCandidate) {
        targetX = snapCandidate.x;
        targetY = snapCandidate.y;
        activeSnapObj = snapCandidate;
      }

      setActiveSnap(activeSnapObj);

      setElements(prev => prev.map(el => {
        if (el.id !== dragging.id) return el;
        if (dragging.type === 'line-start') {
          return {
            ...el,
            x1: targetX,
            y1: targetY,
            attachedStartId: snapCandidate?.targetId || undefined
          };
        } else {
          return {
            ...el,
            x2: targetX,
            y2: targetY,
            attachedEndId: snapCandidate?.targetId || undefined
          };
        }
      }));
    } else {
      setActiveSnap(null);
      let targetX = dragging.startX + snapX;
      let targetY = dragging.startY + snapY;
      const alignmentGuides: { type: 'horizontal' | 'vertical'; value: number }[] = [];

      if (dragging.type === 'component') {
        elements.forEach(el => {
          if (el.id === dragging.id) return;
          if (el.x !== undefined && el.y !== undefined) {
            if (Math.abs(el.x - targetX) < 10) {
              targetX = el.x;
              alignmentGuides.push({ type: 'vertical', value: el.x });
            }
            if (Math.abs(el.y - targetY) < 10) {
              targetY = el.y;
              alignmentGuides.push({ type: 'horizontal', value: el.y });
            }
          }
        });
      }

      setActiveAlignmentLines(alignmentGuides);

      setElements(prev => {
        const nextElements = prev.map(el => {
          if (el.id !== dragging.id) return el;
          if (dragging.type === 'component') {
            return {
              ...el,
              x: targetX,
              y: targetY
            };
          } else if (dragging.type === 'line-whole') {
            return {
              ...el,
              x1: dragging.startX + snapX,
              y1: dragging.startY + snapY,
              x2: (dragging.startX2 || 0) + snapX,
              y2: (dragging.startY2 || 0) + snapY,
              attachedStartId: undefined,
              attachedEndId: undefined
            };
          }
          return el;
        });

        if (dragging.type === 'component') {
          return nextElements.map(el => {
            if (el.type === 'FlowLine' || el.type === 'Busbar') {
              let updated = false;
              const nextLine = { ...el };
              if (el.attachedStartId === dragging.id) {
                nextLine.x1 = targetX;
                nextLine.y1 = targetY;
                updated = true;
              }
              if (el.attachedEndId === dragging.id) {
                nextLine.x2 = targetX;
                nextLine.y2 = targetY;
                updated = true;
              }
              return updated ? nextLine : el;
            }
            return el;
          });
        }

        return nextElements;
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setActiveSnap(null);
    setActiveAlignmentLines([]);

    if (originalElementsRef.current) {
      const changed = JSON.stringify(originalElementsRef.current) !== JSON.stringify(elements);
      if (changed) {
        setHistory(prev => {
          const next = [...prev, originalElementsRef.current!];
          if (next.length > 50) return next.slice(next.length - 50);
          return next;
        });
        setFuture([]);
      }
      originalElementsRef.current = null;
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);
  const currentConfig = configsList.find(c => c.id === currentConfigId);

  return (
    <div className={`relative flex flex-col h-full bg-slate-50 overflow-hidden ${isEmbedded ? 'rounded-[2.5rem] border border-slate-50 p-2' : configId ? '' : 'rounded-2xl shadow-lg border border-slate-200'}`} id="wiring-diagram-page">
      {/* Toast Alert */}
      {showSaveToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-bold text-sm py-2.5 px-6 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Controls Bar */}
      {!isEmbedded && (
        <div className="p-3.5 bg-white border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          {/* Left: Site Configurations Selector & Simplified Icon Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 归属提示：从站点工作台「组态管理」新标签页打开时显示站点与当前组态 */}
            {stationName && (
              <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-0.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  {stationName}
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                  组态管理 · 编辑中
                </span>
              </div>
            )}
            {/* Unified Capsule: Config Picker + Status Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200">
              <FolderPlus className="w-4 h-4 text-indigo-600 ml-1 shrink-0" />
              <select
                value={currentConfigId}
                onChange={(e) => handleSwitchConfig(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-indigo-500 shadow-2xs max-w-[210px] truncate cursor-pointer"
              >
                {configsList.map(cfg => (
                  <option key={cfg.id} value={cfg.id}>
                    {cfg.name} {cfg.status === 'in_use' ? ' (🟢使用中)' : cfg.status === 'editing' ? ' (🟡编辑中)' : ' (⚪未使用)'}
                  </option>
                ))}
              </select>

              {/* Compact Status Switch Selector */}
              {currentConfig && (
                <select
                  value={currentConfig.status}
                  onChange={(e) => handleStatusChange(currentConfig.id, e.target.value as 'in_use' | 'editing' | 'unused')}
                  className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-hidden transition-all ${
                    currentConfig.status === 'in_use'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : currentConfig.status === 'editing'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="点击直接切换当前组态的使用状态"
                >
                  <option value="in_use">🟢 使用中</option>
                  <option value="editing">🟡 编辑中</option>
                  <option value="unused">⚪ 未使用</option>
                </select>
              )}
            </div>

            {/* Icon Button Group: Create, Copy, Delete, List */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
              {/* 新建图标按钮 */}
              {hasButtonPermission('config_create') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-2xs cursor-pointer"
                  title="新建空白组态"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}

              {/* 复制图标按钮 */}
              <button
                onClick={handleCopyCurrentConfig}
                disabled={!currentConfigId}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                title="复制当前组态副本"
              >
                <Copy className="w-4 h-4 text-slate-600" />
              </button>

              {/* 删除图标按钮 */}
              {hasButtonPermission('config_delete') && (
                <button
                  onClick={() => handleDeleteConfigById(currentConfigId)}
                  disabled={!currentConfigId}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                  title="删除当前组态"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* 列表管理图标按钮 */}
              <button
                onClick={() => setShowConfigManagerModal(true)}
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                title="查看与管理全站组态列表"
              >
                <List className="w-4 h-4" />
                <span className="text-[10px] text-indigo-600 font-mono">({configsList.length})</span>
              </button>

              {/* 一键恢复源网荷储氢充标准全景组态 */}
              <button
                onClick={handleRestoreComprehensiveConfig}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                title="恢复源网荷储氢充多能互补全景标准组态拓扑"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>恢复标准全景组态</span>
              </button>
            </div>
          </div>

          {/* Right: Prototype Role Switcher & Edit Controls */}
          <div className="flex items-center gap-3">
            {/* Prototype Role Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[11px]">原型角色:</span>
              <button
                onClick={() => setCurrentRole(userRole === 'admin' ? 'viewer' : 'admin')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  userRole === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {userRole === 'admin' ? '系统管理员 (Admin)' : '普通观察员 (Viewer)'}
              </button>
            </div>

            {/* View / Edit Mode Switch (Controlled by config_edit permission) */}
            {hasButtonPermission('config_edit') ? (
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
                <button
                  onClick={() => { setIsEditMode(false); setSelectedId(null); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isEditMode
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  运行监视
                </button>
                <button
                  onClick={() => setIsEditMode(true)}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isEditMode
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  拓扑编辑
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                仅监视权限
              </span>
            )}

            {isEditMode && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    history.length > 0
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer'
                      : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                  }`}
                  title="撤销"
                >
                  <Undo className="w-3.5 h-3.5" />
                  撤销 ({history.length})
                </button>
                <button
                  onClick={handleRedo}
                  disabled={future.length === 0}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    future.length > 0
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer'
                      : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                  }`}
                  title="重做"
                >
                  <Redo className="w-3.5 h-3.5" />
                  重做
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1" />

                {hasButtonPermission('config_save') && (
                  <button
                    onClick={handleSaveToBackend}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 px-3.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="保存组态至服务端"
                  >
                    <Save className="w-3.5 h-3.5" />
                    保存组态
                  </button>
                )}

                <button
                  onClick={handleClearCanvas}
                  className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="清空当前画布"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空画布
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCADA Simulation Control & Scenario Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-2 border-b border-indigo-900/50 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        {/* Left: Simulation Scenarios Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-xs font-bold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>仿真工况:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[620px] scrollbar-none">
            {SIMULATION_SCENARIOS.map((sc) => {
              const isActive = activeScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20 scale-[1.02]'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={`${sc.name} - ${sc.description}`}
                >
                  {sc.iconType === 'sun' && <Sun className="w-3 h-3 text-amber-400" />}
                  {sc.iconType === 'zap' && <Zap className="w-3 h-3 text-emerald-400" />}
                  {sc.iconType === 'moon' && <Activity className="w-3 h-3 text-blue-400" />}
                  {sc.iconType === 'droplet' && <Droplets className="w-3 h-3 text-cyan-400" />}
                  {sc.iconType === 'factory' && <Factory className="w-3 h-3 text-orange-400" />}
                  {sc.iconType === 'alert' && <AlertCircle className="w-3 h-3 text-rose-400" />}
                  <span>{sc.name.split('·')[0]}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-900 text-slate-400'}`}>
                    {sc.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Simulation Controls & Canvas View Tools */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Play/Pause & Speed */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/80">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`p-1 px-2 rounded-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isSimulating ? 'bg-emerald-600/90 text-white hover:bg-emerald-600' : 'bg-amber-600/90 text-white hover:bg-amber-600'
              }`}
              title={isSimulating ? '暂停实时遥测仿真' : '恢复实时遥测仿真'}
            >
              {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isSimulating ? '仿真中' : '已暂停'}</span>
            </button>

            <button
              onClick={() => setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 5 : 1)}
              className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-indigo-200 hover:bg-slate-700 cursor-pointer"
              title="切换仿真数据波动刷新倍速"
            >
              {simSpeed}x 倍速
            </button>
          </div>

          {/* Flow Animation Toggle */}
          <button
            onClick={() => setShowFlowAnimation(!showFlowAnimation)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              showFlowAnimation
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="开启/关闭潮流线粒子流动动效"
          >
            <Radio className={`w-3 h-3 ${showFlowAnimation ? 'animate-pulse text-cyan-400' : ''}`} />
            <span>潮流动态</span>
          </button>

          {/* Canvas Zoom Tools */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700/80 text-slate-300">
            <button
              onClick={() => setZoomLevel(prev => Math.max(40, prev - 10))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
              title="缩小画布 (亦可在画布中直接滚动鼠标滚轮)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1 min-w-[36px] text-center text-indigo-200">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(250, prev + 10))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer"
              title="放大画布 (亦可在画布中直接滚动鼠标滚轮)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 hover:bg-slate-700 rounded text-[10px] text-slate-400 hover:text-white font-bold cursor-pointer ml-0.5"
              title="重置缩放为 100%"
            >
              1:1
            </button>
          </div>
        </div>
      </div>

      {/* Main Working Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Asset Library (素材库 - Clean click to add without hover tooltip as per Prompt 12) */}
        {isEditMode && (
          <div className="w-60 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  元件素材库
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">点击元件直接添加至画布中央</p>
              </div>
              <button
                onClick={() => setShowCustomDeviceModal(true)}
                className="text-[10px] text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 flex items-center gap-0.5 cursor-pointer"
                title="上传或自定义新设备"
              >
                <Plus className="w-3 h-3" /> 自定义
              </button>
            </div>

            <div className="p-2.5 grid grid-cols-1 gap-1.5">
              {ASSET_LIBRARY.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => handleAddElement(item.type)}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all shadow-inner">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-700 group-hover:text-indigo-900">{item.name}</div>
                      <div className="text-[9.5px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CENTER: Canvas or Empty States */}
        <div 
          className={`flex-1 relative overflow-hidden flex flex-col ${
            isEditMode ? 'edit-grid bg-slate-100/50' : 'bg-slate-50'
          }`}
          style={isEditMode ? {
            backgroundSize: '20px 20px',
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)'
          } : undefined}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Loading Skeleton */}
          {isLoadingConfigs ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs font-bold text-slate-500">正在同步服务端组态数据...</p>
            </div>
          ) : configsList.length === 0 ? (
            /* Prompt 16: No Configurations Exist Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-md mb-4">
                <FolderPlus className="w-10 h-10" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">暂无组态，请创建第一个组态</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
                当前站点下尚未创建任何电气拓扑组态，您可以点击下方按钮创建一个全新的空白组态项目。
              </p>
              {hasButtonPermission('config_create') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  新建第一个组态
                </button>
              )}
            </div>
          ) : elements.length === 0 ? (
            /* Prompt 1: Config exists but elements array is empty */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto border-2 border-dashed border-slate-200 rounded-3xl m-6 bg-white/60">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <MousePointer className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">请从左侧素材库添加元件或选择已有组态</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                当前组态画布为空白状态。请点击左侧素材库卡片将电气元件添加至画布，或通过顶部菜单切换组态。
              </p>
            </div>
          ) : (
            /* Canvas Render Area */
            <div 
              ref={canvasContainerRef}
              className={`flex-1 flex items-center justify-center relative select-none ${
                isEmbedded ? 'p-2 overflow-hidden' : 'p-4 overflow-auto'
              }`}
            >
              <div 
                className={`flex items-center justify-center ${
                  isEmbedded ? 'w-full h-full' : 'transition-transform duration-150 origin-center'
                }`}
                style={isEmbedded ? undefined : { transform: `scale(${zoomLevel / 100})` }}
              >
                <svg
                  ref={svgRef}
                  viewBox={isEmbedded ? EMBEDDED_VIEWBOX : '0 0 1200 850'}
                  width={isEmbedded ? '100%' : 1200}
                  height={isEmbedded ? '100%' : 850}
                  preserveAspectRatio="xMidYMid meet"
                  className="drop-shadow-md select-none bg-white rounded-2xl border border-slate-200"
                  onClick={() => {
                    if (isEditMode) setSelectedId(null);
                    else setInspectingDeviceId(null);
                  }}
                >
                  <g transform={isEmbedded ? undefined : 'translate(100, 30)'}>
                    <style>
                      {`
                        @keyframes flow { to { stroke-dashoffset: -16; } }
                        .flow-line { animation: ${showFlowAnimation ? 'flow 0.8s linear infinite' : 'none'}; }
                        @keyframes bus-glow { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.35; } }
                        .bus-glow { animation: bus-glow 2.5s ease-in-out infinite; }
                        @keyframes inspect-pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 0.4; } }
                        .inspect-ring { animation: inspect-pulse 1.8s ease-in-out infinite; transform-origin: center; }
                      `}
                    </style>

                    {/* Render FlowLines first */}
                    {elements.filter(el => el.type === 'FlowLine').map(el => {
                      const isSelected = selectedId === el.id;
                      
                      // Direction Rule Evaluation (Prompt 8)
                      let isStopped = false;
                      let isReversed = false;
                      if (el.powerPointKey && telemetry[el.powerPointKey]) {
                        const telItem = telemetry[el.powerPointKey];
                        const val = parseFloat(telItem.value);
                        const rule = el.directionRule || { mode: 'sign' };

                        if (rule.mode === 'threshold') {
                          const posTh = rule.positiveThreshold ?? 5.0;
                          const negTh = rule.negativeThreshold ?? -5.0;
                          if (!isNaN(val)) {
                            if (val > posTh) {
                              isReversed = false;
                              isStopped = false;
                            } else if (val < negTh) {
                              isReversed = true;
                              isStopped = false;
                            } else {
                              isStopped = true;
                            }
                          } else {
                            isStopped = true;
                          }
                        } else if (rule.mode === 'enum') {
                          const strVal = telItem.value.trim();
                          if (strVal === (rule.positiveValue || '1')) {
                            isReversed = false;
                            isStopped = false;
                          } else if (strVal === (rule.negativeValue || '2')) {
                            isReversed = true;
                            isStopped = false;
                          } else {
                            isStopped = true;
                          }
                        } else {
                          // Default Sign Mode: value > 0 positive, value < 0 reverse
                          if (isNaN(val) || Math.abs(val) < 0.01) {
                            isStopped = true;
                          } else if (val < 0) {
                            isReversed = true;
                          }
                        }
                      }

                      return (
                        <g 
                          key={el.id}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (isEditMode) setSelectedId(el.id);
                          }}
                          onMouseDown={(e) => isEditMode && handleMouseDownLineWhole(e, el.id, el.x1 || 0, el.y1 || 0, el.x2 || 0, el.y2 || 0)}
                          className={isEditMode ? "cursor-move group" : "group"}
                        >
                          <line 
                            x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} 
                            stroke="transparent" strokeWidth="12" 
                            className="cursor-pointer"
                          />
                          <ElectricalSymbols.FlowLine 
                            x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} 
                            color={el.color} 
                            isStopped={isStopped} 
                            isReversed={isReversed} 
                          />

                          {isSelected && isEditMode && (
                            <g>
                              <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
                              <circle 
                                cx={el.x1} cy={el.y1} r="6.5" 
                                fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" 
                                className="cursor-pointer hover:scale-125 transition-transform"
                                onMouseDown={(e) => handleMouseDownAnchor(e, el.id, 'line-start', el.x1 || 0, el.y1 || 0)}
                              />
                              <circle 
                                cx={el.x2} cy={el.y2} r="6.5" 
                                fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" 
                                className="cursor-pointer hover:scale-125 transition-transform"
                                onMouseDown={(e) => handleMouseDownAnchor(e, el.id, 'line-end', el.x2 || 0, el.y2 || 0)}
                              />
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Render Busbars (Standard "母线" without voltage prefix - Prompt 7) */}
                    {elements.filter(el => el.type === 'Busbar').map(el => {
                      const isSelected = selectedId === el.id;
                      return (
                        <g 
                          key={el.id}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (isEditMode) setSelectedId(el.id); 
                          }}
                          onMouseDown={(e) => isEditMode && handleMouseDownLineWhole(e, el.id, el.x1 || 0, el.y1 || 0, el.x2 || 0, el.y2 || 0)}
                          className={isEditMode ? "cursor-move" : ""}
                        >
                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={el.color || '#94a3b8'} strokeWidth="10" strokeLinecap="round" className="bus-glow" opacity="0.3" />
                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={el.color || '#64748b'} strokeWidth="6" strokeLinecap="round" />
                          {el.label && (
                            <text x={(el.x1 || 0) + 15} y={(el.y1 || 0) - 10} fill="#475569" fontSize="11" fontWeight="bold">
                              {el.label}
                            </text>
                          )}

                          {isSelected && isEditMode && (
                            <g>
                              <circle 
                                cx={el.x1} cy={el.y1} r="7" 
                                fill="#3b82f6" stroke="#ffffff" strokeWidth="2" 
                                className="cursor-pointer"
                                onMouseDown={(e) => handleMouseDownAnchor(e, el.id, 'line-start', el.x1 || 0, el.y1 || 0)}
                              />
                              <circle 
                                cx={el.x2} cy={el.y2} r="7" 
                                fill="#3b82f6" stroke="#ffffff" strokeWidth="2" 
                                className="cursor-pointer"
                                onMouseDown={(e) => handleMouseDownAnchor(e, el.id, 'line-end', el.x2 || 0, el.y2 || 0)}
                              />
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Render standard nodes & custom devices */}
                    {elements.filter(el => el.type !== 'FlowLine' && el.type !== 'Busbar').map(el => {
                      const isSelected = selectedId === el.id;
                      const isInspecting = inspectingDeviceId === el.id && !isEditMode;

                      // Resolve DataBox single point values (Prompt 4)
                      let resolvedRows = el.data || [];
                      if (el.type === 'DataBox') {
                        resolvedRows = (el.data || []).map(row => {
                          if (row.pointKey && telemetry[row.pointKey]) {
                            const telItem = telemetry[row.pointKey];
                            return {
                              ...row,
                              value: `${telItem.value} ${telItem.unit}`.trim()
                            };
                          }
                          return row;
                        });
                      }

                      return (
                        <g
                          key={el.id}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (isEditMode) {
                              setSelectedId(el.id); 
                            } else {
                              setInspectingDeviceId(el.id);
                            }
                          }}
                          onMouseDown={(e) => isEditMode && handleMouseDownComp(e, el.id, el.x || 0, el.y || 0)}
                          className={isEditMode ? "cursor-move" : "cursor-pointer hover:opacity-95"}
                        >
                          {/* Selection indicator in Edit Mode */}
                          {isSelected && isEditMode && (
                            <g>
                              {el.type === 'DataBox' ? (
                                <rect 
                                  x={(el.x || 0) - 5} 
                                  y={(el.y || 0) - 5} 
                                  width="170" 
                                  height={34 + resolvedRows.length * 20} 
                                  fill="none" 
                                  stroke="#4f46e5" 
                                  strokeWidth="1.5" 
                                  strokeDasharray="4 4" 
                                  rx="8" 
                                />
                              ) : (
                                <circle cx={el.x} cy={el.y} r="32" fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4 4" />
                              )}
                            </g>
                          )}

                          {/* Inspection Halo in Monitoring Mode */}
                          {isInspecting && (
                            <g>
                              {el.type === 'DataBox' ? (
                                <rect 
                                  x={(el.x || 0) - 6} 
                                  y={(el.y || 0) - 6} 
                                  width="172" 
                                  height={36 + resolvedRows.length * 20} 
                                  fill="none" 
                                  stroke="#38bdf8" 
                                  strokeWidth="2.5" 
                                  rx="10" 
                                  className="inspect-ring"
                                />
                              ) : (
                                <circle cx={el.x} cy={el.y} r="34" fill="none" stroke="#38bdf8" strokeWidth="2.5" className="inspect-ring" />
                              )}
                            </g>
                          )}

                          {el.type === 'Grid' && <ElectricalSymbols.Grid x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'Transformer' && <ElectricalSymbols.Transformer x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'Meter' && <ElectricalSymbols.Meter x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'Breaker' && <ElectricalSymbols.Breaker x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'Inverter' && <ElectricalSymbols.Inverter x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'PV' && <ElectricalSymbols.PV x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'Battery' && <ElectricalSymbols.Battery x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'EVCharger' && <ElectricalSymbols.EVCharger x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'Load' && <ElectricalSymbols.Load x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'Hydrogen' && <ElectricalSymbols.Hydrogen x={el.x} y={el.y} label={el.label} />}
                          {el.type === 'CustomDevice' && <ElectricalSymbols.CustomDevice x={el.x} y={el.y} label={el.label} customIconUrl={el.customIconUrl} />}
                          {el.type === 'DataBox' && (
                            <ElectricalSymbols.DataBox 
                              x={el.x} y={el.y} 
                              title={el.title} 
                              color={el.color} 
                              active={el.active} 
                              data={resolvedRows} 
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Active Magnetic Snap Feedback */}
                    {isEditMode && activeSnap && (
                      <g style={{ pointerEvents: 'none' }}>
                        <circle cx={activeSnap.x} cy={activeSnap.y} r="12" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" />
                        <circle cx={activeSnap.x} cy={activeSnap.y} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    )}

                    {/* Alignment Guides */}
                    {isEditMode && activeAlignmentLines.map((line, idx) => (
                      <line
                        key={idx}
                        x1={line.type === 'vertical' ? line.value : 0}
                        y1={line.type === 'horizontal' ? line.value : 0}
                        x2={line.type === 'vertical' ? line.value : 1200}
                        y2={line.type === 'horizontal' ? line.value : 850}
                        stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4"
                        style={{ pointerEvents: 'none' }}
                      />
                    ))}
                  </g>
                </svg>
              </div>

              {/* Floating Canvas Zoom & Mouse Wheel Quick Guide HUD */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-2 text-xs select-none z-10">
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-flex items-center gap-1">
                  <MousePointer className="w-3 h-3 text-indigo-500" />
                  <span>滚轮缩放</span>
                </span>
                <div className="h-3 w-px bg-slate-200 hidden sm:block" />
                <button 
                  onClick={() => setZoomLevel(prev => Math.max(40, prev - 10))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="缩小 (滚轮向下)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-indigo-700 min-w-[38px] text-center text-xs">
                  {zoomLevel}%
                </span>
                <button 
                  onClick={() => setZoomLevel(prev => Math.min(250, prev + 10))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                  title="放大 (滚轮向上)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setZoomLevel(100)}
                  className="px-1.5 py-0.5 hover:bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  title="重置为 100%"
                >
                  1:1
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Property & Telemetry Inspector */}
        {isEditMode && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
            {selectedElement ? (
              <div className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    <span>元件属性配置</span>
                  </h3>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-500 border border-slate-100 space-y-1">
                  <div><span className="font-semibold text-slate-700">唯一标识:</span> {selectedElement.id}</div>
                  <div><span className="font-semibold text-slate-700">元件类型:</span> {selectedElement.type}</div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 block border-t border-slate-100 pt-3">业务参数设置</span>

                  {selectedElement.label !== undefined && (
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">名称 / 编号</label>
                      <input
                        type="text"
                        value={selectedElement.label || ''}
                        onChange={(e) => updateSelectedElement({ label: e.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-indigo-500"
                      />
                    </div>
                  )}

                  {/* FlowLine Custom Direction Rule Configuration (Prompt 8) */}
                  {selectedElement.type === 'FlowLine' && (
                    <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <label className="text-[11px] text-indigo-900 font-bold block">潮流流动规则配置</label>

                      {/* FlowLine Telemetry Point Selector Trigger (Prompt 10) */}
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1 font-semibold">绑定潮流功率/状态测点</label>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 p-2 rounded-xl border border-slate-200 bg-white space-y-0.5 min-w-0">
                            {selectedElement.powerPointKey ? (
                              <>
                                <div className="text-xs font-bold text-indigo-900 truncate">
                                  {getPointDisplayName(selectedElement.powerPointKey)}
                                </div>
                                <div className="text-[9.5px] font-mono text-slate-400 truncate">
                                  Key: {selectedElement.powerPointKey}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs font-semibold text-slate-400">-- 未绑定潮流测点 (无流动) --</div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setPointModalTarget({ type: 'flowline' });
                              setShowPointModal(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 flex items-center gap-1"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            选择测点
                          </button>
                        </div>
                      </div>

                      {/* Direction Rule Mode Selection */}
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1 font-semibold">流动方向规则模式</label>
                        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[10px]">
                          {(['sign', 'threshold', 'enum'] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => {
                                updateSelectedElement({
                                  directionRule: {
                                    ...selectedElement.directionRule,
                                    mode
                                  }
                                });
                              }}
                              className={`py-1 rounded font-bold transition-all ${
                                (selectedElement.directionRule?.mode || 'sign') === mode
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {mode === 'sign' ? '正负模式' : mode === 'threshold' ? '阈值模式' : '枚举模式'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Detailed Mode Settings */}
                      {(selectedElement.directionRule?.mode || 'sign') === 'sign' && (
                        <p className="text-[9.5px] text-slate-500 leading-normal">
                          💡 正负模式：测点值 &gt; 0 时正向流动，值 &lt; 0 时反向流动，值 = 0 时潮流静止。
                        </p>
                      )}

                      {selectedElement.directionRule?.mode === 'threshold' && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 font-bold w-16">正向阈值:</span>
                            <input
                              type="number"
                              value={selectedElement.directionRule?.positiveThreshold ?? 5.0}
                              onChange={(e) => updateSelectedElement({
                                directionRule: { ...selectedElement.directionRule, mode: 'threshold', positiveThreshold: parseFloat(e.target.value) || 0 }
                              })}
                              className="flex-1 p-1 border border-slate-200 rounded text-xs bg-white font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 font-bold w-16">反向阈值:</span>
                            <input
                              type="number"
                              value={selectedElement.directionRule?.negativeThreshold ?? -5.0}
                              onChange={(e) => updateSelectedElement({
                                directionRule: { ...selectedElement.directionRule, mode: 'threshold', negativeThreshold: parseFloat(e.target.value) || 0 }
                              })}
                              className="flex-1 p-1 border border-slate-200 rounded text-xs bg-white font-bold"
                            />
                          </div>
                          <p className="text-[9px] text-slate-400">💡 处于正负阈值之间时，潮流保持静止。</p>
                        </div>
                      )}

                      {selectedElement.directionRule?.mode === 'enum' && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 font-bold w-16">正向匹配值:</span>
                            <input
                              type="text"
                              value={selectedElement.directionRule?.positiveValue ?? '1'}
                              onChange={(e) => updateSelectedElement({
                                directionRule: { ...selectedElement.directionRule, mode: 'enum', positiveValue: e.target.value }
                              })}
                              className="flex-1 p-1 border border-slate-200 rounded text-xs bg-white font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 font-bold w-16">反向匹配值:</span>
                            <input
                              type="text"
                              value={selectedElement.directionRule?.negativeValue ?? '2'}
                              onChange={(e) => updateSelectedElement({
                                directionRule: { ...selectedElement.directionRule, mode: 'enum', negativeValue: e.target.value }
                              })}
                              className="flex-1 p-1 border border-slate-200 rounded text-xs bg-white font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DataBox Data Rows Configuration (Single Point Binding & Max 10 Limit - Prompts 4, 9) */}
                  {selectedElement.type === 'DataBox' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">标题</label>
                        <input
                          type="text"
                          value={selectedElement.title || ''}
                          onChange={(e) => updateSelectedElement({ title: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">主题色调</label>
                        <div className="flex gap-2">
                          {[
                            { val: '#3b82f6', name: '经典蓝' },
                            { val: '#10b981', name: '储能绿' },
                            { val: '#f59e0b', name: '桩群黄' },
                            { val: '#8b5cf6', name: '关口紫' },
                            { val: '#64748b', name: '暗灰色' }
                          ].map((c) => (
                            <button
                              key={c.val}
                              onClick={() => updateSelectedElement({ color: c.val })}
                              className={`w-5 h-5 rounded-full border border-white ring-1 transition-transform cursor-pointer ${
                                selectedElement.color === c.val ? 'ring-slate-900 scale-110' : 'ring-slate-200'
                              }`}
                              style={{ backgroundColor: c.val }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Telemetry rows list with 10 rows limit (Prompt 9) */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-slate-500 font-bold">
                            数据项目列表 ({selectedElement.data?.length || 0}/10)
                          </label>
                          <button
                            onClick={() => {
                              const current = selectedElement.data || [];
                              if (current.length >= 10) return;
                              updateSelectedElement({
                                data: [...current, { label: '新遥测项', value: '0.0', pointKey: '' }]
                              });
                            }}
                            disabled={(selectedElement.data?.length || 0) >= 10}
                            className={`text-[10px] font-bold flex items-center gap-0.5 px-2 py-0.5 rounded transition-all ${
                              (selectedElement.data?.length || 0) >= 10
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 cursor-pointer'
                            }`}
                            title={(selectedElement.data?.length || 0) >= 10 ? '最多添加 10 条数据行' : '添加数据行'}
                          >
                            <Plus className="w-3 h-3" />
                            {(selectedElement.data?.length || 0) >= 10 ? '已达上限 10 条' : '添加数据行'}
                          </button>
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {(selectedElement.data || []).map((row, idx) => (
                            <div key={idx} className="p-2 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5 text-[10px]">
                              <div className="flex items-center justify-between gap-1">
                                <input
                                  type="text"
                                  value={row.label}
                                  placeholder="参数显示名"
                                  onChange={(e) => {
                                    const updated = [...(selectedElement.data || [])];
                                    updated[idx] = { ...row, label: e.target.value };
                                    updateSelectedElement({ data: updated });
                                  }}
                                  className="flex-1 p-1 border border-slate-200 rounded bg-white font-bold text-xs"
                                />
                                <button
                                  onClick={() => {
                                    const updated = (selectedElement.data || []).filter((_, i) => i !== idx);
                                    updateSelectedElement({ data: updated });
                                  }}
                                  className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Single Point Selector Trigger (Prompt 10) */}
                              <div>
                                <label className="text-[9.5px] text-slate-400 font-bold block mb-0.5">绑定测点项目</label>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-1 p-1.5 border border-slate-200 rounded-lg bg-white min-w-0">
                                    {row.pointKey ? (
                                      <div className="text-[11px] font-bold text-indigo-900 truncate">
                                        {getPointDisplayName(row.pointKey)}
                                      </div>
                                    ) : (
                                      <div className="text-[10.5px] font-semibold text-slate-400">-- 静态默认值模式 --</div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setPointModalTarget({ type: 'databox_row', rowIndex: idx });
                                      setShowPointModal(true);
                                    }}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10.5px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                                  >
                                    <Sliders className="w-3 h-3" />
                                    {row.pointKey ? '更换' : '绑定测点'}
                                  </button>
                                </div>
                              </div>

                              {!row.pointKey && (
                                <div>
                                  <input
                                    type="text"
                                    value={row.value}
                                    placeholder="默认显示数值 (如 220 V)"
                                    onChange={(e) => {
                                      const updated = [...(selectedElement.data || [])];
                                      updated[idx] = { ...row, value: e.target.value };
                                      updateSelectedElement({ data: updated });
                                    }}
                                    className="w-full p-1 border border-slate-200 rounded bg-white text-[10px]"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRemoveElement(selectedElement.id)}
                  className="mt-4 w-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  删除该元件
                </button>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center h-full text-center text-slate-400 gap-3 my-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-500 shadow-xs">
                  <MousePointer className="w-6 h-6 text-indigo-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700">拓扑与测点组态模式</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                    点击左侧素材库元件添加至画布，或在组态图中选择任意元件以配置其名称、规则或绑定的测点。
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT PANEL: Device Telemetry & Simulation Control Drawer (Monitoring Mode) */}
        {!isEditMode && inspectingDeviceId && (() => {
          const inspectedEl = elements.find(e => e.id === inspectingDeviceId);
          if (!inspectedEl) return null;

          return (
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto shadow-xl z-20 animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      {inspectedEl.label || inspectedEl.title || inspectedEl.type}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] text-emerald-600 font-bold">在线监控正常</span>
                      <span className="text-[9.5px] text-slate-400 font-mono">({inspectedEl.type})</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingDeviceId(null)}
                  className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4 flex-1">
                {/* Real-time Telemetry Highlights */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>实时遥测工况</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    {inspectedEl.type === 'Battery' && (
                      <>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">充放电功率</div>
                          <div className="text-sm font-extrabold text-indigo-700 font-mono mt-0.5">
                            {telemetry['pcs1_p']?.value || '0.0'} kW
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">荷电状态 SOC</div>
                          <div className="text-sm font-extrabold text-emerald-600 font-mono mt-0.5">
                            {telemetry['bess1_soc']?.value || '50.0'} %
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">直流母线电压</div>
                          <div className="text-xs font-bold text-slate-700 font-mono mt-0.5">
                            {telemetry['bess1_u']?.value || '750.0'} V
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">电芯最高温</div>
                          <div className="text-xs font-bold text-amber-600 font-mono mt-0.5">
                            {telemetry['bess1_temp']?.value || '28.5'} °C
                          </div>
                        </div>
                      </>
                    )}

                    {inspectedEl.type === 'PV' && (
                      <>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">光伏出力功率</div>
                          <div className="text-sm font-extrabold text-amber-600 font-mono mt-0.5">
                            {telemetry['pv1_p']?.value || '0.0'} kW
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">今日发电量</div>
                          <div className="text-sm font-extrabold text-indigo-700 font-mono mt-0.5">
                            {telemetry['pv1_daily_gen']?.value || '0.0'} kWh
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">光照辐射度</div>
                          <div className="text-xs font-bold text-slate-700 font-mono mt-0.5">
                            {telemetry['pv1_irradiance']?.value || '850'} W/m²
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">逆变效率</div>
                          <div className="text-xs font-bold text-emerald-600 font-mono mt-0.5">
                            98.7 %
                          </div>
                        </div>
                      </>
                    )}

                    {inspectedEl.type === 'Hydrogen' && (
                      <>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">电解槽功率</div>
                          <div className="text-sm font-extrabold text-cyan-600 font-mono mt-0.5">
                            {telemetry['h2_p']?.value || '0.0'} kW
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">产氢速率</div>
                          <div className="text-sm font-extrabold text-blue-600 font-mono mt-0.5">
                            {telemetry['h2_flow']?.value || '0.0'} Nm³/h
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">储氢罐压力</div>
                          <div className="text-xs font-bold text-slate-700 font-mono mt-0.5">
                            {telemetry['h2_pressure']?.value || '3.2'} MPa
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">氢气纯度</div>
                          <div className="text-xs font-bold text-emerald-600 font-mono mt-0.5">
                            99.999 %
                          </div>
                        </div>
                      </>
                    )}

                    {inspectedEl.type === 'EVCharger' && (
                      <>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">桩群总功率</div>
                          <div className="text-sm font-extrabold text-orange-600 font-mono mt-0.5">
                            {telemetry['ev_p']?.value || '0.0'} kW
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">使用中枪数</div>
                          <div className="text-sm font-extrabold text-indigo-600 font-mono mt-0.5">
                            {telemetry['ev_active_guns']?.value || '0'} / 8 枪
                          </div>
                        </div>
                      </>
                    )}

                    {inspectedEl.type === 'Grid' && (
                      <>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">关口有功功率</div>
                          <div className="text-sm font-extrabold text-indigo-700 font-mono mt-0.5">
                            {telemetry['grid_p']?.value || '0.0'} kW
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">系统电网频率</div>
                          <div className="text-sm font-extrabold text-emerald-600 font-mono mt-0.5">
                            {telemetry['grid_freq']?.value || '50.00'} Hz
                          </div>
                        </div>
                      </>
                    )}

                    {inspectedEl.type === 'Load' && (
                      <>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">总用电负荷</div>
                          <div className="text-sm font-extrabold text-rose-600 font-mono mt-0.5">
                            {telemetry['load_p']?.value || '0.0'} kW
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-bold">功率因数</div>
                          <div className="text-sm font-extrabold text-slate-700 font-mono mt-0.5">
                            0.96
                          </div>
                        </div>
                      </>
                    )}

                    {inspectedEl.type === 'DataBox' && (inspectedEl.data || []).map((d, i) => (
                      <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold truncate">{d.label}</div>
                        <div className="text-xs font-extrabold text-indigo-900 font-mono mt-0.5 truncate">
                          {d.pointKey && telemetry[d.pointKey] ? `${telemetry[d.pointKey].value} ${telemetry[d.pointKey].unit}` : d.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulation Remote Dispatch Commands */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-indigo-600" />
                    <span>仿真调控干预</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    在仿真环境中向该设备下发运行指令或更改工况参数：
                  </p>

                  <div className="space-y-1.5">
                    {inspectedEl.type === 'Battery' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleSimulateDeviceControl('battery_charge')}
                          className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          ⚡ 模拟充电
                        </button>
                        <button
                          onClick={() => handleSimulateDeviceControl('battery_discharge')}
                          className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          🔥 模拟放电
                        </button>
                      </div>
                    )}

                    {inspectedEl.type === 'Hydrogen' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleSimulateDeviceControl('h2_boost')}
                          className="px-2 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          💧 提升制氢负荷
                        </button>
                        <button
                          onClick={() => handleSimulateDeviceControl('h2_idle')}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          ⏹ 降载待机
                        </button>
                      </div>
                    )}

                    {inspectedEl.type === 'Breaker' && (
                      <button
                        onClick={() => handleSimulateDeviceControl('trip_breaker')}
                        className="w-full px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>模拟断路器跳闸 / 分闸</span>
                      </button>
                    )}

                    {inspectedEl.type === 'PV' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleSimulateDeviceControl('pv_curtail')}
                          className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          ☀️ 限发 50%
                        </button>
                        <button
                          onClick={() => handleSimulateDeviceControl('pv_mppt')}
                          className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          ⚡ 恢复 MPPT 满发
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Telemetry Point List */}
                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Database className="w-3 h-3 text-slate-500" />
                    <span>关联测点信号字典</span>
                  </h4>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 max-h-48 overflow-y-auto space-y-1">
                    {DEVICE_LIST.flatMap(d => d.points).slice(0, 6).map(pt => (
                      <div key={pt.key} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-200/50 last:border-0">
                        <span className="text-slate-600 font-semibold truncate max-w-[140px]">{pt.name}</span>
                        <span className="font-mono text-indigo-900 font-bold">
                          {telemetry[pt.key] ? `${telemetry[pt.key].value} ${telemetry[pt.key].unit}` : '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal 1: Create New Configuration Dialog (Prompt 13) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                新建组态拓扑
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">组态名称</label>
              <input
                type="text"
                value={newConfigName}
                placeholder="如: 三期微电网扩展组态"
                onChange={(e) => setNewConfigName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-indigo-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCreateConfig}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Create Custom Device Dialog with Image Upload (Prompt 10) */}
      {showCustomDeviceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                创建自定义图元设备
              </h3>
              <button onClick={() => setShowCustomDeviceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">设备显示名称</label>
                <input
                  type="text"
                  value={customDevName}
                  placeholder="如: 补电柴发机组"
                  onChange={(e) => setCustomDevName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">上传自定义图标 (PNG/JPG/SVG)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    onChange={handleCustomIconUpload}
                    className="hidden"
                    id="custom-icon-upload-input"
                  />
                  <label htmlFor="custom-icon-upload-input" className="cursor-pointer flex flex-col items-center">
                    {customDevIconUrl ? (
                      <div className="space-y-1">
                        <img src={customDevIconUrl} alt="Preview" className="w-12 h-12 object-contain mx-auto rounded border p-1 bg-white" />
                        <span className="text-[10px] text-emerald-600 font-bold block">✓ 图标上传成功，点击可更换</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-indigo-500 mb-1" />
                        <span className="text-xs font-bold text-slate-700">点击或拖拽图片至此处</span>
                        <span className="text-[10px] text-slate-400">支持 PNG, JPG, SVG 格式</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCustomDeviceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddCustomDevice}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
              >
                添加至画布
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal 3: Telemetry Point Binding Modal (Prompt 10: 1.1 Device telemetry points with name/SN search; 1.2 Site-level metrics) */}
      {showPointModal && (() => {
        const filteredDevices = DEVICE_LIST.filter(dev => {
          if (!deviceSearchQuery.trim()) return true;
          const q = deviceSearchQuery.toLowerCase();
          return dev.name.toLowerCase().includes(q) || dev.sn.toLowerCase().includes(q) || dev.category.toLowerCase().includes(q);
        });

        const selectedDevice = DEVICE_LIST.find(d => d.id === selectedDeviceId) || filteredDevices[0] || DEVICE_LIST[0];

        const filteredSiteMetrics = SITE_LEVEL_METRICS.filter(m => {
          if (!siteMetricSearchQuery.trim()) return true;
          const q = siteMetricSearchQuery.toLowerCase();
          return m.name.toLowerCase().includes(q) || m.key.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
        });

        const isPointCurrentlyBound = (key: string) => {
          if (!pointModalTarget || !selectedElement) return false;
          if (pointModalTarget.type === 'flowline') {
            return selectedElement.powerPointKey === key;
          }
          if (pointModalTarget.type === 'databox_row' && pointModalTarget.rowIndex !== undefined) {
            const row = (selectedElement.data || [])[pointModalTarget.rowIndex];
            return row?.pointKey === key;
          }
          return false;
        };

        const handleApplyBind = (pointKey: string, pointName: string, pointUnit: string) => {
          if (!pointModalTarget || !selectedElement) {
            setShowPointModal(false);
            return;
          }

          if (pointModalTarget.type === 'flowline') {
            updateSelectedElement({ powerPointKey: pointKey });
            setToastMsg(pointKey ? `已成功绑定潮流测点` : '已解绑潮流测点');
            setShowSaveToast(true);
            setTimeout(() => setShowSaveToast(false), 2500);
          } else if (pointModalTarget.type === 'databox_row' && pointModalTarget.rowIndex !== undefined) {
            const idx = pointModalTarget.rowIndex;
            const currentRows = [...(selectedElement.data || [])];
            if (currentRows[idx]) {
              const liveItem = pointKey ? telemetry[pointKey] : null;
              const newValue = liveItem ? `${liveItem.value} ${liveItem.unit}` : currentRows[idx].value;
              const newLabel = pointName ? pointName : currentRows[idx].label;
              
              currentRows[idx] = {
                ...currentRows[idx],
                pointKey: pointKey,
                label: newLabel,
                value: newValue
              };
              updateSelectedElement({ data: currentRows });
              setToastMsg(pointKey ? `已成功绑定数据项目` : '已清除测点绑定');
              setShowSaveToast(true);
              setTimeout(() => setShowSaveToast(false), 2500);
            }
          }

          setShowPointModal(false);
        };

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in duration-150">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    测点数据绑定中心
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">选择具体设备测点或绑定全站级别 KPI 统计数据指标</p>
                </div>
                <button onClick={() => setShowPointModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Top Mode Segmented Switcher */}
              <div className="p-2.5 bg-slate-100/80 border-b border-slate-200 flex gap-2">
                <button
                  onClick={() => setModalTab('device')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalTab === 'device'
                      ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  1. 绑定设备测点
                </button>
                <button
                  onClick={() => setModalTab('site')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalTab === 'site'
                      ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Building className="w-4 h-4 text-amber-500" />
                  2. 选择站点级指标数据
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {modalTab === 'device' ? (
                  /* TAB 1: 绑定设备测点 */
                  <div className="space-y-4">
                    {/* 1.1 选择设备与搜索 */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-indigo-500" />
                          步骤 1.1: 选择目标设备 (支持根据名称、SN 序列号精准搜索)
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">找到 {filteredDevices.length} 台设备</span>
                      </div>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={deviceSearchQuery}
                          onChange={(e) => setDeviceSearchQuery(e.target.value)}
                          placeholder="输入设备名称或 SN 进行搜索 (如: 高压关口表 / METER-2026-001 / BESS-PCS)..."
                          className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-indigo-500 bg-slate-50/50"
                        />
                        {deviceSearchQuery && (
                          <button onClick={() => setDeviceSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Devices Grid Selector */}
                    <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 bg-slate-50/80 rounded-xl border border-slate-200">
                      {filteredDevices.map((dev) => {
                        const isSelected = selectedDevice?.id === dev.id;
                        return (
                          <div
                            key={dev.id}
                            onClick={() => setSelectedDeviceId(dev.id)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/90 border-indigo-400 shadow-2xs ring-1 ring-indigo-400'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-xs font-bold text-slate-800 truncate">{dev.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[9.5px]">
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono font-bold">
                                SN: {dev.sn}
                              </span>
                              <span className="text-slate-400 truncate">{dev.category}</span>
                            </div>
                          </div>
                        );
                      })}
                      {filteredDevices.length === 0 && (
                        <div className="col-span-2 p-6 text-center text-xs text-slate-400">
                          未查找到匹配的设备，请尝试其他关键词或 SN 序列号。
                        </div>
                      )}
                    </div>

                    {/* 1.2 选择测点 */}
                    {selectedDevice && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                            步骤 1.2: 选择设备 [{selectedDevice.name}] 对应测点
                          </span>
                          <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            SN: {selectedDevice.sn}
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {selectedDevice.points.map((pt) => {
                            const telVal = telemetry[pt.key];
                            const isCurrentlyBound = isPointCurrentlyBound(pt.key);

                            return (
                              <div
                                key={pt.key}
                                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                  isCurrentlyBound
                                    ? 'bg-emerald-50/80 border-emerald-300'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800">{pt.name}</span>
                                    <span className="text-[9.5px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                      Key: {pt.key}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                    <span>当前实时测值:</span>
                                    <span className="font-bold text-indigo-600">
                                      {telVal ? `${telVal.value} ${telVal.unit}` : '-'}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleApplyBind(pt.key, pt.name, pt.unit)}
                                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isCurrentlyBound
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                  }`}
                                >
                                  {isCurrentlyBound ? '当前已绑定' : '选择绑定'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* TAB 2: 选择站点级指标数据 */
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          选择站点级指标数据 (搜索 Key 或名称)
                        </label>
                      </div>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={siteMetricSearchQuery}
                          onChange={(e) => setSiteMetricSearchQuery(e.target.value)}
                          placeholder="搜索指标名称，如: 下网总功率、绿电消纳率、月度最大需量..."
                          className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-indigo-500 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    {/* Metrics List */}
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {filteredSiteMetrics.map((metric) => {
                        const telVal = telemetry[metric.key];
                        const isCurrentlyBound = isPointCurrentlyBound(metric.key);

                        return (
                          <div
                            key={metric.key}
                            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                              isCurrentlyBound
                                ? 'bg-emerald-50/80 border-emerald-300'
                                : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">{metric.name}</span>
                                <span className="text-[9.5px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                                  {metric.category}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-3">
                                <span className="font-mono text-slate-400">Key: {metric.key}</span>
                                <span>实时指标值: <strong className="text-amber-700">{telVal ? `${telVal.value} ${telVal.unit}` : '-'}</strong></span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleApplyBind(metric.key, metric.name, metric.unit)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isCurrentlyBound
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                              }`}
                            >
                              {isCurrentlyBound ? '当前已绑定' : '选择绑定'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex justify-between items-center">
                <button
                  onClick={() => handleApplyBind('', '', '')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  清除绑定 (置空)
                </button>
                <button
                  onClick={() => setShowPointModal(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Modal 4: All Configurations Manager Modal */}
      {showConfigManagerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">组态列表与状态管理</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">切换运行/编辑状态，或载入其他组态拓扑</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigManagerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-600">全部组态 ({configsList.length})</span>
                {hasButtonPermission('config_create') && (
                  <button
                    onClick={() => {
                      setShowConfigManagerModal(false);
                      setShowCreateModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    新建组态
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {configsList.map((cfg) => {
                  const isCurrent = cfg.id === currentConfigId;

                  return (
                    <div
                      key={cfg.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-indigo-50/60 border-indigo-200 ring-1 ring-indigo-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">{cfg.name}</span>
                          {isCurrent && (
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.2 rounded-full shrink-0">
                              当前画布
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-sans">
                          <span>包含图元: <strong className="text-slate-700">{cfg.elements?.length || 0}</strong> 个</span>
                          <span>更新时间: {cfg.updatedAt}</span>
                        </div>
                      </div>

                      {/* Status Switcher & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Switch Selector */}
                        <select
                          value={cfg.status}
                          onChange={(e) => handleStatusChange(cfg.id, e.target.value as 'in_use' | 'editing' | 'unused')}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-hidden transition-all ${
                            cfg.status === 'in_use'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : cfg.status === 'editing'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title="切换组态运行使用状态"
                        >
                          <option value="in_use">🟢 使用中</option>
                          <option value="editing">🟡 编辑中</option>
                          <option value="unused">⚪ 未使用</option>
                        </select>

                        {/* Switch Active View */}
                        {!isCurrent && (
                          <button
                            onClick={() => {
                              handleSwitchConfig(cfg.id);
                              setShowConfigManagerModal(false);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            title="把当前组态载入到画布"
                          >
                            载入
                          </button>
                        )}

                        {/* Copy Config */}
                        <button
                          onClick={async () => {
                            try {
                              const copy = await copyConfig(cfg.id);
                              const updatedList = await getConfigs('site-1');
                              setConfigsList(updatedList);
                              setToastMsg(`已为“${cfg.name}”成功创建副本`);
                              setShowSaveToast(true);
                              setTimeout(() => setShowSaveToast(false), 2000);
                            } catch (e: any) {
                              alert(e.message || '复制失败');
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="复制组态"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete Config */}
                        {hasButtonPermission('config_delete') && (
                          <button
                            onClick={() => handleDeleteConfigById(cfg.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="删除组态"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {configsList.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    暂无任何电气组态配置。
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex justify-end">
              <button
                onClick={() => setShowConfigManagerModal(false)}
                className="px-4 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationEditorPage;
