import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, ArrowRight, Check, X, Search, Settings, Activity, Cpu, 
  Database, AlertTriangle, Layers, Plus, Trash2, Edit2, Info, Sliders, 
  Globe, Calendar, SlidersHorizontal, ShieldAlert, BadgeCheck, FileText,
  Clock, Server, Network, Zap, RefreshCw, Link, Unlink, CheckSquare, Square,
  CheckCircle2, Power, ChevronDown, BatteryCharging, Plug, Gauge, SunMedium, 
  Wind, Flame, Box, Sun, CornerDownRight, Move, ZoomIn, ZoomOut, Maximize2, RotateCcw,
  ChevronLeft, ChevronRight, LayoutGrid, Send, Radio, FileCode, ShieldCheck,
  History, Eye, Play, Sparkles, HardDriveDownload, ChevronsLeft
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { INITIAL_VERSIONS, INITIAL_FEATURE_PACKS, PROVINCES, SALES_PRICES } from '../App';
import { TopologyDispatchModal, DispatchHistoryItem } from './TopologyDispatchModal';

// Topology device types config map
const DEVICE_TYPE_CONFIG: Record<string, { icon: any, color: string, border: string, bg: string, badge: string }> = {
  '总进线': { icon: Zap, color: 'text-amber-600', border: 'border-amber-300', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
  '变压器': { icon: Server, color: 'text-blue-600', border: 'border-blue-300', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
  '储能': { icon: Database, color: 'text-purple-600', border: 'border-purple-300', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
  'PCS': { icon: Cpu, color: 'text-indigo-600', border: 'border-indigo-300', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-800' },
  '电池簇': { icon: BatteryCharging, color: 'text-cyan-600', border: 'border-cyan-300', bg: 'bg-cyan-50', badge: 'bg-cyan-100 text-cyan-800' },
  '逆变器': { icon: Sun, color: 'text-yellow-600', border: 'border-yellow-300', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
  '充电桩': { icon: Zap, color: 'text-emerald-600', border: 'border-emerald-300', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
  '充电枪': { icon: Plug, color: 'text-teal-600', border: 'border-teal-300', bg: 'bg-teal-50', badge: 'bg-teal-100 text-teal-800' },
  '电表': { icon: Gauge, color: 'text-orange-600', border: 'border-orange-300', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
  '负载': { icon: Box, color: 'text-slate-600', border: 'border-slate-300', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-800' },
  '辐照仪': { icon: SunMedium, color: 'text-amber-500', border: 'border-amber-200', bg: 'bg-amber-50/60', badge: 'bg-amber-100 text-amber-700' },
  '储能空调': { icon: Wind, color: 'text-sky-600', border: 'border-sky-300', bg: 'bg-sky-50', badge: 'bg-sky-100 text-sky-800' },
  '储能消防': { icon: Flame, color: 'text-red-600', border: 'border-red-300', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' },
};

// 设备池分类映射（拓扑编辑画布左侧「设备池」筛选用）
const DEVICE_CATEGORY_MAP: Record<string, string> = {
  '总进线': '配电', '变压器': '配电', '网关': '配电', '电表': '配电',
  'PCS': '储能', '电池簇': '储能', '储能': '储能', 'BMS': '储能', '储能空调': '储能', '储能消防': '储能',
  '逆变器': '光伏', '辐照仪': '光伏',
  '充电桩': '充电', '充电枪': '充电',
  'EMS': '配套', '负载': '配套',
};
const DEVICE_POOL_CATEGORIES = ['全部', '配套', '配电', '储能', '光伏', '充电'];

// 设备运行状态（原型：按 id 稳定散列模拟 正常/故障/离线）
type DeviceRunStatus = 'normal' | 'fault' | 'offline';
const getDeviceRunStatus = (seed: string): DeviceRunStatus => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  if (h % 10 < 8) return 'normal';
  if (h % 10 < 9) return 'fault';
  return 'offline';
};
const DEVICE_STATUS_DOT: Record<DeviceRunStatus, string> = {
  normal: 'bg-emerald-500',
  fault: 'bg-red-500',
  offline: 'bg-gray-300',
};

export interface MeterBinding {
  name: string;
  sn: string;
  model?: string;
  relationType?: string;
}

/**
 * 计量电表关联（电表在画布上独立于设备树）
 * 一块电表 = 一个「计量组」：把同一层级的若干设备用虚线框圈起来，电表胶囊挂在框的边上。
 * 胶囊不隶属任何单台设备，避免「到底测哪一台」的歧义。
 */
export interface MeterLink {
  id: string;
  name: string;
  sn: string;
  model?: string;
  /** 被计量的设备 id 列表（同一层级，至少 1 台）；虚线框取它们的最小区间 */
  targetNodeIds: string[];
}

export interface TopoNode {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  sn?: string;
  model?: string;
  status?: 'normal' | 'warning' | 'offline';
  meterBinding?: MeterBinding;
}

export interface PendingDevice {
  id: string;
  name: string;
  type: string;
  sn: string;
  model: string;
}

const DEFAULT_TOPOLOGY_NODES_MAP: Record<string, TopoNode[]> = {
  'T01': [
    { 
      id: 'node_root', 
      name: '10kV 站点总进线', 
      type: '总进线', 
      parentId: null, 
      sn: 'INC-2026-01', 
      model: 'AH-10kV',
      meterBinding: { name: '高压关口主电表', sn: 'METER-01', model: 'DTSD1352', relationType: '总关口测量' }
    },
    { id: 'node_trans', name: '315kVA 主升压变压器', type: '变压器', parentId: 'node_root', sn: 'TR-315-01', model: 'SCB13-315' },
    { 
      id: 'node_ess', 
      name: '1# 300kWh 储能系统', 
      type: '储能', 
      parentId: 'node_trans', 
      sn: 'ESS-300-01', 
      model: 'CUBE-300',
      meterBinding: { name: '储能出线计量电表', sn: 'METER-ESS-01', model: 'DTSD1352-C', relationType: '分路考核测量' }
    },
    { id: 'node_pcs', name: '150kW PCS 变流器', type: 'PCS', parentId: 'node_ess', sn: 'PCS-150-01', model: 'PCS-150K' },
    { id: 'node_bat', name: '磷酸铁锂电池簇', type: '电池簇', parentId: 'node_ess', sn: 'BAT-300-01', model: 'LFP-300K' },
    { id: 'node_hvac', name: '储能液冷空调', type: '储能空调', parentId: 'node_ess', sn: 'HVAC-01', model: 'COOL-05' },
    { id: 'node_fire', name: '七氟丙烷消防模块', type: '储能消防', parentId: 'node_ess', sn: 'FIRE-01', model: 'FIRE-SAFE' },
  ],
  'T02': [
    { 
      id: 'node_root', 
      name: '380V 低压母线总进线', 
      type: '总进线', 
      parentId: null, 
      sn: 'INC-2026-02', 
      model: 'BUS-380V',
      meterBinding: { name: '低压关口双向电表', sn: 'METER-02', model: 'DTSD1352-C', relationType: '低压关口测量' }
    },
    { id: 'node_load', name: '一期生产线负荷', type: '负载', parentId: 'node_root', sn: 'LOAD-01', model: 'IND-LOAD-1' },
    { id: 'node_pv', name: '100kW 光伏逆变器', type: '逆变器', parentId: 'node_root', sn: 'PV-100-01', model: 'SUN2000' },
    { id: 'node_pyro', name: '光伏顶楼辐照仪', type: '辐照仪', parentId: 'node_pv', sn: 'PYRO-01', model: 'RAD-500' },
  ],
  'T03': [
    { id: 'node_root', name: '充电主回路总进线', type: '总进线', parentId: null, sn: 'INC-2026-03', model: 'INC-EV' },
    { id: 'node_pile', name: '120kW 直流双枪充电桩', type: '充电桩', parentId: 'node_root', sn: 'EV-120-01', model: 'EV-DC120' },
    { id: 'node_gun1', name: 'A枪 充电枪', type: '充电枪', parentId: 'node_pile', sn: 'GUN-01', model: 'GUN-A' },
    { id: 'node_gun2', name: 'B枪 充电枪', type: '充电枪', parentId: 'node_pile', sn: 'GUN-02', model: 'GUN-B' },
  ],
  'T04': [
    { id: 'node_root', name: '分布式并网总进线', type: '总进线', parentId: null, sn: 'INC-2026-04', model: 'PV-GRID' },
    { id: 'node_pv1', name: '50kW 组串逆变器 01', type: '逆变器', parentId: 'node_root', sn: 'PV-50-01', model: 'SUN-50K' },
    { id: 'node_pv2', name: '50kW 组串逆变器 02', type: '逆变器', parentId: 'node_root', sn: 'PV-50-02', model: 'SUN-50K' },
  ]
};

// 由默认拓扑里的 meterBinding 迁移出电表关联（电表独立于设备树，可计量同层多台设备）
const DEFAULT_METER_LINKS_MAP: Record<string, MeterLink[]> = (() => {
  const map: Record<string, MeterLink[]> = {};
  Object.entries(DEFAULT_TOPOLOGY_NODES_MAP).forEach(([topoId, nodes]) => {
    const links: MeterLink[] = [];
    nodes.forEach(n => {
      if (n.meterBinding) {
        links.push({
          id: `ml_${topoId}_${n.id}`,
          name: n.meterBinding.name,
          sn: n.meterBinding.sn,
          model: n.meterBinding.model,
          targetNodeIds: [n.id],
        });
      }
    });
    map[topoId] = links;
  });
  return map;
})();

const DEFAULT_PENDING_DEVICES: PendingDevice[] = [
  { id: 'p_dev_01', name: '2# 变压器 (500kVA)', type: '变压器', sn: 'TR-500-02', model: 'SCB13-500' },
  { id: 'p_dev_02', name: '2# 储能舱 (200kWh)', type: '储能', sn: 'ESS-200-02', model: 'CUBE-200' },
  { id: 'p_dev_03', name: '100kW 双向 PCS', type: 'PCS', sn: 'PCS-100-02', model: 'PCS-100K' },
  { id: 'p_dev_04', name: '2# 高压电池簇 PACK', type: '电池簇', sn: 'BAT-200-02', model: 'LFP-200K' },
  { id: 'p_dev_05', name: '光伏逆变器 03', type: '逆变器', sn: 'PV-INV-03', model: 'SUN-150K' },
  { id: 'p_dev_06', name: '60kW 快充充电桩', type: '充电桩', sn: 'EV-60-02', model: 'DC-60K' },
  { id: 'p_dev_07', name: '大功率充电枪 C', type: '充电枪', sn: 'GUN-C-01', model: 'GUN-700V' },
  { id: 'p_dev_09', name: '智能双向计量电表', type: '电表', sn: 'METER-02', model: 'DTSD1352-C' },
  { id: 'p_dev_10', name: '车间二级动力负荷', type: '负载', sn: 'LOAD-02', model: 'LOAD-50KW' },
  { id: 'p_dev_11', name: '环境气象辐照仪', type: '辐照仪', sn: 'RAD-02', model: 'PYRA-200' },
  { id: 'p_dev_12', name: '储能专用水冷空调', type: '储能空调', sn: 'HVAC-02', model: 'COOL-AC-02' },
  { id: 'p_dev_13', name: '全氟己酮消防灭火主机', type: '储能消防', sn: 'FIRE-02', model: 'FIRE-SYS-02' },
];

// ===== Operation Logs mock data =====
const MOCK_OPERATION_LOGS = [
  { id: 'L01', time: '2026-07-13 14:23:00', level: 'error', type: '设备告警', source: '3#PCS', content: 'PCS 通讯异常，数据上报中断', handler: '系统自动', status: '未处理' },
  { id: 'L02', time: '2026-07-13 10:15:00', level: 'warning', type: '策略变更', source: '管理员', content: '修改购电电价策略为峰谷平', handler: '管理员(荆汉进)', status: '已处理' },
  { id: 'L03', time: '2026-07-12 22:00:00', level: 'info', type: '版本升级', source: '系统', content: '系统版本从 v2.0 升级至 v2.1 高级版', handler: '系统自动', status: '已处理' },
  { id: 'L04', time: '2026-07-12 16:30:00', level: 'error', type: '设备告警', source: '2#电池簇', content: '电池簇 SOC 异常偏低，建议检查', handler: '运维人员', status: '处理中' },
  { id: 'L05', time: '2026-07-12 09:00:00', level: 'info', type: '设备新增', source: '管理员', content: '手动新增设备 2#电表 (SN: THMET002)', handler: '管理员(荆汉进)', status: '已处理' },
  { id: 'L06', time: '2026-07-11 15:45:00', level: 'warning', type: '拓扑变更', source: '管理员', content: '修改拓扑连接：新增 2#储能柜至低压母线连接', handler: '管理员(荆汉进)', status: '已处理' },
  { id: 'L07', time: '2026-07-11 11:20:00', level: 'info', type: '设备审批', source: '系统', content: '网关 SN:8842b5 发现设备 11 台，审批通过', handler: '管理员(荆汉进)', status: '已处理' },
  { id: 'L08', time: '2026-07-10 09:54:37', level: 'info', type: '建站完成', source: '系统', content: '站点"荣成中医院微网"创建完成', handler: '系统自动', status: '已处理' },
];

// ===== Station Applications mock data =====
const MOCK_STATION_APPLICATIONS = [
  { id: 'APP001', gatewaySn: '8842b5aab845d7', station: '核心贸易区步行街项目', deviceCount: 11, applyTime: '2026-07-10 13:49:54', status: 'approved',
    devices: [
      { type: '变压器', name: '变压器', count: 1 },
      { type: '并网柜', name: '并网柜', count: 1 },
      { type: '储能柜', name: '储能柜', count: 2 },
      { type: 'PCS', name: 'PCS', count: 4 },
      { type: '电池簇', name: '电池簇', count: 3 },
    ]
  },
  { id: 'APP002', gatewaySn: 'AB12cdef3456gh', station: '光明储能项目', deviceCount: 8, applyTime: '2026-07-12 09:20:00', status: 'pending',
    devices: [
      { type: '变压器', name: '主变压器', count: 1 },
      { type: '并网柜', name: '并网柜', count: 1 },
      { type: '储能柜', name: '储能柜', count: 1 },
      { type: 'PCS', name: 'PCS', count: 2 },
      { type: '电池簇', name: '电池簇', count: 2 },
      { type: '光伏逆变器', name: '光伏逆变器', count: 1 },
    ]
  },
  { id: 'APP003', gatewaySn: 'EF56ghij7890kl', station: '大兴智慧能源', deviceCount: 5, applyTime: '2026-07-11 15:30:00', status: 'pending',
    devices: [
      { type: '变压器', name: '主变压器', count: 1 },
      { type: '储能柜', name: '储能柜', count: 1 },
      { type: 'PCS', name: 'PCS', count: 2 },
      { type: '电池簇', name: '电池簇', count: 1 },
    ]
  },
];

// ===== Thing Models mock data =====
const MOCK_THING_MODELS = [
  { id: 'TM01', name: '变压器物模型 v2.0', deviceType: '变压器', version: 'v2.0', product: '变压器产品系列' },
  { id: 'TM02', name: '变压器物模型 v1.0', deviceType: '变压器', version: 'v1.0', product: '变压器产品系列' },
  { id: 'TM03', name: '并网柜物模型 v1.2', deviceType: '并网柜', version: 'v1.2', product: '并网柜产品系列' },
  { id: 'TM04', name: '储能柜物模型 v1.5', deviceType: '储能柜', version: 'v1.5', product: '储能柜产品系列' },
  { id: 'TM05', name: 'PCS物模型 v2.1', deviceType: 'PCS', version: 'v2.1', product: 'PCS产品系列' },
  { id: 'TM06', name: '电池簇物模型 v1.0', deviceType: '电池簇', version: 'v1.0', product: '电池簇产品系列' },
  { id: 'TM07', name: '光伏逆变器物模型 v1.3', deviceType: '光伏逆变器', version: 'v1.3', product: '光伏产品系列' },
  { id: 'TM08', name: '电表物模型 v1.1', deviceType: '电表', version: 'v1.1', product: '电表产品系列' },
];

// Mock devices matching screenshot
const DEFAULT_SCREENSHOT_DEVICES = [
  {
    id: 'THGATE0000IFXV3QGG30N',
    name: 'EMS网关',
    type: 'EMS',
    sn: 'TRINASTORAGE94',
    model: 'FCU2601',
    parent: '荣成市妇幼保健院',
    station: '荣成市妇幼保健院',
    enterprise: '威海市荣成市妇幼保健院',
    createdAt: '2026-08-18 16:46:14'
  },
  {
    id: 'THBESSPCS0TD08TI0724F',
    name: '储能柜-3#PCS数据',
    type: 'PCS',
    sn: 'TRINASTORAGE82_PCS03',
    model: 'PCS',
    parent: '储能柜-3#',
    station: '宣城华纳新材料-2#站',
    enterprise: '安徽省宣城市华纳新材料科技',
    createdAt: '2026-08-18 16:36:50'
  },
  {
    id: 'THBESSPCS0PCIDF2LL7EF',
    name: '储能柜-6#PCS数据',
    type: 'PCS',
    sn: 'TRINASTORAGE82_PCS06',
    model: 'PCS',
    parent: '储能柜-6#',
    station: '宣城华纳新材料-2#站',
    enterprise: '安徽省宣城市华纳新材料科技',
    createdAt: '2026-08-18 16:36:50'
  },
  {
    id: 'THBESSPCS0LUKZAIW3SXF',
    name: '储能柜-1#PCS数据',
    type: 'PCS',
    sn: 'TRINASTORAGE82_PCS01',
    model: 'PCS',
    parent: '储能柜-1#',
    station: '宣城华纳新材料-2#站',
    enterprise: '安徽省宣城市华纳新材料科技',
    createdAt: '2026-08-18 16:36:50'
  },
  {
    id: 'THBESSPCS0J3J9INGN4FF',
    name: '储能柜-5#PCS数据',
    type: 'PCS',
    sn: 'TRINASTORAGE82_PCS05',
    model: 'PCS',
    parent: '储能柜-5#',
    station: '宣城华纳新材料-2#站',
    enterprise: '安徽省宣城市华纳新材料科技',
    createdAt: '2026-08-18 16:36:50'
  },
  {
    id: 'THBESSPCS05PB4FJI9QEF',
    name: '储能柜-2#PCS数据',
    type: 'PCS',
    sn: 'TRINASTORAGE82_PCS02',
    model: 'PCS',
    parent: '储能柜-2#',
    station: '宣城华纳新材料-2#站',
    enterprise: '安徽省宣城市华纳新材料科技',
    createdAt: '2026-08-18 16:36:50'
  },
  {
    id: 'THBESSPCS02Y9O4E8KHRF',
    name: '储能柜-4#PCS数据',
    type: 'PCS',
    sn: 'TRINASTORAGE82_PCS04',
    model: 'PCS',
    parent: '储能柜-4#',
    station: '宣城华纳新材料-2#站',
    enterprise: '安徽省宣城市华纳新材料科技',
    createdAt: '2026-08-18 16:36:50'
  },
  {
    id: 'THBESSAIR0ZCK2JO7S9UF',
    name: '储能柜-4#液冷机数据',
    type: '储能空调',
    sn: 'TRINASTORAGE82_TMS04',
    model: '12345',
    parent: '储能柜-4#',
    station: '宣城华纳新材料-2#站',
    enterprise: '安徽省宣城市华纳新材料科技',
    createdAt: '2026-08-18 16:36:50'
  },
  {
    id: 'THBESSAIR0WUIHPZO6Y5F',
    name: '储能柜-2#液冷机数据',
    type: '储能空调',
    sn: 'TRINASTORAGE82_TMS02',
    model: '12345',
    parent: '储能柜-2#',
    station: '宣城华纳新材料-2#站',
    enterprise: '安徽省宣城市华纳新材料科技',
    createdAt: '2026-08-18 16:36:50'
  },
  {
    id: 'THBESSAIR0KUTVO69PSNF',
    name: '储能柜-6#液冷机数据',
    type: '储能空调',
    sn: 'TRINASTORAGE82_TMS06',
    model: '12345',
    parent: '储能柜-6#',
    station: '宣城华纳新材料-2#站',
    enterprise: '安徽省宣城市华纳新材料科技',
    createdAt: '2026-08-18 16:36:50'
  }
];

interface StationWorkspaceProps {
  station: any;
  onClose: () => void;
  stations: any[];
  setStations: React.Dispatch<React.SetStateAction<any[]>>;
  devices: any[];
  setDevices: React.Dispatch<React.SetStateAction<any[]>>;
  versions?: any[];
  featurePacks?: any[];
}

export function StationWorkspace({ 
  station, 
  onClose, 
  stations, 
  setStations, 
  devices, 
  setDevices,
  versions,
  featurePacks
}: StationWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'device' | 'incomer' | 'topo' | 'configuration' | 'pricing' | 'events'>('overview');

  // Multiple topologies state (多套拓扑维护)
  const [stationTopologies, setStationTopologies] = useState<any[]>(() => {
    const storageKey = `station_topologies_v2_${station.id || station.name}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 'T01', name: '1# 变压器高压侧拓扑图', type: '高压侧', remarks: '主变与高压开关柜配电逻辑节点', updatedAt: '2026-07-28 10:00' },
      { id: 'T02', name: '低压Ⅰ段交流母线拓扑图', type: '低压母线', remarks: '380V低压交流母线及分支逻辑节点', updatedAt: '2026-07-28 10:00' },
      { id: 'T03', name: '1# 储能充放电系统拓扑图', type: '储能系统', remarks: '1# PCS变流器与储能电池簇系统', updatedAt: '2026-07-28 10:00' },
      { id: 'T04', name: '光伏发电并网逆变拓扑图', type: '光伏系统', remarks: '光伏逆变器与并网汇流柜逻辑节点', updatedAt: '2026-07-28 10:00' },
    ];
  });

  useEffect(() => {
    const storageKey = `station_topologies_v2_${station.id || station.name}`;
    localStorage.setItem(storageKey, JSON.stringify(stationTopologies));
  }, [stationTopologies, station.id, station.name]);

  // Selected topology set for viewing/editing canvas
  const [activeTopoId, setActiveTopoId] = useState<string>('T01');

  // Topology node tree structure state per topology
  const [topoTrees, setTopoTrees] = useState<Record<string, TopoNode[]>>(() => {
    const key = `station_topo_trees_${station.id || station.name}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_TOPOLOGY_NODES_MAP;
  });

  useEffect(() => {
    const key = `station_topo_trees_${station.id || station.name}`;
    localStorage.setItem(key, JSON.stringify(topoTrees));
  }, [topoTrees, station.id, station.name]);

  // Unassigned / Pending Devices Area state
  const [pendingDevices, setPendingDevices] = useState<PendingDevice[]>(() => {
    const key = `station_pending_devices_${station.id || station.name}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_PENDING_DEVICES;
  });

  useEffect(() => {
    const key = `station_pending_devices_${station.id || station.name}`;
    localStorage.setItem(key, JSON.stringify(pendingDevices));
  }, [pendingDevices, station.id, station.name]);

  // Layout mode state: Vertical tree vs Horizontal tree vs Single-line diagram vs Matrix grid
  const [treeLayoutMode, setTreeLayoutMode] = useState<'vertical' | 'horizontal' | 'singleline' | 'matrix'>('vertical');

  // Currently live operational topology in site field (现场当前生效拓扑)
  const [operationalTopoId, setOperationalTopoId] = useState<string>(() => {
    const key = `station_operational_topo_${station.id || station.name}`;
    return localStorage.getItem(key) || 'T01';
  });

  useEffect(() => {
    const key = `station_operational_topo_${station.id || station.name}`;
    localStorage.setItem(key, operationalTopoId);
  }, [operationalTopoId, station.id, station.name]);

  // Topology Deployment / Dispatch Status per Topology
  const [topoDeploymentStatus, setTopoDeploymentStatus] = useState<Record<string, { status: 'deployed' | 'modified' | 'draft', lastDeployedAt?: string, version?: string }>>(() => {
    const key = `station_topo_deploy_status_${station.id || station.name}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      'T01': { status: 'deployed', lastDeployedAt: '2026-08-18 17:30:15', version: 'v2.4.0' },
      'T02': { status: 'deployed', lastDeployedAt: '2026-07-28 10:15:00', version: 'v2.3.8' },
      'T03': { status: 'modified', lastDeployedAt: '2026-07-15 09:00:00', version: 'v2.2.1' },
      'T04': { status: 'draft', version: 'v1.0.0-draft' }
    };
  });

  useEffect(() => {
    const key = `station_topo_deploy_status_${station.id || station.name}`;
    localStorage.setItem(key, JSON.stringify(topoDeploymentStatus));
  }, [topoDeploymentStatus, station.id, station.name]);

  // Dispatch Modal Open State
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  // Switch Topology Confirmation (password-verified) state
  const [switchConfirmTopoId, setSwitchConfirmTopoId] = useState<string | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchPasswordError, setSwitchPasswordError] = useState('');

  // Switch Active Operational Topology Handler
  const handleSwitchOperationalTopo = (topoId: string) => {
    const targetTopo = stationTopologies.find(t => t.id === topoId);
    if (!targetTopo) return;

    setOperationalTopoId(topoId);
    setActiveTopoId(topoId);

    // Also update bound incomer status if needed
    showNotification(`已成功将 [${targetTopo.name}] 切换为现场当前运行主拓扑！`, 'success');
  };

  // Confirm switch with password
  const handleConfirmSwitchTopo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchConfirmTopoId) return;
    if (!switchPassword) {
      setSwitchPasswordError('请输入操作密码');
      return;
    }
    if (switchPassword !== '123456') {
      setSwitchPasswordError('密码错误，请重新输入');
      return;
    }
    handleSwitchOperationalTopo(switchConfirmTopoId);
    setSwitchConfirmTopoId(null);
    setSwitchPassword('');
    setSwitchPasswordError('');
  };

  // Dispatch Success Handler
  const handleDispatchSuccess = (topoId: string, version: string, mode: string) => {
    const targetTopo = stationTopologies.find(t => t.id === topoId);
    const timeNow = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setTopoDeploymentStatus(prev => ({
      ...prev,
      [topoId]: {
        status: 'deployed',
        lastDeployedAt: timeNow,
        version: version
      }
    }));

    // If active topo was dispatched, set it as operational
    setOperationalTopoId(topoId);

    showNotification(`拓扑方案 [${targetTopo?.name || topoId}] 已成功下发至网关并生效！(版本: ${version})`, 'success');
  };

  // Rollback Topology Handler
  const handleRollbackTopo = (historyItem: DispatchHistoryItem) => {
    setTopoDeploymentStatus(prev => ({
      ...prev,
      [historyItem.topoId]: {
        status: 'deployed',
        lastDeployedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        version: historyItem.version
      }
    }));
    setActiveTopoId(historyItem.topoId);
    showNotification(`已成功回滚拓扑至历史版本 [${historyItem.version}]！`, 'success');
  };
  
  // Canvas Zoom Scale state (50% ~ 200%)
  const [canvasScale, setCanvasScale] = useState<number>(1);
  // Hovered node state for floating popover details
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  // Left pending devices sidebar collapse state
  const [isPendingCollapsed, setIsPendingCollapsed] = useState<boolean>(false);

  // 设备池 / 站点树 侧栏 Tab 与筛选状态
  const [devicePoolTab, setDevicePoolTab] = useState<'pool' | 'tree'>('pool');
  const [devicePoolFilter, setDevicePoolFilter] = useState<string>('全部');
  const [treeExpandedIds, setTreeExpandedIds] = useState<Record<string, boolean>>({});

  // 计量电表关联（独立于设备树；一块表只画一处，画在被测设备这一层，计量的是一组同层设备）
  const [meterLinks, setMeterLinks] = useState<Record<string, MeterLink[]>>(() => {
    const key = `station_meter_links_v3_${station.id || station.name}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed as Record<string, MeterLink[]>;
      } catch (e) {}
    }
    return DEFAULT_METER_LINKS_MAP;
  });
  useEffect(() => {
    localStorage.setItem(
      `station_meter_links_v3_${station.id || station.name}`,
      JSON.stringify(meterLinks)
    );
  }, [meterLinks, station.id, station.name]);

  // hover 高亮：记录当前悬停电表的 SN（悬停时高亮它计量那一组同层设备）
  const [hoveredMeterSn, setHoveredMeterSn] = useState<string | null>(null);

  // 与某节点相关的电表（把它算作计量组的一员）——用于矩阵表
  const metersRelatedTo = (topoId: string, nodeId: string): MeterLink[] =>
    (meterLinks[topoId] || []).filter(ml => ml.targetNodeIds.includes(nodeId));

  // 悬停某块电表时，需要高亮的设备集合 = 它计量的那一组同层设备（不含任何父节点）
  const meterHighlightIds = (topoId: string, sn: string | null): Set<string> => {
    const ids = new Set<string>();
    if (!sn) return ids;
    (meterLinks[topoId] || [])
      .filter(ml => ml.sn === sn)
      .forEach(ml => ml.targetNodeIds.forEach(id => ids.add(id)));
    return ids;
  };

  // 常显的成员描边：某设备属于任意计量组（用于区分「框住但没被测」的设备）
  const meterMemberIds = (topoId: string): Set<string> => {
    const ids = new Set<string>();
    (meterLinks[topoId] || []).forEach(ml => ml.targetNodeIds.forEach(id => ids.add(id)));
    return ids;
  };

  // 同层判定：同一个父节点的直接下级才算「同一层级」
  const sameLevelAs = (topoId: string, nodeId: string, otherId: string): boolean => {
    const nodes = topoTrees[topoId] || DEFAULT_TOPOLOGY_NODES_MAP[topoId] || [];
    const a = nodes.find(n => n.id === nodeId);
    const b = nodes.find(n => n.id === otherId);
    if (!a || !b) return false;
    return (a.parentId || null) === (b.parentId || null);
  };

  // 让计量组的成员在兄弟里紧挨着排：组里增删成员后自动把成员聚拢，
  // 这样虚线框只会框住被计量的设备，不会把中间没被测的设备一起圈进去。
  const compactMeterGroupOrder = (topoId: string, memberIds: string[]) => {
    if (memberIds.length < 2) return;
    const memberSet = new Set(memberIds);
    setTopoTrees(prev => {
      const nodes = prev[topoId];
      if (!nodes) return prev;
      const first = nodes.find(n => n.id === memberIds[0]);
      if (!first) return prev;
      const parentId = first.parentId ?? null;
      const siblings = nodes.filter(n => (n.parentId ?? null) === parentId);
      const members = siblings.filter(n => memberSet.has(n.id));
      const others = siblings.filter(n => !memberSet.has(n.id));
      if (members.length < 2) return prev;
      // 成员插到「第一个成员原本所在的位置」，其余设备的相对顺序保持不变
      const firstIdx = siblings.findIndex(n => n.id === memberIds[0]);
      const before = siblings.slice(0, firstIdx).filter(n => !memberSet.has(n.id)).length;
      const newSiblings = [...others.slice(0, before), ...members, ...others.slice(before)];
      if (newSiblings.map(n => n.id).join() === siblings.map(n => n.id).join()) return prev;
      let cursor = 0;
      const out = nodes.map(n =>
        (n.parentId ?? null) === parentId ? newSiblings[cursor++] : n
      );
      return { ...prev, [topoId]: out };
    });
  };

  // 延迟聚拢：连续删/加多台时不要每操作一次就重排——卡片会挪到光标底下，
  // 下一次点「移出」就容易点到别的设备上。改成停手一小会儿后再统一聚拢一次。
  const METER_COMPACT_DELAY = 900;
  const meterCompactTimerRef = React.useRef<number | null>(null);
  // 每块表只留最后一次的成员快照，连续操作时中间的快照会被覆盖掉
  const pendingMeterCompactRef = React.useRef<Record<string, { topoId: string; memberIds: string[] }>>({});

  const flushMeterCompact = () => {
    if (meterCompactTimerRef.current !== null) {
      window.clearTimeout(meterCompactTimerRef.current);
      meterCompactTimerRef.current = null;
    }
    const pending = pendingMeterCompactRef.current;
    pendingMeterCompactRef.current = {};
    Object.keys(pending).forEach(linkId => {
      const p = pending[linkId];
      if (p.memberIds.length >= 2) compactMeterGroupOrder(p.topoId, p.memberIds);
    });
  };

  const scheduleMeterCompact = (topoId: string, linkId: string, memberIds: string[]) => {
    // 覆盖式写入：期间又删了一台，就以最新的成员快照为准（清空到 1 台以下也不再回退到旧快照）
    pendingMeterCompactRef.current[linkId] = { topoId, memberIds };
    if (meterCompactTimerRef.current !== null) window.clearTimeout(meterCompactTimerRef.current);
    meterCompactTimerRef.current = window.setTimeout(() => {
      meterCompactTimerRef.current = null;
      flushMeterCompact();
    }, METER_COMPACT_DELAY);
  };

  // 切走标签页/卸载时，把还没结算的聚拢清掉
  useEffect(() => {
    return () => {
      if (meterCompactTimerRef.current !== null) {
        window.clearTimeout(meterCompactTimerRef.current);
        meterCompactTimerRef.current = null;
      }
      pendingMeterCompactRef.current = {};
    };
  }, [activeTab]);

  // 计量组虚线框 + 挂在框上的胶囊位置（相对树内容层的布局坐标）
  type MeterSide = 'right' | 'left' | 'bottom' | 'top';
  interface MeterBox { x: number; y: number; w: number; h: number; side: MeterSide; inset: number; multi: boolean }
  const [meterBoxMap, setMeterBoxMap] = useState<Record<string, MeterBox>>({});
  const meterBoxRef = React.useRef<Record<string, MeterBox>>({});

  // 窗口尺寸变化：画布可视区变了，重算电表胶囊的避让位置
  const [viewportTick, setViewportTick] = useState(0);
  useEffect(() => {
    const onResize = () => setViewportTick(t => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Native mouse wheel zoom handler for canvas container
  const canvasContainerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheelZoom = (e: WheelEvent) => {
      // Prevent default page scroll when scrolling inside topology canvas
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
      setCanvasScale(prev => {
        const next = Number((prev + zoomDelta).toFixed(2));
        return Math.min(2.0, Math.max(0.4, next));
      });
    };

    container.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelZoom);
    };
    // 画布容器只在「拓扑维护」Tab 下才挂载，切 Tab 后需要重新绑定滚轮监听
  }, [activeTab, treeLayoutMode]);

  // ---- 指针拖拽系统（取代 HTML5 DnD）----
  // HTML5 drag 在「缩放 + 滚动 + flex 居中」的容器里 drop 事件经常落不到目标上，
  // 改为 pointerdown/move/up + elementFromPoint 命中检测，稳定且可控。
  type DragSource = 'pending' | 'canvas' | 'meter';
  const [dragItem, setDragItem] = useState<{ id: string; source: DragSource; type: string; name: string } | null>(null);
  const dragItemRef = React.useRef<{ id: string; source: DragSource; type: string; name: string } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [isOverPool, setIsOverPool] = useState<boolean>(false);
  // 拖设备时，正悬停在哪块电表的胶囊上（用于加入计量组的高亮与落点）
  const [dragOverMeterId, setDragOverMeterId] = useState<string | null>(null);
  // 展开中的「计量范围」面板（哪块电表）；面板方向按可用空间自动翻转，避免被画布裁掉
  const [openMeterPanelId, setOpenMeterPanelId] = useState<string | null>(null);
  const [openMeterPanelUp, setOpenMeterPanelUp] = useState(false);
  const [openMeterPanelAlignRight, setOpenMeterPanelAlignRight] = useState(false);

  // 画布平移（拖动空白处）
  const [canvasPan, setCanvasPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasPanRef = React.useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  // 计量组布局：量出每块表「成员设备的最小区间」作为虚线框，再把胶囊挂到框的一条边上（自动避让）。
  // 框的位置只取决于成员卡片（稳定），胶囊尺寸取自上一帧的实测值，因此不会来回抖动。
  React.useLayoutEffect(() => {
    if (activeTab !== 'topo') return;
    if (treeLayoutMode !== 'vertical' && treeLayoutMode !== 'horizontal') return;
    const container = canvasContainerRef.current;
    const content = container?.querySelector('[data-tree-content]') as HTMLElement | null;
    if (!container || !content) return;

    const raf = requestAnimationFrame(() => {
      const topoId = activeTopoId || 'T01';
      const links = meterLinks[topoId] || [];
      const scale = canvasScale || 1;

      const contentRect = content.getBoundingClientRect();
      const cardBoxes = Array.from(container!.querySelectorAll('[data-node-id]') as NodeListOf<HTMLElement>)
        .map(el => ({ id: el.getAttribute('data-node-id') || '', rect: el.getBoundingClientRect() }));
      const lineBoxes = Array.from(container!.querySelectorAll('[data-connector]') as NodeListOf<HTMLElement>)
        .map(el => el.getBoundingClientRect());

      const overlapArea = (a: { left: number; top: number; right: number; bottom: number }, b: { left: number; top: number; right: number; bottom: number }) => {
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        return w > 0 && h > 0 ? w * h : 0;
      };

      // 树形布局下横向贴边不会压到竖直连线；横向布局则优先上下贴边
      const prefer: MeterSide[] = treeLayoutMode === 'vertical'
        ? ['right', 'left', 'bottom', 'top']
        : ['bottom', 'top', 'right', 'left'];

      const containerRect = container!.getBoundingClientRect();
      const GAP = 6;   // 框与卡片之间留的缝
      const PAD = 7;   // 框相对成员最小包围盒外扩
      const STUB = 14; // 框到胶囊之间的引出长度

      const next: Record<string, MeterBox> = {};
      let changed = false;
      // 已经排好的框与胶囊（视口坐标），让每块表互不遮挡
      const placedRects: { left: number; top: number; right: number; bottom: number }[] = [];

      links.forEach((ml, linkIdx) => {
        const memberRects = ml.targetNodeIds
          .map(id => cardBoxes.find(c => c.id === id)?.rect)
          .filter(Boolean) as DOMRect[];
        if (memberRects.length === 0) return;

        // 成员的最小包围盒（视口坐标）
        let L = Math.min(...memberRects.map(r => r.left));
        let T = Math.min(...memberRects.map(r => r.top));
        let R = Math.max(...memberRects.map(r => r.right));
        let B = Math.max(...memberRects.map(r => r.bottom));
        const inset = (linkIdx % 3) * 3; // 多块表嵌套时错开一点，避免框线重合
        L -= PAD + inset; T -= PAD + inset; R += PAD + inset; B += PAD + inset;
        const boxRect = { left: L, top: T, right: R, bottom: B };

        // 胶囊尺寸：取上一帧实测，首帧用估值
        const chipEl = container!.querySelector(`[data-meter-chip="${ml.id}"]`) as HTMLElement | null;
        const chipRect = chipEl ? chipEl.getBoundingClientRect() : null;
        const cw = (chipRect ? Math.max(chipRect.width, 90) : 130) / scale;
        const ch = (chipRect ? Math.max(chipRect.height, 16) : 20) / scale;
        const sw = STUB / scale;
        const gw = GAP / scale;

        const obstacles = [
          ...cardBoxes.map(c => c.rect),
          ...lineBoxes,
          ...placedRects,
        ];

        const cand: Record<MeterSide, { left: number; top: number; right: number; bottom: number }> = {
          right: { left: boxRect.right + gw, top: (T + B) / 2 - ch / 2, right: boxRect.right + gw + sw + cw, bottom: (T + B) / 2 + ch / 2 },
          left: { left: boxRect.left - gw - sw - cw, top: (T + B) / 2 - ch / 2, right: boxRect.left - gw, bottom: (T + B) / 2 + ch / 2 },
          bottom: { left: (L + R) / 2 - cw / 2, top: boxRect.bottom + gw, right: (L + R) / 2 + cw / 2, bottom: boxRect.bottom + gw + sw + ch },
          top: { left: (L + R) / 2 - cw / 2, top: boxRect.top - gw - sw - ch, right: (L + R) / 2 + cw / 2, bottom: boxRect.top - gw },
        };

        let best: MeterSide = prefer[0];
        let bestCost = Number.POSITIVE_INFINITY;
        prefer.forEach((side, idx) => {
          const r = cand[side];
          let cost = 0;
          obstacles.forEach(o => { cost += overlapArea(o, r); });
          // 超出画布可视带也要罚，避免框或胶囊跑到看不见的地方
          const out = Math.max(0, containerRect.left - r.left) + Math.max(0, r.right - containerRect.right)
            + Math.max(0, containerRect.top - r.top) + Math.max(0, r.bottom - containerRect.bottom);
          cost += out * 10 + idx * 0.5;
          if (cost < bestCost) {
            bestCost = cost;
            best = side;
          }
        });

        placedRects.push(cand[best]);
        placedRects.push(boxRect);

        next[ml.id] = {
          x: (boxRect.left - contentRect.left) / scale,
          y: (boxRect.top - contentRect.top) / scale,
          w: (boxRect.right - boxRect.left) / scale,
          h: (boxRect.bottom - boxRect.top) / scale,
          side: best,
          inset,
          multi: ml.targetNodeIds.length > 1,
        };
        const prev = meterBoxRef.current[ml.id];
        if (!prev || prev.x !== next[ml.id].x || prev.y !== next[ml.id].y
          || prev.w !== next[ml.id].w || prev.h !== next[ml.id].h
          || prev.side !== next[ml.id].side || prev.multi !== next[ml.id].multi) {
          changed = true;
        }
      });

      // 表被解绑后清掉残留
      if (Object.keys(meterBoxRef.current).some(id => !next[id])) changed = true;

      meterBoxRef.current = next;
      if (changed) setMeterBoxMap(next);
    });

    return () => cancelAnimationFrame(raf);
  }, [activeTab, treeLayoutMode, meterLinks, topoTrees, activeTopoId, canvasScale, canvasPan, viewportTick]);

  // 点电表胶囊以外的地方，收起「计量范围」面板
  useEffect(() => {
    if (!openMeterPanelId) return;
    const close = (ev: PointerEvent) => {
      const el = ev.target as HTMLElement | null;
      if (el && el.closest('[data-drop-meter]')) return;
      setOpenMeterPanelId(null);
      // 面板收起 = 这一轮调整结束，把延迟的聚拢立刻结算
      flushMeterCompact();
    };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [openMeterPanelId]);


  // Topology set modal (Only Name and Remarks)
  const [isTopoModalOpen, setIsTopoModalOpen] = useState(false);
  const [editingTopo, setEditingTopo] = useState<any | null>(null);
  const [topoForm, setTopoForm] = useState({
    name: '',
    remarks: ''
  });

  const handleOpenAddTopo = () => {
    setEditingTopo(null);
    setTopoForm({
      name: '',
      remarks: ''
    });
    setIsTopoModalOpen(true);
  };

  const handleOpenEditTopo = (topo: any) => {
    setEditingTopo(topo);
    setTopoForm({
      name: topo.name,
      remarks: topo.remarks || ''
    });
    setIsTopoModalOpen(true);
  };

  const handleSaveTopo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topoForm.name.trim()) {
      showNotification('请输入拓扑图名称！', 'error');
      return;
    }

    if (editingTopo) {
      setStationTopologies(prev => prev.map(t => t.id === editingTopo.id ? {
        ...t,
        name: topoForm.name,
        remarks: topoForm.remarks,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      } : t));
      showNotification(`拓扑图 [${topoForm.name}] 属性已成功更新！`);
    } else {
      const newTopo = {
        id: 'T' + Math.floor(100 + Math.random() * 900),
        name: topoForm.name,
        deviceCount: 1,
        status: 'normal',
        remarks: topoForm.remarks,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      
      // Initialize default root node for new topology
      setTopoTrees(prev => ({
        ...prev,
        [newTopo.id]: [
          { id: `root_${newTopo.id}`, name: `${newTopo.name}总进线`, type: '总进线', parentId: null, sn: `INC-${newTopo.id}`, model: 'AH-MAIN' }
        ]
      }));

      setStationTopologies(prev => [...prev, newTopo]);
      setActiveTopoId(newTopo.id);
      showNotification(`成功新增拓扑方案：[${newTopo.name}]！`);
    }
    setIsTopoModalOpen(false);
  };

  const handleDeleteTopo = (topoId: string, topoName: string) => {
    if (confirm(`确定要删除拓扑图配置 "${topoName}" 吗？此操作不可撤销。`)) {
      setStationTopologies(prev => {
        const filtered = prev.filter(t => t.id !== topoId);
        if (filtered.length === 0) {
          const defaultTopo = {
            id: 'T01',
            name: '1# 站点标准主拓扑图',
            deviceCount: 1,
            status: 'normal',
            remarks: '站点默认系统主拓扑图',
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
          setActiveTopoId('T01');
          return [defaultTopo];
        }
        if (activeTopoId === topoId) {
          setActiveTopoId(filtered[0].id);
        }
        return filtered;
      });

      // Cleanup trees
      setTopoTrees(prev => {
        const copy = { ...prev };
        delete copy[topoId];
        return copy;
      });

      showNotification(`已成功删除拓扑方案：[${topoName}]`);
    }
  };

  // Handle adding device manually to pending area
  const handleAddPendingDevice = (type: string) => {
    const newDevice: PendingDevice = {
      id: `p_dev_${Date.now()}`,
      name: `新建${type}_${Math.floor(100 + Math.random() * 900)}`,
      type,
      sn: `SN-${type.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
      model: `${type}-MOD-V1`
    };
    setPendingDevices(prev => [newDevice, ...prev]);
    showNotification(`已新增 [${newDevice.name}] 至待编辑设备区域！`);
  };

  // 开始指针拖拽（设备池卡片 / 画布节点卡片 / 画布上的电表胶囊 通用）
  const startPointerDrag = (
    e: React.PointerEvent,
    item: { id: string; name: string; type: string },
    source: 'pending' | 'canvas' | 'meter'
  ) => {
    if (e.button !== 0) return; // 仅左键
    e.preventDefault();
    e.stopPropagation();
    const payload = { id: item.id, name: item.name, type: item.type, source };
    dragItemRef.current = payload;
    setDragItem(payload);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  // 落点处理：把设备挂到 targetParentId 下（或与目标建立电表计量关系）
  const dropOnNode = (
    item: { id: string; name: string; type: string; source: 'pending' | 'canvas' | 'meter' },
    targetParentId: string
  ) => {
    const currentTopoId = activeTopoId || 'T01';
    const currentNodes = topoTrees[currentTopoId] || DEFAULT_TOPOLOGY_NODES_MAP['T01'] || [];
    const targetParent = currentNodes.find(n => n.id === targetParentId);
    const parentName = targetParent ? targetParent.name : '目标节点';

    // Special handling for Electric Meters (电表是计量关系，不是树层级连线节点)
    if (item.type === '电表') {
      if (item.source === 'pending') {
        const device = pendingDevices.find(p => p.id === item.id);
        if (!device) return;

        // 落点即测量组的第一台设备；后续把同层设备拖到电表胶囊上继续加组
        const dup = (meterLinks[currentTopoId] || []).some(
          ml => ml.sn === device.sn && ml.targetNodeIds.includes(targetParentId)
        );
        if (dup) {
          showNotification(`设备 [${parentName}] 已在电表 [${device.name}] 的计量组里了。`, 'error');
          return;
        }

        setMeterLinks(prev => {
          const list = prev[currentTopoId] || [];
          return {
            ...prev,
            [currentTopoId]: [
              ...list,
              {
                id: `ml_${Date.now()}`,
                name: device.name,
                sn: device.sn,
                model: device.model,
                // 落点即计量组的第一台成员；后续把同层设备拖到电表胶囊上继续加组
                targetNodeIds: [targetParentId],
              },
            ],
          };
        });

        setPendingDevices(prev => prev.filter(p => p.id !== item.id));
        showNotification(
          `电表 [${device.name}] 已挂到设备 [${parentName}] 上（当前计量 1 台）。把同层级设备拖到电表上可继续加组。`,
          'success'
        );
      }
      return;
    }

    if (item.source === 'pending') {
      const device = pendingDevices.find(p => p.id === item.id);
      if (!device) return;

      const newNode: TopoNode = {
        id: `node_${Date.now()}`,
        name: device.name,
        type: device.type,
        parentId: targetParentId,
        sn: device.sn,
        model: device.model,
        status: 'normal'
      };

      setTopoTrees(prev => ({
        ...prev,
        [currentTopoId]: [...(prev[currentTopoId] || []), newNode]
      }));

      setPendingDevices(prev => prev.filter(p => p.id !== item.id));
      showNotification(`已自动吸附连线：[${device.name}] 挂载至 [${parentName}] 下级！`, 'success');

    } else if (item.source === 'canvas') {
      if (item.id === targetParentId) return;

      let curr: string | null = targetParentId;
      let isAncestor = false;
      while (curr) {
        if (curr === item.id) { isAncestor = true; break; }
        const p = currentNodes.find(n => n.id === curr);
        curr = p?.parentId || null;
      }

      if (isAncestor) {
        showNotification('不能将父节点挂载至其子节点下级！', 'error');
        return;
      }

      // 统计被拖动设备的下级数量（子设备随父节点整体重挂载）
      let subCount = 0;
      {
        const moved = new Set<string>([item.id]);
        let go = true;
        while (go) {
          go = false;
          currentNodes.forEach(n => {
            if (n.parentId && moved.has(n.parentId) && !moved.has(n.id)) {
              moved.add(n.id);
              subCount++;
              go = true;
            }
          });
        }
      }

      setTopoTrees(prev => ({
        ...prev,
        [currentTopoId]: (prev[currentTopoId] || []).map(n => n.id === item.id ? { ...n, parentId: targetParentId } : n)
      }));

      // 重挂载后：该层级若已有整组同层的计量组（≥2 台），重新聚拢，避免新挂载的设备插进框里
      {
        const inLevel = (id: string) => {
          if (id === item.id) return true; // 被拖动的这台刚落进该层级
          const n = currentNodes.find(x => x.id === id);
          return !!n && (n.parentId ?? null) === targetParentId;
        };
        (meterLinks[currentTopoId] || [])
          .filter(ml => ml.targetNodeIds.length >= 2 && ml.targetNodeIds.every(inLevel))
          .forEach(ml => scheduleMeterCompact(currentTopoId, ml.id, ml.targetNodeIds));
      }

      showNotification(
        subCount > 0
          ? `已将 [${item.name}] 及其下级 ${subCount} 台设备整体挂载至 [${parentName}] 下！`
          : `节点 [${item.name}] 已挂载至 [${parentName}] 下！`,
        'success'
      );
    }
  };

  // 解绑电表：整表退回设备池（电表只画一处，× 即整块表解绑）
  const handleUnbindMeterLink = (linkId: string) => {
    const currentTopoId = activeTopoId || 'T01';
    const list = meterLinks[currentTopoId] || [];
    const link = list.find(ml => ml.id === linkId);
    if (!link) return;

    setMeterLinks(prev => ({ ...prev, [currentTopoId]: list.filter(ml => ml.id !== linkId) }));
    const returnedMeter: PendingDevice = {
      id: `p_dev_${Date.now()}`,
      name: link.name,
      type: '电表',
      sn: link.sn,
      model: link.model || 'DTSD1352',
    };
    setPendingDevices(prev => [returnedMeter, ...prev]);
    showNotification(`已解绑测量关系，电表 [${link.name}] 退回设备池！`, 'success');
  };

  // 加组：把一台设备拖到电表胶囊上，纳入该表的计量组（必须与组内设备同层级）
  const handleAddToMeterGroup = (linkId: string, deviceId: string) => {
    const currentTopoId = activeTopoId || 'T01';
    const list = meterLinks[currentTopoId] || [];
    const link = list.find(ml => ml.id === linkId);
    if (!link) return;
    if (link.targetNodeIds.includes(deviceId)) {
      showNotification('该设备已经在这块电表的计量组里了。', 'error');
      return;
    }
    const nodes = topoTrees[currentTopoId] || [];
    const device = nodes.find(n => n.id === deviceId);
    if (!device) return;
    // 只能加同层级（同一个父节点的直接下级）的设备
    if (!sameLevelAs(currentTopoId, link.targetNodeIds[0], deviceId)) {
      showNotification(
        `[${device.name}] 与这块电表当前的计量设备不在同一层级，只能加同层级的设备。`,
        'error'
      );
      return;
    }
    setMeterLinks(prev => ({
      ...prev,
      [currentTopoId]: (prev[currentTopoId] || []).map(ml =>
        ml.id === linkId ? { ...ml, targetNodeIds: [...ml.targetNodeIds, deviceId] } : ml
      ),
    }));
    // 新成员可能与组内设备隔着一个没被测的设备，稍后自动聚拢（连续加多台只重排一次）
    scheduleMeterCompact(currentTopoId, linkId, [...link.targetNodeIds, deviceId]);
    showNotification(
      `已把设备 [${device.name}] 加入电表 [${link.name}] 的计量组（当前 ${link.targetNodeIds.length + 1} 台同层设备）。`,
      'success'
    );
  };

  // 移出成员：从计量组里去掉一台设备（整组不能为空；空了等同解绑）
  const handleRemoveMeterMember = (linkId: string, deviceId: string) => {
    const currentTopoId = activeTopoId || 'T01';
    const list = meterLinks[currentTopoId] || [];
    const link = list.find(ml => ml.id === linkId);
    if (!link) return;
    const remaining = link.targetNodeIds.filter(id => id !== deviceId);
    if (remaining.length === 0) {
      handleUnbindMeterLink(linkId);
      return;
    }
    const nodes = topoTrees[currentTopoId] || [];
    const device = nodes.find(n => n.id === deviceId);
    setMeterLinks(prev => ({
      ...prev,
      [currentTopoId]: (prev[currentTopoId] || []).map(ml =>
        ml.id === linkId ? { ...ml, targetNodeIds: remaining } : ml
      ),
    }));
    // 移出的是框中间的设备，剩余成员会被没被测的设备隔开 —— 延迟聚拢，
    // 让领导能接着删下一台而不必追着移动中的卡片点
    scheduleMeterCompact(currentTopoId, linkId, remaining);
    showNotification(`已把设备 [${device ? device.name : deviceId}] 移出该电表的计量组。`, 'success');
  };

  // 改挂电表：把胶囊拖到另一台设备上——同层则并入，跨层则重置为这一台
  const handleReanchorMeterLink = (linkId: string, targetNodeId: string) => {
    const currentTopoId = activeTopoId || 'T01';
    const list = meterLinks[currentTopoId] || [];
    const nodes = topoTrees[currentTopoId] || [];
    const link = list.find(ml => ml.id === linkId);
    const target = nodes.find(n => n.id === targetNodeId);
    if (!link || !target) return;
    // 已经是组里唯一一台，原地放下不动
    if (link.targetNodeIds.length === 1 && link.targetNodeIds[0] === targetNodeId) return;

    const sameLevel = sameLevelAs(currentTopoId, link.targetNodeIds[0], targetNodeId);
    const nextTargets = sameLevel
      ? Array.from(new Set([...link.targetNodeIds, targetNodeId]))
      : [targetNodeId];

    setMeterLinks(prev => ({
      ...prev,
      [currentTopoId]: (prev[currentTopoId] || []).map(ml =>
        ml.id === linkId ? { ...ml, targetNodeIds: nextTargets } : ml
      ),
    }));
    if (sameLevel) scheduleMeterCompact(currentTopoId, linkId, nextTargets);
    showNotification(
      sameLevel
        ? `电表 [${link.name}] 的计量组已加入 [${target.name}]（当前 ${nextTargets.length} 台同层设备）。`
        : `电表 [${link.name}] 的计量组已改为只测 [${target.name}]。原组员与它不同层级。`,
      'success'
    );
  };

  // 退回设备池：该设备及其全部下级一并退回（非硬删除），关联电表同步处理
  const handleRemoveNodeToPending = (nodeId: string) => {
    const currentTopoId = activeTopoId || 'T01';
    const currentNodes = topoTrees[currentTopoId] || [];
    const nodeToRemove = currentNodes.find(n => n.id === nodeId);
    if (!nodeToRemove) return;

    if (nodeToRemove.type === '总进线' || nodeToRemove.parentId === null) {
      showNotification('总进线为画布默认根节点，不可移出拓扑！', 'error');
      return;
    }

    // 收集该设备及其全部下级设备
    const removeIds = new Set<string>([nodeId]);
    let growing = true;
    while (growing) {
      growing = false;
      currentNodes.forEach(n => {
        if (n.parentId && removeIds.has(n.parentId) && !removeIds.has(n.id)) {
          removeIds.add(n.id);
          growing = true;
        }
      });
    }

    const removedNodes = currentNodes.filter(n => removeIds.has(n.id));
    const remainingNodes = currentNodes.filter(n => !removeIds.has(n.id));

    const stamp = Date.now();
    const returnedDevices: PendingDevice[] = removedNodes.map((n, i) => ({
      id: `p_dev_${stamp}_${i}`,
      name: n.name,
      type: n.type,
      sn: n.sn || `SN-${n.id}`,
      model: n.model || `${n.type}-MOD`,
    }));

    // 电表：胶囊所在设备被删则整表退回；否则只把被删设备从计量组里摘掉
    const list = meterLinks[currentTopoId] || [];
    const keptMeters: MeterLink[] = [];
    const returnedMeters: PendingDevice[] = [];
    list.forEach(ml => {
      const remainingTargets = ml.targetNodeIds.filter(id => !removeIds.has(id));
      if (remainingTargets.length === 0) {
        // 计量组被清空 = 这块表在画布上没处可挂，整表退回设备池
        returnedMeters.push({
          id: `p_dev_${stamp}_m_${ml.id}`,
          name: ml.name,
          type: '电表',
          sn: ml.sn,
          model: ml.model || 'DTSD1352',
        });
      } else {
        keptMeters.push({ ...ml, targetNodeIds: remainingTargets });
      }
    });

    setTopoTrees(prev => ({ ...prev, [currentTopoId]: remainingNodes }));
    setMeterLinks(prev => ({ ...prev, [currentTopoId]: keptMeters }));
    setPendingDevices(prev => [...returnedDevices, ...returnedMeters, ...prev]);
    // 被删设备原本夹在组中间时，剩余成员稍后自动聚拢（连续的删除/退回会合并成一次）
    keptMeters.forEach(ml => scheduleMeterCompact(currentTopoId, ml.id, ml.targetNodeIds));

    const extra = removedNodes.length - 1;
    showNotification(
      extra > 0
        ? `已将 [${nodeToRemove.name}] 及其下级 ${extra} 台设备一并退回设备池！`
        : `已将设备 [${nodeToRemove.name}] 退回设备池！`,
      'success'
    );
  };

  // 拖设备时，电表胶囊很小不容易对准：命中不到时找最近的一块（26px 以内也算命中）
  const meterChipNear = (x: number, y: number, radius = 26): string | null => {
    const chips = document.querySelectorAll('[data-meter-chip]');
    let bestId: string | null = null;
    let bestDist = radius;
    chips.forEach(c => {
      const r = (c as HTMLElement).getBoundingClientRect();
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) {
        bestDist = d;
        bestId = c.getAttribute('data-meter-chip');
      }
    });
    return bestId;
  };

  // 指针拖拽：全局监听，指针移出容器也能正常结算（HTML5 DnD 的 drop 做不到）
  useEffect(() => {
    if (!dragItem) return;

    const onMove = (ev: PointerEvent) => {
      setDragPos({ x: ev.clientX, y: ev.clientY });
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const nodeEl = el?.closest('[data-node-id]') as HTMLElement | null;
      const meterEl = el?.closest('[data-drop-meter]') as HTMLElement | null;
      setDragOverNodeId(nodeEl ? nodeEl.getAttribute('data-node-id') : null);
      setDragOverMeterId(
        meterEl ? meterEl.getAttribute('data-drop-meter') : meterChipNear(ev.clientX, ev.clientY)
      );
      setIsOverPool(!!el?.closest('[data-drop-pool]'));
    };

    const onUp = (ev: PointerEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const nodeEl = el?.closest('[data-node-id]') as HTMLElement | null;
      const meterEl = el?.closest('[data-drop-meter]') as HTMLElement | null;
      const meterId = meterEl
        ? meterEl.getAttribute('data-drop-meter')
        : meterChipNear(ev.clientX, ev.clientY);
      const overPool = !!el?.closest('[data-drop-pool]');
      const payload = dragItemRef.current;

      if (payload) {
        if (payload.source === 'meter') {
          // 电表胶囊：拖回设备池 = 解绑整表；拖到设备上 = 改挂 / 并入同层计量组
          if (overPool) {
            handleUnbindMeterLink(payload.id);
          } else if (nodeEl) {
            handleReanchorMeterLink(payload.id, nodeEl.getAttribute('data-node-id') as string);
          }
        } else if (meterId && payload.source === 'canvas') {
          // 把画布上的一台设备拖到电表上 = 纳入该表的计量组
          handleAddToMeterGroup(meterId, payload.id);
        } else if (meterId && payload.source === 'pending') {
          showNotification('请先把这台设备挂到拓扑上，再拖到电表上加入计量组。', 'error');
        } else if (overPool && payload.source === 'canvas') {
          // 拖回设备池 = 删除（该设备及其全部下级一并退回）
          handleRemoveNodeToPending(payload.id);
        } else if (nodeEl) {
          dropOnNode(payload, nodeEl.getAttribute('data-node-id') as string);
        }
      }

      dragItemRef.current = null;
      setDragItem(null);
      setDragPos(null);
      setDragOverNodeId(null);
      setDragOverMeterId(null);
      setIsOverPool(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragItem]);

  // 画布平移：全局监听
  useEffect(() => {
    if (!isPanning) return;
    const onMove = (ev: PointerEvent) => {
      const st = canvasPanRef.current;
      if (!st) return;
      setCanvasPan({ x: st.baseX + (ev.clientX - st.startX), y: st.baseY + (ev.clientY - st.startY) });
    };
    const onUp = () => {
      canvasPanRef.current = null;
      setIsPanning(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isPanning]);

  // 画布空白处按下 → 开始平移（点在卡片/按钮/下拉/输入框上则不触发）
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = e.target as HTMLElement;
    if (
      el.closest('[data-node-id]') ||
      el.closest('[data-meter-chip]') ||
      el.closest('[data-pool-card]') ||
      el.closest('button') ||
      el.closest('select') ||
      el.closest('input')
    ) return;
    e.preventDefault();
    canvasPanRef.current = { startX: e.clientX, startY: e.clientY, baseX: canvasPan.x, baseY: canvasPan.y };
    setIsPanning(true);
  };

  // Incomer Line state
  const [incomerLines, setIncomerLines] = useState<any[]>(() => {
    const storageKey = `incomer_lines_v2_${station.id || station.name}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Default: 2 incomer lines with multi-topology binding demo
    return [
      {
        id: 'INC_01',
        name: '1# 变压器总进线',
        remarks: '站内主电源进线，绑定高压侧与低压母线拓扑',
        isInUse: true,
        boundTopoIds: ['T01', 'T02'],
        createdAt: '2026-07-10 11:30:00'
      },
      {
        id: 'INC_02',
        name: '2# 变压器总进线',
        remarks: '二期备用电源进线，绑定储能与光伏拓扑',
        isInUse: false,
        boundTopoIds: ['T03', 'T04'],
        createdAt: '2026-07-12 09:15:00'
      }
    ];
  });

  useEffect(() => {
    const storageKey = `incomer_lines_v2_${station.id || station.name}`;
    localStorage.setItem(storageKey, JSON.stringify(incomerLines));
  }, [incomerLines, station.id, station.name]);

  const [isIncomerModalOpen, setIsIncomerModalOpen] = useState(false);
  const [editingIncomer, setEditingIncomer] = useState<any | null>(null);
  const [incomerForm, setIncomerForm] = useState({
    name: '',
    remarks: '',
    isInUse: true,
    selectedTopoIds: [] as string[]
  });
  const [isSyncingTopo, setIsSyncingTopo] = useState(false);

  const handleOpenAddIncomer = () => {
    setEditingIncomer(null);
    setIncomerForm({
      name: `${incomerLines.length + 1}# 进线`,
      remarks: '',
      isInUse: true,
      selectedTopoIds: []
    });
    setIsIncomerModalOpen(true);
  };

  const handleOpenEditIncomer = (line: any) => {
    setEditingIncomer(line);
    setIncomerForm({
      name: line.name,
      remarks: line.remarks || '',
      isInUse: line.isInUse ?? true,
      selectedTopoIds: [...line.boundTopoIds]
    });
    setIsIncomerModalOpen(true);
  };

  const handleToggleIncomerStatus = (id: string) => {
    setIncomerLines(prev => prev.map(line => {
      if (line.id === id) {
        const nextStatus = !line.isInUse;
        showNotification(`进线 [${line.name}] 已切换为 ${nextStatus ? '使用中' : '备用/未启用'}！`);
        return { ...line, isInUse: nextStatus };
      }
      return line;
    }));
  };

  const handleSaveIncomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomerForm.name.trim()) {
      showNotification('请输入进线名称！', 'error');
      return;
    }

    const newTopoIds = incomerForm.selectedTopoIds;

    if (editingIncomer) {
      setIncomerLines(prev => {
        return prev.map(line => {
          if (line.id === editingIncomer.id) {
            return {
              ...line,
              name: incomerForm.name,
              remarks: incomerForm.remarks,
              isInUse: incomerForm.isInUse,
              boundTopoIds: newTopoIds
            };
          } else {
            return {
              ...line,
              boundTopoIds: line.boundTopoIds.filter(id => !newTopoIds.includes(id))
            };
          }
        });
      });
      showNotification(`已更新进线 [${incomerForm.name}] 及其绑定的拓扑映射！`);
    } else {
      const newId = 'INC_' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const newIncomer = {
        id: newId,
        name: incomerForm.name,
        remarks: incomerForm.remarks,
        isInUse: incomerForm.isInUse,
        boundTopoIds: newTopoIds,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      setIncomerLines(prev => {
        const updatedPrev = prev.map(line => ({
          ...line,
          boundTopoIds: line.boundTopoIds.filter(id => !newTopoIds.includes(id))
        }));
        return [...updatedPrev, newIncomer];
      });
      showNotification(`已新增进线 [${incomerForm.name}]！`);
    }

    setIsIncomerModalOpen(false);
  };

  const handleDeleteIncomer = (id: string, name: string) => {
    if (incomerLines.length <= 1) {
      if (!confirm(`这是站内唯一的进线 [${name}]，确认删除吗？`)) {
        return;
      }
    }
    setIncomerLines(prev => prev.filter(l => l.id !== id));
    showNotification(`已删除进线 [${name}]！`);
  };

  const handleSyncTopologyFromLocal = () => {
    if (isSyncingTopo) return;
    setIsSyncingTopo(true);
    setTimeout(() => {
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const syncedCount = stationTopologies.length;

      // 同步全部本地拓扑：刷新现场运行拓扑的物理连线，并更新各套拓扑的同步时间
      setTopoConnections([
        { from: 'grid', to: 'gw' },
        { from: 'gw', to: 'trans' },
        { from: 'trans', to: 'bus' },
        { from: 'bus', to: 'ess1' },
        { from: 'bus', to: 'ess2' },
        { from: 'ess1', to: 'pcs1' },
        { from: 'ess1', to: 'pcs2' },
        { from: 'ess2', to: 'bat1' },
        { from: 'ess2', to: 'bat2' }
      ]);
      setStationTopologies(prev => prev.map(t => ({ ...t, updatedAt: stamp })));
      setIsSyncingTopo(false);
      showNotification(`同步完成：已从本地网关 (SN: 8842b5) 同步 ${syncedCount} 套拓扑方案，节点与连线关系已更新！`, 'success');
    }, 800);
  };

  const allVersions = versions || INITIAL_VERSIONS;
  const allFeaturePacks = featurePacks || INITIAL_FEATURE_PACKS;

  const [selectedVersionId, setSelectedVersionId] = useState<string>(() => {
    return station.baseVersionId || 'V2';
  });

  const [selectedFeatureCodes, setSelectedFeatureCodes] = useState<string[]>(() => {
    return station.features || ['FP1', 'FP2', 'FP3', 'FP4', 'FP9'];
  });

  // Load custom features enabled for this station
  const [pricingConfig, setPricingConfig] = useState(() => {
    let pType = station.purchasePriceType || '固定分时电价';
    if (pType === '动态电价' || pType === '市场化价格') pType = '市场化电价';
    let fType = station.feedInPriceType || '固定价格';
    if (fType === '市场随动价格' || fType === '随行就市市场价格') fType = '市场化电价';

    return {
      purchaseType: pType,
      purchaseDetail: station.purchaseDetail || '峰 1.2元/kWh | 平 0.8元/kWh | 谷 0.3元/kWh',
      feedInType: fType,
      feedInPrice: station.feedInPrice || '0.45',
      province: station.province || '上海市',
      electricityTypeI: station.electricityTypeI || '两部制',
      electricityTypeII: station.electricityTypeII || '一般工商业',
      voltageLevel: station.voltageLevel || '10千伏',
      dynamicPurchasePriceId: station.dynamicPurchasePriceId || '',
      dynamicSalesPriceId: station.dynamicSalesPriceId || ''
    };
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ===== Electricity Price Trend & Rules State =====
  const [priceTab, setPriceTab] = useState<'purchase' | 'sale'>('purchase'); // 电网购电 vs 光伏售电
  const [priceMode, setPriceMode] = useState<'fixed' | 'market'>('fixed'); // 固定分时 vs 市场化电价
  const [priceDate, setPriceDate] = useState<string>('2026-07-30');
  const [autoSyncPrice, setAutoSyncPrice] = useState<boolean>(true);

  // Modals state
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState<boolean>(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [ruleForm, setRuleForm] = useState({
    dateRange: '2026-07-01~2026-07-31',
    timeSlot: '17:00~22:00',
    type: '尖峰',
    price: 1.1187
  });

  const [touRules, setTouRules] = useState([
    { id: 'R01', dateRange: '2026-07-01~2026-07-31', timeSlot: '17:00~22:00', type: '尖峰', price: 1.1187, updatedAt: '2026-06-30 23:00:19' },
    { id: 'R02', dateRange: '2026-07-01~2026-07-31', timeSlot: '16:00~17:00、22:00~23:00', type: '高峰', price: 0.9734, updatedAt: '2026-06-30 23:00:19' },
    { id: 'R03', dateRange: '2026-07-01~2026-07-31', timeSlot: '00:00~01:00、06:00~16:00、23:00~24:00', type: '平段', price: 0.6339, updatedAt: '2026-06-30 23:00:19' },
    { id: 'R04', dateRange: '2026-07-01~2026-07-31', timeSlot: '01:00~06:00', type: '低谷', price: 0.2946, updatedAt: '2026-06-30 23:00:19' },
    
    { id: 'R05', dateRange: '2026-06-01~2026-06-30', timeSlot: '17:00~22:00', type: '尖峰', price: 1.0453, updatedAt: '2026-05-31 23:00:16' },
    { id: 'R06', dateRange: '2026-06-01~2026-06-30', timeSlot: '16:00~17:00、22:00~23:00', type: '高峰', price: 0.9096, updatedAt: '2026-05-31 23:00:16' },
    { id: 'R07', dateRange: '2026-06-01~2026-06-30', timeSlot: '00:00~07:00、12:00~16:00、23:00~24:00', type: '平段', price: 0.5926, updatedAt: '2026-05-31 23:00:16' },
    { id: 'R08', dateRange: '2026-06-01~2026-06-30', timeSlot: '07:00~12:00', type: '低谷', price: 0.2758, updatedAt: '2026-05-31 23:00:16' },

    { id: 'R09', dateRange: '2026-05-01~2026-05-31', timeSlot: '17:00~20:00', type: '尖峰', price: 1.0639, updatedAt: '2026-04-30 23:01:05' },
    { id: 'R10', dateRange: '2026-05-01~2026-05-31', timeSlot: '20:00~22:00', type: '高峰', price: 0.9240, updatedAt: '2026-04-30 23:01:05' },
    { id: 'R11', dateRange: '2026-05-01~2026-05-31', timeSlot: '00:00~10:00、15:00~17:00、22:00~24:00', type: '平段', price: 0.5974, updatedAt: '2026-04-30 23:01:05' },
    { id: 'R12', dateRange: '2026-05-01~2026-05-31', timeSlot: '10:00~11:00、14:00~15:00', type: '低谷', price: 0.2709, updatedAt: '2026-04-30 23:01:05' },
    { id: 'R13', dateRange: '2026-05-01~2026-05-31', timeSlot: '11:00~14:00', type: '深谷', price: 0.1776, updatedAt: '2026-04-30 23:01:05' },
  ]);

  const trendChartData = useMemo(() => {
    if (priceTab === 'purchase') {
      return [
        { time: '00:00', actual: 0.6339, predicted: 0.6339, period: '平段' },
        { time: '01:00', actual: 0.6339, predicted: 0.6339, period: '平段' },
        { time: '02:00', actual: 0.2946, predicted: 0.2946, period: '低谷' },
        { time: '03:00', actual: 0.2946, predicted: 0.2946, period: '低谷' },
        { time: '04:00', actual: 0.2946, predicted: 0.2946, period: '低谷' },
        { time: '05:00', actual: 0.2946, predicted: 0.2946, period: '低谷' },
        { time: '06:00', actual: 0.6339, predicted: 0.6339, period: '平段' },
        { time: '07:00', actual: 0.6339, predicted: 0.6500, period: '平段' },
        { time: '08:00', actual: 0.6339, predicted: 0.6339, period: '平段' },
        { time: '09:00', actual: 0.4403, predicted: 0.4403, period: '低谷' },
        { time: '09:30', actual: 0.3238, predicted: 0.3238, period: '低谷' },
        { time: '10:00', actual: 0.3238, predicted: 0.6339, period: '平段' },
        { time: '11:00', actual: null, predicted: 0.6339, period: '平段' },
        { time: '12:00', actual: null, predicted: 0.6339, period: '平段' },
        { time: '13:00', actual: null, predicted: 0.6500, period: '平段' },
        { time: '14:00', actual: null, predicted: 0.6500, period: '平段' },
        { time: '15:00', actual: null, predicted: 0.6800, period: '平段' },
        { time: '16:00', actual: null, predicted: 0.9734, period: '高峰' },
        { time: '17:00', actual: null, predicted: 1.1187, period: '尖峰' },
        { time: '18:00', actual: null, predicted: 1.1187, period: '尖峰' },
        { time: '18:30', actual: null, predicted: 0.9946, period: '高峰' },
        { time: '19:00', actual: null, predicted: 0.9946, period: '高峰' },
        { time: '20:00', actual: null, predicted: 0.9946, period: '高峰' },
        { time: '21:00', actual: null, predicted: 0.9946, period: '高峰' },
        { time: '22:00', actual: null, predicted: 0.9734, period: '高峰' },
        { time: '23:00', actual: null, predicted: 0.6339, period: '平段' },
        { time: '24:00', actual: null, predicted: 0.6339, period: '平段' },
      ];
    } else {
      return [
        { time: '00:00', actual: 0.4100, predicted: 0.4100, period: '光伏余量' },
        { time: '01:00', actual: 0.4100, predicted: 0.4100, period: '光伏余量' },
        { time: '02:00', actual: 0.4350, predicted: 0.4100, period: '光伏余量' },
        { time: '03:00', actual: 0.4000, predicted: 0.3950, period: '光伏余量' },
        { time: '04:00', actual: 0.3900, predicted: 0.3900, period: '光伏余量' },
        { time: '05:00', actual: 0.3900, predicted: 0.3900, period: '光伏余量' },
        { time: '06:00', actual: 0.3800, predicted: 0.3800, period: '日光发散' },
        { time: '07:00', actual: 0.3600, predicted: 0.3400, period: '日光发散' },
        { time: '08:00', actual: 0.3300, predicted: 0.3300, period: '光伏大发' },
        { time: '09:00', actual: 0.0931, predicted: 0.2500, period: '光伏大发' },
        { time: '09:30', actual: -0.0234, predicted: 0.0931, period: '大发倒扣' },
        { time: '10:00', actual: -0.0234, predicted: -0.0234, period: '大发倒扣' },
        { time: '11:00', actual: null, predicted: 0.3500, period: '充放上网' },
        { time: '12:00', actual: null, predicted: 0.3300, period: '充放上网' },
        { time: '13:00', actual: null, predicted: 0.3500, period: '充放上网' },
        { time: '14:00', actual: null, predicted: 0.3700, period: '充放上网' },
        { time: '15:00', actual: null, predicted: 0.4200, period: '晚峰储备' },
        { time: '16:00', actual: null, predicted: 0.4300, period: '晚峰储备' },
        { time: '17:00', actual: null, predicted: 0.4400, period: '晚峰高价' },
        { time: '18:00', actual: null, predicted: 0.4601, period: '晚峰高价' },
        { time: '18:30', actual: null, predicted: 0.4601, period: '晚峰高价' },
        { time: '19:00', actual: null, predicted: 0.4601, period: '晚峰高价' },
        { time: '20:00', actual: null, predicted: 0.4300, period: '常态上网' },
        { time: '21:00', actual: null, predicted: 0.4200, period: '常态上网' },
        { time: '22:00', actual: null, predicted: 0.4250, period: '常态上网' },
        { time: '23:00', actual: null, predicted: 0.4200, period: '常态上网' },
        { time: '24:00', actual: null, predicted: 0.4200, period: '常态上网' },
      ];
    }
  }, [priceTab]);

  const getTypeBadgeColor = (type: string) => {
    switch(type) {
      case '尖峰': return 'bg-orange-100 text-orange-800 border-orange-200';
      case '高峰': return 'bg-amber-100 text-amber-800 border-amber-200';
      case '平段': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case '低谷': return 'bg-blue-100 text-blue-800 border-blue-200';
      case '深谷': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Sync pricing settings with initial prop values
  useEffect(() => {
    let pType = station.purchasePriceType || '固定分时电价';
    if (pType === '动态电价' || pType === '市场化价格') pType = '市场化电价';
    let fType = station.feedInPriceType || '固定价格';
    if (fType === '市场随动价格' || fType === '随行就市市场价格') fType = '市场化电价';

    setPricingConfig({
      purchaseType: pType,
      purchaseDetail: station.purchaseDetail || '峰 1.2元/kWh | 平 0.8元/kWh | 谷 0.3元/kWh',
      feedInType: fType,
      feedInPrice: station.feedInPrice || '0.45',
      province: station.province || '上海市',
      electricityTypeI: station.electricityTypeI || '两部制',
      electricityTypeII: station.electricityTypeII || '一般工商业',
      voltageLevel: station.voltageLevel || '10千伏',
      dynamicPurchasePriceId: station.dynamicPurchasePriceId || '',
      dynamicSalesPriceId: station.dynamicSalesPriceId || ''
    });
    setSelectedVersionId(station.baseVersionId || 'V2');
    setSelectedFeatureCodes(station.features || ['FP1', 'FP2', 'FP3', 'FP4', 'FP9']);
  }, [station]);

  // Devices belonging to this station
  const stationDevices = useMemo(() => {
    return devices.filter(d => d.station === station.name || d.parent === station.name);
  }, [devices, station.name]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = stationDevices.length;
    // Mocking status logic since some loaded items might have normal/fault/offline status
    const online = Math.max(0, Math.floor(total * 0.9));
    const alarm = Math.floor(total * 0.07);
    const offline = total - online - alarm;
    
    return {
      total,
      online: Math.max(0, online),
      alarm: Math.max(0, alarm),
      offline: Math.max(0, offline)
    };
  }, [stationDevices]);

  // Device types distribution
  const deviceDistribution = useMemo(() => {
    const counts: { [key: string]: number } = {};
    stationDevices.forEach(d => {
      counts[d.type] = (counts[d.type] || 0) + 1;
    });
    // Fill in default types if empty
    const defaultTypes = ['变压器', '储能柜', 'PCS', '电池簇', '并网柜', '电表'];
    defaultTypes.forEach(t => {
      if (!counts[t]) counts[t] = 0;
    });
    return Object.entries(counts).map(([type, value]) => ({ type, value }));
  }, [stationDevices]);

  // ==================== TAB 2 (Device Management) STATES & FILTERS ====================
  const [filterDeviceId, setFilterDeviceId] = useState('');
  const [filterDeviceName, setFilterDeviceName] = useState('');
  const [filterDeviceType, setFilterDeviceType] = useState('');
  const [filterDeviceSn, setFilterDeviceSn] = useState('');
  const [filterDeviceModel, setFilterDeviceModel] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterEnterprise, setFilterEnterprise] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    deviceId: '',
    deviceName: '',
    deviceType: '',
    deviceSn: '',
    deviceModel: '',
    station: '',
    enterprise: ''
  });

  const handleSearchClick = () => {
    setAppliedFilters({
      deviceId: filterDeviceId,
      deviceName: filterDeviceName,
      deviceType: filterDeviceType,
      deviceSn: filterDeviceSn,
      deviceModel: filterDeviceModel,
      station: filterStation,
      enterprise: filterEnterprise
    });
    setCurrentPage(1);
  };

  const handleResetClick = () => {
    setFilterDeviceId('');
    setFilterDeviceName('');
    setFilterDeviceType('');
    setFilterDeviceSn('');
    setFilterDeviceModel('');
    setFilterStation('');
    setFilterEnterprise('');
    setAppliedFilters({
      deviceId: '',
      deviceName: '',
      deviceType: '',
      deviceSn: '',
      deviceModel: '',
      station: '',
      enterprise: ''
    });
    setCurrentPage(1);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Modals inside Device Tab
  const [isCreateDeviceOpen, setIsCreateDeviceOpen] = useState(false);
  const [isImportFromApplyOpen, setIsImportFromApplyOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [viewingDevice, setViewingDevice] = useState<any>(null);

  // New/Edit Device form states
  const [deviceForm, setDeviceForm] = useState({
    id: '',
    name: '',
    type: 'PCS',
    sn: '',
    model: 'PCS',
    parent: '',
    station: '',
    enterprise: '',
    thingModelId: 'TM05'
  });

  // Station and Enterprise options for dropdown
  const stationOptions = useMemo(() => {
    const set = new Set<string>();
    if (station?.name) set.add(station.name);
    set.add('荣成市妇幼保健院');
    set.add('宣城华纳新材料-2#站');
    stations.forEach(s => s.name && set.add(s.name));
    return Array.from(set);
  }, [stations, station?.name]);

  const enterpriseOptions = useMemo(() => {
    const set = new Set<string>();
    if (station?.enterpriseName) set.add(station.enterpriseName);
    set.add('威海市荣成市妇幼保健院');
    set.add('安徽省宣城市华纳新材料科技');
    stations.forEach(s => s.enterpriseName && set.add(s.enterpriseName));
    return Array.from(set);
  }, [stations, station?.enterpriseName]);

  // Combined device dataset (Mock screenshot items + user added items)
  const allAvailableDevices = useMemo(() => {
    const customList = devices.map(d => ({
      id: d.id || `TH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      name: d.name,
      type: d.type,
      sn: d.sn || `SN-${d.id}`,
      model: d.model || '标准款',
      parent: d.parent || station.name,
      station: d.station || station.name,
      enterprise: d.enterprise || station.enterpriseName || '天合能源有限公司',
      createdAt: d.createdAt || '2026-08-18 16:30:00'
    }));

    const map = new Map<string, any>();
    DEFAULT_SCREENSHOT_DEVICES.forEach(item => map.set(item.id, item));
    customList.forEach(item => map.set(item.id, item));
    return Array.from(map.values());
  }, [devices, station.name, station.enterpriseName]);

  // Filtered devices list
  const filteredDeviceList = useMemo(() => {
    return allAvailableDevices.filter(d => {
      if (appliedFilters.deviceId && !d.id.toLowerCase().includes(appliedFilters.deviceId.toLowerCase())) return false;
      if (appliedFilters.deviceName && !d.name.toLowerCase().includes(appliedFilters.deviceName.toLowerCase())) return false;
      if (appliedFilters.deviceType && d.type !== appliedFilters.deviceType) return false;
      if (appliedFilters.deviceSn && !d.sn.toLowerCase().includes(appliedFilters.deviceSn.toLowerCase())) return false;
      if (appliedFilters.deviceModel && !(d.model || '').toLowerCase().includes(appliedFilters.deviceModel.toLowerCase())) return false;
      if (appliedFilters.station && !d.station.includes(appliedFilters.station)) return false;
      if (appliedFilters.enterprise && !d.enterprise.includes(appliedFilters.enterprise)) return false;
      return true;
    });
  }, [allAvailableDevices, appliedFilters]);

  // Filtered flag
  const isFiltered = Boolean(
    appliedFilters.deviceId || appliedFilters.deviceName || appliedFilters.deviceType ||
    appliedFilters.deviceSn || appliedFilters.deviceModel || appliedFilters.station || appliedFilters.enterprise
  );
  const displayTotalCount = isFiltered ? filteredDeviceList.length : 2548;
  const totalPages = Math.max(1, Math.ceil(displayTotalCount / pageSize));

  // Current page items
  const pagedDevices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    if (start >= filteredDeviceList.length) {
      return filteredDeviceList.slice(0, pageSize);
    }
    return filteredDeviceList.slice(start, start + pageSize);
  }, [filteredDeviceList, currentPage, pageSize]);

  useEffect(() => {
    // Auto match thing model based on type selected
    const modelMap: { [key: string]: string } = {
      '变压器': 'TM01',
      '储能柜': 'TM04',
      'PCS': 'TM05',
      '电池簇': 'TM06',
      '并网柜': 'TM03',
      '光伏逆变器': 'TM07',
      '电表': 'TM08'
    };
    setDeviceForm(prev => ({ ...prev, thingModelId: modelMap[prev.type] || 'TM05' }));
  }, [deviceForm.type]);

  const handleOpenCreateDevice = () => {
    setEditingDevice(null);
    setDeviceForm({
      id: `TH${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      name: '',
      type: 'PCS',
      sn: `SN-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
      model: 'PCS',
      parent: station.name,
      station: station.name,
      enterprise: station.enterpriseName || '天合能源有限公司',
      thingModelId: 'TM05'
    });
    setIsCreateDeviceOpen(true);
  };

  const handleOpenEditDevice = (item: any) => {
    setEditingDevice(item);
    setDeviceForm({
      id: item.id,
      name: item.name,
      type: item.type,
      sn: item.sn,
      model: item.model || '',
      parent: item.parent || '',
      station: item.station || station.name,
      enterprise: item.enterprise || station.enterpriseName || '',
      thingModelId: 'TM05'
    });
    setIsCreateDeviceOpen(true);
  };

  const handleSaveDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const model = MOCK_THING_MODELS.find(m => m.id === deviceForm.thingModelId);
    
    if (editingDevice) {
      // Update existing device
      const updated = {
        ...editingDevice,
        name: deviceForm.name || editingDevice.name,
        type: deviceForm.type,
        sn: deviceForm.sn || editingDevice.sn,
        model: deviceForm.model || model?.name || editingDevice.model,
        parent: deviceForm.parent || editingDevice.parent,
        station: deviceForm.station || editingDevice.station,
        enterprise: deviceForm.enterprise || editingDevice.enterprise
      };

      setDevices(prev => prev.map(d => d.id === editingDevice.id ? updated : d));
      showNotification('设备信息更新成功！');
    } else {
      // Create new device
      const newDevice = {
        id: deviceForm.id || `TH${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        name: deviceForm.name || `${deviceForm.type}设备`,
        type: deviceForm.type,
        sn: deviceForm.sn || `SN-${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
        model: deviceForm.model || model?.name || 'GENERIC',
        parent: deviceForm.parent || station.name,
        station: deviceForm.station || station.name,
        enterprise: deviceForm.enterprise || station.enterpriseName || '天合能源有限公司',
        status: 'online',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        remarks: '手动创建并分配物模型'
      };

      setDevices(prev => [newDevice, ...prev]);
      
      const saved = localStorage.getItem('wizard_created_devices');
      let devicesList = [];
      if (saved) {
        try { devicesList = JSON.parse(saved); } catch (e) {}
      }
      devicesList.push(newDevice);
      localStorage.setItem('wizard_created_devices', JSON.stringify(devicesList));

      showNotification('成功创建新设备！');
    }

    setIsCreateDeviceOpen(false);
    setEditingDevice(null);
  };

  // Import from application checkbox states
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const handleImportDevices = () => {
    if (selectedApps.length === 0) {
      showNotification('请至少选择一个建站申请项目！', 'error');
      return;
    }

    const appsToImport = MOCK_STATION_APPLICATIONS.filter(app => selectedApps.includes(app.id));
    const imported: any[] = [];

    appsToImport.forEach(app => {
      app.devices.forEach(dev => {
        for (let i = 0; i < dev.count; i++) {
          const modelMap: { [key: string]: string } = {
            '变压器': '变压器物模型 v2.0',
            '储能柜': '储能柜物模型 v1.5',
            'PCS': 'PCS物模型 v2.1',
            '电池簇': '电池簇物模型 v1.0',
            '并网柜': '并网柜物模型 v1.2',
            '电表': '电表物模型 v1.1'
          };
          imported.push({
            id: 'TH' + Math.random().toString(36).substring(2, 10).toUpperCase(),
            name: dev.count > 1 ? `${dev.name}_#${i + 1}` : dev.name,
            type: dev.type,
            sn: `SN-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
            model: modelMap[dev.type] || '通用物模型',
            parent: station.name,
            station: station.name,
            enterprise: station.enterpriseName || '天合能源有限公司',
            status: 'online',
            createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            remarks: `通过网关申请项目[${app.station}]快速导入创建`
          });
        }
      });
    });

    setDevices(prev => [...imported, ...prev]);

    // Save to localStorage
    const saved = localStorage.getItem('wizard_created_devices');
    let devicesList = [];
    if (saved) {
      try { devicesList = JSON.parse(saved); } catch (e) {}
    }
    devicesList.push(...imported);
    localStorage.setItem('wizard_created_devices', JSON.stringify(devicesList));

    setIsImportFromApplyOpen(false);
    setSelectedApps([]);
    showNotification(`已成功导入 ${imported.length} 台设备到本站工作台！`);
  };

  const handleDeleteDevice = (id: string, name: string) => {
    if (confirm(`确定要从系统中删除设备 "${name}" 吗？`)) {
      setDevices(prev => prev.filter(d => d.id !== id));
      
      const saved = localStorage.getItem('wizard_created_devices');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const filtered = parsed.filter((d: any) => d.id !== id);
          localStorage.setItem('wizard_created_devices', JSON.stringify(filtered));
        } catch (e) {}
      }
      showNotification('设备已成功删除');
    }
  };

  // Topology state (interactive node diagram)
  const [isTopologyEditMode, setIsTopologyEditMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Custom interactive mock connections
  const [topoConnections, setTopoConnections] = useState<Array<{ from: string, to: string }>>([
    { from: 'grid', to: 'gw' },
    { from: 'gw', to: 'trans' },
    { from: 'trans', to: 'bus' },
    { from: 'bus', to: 'ess1' },
    { from: 'bus', to: 'ess2' },
    { from: 'ess1', to: 'pcs1' },
    { from: 'ess1', to: 'pcs2' },
    { from: 'ess2', to: 'bat1' },
    { from: 'ess2', to: 'bat2' }
  ]);

  const [connectingSource, setConnectingSource] = useState<string | null>(null);

  const handleAddTopologyConnection = (targetId: string) => {
    if (connectingSource) {
      if (connectingSource === targetId) {
        setConnectingSource(null);
        return;
      }
      // Check if duplicate
      if (topoConnections.some(c => (c.from === connectingSource && c.to === targetId) || (c.from === targetId && c.to === connectingSource))) {
        showNotification('连接关系已存在！', 'error');
        setConnectingSource(null);
        return;
      }
      setTopoConnections(prev => [...prev, { from: connectingSource, to: targetId }]);
      showNotification(`已成功建立 ${connectingSource} 到 ${targetId} 的逻辑连线关系！`);
      setConnectingSource(null);
    } else {
      setConnectingSource(targetId);
      showNotification('请选择另一个节点完成网络/逻辑连线建立');
    }
  };

  // Pricing & Version config saves
  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    // Update stations list
    setStations(prev => prev.map(s => s.id === station.id ? { 
      ...s, 
      purchasePriceType: pricingConfig.purchaseType,
      purchaseDetail: pricingConfig.purchaseDetail,
      feedInPriceType: pricingConfig.feedInType,
      feedInPrice: pricingConfig.feedInPrice,
      province: pricingConfig.province,
      electricityTypeI: pricingConfig.electricityTypeI,
      electricityTypeII: pricingConfig.electricityTypeII,
      voltageLevel: pricingConfig.voltageLevel,
      dynamicPurchasePriceId: pricingConfig.dynamicPurchasePriceId,
      dynamicSalesPriceId: pricingConfig.dynamicSalesPriceId
    } : s));
    
    // Write back to wizard list if applicable
    const saved = localStorage.getItem('wizard_created_stations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const updated = parsed.map((s: any) => s.id === station.id ? {
          ...s,
          purchasePriceType: pricingConfig.purchaseType,
          purchaseDetail: pricingConfig.purchaseDetail,
          feedInPriceType: pricingConfig.feedInType,
          feedInPrice: pricingConfig.feedInPrice,
          province: pricingConfig.province,
          electricityTypeI: pricingConfig.electricityTypeI,
          electricityTypeII: pricingConfig.electricityTypeII,
          voltageLevel: pricingConfig.voltageLevel,
          dynamicPurchasePriceId: pricingConfig.dynamicPurchasePriceId,
          dynamicSalesPriceId: pricingConfig.dynamicSalesPriceId
        } : s);
        localStorage.setItem('wizard_created_stations', JSON.stringify(updated));
      } catch (e) {}
    }

    showNotification('购售电电价策略及关联参数配置保存成功，即刻生效！');
  };

  const handleSaveFeatures = () => {
    // Update stations list with baseVersionId and features
    setStations(prev => prev.map(s => s.id === station.id ? { 
      ...s, 
      baseVersionId: selectedVersionId,
      features: selectedFeatureCodes
    } : s));
    
    // Write back to wizard list if applicable
    const saved = localStorage.getItem('wizard_created_stations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const updated = parsed.map((s: any) => s.id === station.id ? {
          ...s,
          baseVersionId: selectedVersionId,
          features: selectedFeatureCodes
        } : s);
        localStorage.setItem('wizard_created_stations', JSON.stringify(updated));
      } catch (e) {}
    }

    showNotification('部署服务运行环境版本与特性包配置同步成功，正在重新初始化EMS！');
  };

  // Event log filters
  const [eventSearch, setEventSearch] = useState('');
  const [activeEventCategory, setActiveEventCategory] = useState<string>('全部');

  const filteredLogs = useMemo(() => {
    return MOCK_OPERATION_LOGS.filter(log => {
      const matchSearch = log.content.includes(eventSearch) || log.source.includes(eventSearch) || log.type.includes(eventSearch);
      const matchCat = activeEventCategory === '全部' || log.type === activeEventCategory;
      return matchSearch && matchCat;
    });
  }, [eventSearch, activeEventCategory]);


  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative text-xs">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2.5 animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span className="font-semibold text-xs">{notification.text}</span>
        </div>
      )}

      {/* 1. Header Information Bar */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition flex items-center space-x-1 border border-gray-200 bg-white"
          >
            <ArrowLeft size={14} />
            <span className="font-medium text-xs">返回站点列表</span>
          </button>
          <div className="h-4 w-px bg-gray-300"></div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-gray-900">{station.name}</h2>
              <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                station.status === 'fault' || station.status === 'offline'
                  ? 'bg-red-50 text-red-700 border border-red-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                <span className={`w-1 h-1 rounded-full mr-1 ${
                  station.status === 'fault' || station.status === 'offline' ? 'bg-red-500' : 'bg-emerald-500'
                }`} />
                {station.status === 'fault' ? '告警' : station.status === 'offline' ? '离线' : '运行中'}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-gray-500 text-[11px] mt-1">
              <span className="font-mono flex items-center space-x-1">
                <Cpu size={11} className="text-gray-400" />
                <span>EMS: {station.emsSn || 'ems-default-sn'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Globe size={11} className="text-gray-400" />
                <span>{station.address || '常州市新北区天合路2号'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-gray-500 text-xs shrink-0 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
          <div>
            <span className="text-gray-400">项目负责人：</span>
            <span className="font-medium text-gray-800">{station.managerName || '荆汉进'}</span>
          </div>
          <div className="h-3 w-px bg-gray-200"></div>
          <div>
            <span className="text-gray-400">电话：</span>
            <span className="font-mono font-medium text-gray-800">{station.phone || '18661675886'}</span>
          </div>
        </div>
      </div>

      {/* 2. Menu Navigation Tabs */}
      <div className="flex items-center bg-gray-50 border-b border-gray-200 px-6 shrink-0 h-10">
        <div className="flex space-x-6 h-full">
          {[
            { id: 'overview', label: '站点概览', icon: <Activity size={14} /> },
            { id: 'device', label: '设备管理', icon: <Server size={14} /> },
            { id: 'incomer', label: '进线管理', icon: <Zap size={14} /> },
            { id: 'topo', label: '拓扑维护', icon: <Network size={14} /> },
            { id: 'configuration', label: '组态维护', icon: <LayoutGrid size={14} /> },
            { id: 'pricing', label: '电价配置', icon: <Sliders size={14} /> },
            { id: 'events', label: '事件记录', icon: <FileText size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-1 border-b-2 font-bold text-xs transition-colors h-full ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Workspace Panel Area */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50/40">
        
        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Top statistics summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">所有物理设备</span>
                  <span className="text-2xl font-black text-gray-900 font-mono mt-1 block">{stats.total} <span className="text-xs font-normal text-gray-500">台</span></span>
                </div>
                <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                  <Server size={22} />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">正常在线</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{stats.online} <span className="text-xs font-normal text-gray-500">台</span></span>
                </div>
                <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
                  <BadgeCheck size={22} />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">异常告警</span>
                  <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">{stats.alarm} <span className="text-xs font-normal text-gray-500">台</span></span>
                </div>
                <div className="p-3 rounded-full bg-amber-50 text-amber-600">
                  <ShieldAlert size={22} />
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">离线设备</span>
                  <span className="text-2xl font-black text-gray-500 font-mono mt-1 block">{stats.offline} <span className="text-xs font-normal text-gray-500">台</span></span>
                </div>
                <div className="p-3 rounded-full bg-gray-100 text-gray-500">
                  <Clock size={22} />
                </div>
              </div>
            </div>

            {/* Middle Configuration states and distributions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Configuration Panel */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 lg:col-span-1">
                <h3 className="font-bold text-gray-800 text-xs border-b border-gray-100 pb-3 flex items-center space-x-1.5">
                  <Settings size={14} className="text-gray-500" />
                  <span>服务及运营配置状态</span>
                </h3>
                
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">购电</span>
                      <div className="text-xs">
                        <span className="text-gray-400 block text-[10px]">电价策略</span>
                        <span className="font-bold text-gray-800">{pricingConfig.purchaseType}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('pricing')}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      修改
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">版本</span>
                      <div className="text-xs">
                        <span className="text-gray-400 block text-[10px]">服务版本</span>
                        <span className="font-bold text-gray-800">
                          v2.1 {allVersions.find(v => v.id === selectedVersionId || v.code === selectedVersionId)?.name || '高级版'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('pricing')}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      管理
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">拓扑</span>
                      <div className="text-xs">
                        <span className="text-gray-400 block text-[10px]">逻辑完整度</span>
                        <span className="font-bold text-emerald-600">拓扑结构完整</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('topo')}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      维护
                    </button>
                  </div>
                </div>
              </div>

              {/* Device distribution bar charts */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:col-span-2 space-y-4">
                <h3 className="font-bold text-gray-800 text-xs border-b border-gray-100 pb-3 flex items-center space-x-1.5">
                  <SlidersHorizontal size={14} className="text-gray-500" />
                  <span>站点设备类型分布</span>
                </h3>

                <div className="space-y-3.5 pt-1">
                  {deviceDistribution.map(item => {
                    const maxCount = Math.max(...deviceDistribution.map(i => i.value), 1);
                    const percent = Math.min(100, Math.max(8, (item.value / maxCount) * 100));
                    
                    let barColor = 'bg-blue-500';
                    if (item.type === '储能柜') barColor = 'bg-purple-500';
                    if (item.type === '电池簇') barColor = 'bg-cyan-500';
                    if (item.type === 'PCS') barColor = 'bg-amber-500';
                    if (item.type === '并网柜') barColor = 'bg-emerald-500';
                    if (item.type === '变压器') barColor = 'bg-indigo-500';

                    return (
                      <div key={item.type} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-gray-700">{item.type}</span>
                          <span className="font-bold text-gray-900 font-mono">{item.value} <span className="text-[10px] font-normal text-gray-400">台</span></span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden w-full relative">
                          <div 
                            className={`h-full rounded-full ${barColor} transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom logs segment */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-800 text-xs flex items-center space-x-1.5">
                  <Clock size={14} className="text-gray-500" />
                  <span>最近运行与操作日志</span>
                </h3>
                <button 
                  onClick={() => setActiveTab('events')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5"
                >
                  <span>查看全部</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {MOCK_OPERATION_LOGS.slice(0, 3).map(log => (
                  <div key={log.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 first:pt-0 last:pb-0">
                    <div className="flex items-start md:items-center space-x-3">
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        log.level === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                        log.level === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-xs font-medium text-gray-800">{log.content}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-[11px] text-gray-400 font-mono self-end md:self-auto">
                      <span>来源: {log.source}</span>
                      <span>•</span>
                      <span>时间: {log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* ==================== TAB 2: DEVICE MANAGEMENT ==================== */}
        {activeTab === 'device' && (
          <div className="space-y-4">
            
            {/* Top 2-Row Filter Grid Matching Screenshot */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700 whitespace-nowrap w-16 text-right shrink-0">设备ID</span>
                  <input 
                    type="text" 
                    placeholder="请输入"
                    value={filterDeviceId}
                    onChange={e => setFilterDeviceId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchClick()}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500 bg-white placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700 whitespace-nowrap w-16 text-right shrink-0">设备名称</span>
                  <input 
                    type="text" 
                    placeholder="请输入"
                    value={filterDeviceName}
                    onChange={e => setFilterDeviceName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchClick()}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500 bg-white placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700 whitespace-nowrap w-16 text-right shrink-0">设备类型</span>
                  <div className="relative w-full">
                    <select 
                      value={filterDeviceType}
                      onChange={e => setFilterDeviceType(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500 bg-white text-gray-700 appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">请输入</option>
                      <option value="EMS">EMS</option>
                      <option value="PCS">PCS</option>
                      <option value="储能空调">储能空调</option>
                      <option value="变压器">变压器</option>
                      <option value="储能柜">储能柜</option>
                      <option value="电池簇">电池簇</option>
                      <option value="并网柜">并网柜</option>
                      <option value="光伏逆变器">光伏逆变器</option>
                      <option value="电表">电表</option>
                      <option value="储能消防">储能消防</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700 whitespace-nowrap w-16 text-right shrink-0">设备SN</span>
                  <input 
                    type="text" 
                    placeholder="请输入"
                    value={filterDeviceSn}
                    onChange={e => setFilterDeviceSn(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchClick()}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500 bg-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700 whitespace-nowrap w-16 text-right shrink-0">设备型号</span>
                  <input 
                    type="text" 
                    placeholder="请输入"
                    value={filterDeviceModel}
                    onChange={e => setFilterDeviceModel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchClick()}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500 bg-white placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700 whitespace-nowrap w-16 text-right shrink-0">所属站点</span>
                  <div className="relative w-full">
                    <select 
                      value={filterStation}
                      onChange={e => setFilterStation(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500 bg-white text-gray-700 appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">请输入</option>
                      {stationOptions.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-700 whitespace-nowrap w-16 text-right shrink-0">所属企业</span>
                  <div className="relative w-full">
                    <select 
                      value={filterEnterprise}
                      onChange={e => setFilterEnterprise(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500 bg-white text-gray-700 appearance-none pr-8 cursor-pointer"
                    >
                      <option value="">请选择</option>
                      {enterpriseOptions.map(ent => (
                        <option key={ent} value={ent}>{ent}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2.5">
                  <button 
                    onClick={handleSearchClick}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition flex items-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <Search size={13} />
                    <span>搜索</span>
                  </button>
                  <button 
                    onClick={handleResetClick}
                    className="px-4 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 bg-white rounded text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>重置</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Bar Above Table */}
            <div className="flex items-center justify-end space-x-3 pt-1">
              <button 
                onClick={() => setIsImportFromApplyOpen(true)}
                className="relative px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <FileText size={13} />
                <span>本地新建设备申请</span>
                <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white leading-tight shadow-xs">
                  26
                </span>
              </button>
              <button 
                onClick={handleOpenCreateDevice}
                className="px-3.5 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 bg-white text-xs font-medium rounded transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus size={13} />
                <span>新建设备</span>
              </button>
            </div>

            {/* Devices Table (10 Columns matching screenshot) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-700 font-medium">
                      <th className="px-4 py-3.5 whitespace-nowrap">设备ID</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">设备名称</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">设备类型</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">设备SN</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">设备型号</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">设备父级</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">所属站点</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">所属企业</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">创建时间</th>
                      <th className="px-4 py-3.5 text-center whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {pagedDevices.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-16 text-gray-400">
                          <Server size={32} className="mx-auto mb-2 text-gray-300 opacity-60" />
                          <span>暂无符合条件的设备数据</span>
                        </td>
                      </tr>
                    ) : (
                      pagedDevices.map(item => (
                        <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-gray-800 whitespace-nowrap">{item.id}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{item.name}</td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{item.type}</td>
                          <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">{item.sn}</td>
                          <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">{item.model || '-'}</td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{item.parent || '-'}</td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{item.station}</td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{item.enterprise}</td>
                          <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">{item.createdAt}</td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button 
                                onClick={() => setViewingDevice(item)}
                                className="px-2 py-0.5 border border-blue-500 text-blue-600 hover:bg-blue-50 bg-white rounded text-[11px] font-medium transition cursor-pointer"
                              >
                                详情
                              </button>
                              <button 
                                onClick={() => handleOpenEditDevice(item)}
                                className="px-2 py-0.5 border border-blue-500 text-blue-600 hover:bg-blue-50 bg-white rounded text-[11px] font-medium transition cursor-pointer"
                              >
                                编辑
                              </button>
                              <button 
                                onClick={() => handleDeleteDevice(item.id, item.name)}
                                className="px-2 py-0.5 border border-red-400 text-red-500 hover:bg-red-50 bg-white rounded text-[11px] font-medium transition cursor-pointer"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="px-5 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
                <div>
                  共 <span className="font-mono">{displayTotalCount}</span> 条记录 第<span className="font-mono">{currentPage}/{totalPages}</span>页
                </div>
                <div className="flex items-center space-x-2">
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].filter(p => p <= totalPages).map(p => {
                      const isCurrent = p === currentPage;
                      return (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-xs transition cursor-pointer ${
                            isCurrent 
                              ? 'border border-blue-600 text-blue-600 font-bold bg-white' 
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-1 text-gray-400">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-xs transition cursor-pointer ${
                            currentPage === totalPages 
                              ? 'border border-blue-600 text-blue-600 font-bold bg-white' 
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Page Size */}
                  <div className="relative">
                    <select 
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-200 rounded text-xs bg-white text-gray-700 outline-none pr-6 cursor-pointer"
                    >
                      <option value={10}>10 条/页</option>
                      <option value={20}>20 条/页</option>
                      <option value={50}>50 条/页</option>
                      <option value={100}>100 条/页</option>
                    </select>
                  </div>

                  {/* Jump Page */}
                  <div className="flex items-center space-x-1 text-gray-500">
                    <span>跳至</span>
                    <input 
                      type="text" 
                      value={jumpPageInput}
                      onChange={e => setJumpPageInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const num = parseInt(jumpPageInput, 10);
                          if (!isNaN(num) && num >= 1 && num <= totalPages) {
                            setCurrentPage(num);
                            setJumpPageInput('');
                          }
                        }
                      }}
                      className="w-10 h-7 text-center border border-gray-200 rounded text-xs outline-none focus:border-blue-500 bg-white font-mono"
                    />
                    <span>页</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ==================== TAB: INCOMER LINE MANAGEMENT ==================== */}
        {activeTab === 'incomer' && (
          <div className="space-y-5">
            {/* Incomer Lines Grid & Mapping Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left 2 Cols: Incomer Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                    <span>站内进线列表</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{incomerLines.length}</span>
                  </h4>
                  <button
                    onClick={handleOpenAddIncomer}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center space-x-1"
                  >
                    <Plus size={13} />
                    <span>新增进线</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {incomerLines.map((line) => {
                    const boundTopos = stationTopologies.filter(t => line.boundTopoIds.includes(t.id));
                    return (
                      <div key={line.id} className={`bg-white p-5 rounded-xl border shadow-sm transition ${line.isInUse ? 'border-emerald-200 hover:border-emerald-300' : 'border-gray-200 hover:border-gray-300 opacity-90'}`}>
                        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold shrink-0 ${line.isInUse ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                              <Zap size={18} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h5 className="font-bold text-gray-900 text-sm">{line.name}</h5>
                                {line.isInUse ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] rounded-full flex items-center space-x-1">
                                    <CheckCircle2 size={11} className="text-emerald-600" />
                                    <span>使用中 (用户端控制)</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 font-medium text-[10px] rounded-full flex items-center space-x-1">
                                    <Power size={11} className="text-gray-400" />
                                    <span>备用 / 未激活</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-1">
                                {line.remarks ? (
                                  <span><strong className="text-gray-700 font-semibold">备注说明:</strong> {line.remarks}</span>
                                ) : (
                                  <span className="text-gray-400 italic">暂无备注说明</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEditIncomer(line)}
                              className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded text-xs font-bold transition flex items-center space-x-1"
                            >
                              <Edit2 size={12} />
                              <span>编辑/绑定拓扑</span>
                            </button>
                            <button
                              onClick={() => handleDeleteIncomer(line.id, line.name)}
                              className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-100 rounded text-xs font-medium transition flex items-center space-x-1"
                            >
                              <Trash2 size={12} />
                              <span>删除</span>
                            </button>
                          </div>
                        </div>

                        {/* Bound Topologies Section */}
                        <div className="pt-3">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-2">
                            <span className="flex items-center space-x-1">
                              <Link size={12} className="text-blue-500" />
                              <span>已绑定的拓扑图 ({boundTopos.length})</span>
                            </span>
                          </div>

                          {boundTopos.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {boundTopos.map(t => (
                                <div key={t.id} className="flex items-center space-x-1.5 bg-blue-50/70 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-lg text-xs font-medium">
                                  <Network size={12} className="text-blue-600" />
                                  <span className="text-[9px] bg-blue-600 text-white font-mono font-bold px-1 py-0.2 rounded" title="拓扑 ID">{t.id}</span>
                                  <span>{t.name}</span>
                                  <span className="text-[9px] bg-blue-200/60 text-blue-900 font-mono px-1 rounded">{t.type}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center text-xs text-gray-400">
                              尚未绑定任何拓扑图，点击右上角"编辑/绑定拓扑"进行勾选绑定
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Col: Topology Binding Status Matrix */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                  <span>拓扑进线绑定明细</span>
                </h4>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  {stationTopologies.map(topo => {
                    const bindingIncomer = incomerLines.find(l => l.boundTopoIds.includes(topo.id));
                    return (
                      <div key={topo.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-xs flex items-center space-x-1.5">
                            <Network size={13} className="text-blue-600" />
                            <span className="text-[9px] bg-blue-600 text-white font-mono font-bold px-1.5 py-0.2 rounded" title="拓扑 ID（同步本地拓扑时按此 ID 匹配）">{topo.id}</span>
                            <span>{topo.name}</span>
                          </span>
                          <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.2 rounded font-mono">{topo.type}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                          <span className="text-gray-400 text-[10px]">绑定进线:</span>
                          {bindingIncomer ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 border text-gray-700 bg-gray-50 border-gray-200">
                              <Zap size={10} className="text-gray-500" />
                              <span>{bindingIncomer.name}</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                              <Unlink size={10} className="text-amber-600" />
                              <span>未绑定进线</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Incomer Edit / Create Modal */}
            {isIncomerModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsIncomerModalOpen(false)}></div>
                <div className="relative bg-white rounded-xl shadow-2xl w-[500px] p-6 text-xs text-gray-700 z-10 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{editingIncomer ? '编辑进线' : '新增进线'}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">仅需填写进线名称与备注说明，使用状态由用户端控制</p>
                    </div>
                    <button onClick={() => setIsIncomerModalOpen(false)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveIncomer} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">进线名称 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="例如: 1# 变压器总进线"
                        value={incomerForm.name}
                        onChange={e => setIncomerForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-medium text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">备注说明</label>
                      <textarea
                        rows={2}
                        placeholder="例如: 站内主电源进线，负责一期与二期回路配电"
                        value={incomerForm.remarks}
                        onChange={e => setIncomerForm(prev => ({ ...prev, remarks: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-xs resize-none"
                      />
                    </div>

                    {/* Topology selection checkboxes */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-800">选择要绑定的拓扑图</label>
                        <button
                          type="button"
                          onClick={() => {
                            const selectableIds = stationTopologies
                              .filter(t => !incomerLines.some(l => l.id !== editingIncomer?.id && l.boundTopoIds.includes(t.id)))
                              .map(t => t.id);
                            setIncomerForm(prev => ({ ...prev, selectedTopoIds: selectableIds }));
                          }}
                          className="text-[10px] text-blue-600 font-bold hover:underline"
                        >
                          全选可绑定拓扑
                        </button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-auto border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                        {stationTopologies.map(topo => {
                          const isChecked = incomerForm.selectedTopoIds.includes(topo.id);
                          const otherBoundLine = incomerLines.find(l => l.id !== editingIncomer?.id && l.boundTopoIds.includes(topo.id));
                          const isDisabled = !!otherBoundLine;

                          return (
                            <div
                              key={topo.id}
                              onClick={() => {
                                if (isDisabled) return;
                                setIncomerForm(prev => {
                                  const exists = prev.selectedTopoIds.includes(topo.id);
                                  if (exists) {
                                    return { ...prev, selectedTopoIds: prev.selectedTopoIds.filter(id => id !== topo.id) };
                                  } else {
                                    return { ...prev, selectedTopoIds: [...prev.selectedTopoIds, topo.id] };
                                  }
                                });
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-lg border transition select-none ${
                                isDisabled
                                  ? 'bg-gray-100/60 border-gray-200 text-gray-400 cursor-not-allowed'
                                  : isChecked
                                    ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold cursor-pointer'
                                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded flex items-center justify-center border text-white ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                  {isChecked && <Check size={11} />}
                                </div>
                                <span className="text-[9px] bg-blue-600 text-white font-mono font-bold px-1.5 py-0.2 rounded" title="拓扑 ID">{topo.id}</span>
                                <span className="text-xs font-medium">{topo.name}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                {otherBoundLine && !isChecked && (
                                  <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                    已绑定进线: {otherBoundLine.name}
                                  </span>
                                )}
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded font-mono">{topo.type}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsIncomerModalOpen(false)}
                        className="px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded font-bold text-xs"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow-sm transition"
                      >
                        保存
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== TAB 3: TOPOLOGY MAINTENANCE ==================== */}
        {activeTab === 'topo' && (
          <div className="h-full min-h-0 flex flex-col gap-4">
            
            {/* Top Toolbar: 拓扑方案选择 + 操作按钮（合并为一行） */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              {/* 左侧：拓扑方案下拉 + 当前方案操作图标 */}
              <div className="flex items-center flex-wrap gap-2 py-0.5">
                <span className="text-xs font-bold text-gray-500 shrink-0 flex items-center space-x-1">
                  <Layers size={13} className="text-blue-600" />
                  <span>切换拓扑方案:</span>
                </span>
                <div className="relative">
                  <select
                    value={activeTopoId || stationTopologies[0]?.id}
                    onChange={e => {
                      setActiveTopoId(e.target.value);
                      setSelectedNodeId(null);
                    }}
                    className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 bg-gray-50 hover:border-gray-300 outline-none cursor-pointer min-w-[180px]"
                  >
                    {stationTopologies.map(topo => (
                      <option key={topo.id} value={topo.id}>
                        [{topo.id}] {topo.name}{topo.id === operationalTopoId ? '（运行中）' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={13} />
                  </div>
                </div>

                {/* 修改属性 / 编辑拓扑 / 删除拓扑 —— 图标按钮，置于方案下拉框右侧 */}
                {(() => {
                  const currentActiveTopo = stationTopologies.find(t => t.id === (activeTopoId || stationTopologies[0]?.id)) || stationTopologies[0];
                  if (!currentActiveTopo) return null;
                  return (
                    <div className="flex items-center space-x-1 pl-2 ml-0.5 border-l border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTopo(currentActiveTopo)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                        title="修改拓扑属性（名称/备注）"
                      >
                        <Settings size={14} />
                      </button>

                      {isTopologyEditMode ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsTopologyEditMode(false);
                            setDragOverNodeId(null);
                            // Mark as modified if edited
                            setTopoDeploymentStatus(prev => ({
                              ...prev,
                              [activeTopoId || 'T01']: {
                                ...(prev[activeTopoId || 'T01'] || {}),
                                status: 'modified'
                              }
                            }));
                            showNotification('拓扑修改完成，连线关系已本地暂存！');
                          }}
                          className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 rounded-lg transition"
                          title="完成编辑"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsTopologyEditMode(true);
                            showNotification('已进入拓扑编辑模式：可拖拽待编辑设备到节点下吸附组网，也可建立电表测量关联');
                          }}
                          className="p-1.5 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition"
                          title="编辑拓扑连线"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteTopo(currentActiveTopo.id, currentActiveTopo.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
                        title="删除此套拓扑图配置"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* 右侧：切换拓扑 / 新增拓扑 / 同步本地拓扑 */}
              <div className="flex items-center flex-wrap gap-2 shrink-0">
                {/* Switch Topology Button: applies to currently selected scheme (only in-use incomer bound topologies allowed) */}
                {(() => {
                  const targetId = activeTopoId || stationTopologies[0]?.id;
                  const targetTopo = stationTopologies.find(t => t.id === targetId);
                  const boundIncomer = targetTopo ? incomerLines.find(l => l.boundTopoIds.includes(targetTopo.id)) : undefined;
                  const isSwitchable = !!targetTopo && !!boundIncomer?.isInUse;
                  const isAlreadyRunning = targetId === operationalTopoId;

                  if (!targetTopo) return null;

                  return (
                    <button
                      type="button"
                      disabled={!isSwitchable || isAlreadyRunning}
                      onClick={() => {
                        setSwitchPassword('');
                        setSwitchPasswordError('');
                        setSwitchConfirmTopoId(targetTopo.id);
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg shadow-md transition flex items-center space-x-1.5"
                      title={isAlreadyRunning
                        ? '当前方案已是现场运行拓扑'
                        : isSwitchable
                          ? `将 [${targetTopo.name}] 切换为现场运行拓扑`
                          : '仅当前使用中进线绑定的拓扑可切换'}
                    >
                      <RefreshCw size={13} />
                      <span>切换拓扑</span>
                    </button>
                  );
                })()}

                <button
                  type="button"
                  onClick={handleOpenAddTopo}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold text-xs rounded-lg shadow-2xs transition flex items-center space-x-1"
                >
                  <Plus size={13} />
                  <span>新增拓扑</span>
                </button>

                {/* 同步本地拓扑：一键同步本地全部拓扑方案 */}
                <button
                  type="button"
                  onClick={handleSyncTopologyFromLocal}
                  disabled={isSyncingTopo}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold text-xs rounded-lg shadow-2xs transition flex items-center space-x-1 disabled:opacity-60 disabled:cursor-not-allowed"
                  title="从本地网关同步全部拓扑方案的节点与连线关系"
                >
                  <HardDriveDownload size={13} className={isSyncingTopo ? 'animate-pulse' : ''} />
                  <span>{isSyncingTopo ? '同步中...' : '同步本地拓扑'}</span>
                </button>
              </div>
            </div>

            {/* Main Topology Editor Workspace Container */}
            <div className="flex-1 min-h-[420px] flex flex-col xl:flex-row gap-4">
              
              {/* Left Side: Pending Device Area (待编辑设备区域) */}
              {(isPendingCollapsed || pendingDevices.length === 0) ? (
                /* Collapsed / Empty Sidebar state - retracts to the left */
                <div 
                  data-drop-pool="1"
                  onClick={() => setIsPendingCollapsed(false)}
                  className={`w-12 shrink-0 bg-white rounded-xl border-2 transition-all p-2 flex flex-col items-center justify-between cursor-pointer hover:bg-gray-50 shadow-xs min-h-[220px] xl:min-h-0 ${
                    isOverPool ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300' : 'border-gray-200'
                  }`}
                  title="点击展开待编辑设备栏"
                >
                  <div className="flex flex-col items-center space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPendingCollapsed(false);
                      }}
                      className="p-1 hover:bg-amber-100 text-amber-700 rounded transition"
                      title="展开待编辑设备区"
                    >
                      <ChevronRight size={16} />
                    </button>

                    <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                      <Box size={16} />
                    </div>

                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full font-mono">
                      {pendingDevices.length}
                    </span>

                    <div className="writing-mode-vertical text-xs font-bold text-gray-600 tracking-widest pt-4 opacity-75">
                      待编辑设备
                    </div>
                  </div>

                  {isOverPool && (
                    <div className="text-[9px] bg-amber-200 text-amber-900 font-bold p-1 rounded text-center animate-pulse">
                      松开退回
                    </div>
                  )}

                  <div className="pb-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPendingCollapsed(false);
                      }}
                      className="text-gray-400 hover:text-amber-600 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Expanded Sidebar: 设备池 / 站点树 */
                <div 
                  data-drop-pool="1"
                  className={`w-full xl:w-64 shrink-0 bg-white rounded-xl border transition-all flex flex-col min-h-0 max-h-[60vh] xl:max-h-none ${
                    isOverPool ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300' : 'border-gray-200'
                  }`}
                >
                  {/* 站点名 + Tab 切换 */}
                  <div className="px-3 pt-3 pb-0 border-b border-gray-100 shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-900">{station.name}</span>
                      <button
                        type="button"
                        onClick={() => setIsPendingCollapsed(true)}
                        className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded transition"
                        title="收起面板"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() => setDevicePoolTab('pool')}
                        className={`pb-2 text-xs font-bold border-b-2 -mb-px transition ${
                          devicePoolTab === 'pool' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-800'
                        }`}
                      >
                        设备池
                      </button>
                      <button
                        type="button"
                        onClick={() => setDevicePoolTab('tree')}
                        className={`pb-2 text-xs font-bold border-b-2 -mb-px transition ${
                          devicePoolTab === 'tree' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-800'
                        }`}
                      >
                        站点树
                      </button>
                    </div>
                  </div>

                  {devicePoolTab === 'pool' ? (
                    /* Tab 1: 设备池（分类筛选 + 设备卡片） */
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex flex-wrap gap-1.5 p-2.5 shrink-0">
                        {DEVICE_POOL_CATEGORIES.map(cat => {
                          const count = cat === '全部'
                            ? pendingDevices.length
                            : pendingDevices.filter(d => (DEVICE_CATEGORY_MAP[d.type] || '配套') === cat).length;
                          const active = devicePoolFilter === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setDevicePoolFilter(cat)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                                active
                                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                              }`}
                            >
                              {cat} <span className="font-mono opacity-80">{count}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex-1 min-h-0 overflow-y-auto px-2.5 pb-2.5 space-y-1.5 custom-scrollbar">
                        {pendingDevices
                          .filter(d => devicePoolFilter === '全部' || (DEVICE_CATEGORY_MAP[d.type] || '配套') === devicePoolFilter)
                          .map(device => {
                            const st = getDeviceRunStatus(device.id + device.sn);
                            return (
                              <div
                                key={device.id}
                                data-pool-card="1"
                                onPointerDown={(e) => startPointerDrag(e, { id: device.id, name: device.name, type: device.type }, 'pending')}
                                className="p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing select-none group touch-none"
                                title={`${device.type} · ${device.model || ''}｜按住拖拽至画布节点组网`}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DEVICE_STATUS_DOT[st]}`} />
                                  <span className="text-[10px] text-gray-500 truncate">{device.type}</span>
                                </div>
                                <div className="text-[9px] text-gray-400 font-mono truncate mt-0.5" title={device.sn}>
                                  {device.sn}
                                </div>
                                <div className="text-xs font-bold text-gray-800 truncate" title={device.name}>
                                  {device.name}
                                </div>
                              </div>
                            );
                          })}
                        {pendingDevices.filter(d => devicePoolFilter === '全部' || (DEVICE_CATEGORY_MAP[d.type] || '配套') === devicePoolFilter).length === 0 && (
                          <div className="text-center text-[10px] text-gray-400 py-8">该分类下暂无待编辑设备</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Tab 2: 站点树（当前拓扑层级结构） */
                    <div className="flex-1 min-h-0 overflow-y-auto p-2.5 custom-scrollbar">
                      {(() => {
                        const currentTopoId = activeTopoId || 'T01';
                        const nodes = topoTrees[currentTopoId] || [];
                        if (nodes.length === 0) {
                          return <div className="text-center text-[10px] text-gray-400 py-8">当前拓扑暂无节点</div>;
                        }
                        const displayName = (n: any) => (n.type === '总进线' || n.parentId === null) ? '站点Bus' : n.name;
                        const renderTreeLevel = (parentId: string | null, depth: number): React.ReactNode => {
                          const children = nodes.filter(n =>
                            n.parentId === parentId || (parentId === null && n.parentId && !nodes.some(p => p.id === n.parentId))
                          );
                          if (children.length === 0 && depth > 0) return null;
                          return children.map(node => {
                            const nodeChildren = nodes.filter(n => n.parentId === node.id);
                            const expanded = treeExpandedIds[node.id] !== false;
                            const st = getDeviceRunStatus(node.id + (node.sn || ''));
                            return (
                              <div key={node.id}>
                                <div className="flex items-center space-x-1 py-1" style={{ paddingLeft: depth * 14 }}>
                                  {nodeChildren.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => setTreeExpandedIds(prev => ({ ...prev, [node.id]: !expanded }))}
                                      className="p-0.5 text-gray-400 hover:text-gray-700 transition"
                                    >
                                      {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                    </button>
                                  ) : (
                                    <span className="w-[15px] shrink-0" />
                                  )}
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DEVICE_STATUS_DOT[st]}`} />
                                  <span
                                    onClick={() => setSelectedNodeId(node.id)}
                                    className={`text-[11px] truncate cursor-pointer transition ${selectedNodeId === node.id ? 'text-blue-600 font-bold' : 'text-gray-700 hover:text-blue-600'}`}
                                    title={node.name}
                                  >
                                    {displayName(node)}
                                  </span>
                                </div>
                                {expanded && renderTreeLevel(node.id, depth + 1)}
                              </div>
                            );
                          });
                        };
                        return renderTreeLevel(null, 0);
                      })()}
                    </div>
                  )}

                  {isOverPool && (
                    <div className="p-2 bg-amber-100 border border-amber-300 rounded text-center text-amber-900 font-bold text-xs animate-bounce mt-2 shrink-0">
                      ⬇ 松开鼠标，将节点退回至待编辑区
                    </div>
                  )}
                </div>
              )}

              {/* Main Center Canvas Area (拓扑图形画布) */}
              <div className="flex-1 min-w-0 w-full bg-white rounded-xl border border-gray-200 shadow-sm p-5 min-h-[360px] xl:min-h-0 flex flex-col relative overflow-hidden">
                
                {/* Canvas Toolbar Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 shrink-0 flex-wrap gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    {/* 收起左侧设备池 */}
                    <button
                      type="button"
                      onClick={() => setIsPendingCollapsed(true)}
                      className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-lg border border-gray-200 transition"
                      title="收起左侧设备池"
                    >
                      <ChevronsLeft size={14} />
                    </button>

                    {/* 纵向 / 横向 布局切换 */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setTreeLayoutMode('vertical')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                          treeLayoutMode === 'vertical' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                        title="纵向树形拓扑结构"
                      >
                        纵向
                      </button>
                      <button
                        type="button"
                        onClick={() => setTreeLayoutMode('horizontal')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                          treeLayoutMode === 'horizontal' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                        title="横向树形拓扑结构"
                      >
                        横向
                      </button>
                    </div>

                    {/* 运行状态图例 */}
                    <div className="flex items-center space-x-2.5 pl-1 text-[10px] text-gray-600">
                      <span className="font-bold text-gray-500">运行状态</span>
                      <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span>正常</span></span>
                      <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span>故障</span></span>
                      <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" /><span>离线</span></span>
                    </div>

                    {/* 当前拓扑 ID（同步本地拓扑时按此 ID 匹配） */}
                    <span className="text-[9px] bg-blue-600 text-white font-mono font-bold px-1.5 py-0.5 rounded" title="当前拓扑 ID（同步本地拓扑时按此 ID 匹配）">
                      {activeTopoId || stationTopologies[0]?.id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isTopologyEditMode) {
                          setIsTopologyEditMode(false);
                          setDragOverNodeId(null);
                          setTopoDeploymentStatus(prev => ({
                            ...prev,
                            [activeTopoId || 'T01']: {
                              ...(prev[activeTopoId || 'T01'] || {}),
                              status: 'modified'
                            }
                          }));
                        }
                        showNotification('拓扑配置已保存，连线关系已本地暂存！');
                      }}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isTopologyEditMode) {
                          setIsTopologyEditMode(false);
                          setDragOverNodeId(null);
                        }
                        setSelectedNodeId(null);
                        showNotification('已取消本次拓扑编辑操作。');
                      }}
                      className="px-4 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 font-bold text-xs rounded-lg transition"
                    >
                      取消
                    </button>
                  </div>
                </div>

                {/* 右侧悬浮缩放控制 */}
                <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setCanvasScale(1)}
                    className="min-w-[34px] text-[10px] font-mono font-bold text-gray-600 bg-white border border-gray-200 rounded-lg px-1.5 py-1 shadow-xs hover:text-blue-600 transition"
                    title="重置为 100%"
                  >
                    {Math.round(canvasScale * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasScale(s => Math.min(2.0, Number((s + 0.1).toFixed(1))))}
                    disabled={canvasScale >= 2.0}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 shadow-xs transition disabled:opacity-40"
                    title="放大画布 (+10%)"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasScale(s => Math.max(0.4, Number((s - 0.1).toFixed(1))))}
                    disabled={canvasScale <= 0.4}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 shadow-xs transition disabled:opacity-40"
                    title="缩小画布 (-10%)"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCanvasScale(1); setCanvasPan({ x: 0, y: 0 }); }}
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 shadow-xs transition"
                    title="重置视图（缩放 100% + 复位平移）"
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>

                {isTopologyEditMode && (
                  <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                      <span><strong>拓扑编辑模式进行中：</strong> 从左侧待编辑区拖拽设备放置到目标节点上吸附组网；支持<strong>鼠标滚轮在画布上直接放大/缩小</strong>（40%~200%）。</span>
                    </span>
                  </div>
                )}

                {/* Tree Canvas Render Area —— 空白处按下可平移画布 */}
                <div
                  ref={canvasContainerRef}
                  onPointerDown={handleCanvasPointerDown}
                  className={`flex-1 min-h-0 overflow-hidden p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/40 relative flex items-start justify-center ${
                    isPanning ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                >
                  {/* 平移提示（未平移过时显示） */}
                  {!isPanning && canvasPan.x === 0 && canvasPan.y === 0 && (
                    <div className="absolute right-3 top-3 z-10 text-[10px] text-gray-400 bg-white/80 border border-gray-200 rounded-full px-2 py-0.5 pointer-events-none select-none">
                      拖动空白处平移画布 · 滚轮缩放
                    </div>
                  )}

                  {/* 拖拽跟随幽灵 */}
                  {dragItem && dragPos && (
                    <div
                      className="fixed z-[999] pointer-events-none -translate-x-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-white/95 border-2 border-blue-400 shadow-2xl text-[11px] font-bold text-gray-800 whitespace-nowrap flex items-center space-x-1.5"
                      style={{ left: dragPos.x, top: dragPos.y }}
                    >
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">{dragItem.type}</span>
                      <span>{dragItem.name}</span>
                      <span className="text-[9px] text-gray-400 font-normal">
                        {isOverPool
                          ? (dragItem.source === 'meter' ? '松开放回设备池（解绑电表）' : '松开放回设备池')
                          : dragOverMeterId
                            ? '松开：加入该电表的计量组（须同层）'
                            : dragItem.source === 'pending'
                              ? '拖到节点上挂载'
                              : dragItem.source === 'meter'
                                ? '拖到设备上改挂 · 拖到池中解绑'
                                : '拖到目标设备上'}
                      </span>
                    </div>
                  )}
                  
                  {/* VIEW MODE 1: SINGLE-LINE ELECTRICAL DIAGRAM */}
                  {treeLayoutMode === 'singleline' && (
                    <div className="w-full max-w-4xl p-5 bg-slate-950 text-white rounded-2xl shadow-xl border border-slate-800 space-y-6 animate-in fade-in duration-200 my-auto">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/30">
                            <Zap size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-white">单线电气主接线图 (Single-line Diagram)</h4>
                            <p className="text-[10px] text-slate-400 font-mono">10kV 电网进线 → 315kVA 降压变压器 → 380V 低压交流母线 → 储能/光伏/桩负荷分路</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 text-[10px] font-mono">
                          <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>母线电压: 398.2V / 50.01Hz</span>
                          </span>
                          <span className="text-sky-300">总有功: 82.4 kW</span>
                        </div>
                      </div>

                      {/* Power Flow Diagram */}
                      <div className="space-y-6 py-2">
                        {/* 10kV Grid & High-Voltage Breaker */}
                        <div className="flex flex-col items-center">
                          <div className="px-5 py-2 bg-slate-900 border-2 border-amber-500 rounded-xl text-center shadow-lg">
                            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">10kV 市电电网接入点 (Utility Grid)</div>
                            <div className="text-xs font-bold text-white mt-0.5">站点主进线断路器 [AH01]</div>
                            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● 状态: 合闸闭合 (Closed) | 关口表: PM800-01</div>
                          </div>
                          <div className="w-0.5 h-6 bg-amber-500" />
                          <div className="px-4 py-1.5 bg-blue-950 border border-blue-500 rounded-lg text-center text-xs">
                            <div className="font-bold text-blue-300">315 kVA 变压器 (#1 Transformer)</div>
                            <div className="text-[9px] text-slate-400 font-mono">变比: 10kV / 0.4kV | Dyn11 | 负载率: 36.8%</div>
                          </div>
                          <div className="w-0.5 h-6 bg-cyan-400" />
                        </div>

                        {/* 380V Main Busbar (Low Voltage) */}
                        <div className="relative py-2">
                          <div className="w-full h-3 bg-gradient-to-r from-cyan-600 via-sky-400 to-cyan-600 rounded-full shadow-lg flex items-center justify-center">
                            <span className="text-[9px] font-mono font-bold text-slate-950 px-3 bg-white/90 rounded-full shadow-xs">
                              380V 低压交流主母线 (Main AC Busbar #1)
                            </span>
                          </div>

                          {/* 4 Downstream Feeders */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-dashed border-slate-800">
                            
                            {/* Feeder 1: Energy Storage */}
                            <div className="p-3 bg-slate-900/90 rounded-xl border border-purple-500/40 space-y-2">
                              <div className="text-[10px] text-purple-400 font-bold flex items-center justify-between">
                                <span>1# 储能分路 (ESS)</span>
                                <span className="bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded text-[9px] font-mono">100kW/215kWh</span>
                              </div>
                              <div className="text-xs font-bold text-white">储能变流器 (PCS)</div>
                              <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                                <div>• 电池簇: 280Ah LFP (SOC: 78.4%)</div>
                                <div>• 辅控: 储能空调 + 消防联动</div>
                                <div>• 测量表: 储能专用双向计量表</div>
                              </div>
                              <div className="text-[10px] text-emerald-400 font-bold font-mono pt-1 border-t border-slate-800">
                                充放功率: +45.2 kW (充电中)
                              </div>
                            </div>

                            {/* Feeder 2: PV Solar Inverters */}
                            <div className="p-3 bg-slate-900/90 rounded-xl border border-yellow-500/40 space-y-2">
                              <div className="text-[10px] text-yellow-400 font-bold flex items-center justify-between">
                                <span>2# 光伏并网分路 (PV)</span>
                                <span className="bg-yellow-950 text-yellow-300 px-1.5 py-0.2 rounded text-[9px] font-mono">50kWp</span>
                              </div>
                              <div className="text-xs font-bold text-white">组串式逆变器 (Inverter)</div>
                              <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                                <div>• 辐照度: 820 W/m²</div>
                                <div>• MPPT效率: 98.6%</div>
                                <div>• 测量表: 光伏发电计量电表</div>
                              </div>
                              <div className="text-[10px] text-yellow-400 font-bold font-mono pt-1 border-t border-slate-800">
                                发电功率: 38.6 kW
                              </div>
                            </div>

                            {/* Feeder 3: EV Charging Stations */}
                            <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/40 space-y-2">
                              <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-between">
                                <span>3# 充电桩分路 (EV)</span>
                                <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded text-[9px] font-mono">120kW 超充</span>
                              </div>
                              <div className="text-xs font-bold text-white">双枪直流快速充电桩</div>
                              <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                                <div>• A枪: 充电中 (42.0 kW)</div>
                                <div>• B枪: 空闲待机 (0.0 kW)</div>
                                <div>• 测量表: 充电桩计费计量表</div>
                              </div>
                              <div className="text-[10px] text-emerald-400 font-bold font-mono pt-1 border-t border-slate-800">
                                用电功率: 42.0 kW
                              </div>
                            </div>

                            {/* Feeder 4: Plant Loads */}
                            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2">
                              <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
                                <span>4# 厂区动力负荷</span>
                                <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[9px] font-mono">配电负荷</span>
                              </div>
                              <div className="text-xs font-bold text-white">厂区车间动力总回路</div>
                              <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                                <div>• 动力回路 1#~4#</div>
                                <div>• 功率因数: 0.96</div>
                                <div>• 测量表: 厂区总动力电表</div>
                              </div>
                              <div className="text-[10px] text-slate-300 font-bold font-mono pt-1 border-t border-slate-800">
                                负荷功率: 57.0 kW
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIEW MODE 2: NODE MATRIX TABLE */}
                  {treeLayoutMode === 'matrix' && (
                    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-xs animate-in fade-in duration-200 my-auto">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <h4 className="font-bold text-gray-900">拓扑节点与通信映射矩阵</h4>
                        <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          共 {(topoTrees[activeTopoId || 'T01'] || []).length} 个节点
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-2.5">节点名称</th>
                              <th className="px-3 py-2.5">设备类型</th>
                              <th className="px-3 py-2.5">挂载上级节点</th>
                              <th className="px-3 py-2.5">设备 SN</th>
                              <th className="px-3 py-2.5">型号规格</th>
                              <th className="px-4 py-2.5">关联测量电表</th>
                              <th className="px-3 py-2.5">通信状态</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-medium">
                            {(topoTrees[activeTopoId || 'T01'] || DEFAULT_TOPOLOGY_NODES_MAP['T01'] || []).map((node) => {
                              const currentNodes = topoTrees[activeTopoId || 'T01'] || DEFAULT_TOPOLOGY_NODES_MAP['T01'] || [];
                              const parent = currentNodes.find(n => n.id === node.parentId);
                              const cfg = DEVICE_TYPE_CONFIG[node.type] || DEVICE_TYPE_CONFIG['变压器'];
                              const IconComp = cfg.icon;

                              return (
                                <tr key={node.id} className="hover:bg-blue-50/40 transition">
                                  <td className="px-4 py-2.5 font-bold text-gray-900 flex items-center space-x-2">
                                    <div className={`p-1 rounded ${cfg.bg} ${cfg.color}`}>
                                      <IconComp size={13} />
                                    </div>
                                    <span>{node.name}</span>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${cfg.badge}`}>
                                      {node.type}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-600">
                                    {parent ? (
                                      <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-700 font-medium">
                                        {parent.name}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                        ★ 站点总进线 (根节点)
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-[10px] text-gray-500">
                                    {node.sn || `SN-${node.id}`}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-[10px] text-gray-500">
                                    {node.model || 'STD-MODEL'}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {metersRelatedTo(activeTopoId || 'T01', node.id).length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {metersRelatedTo(activeTopoId || 'T01', node.id).map(ml => {
                                          const memberCount = ml.targetNodeIds.length;
                                          return (
                                            <span
                                              key={ml.id}
                                              title={memberCount > 1
                                                ? `「${ml.name}」的计量组覆盖同层 ${memberCount} 台设备，此设备是其中之一（虚线框内）`
                                                : `「${ml.name}」单独计量此设备`}
                                              className="text-[10px] px-2 py-0.5 rounded font-bold flex items-center space-x-1 w-fit border text-orange-700 bg-orange-50 border-orange-200"
                                            >
                                              <Gauge size={11} className="text-orange-600" />
                                              <span>{ml.name} ({ml.sn})</span>
                                              {memberCount > 1 && (
                                                <span className="text-[9px] px-1 rounded bg-orange-500 text-white">组内{memberCount}台</span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-gray-400">未绑定计量电表</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 w-fit">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      <span>正常在线</span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* VIEW MODE 3 & 4: TREE CANVAS (VERTICAL / HORIZONTAL) */}
                  {(treeLayoutMode === 'vertical' || treeLayoutMode === 'horizontal') && (
                  <div 
                    data-tree-content
                    className="relative origin-top flex items-center justify-center p-4 min-w-full"
                    style={{ transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasScale})`, transformOrigin: 'top center' }}
                  >
                    {(() => {
                      const currentTopoId = activeTopoId || 'T01';
                      const currentNodes = topoTrees[currentTopoId] || DEFAULT_TOPOLOGY_NODES_MAP['T01'] || [];
                      const rootNode = currentNodes.find(n => n.type === '总进线' || n.parentId === null) || currentNodes[0];

                      if (!rootNode) {
                        return (
                          <div className="text-center py-20 text-gray-400 space-y-2">
                            <Zap size={32} className="mx-auto text-amber-500 opacity-60" />
                            <p className="font-bold text-gray-700 text-xs">暂无总进线根节点</p>
                            <button
                              type="button"
                              onClick={() => {
                                setTopoTrees(prev => ({
                                  ...prev,
                                  [currentTopoId]: [
                                    { id: `root_${Date.now()}`, name: '站点主总进线', type: '总进线', parentId: null, sn: 'INC-2026-MAIN', model: 'AH-10KV' }
                                  ]
                                }));
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold shadow-xs"
                            >
                              初始化创建总进线节点
                            </button>
                          </div>
                        );
                      }

                      // Render tree recursively
                      const renderNodeTree = (nodeId: string): React.ReactNode => {
                        const node = currentNodes.find(n => n.id === nodeId);
                        if (!node) return null;

                        const children = currentNodes.filter(n => n.parentId === nodeId);
                        const parentNode = currentNodes.find(n => n.id === node.parentId);
                        const cfg = DEVICE_TYPE_CONFIG[node.type] || DEVICE_TYPE_CONFIG['变压器'];
                        const isSelected = selectedNodeId === node.id;
                        const isDragOver = dragOverNodeId === node.id;
                        const isRoot = node.type === '总进线' || node.parentId === null;
                        // 该设备相关的电表（把它算作计量组成员）——用于悬浮气泡里的说明
                        const relatedMeters = metersRelatedTo(currentTopoId, node.id);
                        // 常显：该设备属于某个计量组（虚线框里但没被计量的设备不会有这个描边）
                        const inMeterGroup = meterMemberIds(currentTopoId).has(node.id);
                        // hover 高亮：该设备是当前悬停电表计量组里的成员（同层设备，不含父节点）
                        const highlightedByMeter = meterHighlightIds(currentTopoId, hoveredMeterSn).has(node.id);

                        return (
                          <div key={node.id} className={`flex ${treeLayoutMode === 'vertical' ? 'flex-col items-center' : 'flex-row items-center'} relative shrink-0`}>
                            {/* Node Card Container with Hover Popover */}
                            <div className="relative group/node">
                              {/* 电表引出线以 group/node 为定位参照（该容器与卡片同宽同高） */}
                              <div
                                data-node-id={node.id}
                                onPointerDown={(e) => {
                                  if (isRoot) return;
                                  if ((e.target as HTMLElement).closest('button')) return; // 点删除等按钮不触发拖拽
                                  startPointerDrag(e, { id: node.id, name: node.name, type: node.type }, 'canvas');
                                }}
                                onClick={() => setSelectedNodeId(node.id)}
                                onMouseEnter={() => setHoveredNodeId(node.id)}
                                onMouseLeave={() => setHoveredNodeId(null)}
                                className={`transition-all duration-200 cursor-pointer select-none touch-none ${
                                  isRoot
                                    ? 'px-4 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200'
                                    : 'p-2.5 rounded-lg border bg-white border-gray-200 w-40 shadow-xs'
                                } ${
                                  isSelected ? 'ring-2 ring-offset-2 ring-blue-500 z-10 shadow-md' : 'hover:shadow-md'
                                } ${
                                  inMeterGroup ? 'border-orange-300' : ''
                                } ${
                                  highlightedByMeter ? 'ring-2 ring-orange-400 border-orange-400 bg-orange-50/60' : ''
                               } ${
                                  isDragOver ? 'ring-4 ring-emerald-500 bg-emerald-100 scale-105 shadow-xl border-emerald-400 animate-pulse' : ''
                                }`}
                              >
                                {isDragOver && (
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md z-20 whitespace-nowrap">
                                    {dragItem?.type === '电表'
                                      ? (isRoot ? '🎯 松开：电表贴到该节点下全部设备' : '🎯 松开：电表贴到该设备边上')
                                      : '🎯 松开：挂载到该设备下'}
                                  </div>
                                )}

                                {isRoot ? (
                                  /* 根节点：站点Bus 胶囊样式 */
                                  <div className="flex items-center space-x-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-xs font-bold text-emerald-800" title={node.name}>站点Bus</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1.5 min-w-0">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DEVICE_STATUS_DOT[getDeviceRunStatus(node.id + (node.sn || ''))]}`} />
                                        <span className="text-[10px] text-gray-500 truncate">{node.type}</span>
                                      </div>
                                      {isTopologyEditMode && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveNodeToPending(node.id);
                                          }}
                                          className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition shrink-0"
                                          title="退回设备池（该设备下全部子设备一并退回）"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-mono truncate mt-1" title={node.sn || `SN-${node.id}`}>
                                      设备ID {node.sn || `SN-${node.id}`}
                                    </div>
                                    <div className="text-xs font-bold text-gray-900 truncate" title={node.name}>
                                      {node.name}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Hover 悬浮信息：只报 4 项 —— 设备名称 / SN / 设备类型 / 关联电表 */}
                              <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 ${dragItem ? 'hidden' : 'hidden group-hover/node:block'} w-56 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 text-xs text-gray-700 z-50 animate-in fade-in zoom-in-95 duration-150`}>
                                <div className="space-y-1.5 text-[11px]">
                                  <div className="flex justify-between py-0.5 border-b border-gray-50">
                                    <span className="text-gray-400 shrink-0">设备名称:</span>
                                    <span className="font-bold text-gray-900 truncate ml-2">{node.name}</span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-gray-50">
                                    <span className="text-gray-400 shrink-0">SN:</span>
                                    <span className="font-mono text-gray-800 truncate ml-2">{node.sn || `SN-${node.id}`}</span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-gray-50">
                                    <span className="text-gray-400 shrink-0">设备类型:</span>
                                    <span className="font-medium text-gray-800 truncate ml-2">{node.type}</span>
                                  </div>
                                  <div className="flex justify-between py-0.5">
                                    <span className="text-gray-400 shrink-0">关联电表:</span>
                                    <span
                                      className={`ml-2 truncate ${relatedMeters.length > 0 ? 'text-orange-600 font-bold' : 'text-gray-400'}`}
                                      title={relatedMeters.length > 0 ? relatedMeters.map(ml => `${ml.name}（${ml.sn}）`).join(' / ') : '未绑定计量关系'}
                                    >
                                      {relatedMeters.length > 0 ? relatedMeters.map(ml => ml.sn).join(' / ') : '无'}
                                    </span>
                                  </div>
                                </div>

                                {/* Arrow down */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-white drop-shadow-xs" />
                              </div>
                            </div>

                            {/* Children branch connector —— 连线接到每个设备顶部居中 */}
                            {children.length > 0 && (
                              treeLayoutMode === 'vertical' ? (
                                <div className="flex flex-col items-center">
                                  {/* 父节点底部居中引出 */}
                                  <div data-connector className="w-0.5 h-5 bg-gray-300" />
                                  {/* 子设备组：横线精确落到各设备中心，再竖直下探到设备顶部 */}
                                  <div className="flex flex-row items-start">
                                    {children.map((child, idx) => (
                                      <div key={child.id} className="relative flex flex-col items-center px-4">
                                        {children.length > 1 && (
                                          <div
                                            data-connector className="absolute top-0 h-0.5 bg-gray-300"
                                            style={{ left: idx === 0 ? '50%' : 0, right: idx === children.length - 1 ? '50%' : 0 }}
                                          />
                                        )}
                                        <div data-connector className="w-0.5 h-3 bg-gray-300 relative z-10" />
                                        {renderNodeTree(child.id)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-row items-center">
                                  {/* 父节点右侧居中引出 */}
                                  <div data-connector className="h-0.5 w-5 bg-gray-300" />
                                  {/* 子设备组：竖线精确落到各设备中心，再水平连到设备左侧 */}
                                  <div className="flex flex-col items-start">
                                    {children.map((child, idx) => (
                                      <div key={child.id} className="relative flex flex-row items-center py-3">
                                        {children.length > 1 && (
                                          <div
                                            data-connector className="absolute left-0 w-0.5 bg-gray-300"
                                            style={{ top: idx === 0 ? '50%' : 0, bottom: idx === children.length - 1 ? '50%' : 0 }}
                                          />
                                        )}
                                        <div data-connector className="h-0.5 w-3 bg-gray-300 relative z-10" />
                                        {renderNodeTree(child.id)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        );
                      };

                      return renderNodeTree(rootNode.id);
                    })()}
                  {/* 计量组覆盖层：虚线框 + 挂在框边上的电表胶囊（不隶属任何单台设备，故无歧义） */}
                  {/* 悬停设备卡、弹出详情气泡时让位到下一层，保证气泡里的按钮能点到 */}
                  <div className={`absolute inset-0 pointer-events-none ${hoveredNodeId ? '-z-10' : 'z-20'}`}>
                    {(() => {
                      const ovTopoId = activeTopoId || 'T01';
                      const ovNodes = topoTrees[ovTopoId] || DEFAULT_TOPOLOGY_NODES_MAP[ovTopoId] || [];
                      return (meterLinks[ovTopoId] || []).map(ml => {
                        const box = meterBoxMap[ml.id];
                        if (!box) return null;
                        const hl = hoveredMeterSn === ml.sn;
                        const isGroupDropTarget = dragOverMeterId === ml.id;
                        const isPanelOpen = openMeterPanelId === ml.id;
                        const measureCount = ml.targetNodeIds.length;
                        const horizSide = box.side === 'right' || box.side === 'left';
                        const chipPosCls =
                          box.side === 'right' ? 'left-full top-1/2 -translate-y-1/2 flex flex-row items-center'
                            : box.side === 'left' ? 'right-full top-1/2 -translate-y-1/2 flex flex-row-reverse items-center'
                              : box.side === 'top' ? 'left-1/2 -translate-x-1/2 bottom-full flex flex-col-reverse items-center'
                                : 'left-1/2 -translate-x-1/2 top-full flex flex-col items-center';
                        return (
                          <div key={ml.id} className="absolute" style={{ left: box.x, top: box.y, width: box.w, height: box.h }}>
                            {/* 计量组虚线框：普通状态常显，框住被计量的同层设备 */}
                            {box.multi && (
                              <div className={`absolute inset-0 rounded-xl border-2 border-dashed transition-all ${
                                isGroupDropTarget
                                  ? 'border-emerald-500 bg-emerald-200/15'
                                  : hl
                                    ? 'border-orange-500 bg-orange-300/15'
                                    : 'border-orange-400/60 bg-orange-200/10'
                              }`} />
                            )}

                            {/* 从框边引出的电表胶囊：框边先落一个「计量点」，再引出到胶囊 */}
                            <div className={`absolute ${chipPosCls}`}>
                              <span className={`w-2 h-2 rounded-full shrink-0 pointer-events-none ${hl ? 'bg-orange-500' : 'bg-orange-400'}`} />
                              <div className={`shrink-0 ${horizSide ? 'h-0.5 w-3' : 'w-0.5 h-2'} ${hl ? 'bg-orange-500' : 'bg-orange-300'}`} />
                              <div
                                data-meter-chip={ml.id}
                                data-drop-meter={ml.id}
                                data-meter-count={measureCount}
                                onPointerDown={(e) => {
                                  if ((e.target as HTMLElement).closest('button')) return;
                                  startPointerDrag(e, { id: ml.id, name: ml.name, type: '电表' }, 'meter');
                                }}
                                onMouseEnter={(e) => { e.stopPropagation(); setHoveredMeterSn(ml.sn); }}
                                onMouseLeave={() => setHoveredMeterSn(null)}
                                className={`group/meter relative pointer-events-auto flex items-center space-x-1 pl-1 pr-1.5 py-0.5 rounded-md border bg-orange-50 whitespace-nowrap shadow-xs transition-all cursor-grab active:cursor-grabbing touch-none ${
                                  isGroupDropTarget
                                    ? 'border-emerald-500 ring-4 ring-emerald-300 bg-emerald-50 scale-110'
                                    : isPanelOpen
                                      ? 'border-orange-500 ring-2 ring-orange-300 bg-orange-100'
                                      : hl
                                        ? 'border-orange-500 ring-2 ring-orange-300 bg-orange-100 scale-105'
                                        : 'border-orange-200 hover:border-orange-400'
                                }`}
                              >
                                {/* Hover 悬浮信息：只报 4 项 —— 设备名称 / SN / 设备类型 / 关联电表 */}
                                <div className={`absolute left-1/2 -translate-x-1/2 ${box.side === 'top' ? 'top-full mt-2' : 'bottom-full mb-2'} ${dragItem ? 'hidden' : 'hidden group-hover/meter:block'} w-48 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 text-xs text-gray-700 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150`}>
                                  <div className="space-y-1.5 text-[11px]">
                                    <div className="flex justify-between py-0.5 border-b border-gray-50">
                                      <span className="text-gray-400 shrink-0">设备名称:</span>
                                      <span className="font-bold text-gray-900 truncate ml-2">{ml.name}</span>
                                    </div>
                                    <div className="flex justify-between py-0.5 border-b border-gray-50">
                                      <span className="text-gray-400 shrink-0">SN:</span>
                                      <span className="font-mono text-gray-800 truncate ml-2">{ml.sn}</span>
                                    </div>
                                    <div className="flex justify-between py-0.5 border-b border-gray-50">
                                      <span className="text-gray-400 shrink-0">设备类型:</span>
                                      <span className="font-medium text-gray-800 truncate ml-2">电表</span>
                                    </div>
                                    <div className="flex justify-between py-0.5">
                                      <span className="text-gray-400 shrink-0">关联电表:</span>
                                      <span className="ml-2 font-bold text-orange-600 truncate">自身</span>
                                    </div>
                                  </div>
                                  <div className={`absolute left-1/2 -translate-x-1/2 border-6 border-transparent ${box.side === 'top' ? 'bottom-full border-b-white' : 'top-full border-t-white'} drop-shadow-xs`} />
                                </div>
                                <Gauge size={10} className="text-orange-600 shrink-0" />
                                <span className="text-[9px] font-bold text-orange-800 font-mono">{ml.sn}</span>
                                {measureCount > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (openMeterPanelId === ml.id) {
                                        setOpenMeterPanelId(null);
                                        flushMeterCompact();
                                        return;
                                      }
                                      // 下方/右侧空间不够就翻到上方 / 右对齐，别被画布容器裁掉
                                      const chipEl = (e.currentTarget as HTMLElement).closest('[data-meter-chip]') as HTMLElement | null;
                                      const cr = canvasContainerRef.current?.getBoundingClientRect();
                                      if (chipEl && cr) {
                                        const r = chipEl.getBoundingClientRect();
                                        setOpenMeterPanelUp(cr.bottom - r.bottom < 200);
                                        setOpenMeterPanelAlignRight(r.left + 224 > cr.right);
                                      }
                                      setOpenMeterPanelId(ml.id);
                                    }}
                                    className="text-[8px] font-bold px-1 rounded bg-orange-500 hover:bg-orange-600 text-white leading-3 transition"
                                    title="查看 / 调整计量范围（可逐台移出）"
                                  >
                                    测{measureCount}台
                                  </button>
                                )}
                                {isTopologyEditMode && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleUnbindMeterLink(ml.id); }}
                                    className="ml-0.5 text-[10px] leading-none text-red-500 hover:text-red-700 hover:bg-red-100 rounded px-0.5 transition"
                                    title="解绑：整块电表退回设备池"
                                  >
                                    ×
                                  </button>
                                )}

                                {/* 计量范围面板：列出同层成员，可逐台移出 */}
                                {openMeterPanelId === ml.id && (
                                  <div
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className={`absolute ${openMeterPanelUp ? 'bottom-full mb-1' : 'top-full mt-1'} ${openMeterPanelAlignRight ? 'right-0' : 'left-0'} z-50 w-56 bg-white rounded-lg border border-orange-200 shadow-xl p-2 text-left whitespace-normal cursor-default`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[9px] font-bold text-gray-500">计量范围（同一层级）</span>
                                      <span className="text-[9px] font-bold text-orange-600">共 {measureCount} 台</span>
                                    </div>
                                    <div className="space-y-0.5 max-h-40 overflow-auto">
                                      {ml.targetNodeIds.map(id => {
                                        const member = ovNodes.find(n => n.id === id);
                                        return (
                                          <div key={id} className="flex items-center justify-between px-1.5 py-1 rounded hover:bg-orange-50">
                                            <span className="text-[10px] text-gray-700 truncate" title={member ? member.name : id}>
                                              {member ? `${member.type} · ${member.name}` : id}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); handleRemoveMeterMember(ml.id, id); }}
                                              className="ml-2 shrink-0 text-[11px] leading-none text-red-500 hover:text-red-700 hover:bg-red-50 rounded px-1 transition"
                                              title="移出计量组"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-[9px] text-gray-400">
                                      把同层级设备拖到这块电表上即可加组
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* Topology Edit / Create Modal (Properties: Only Name & Remarks) */}
            {isTopoModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsTopoModalOpen(false)}></div>
                <div className="relative bg-white rounded-xl shadow-2xl w-[460px] p-6 text-xs text-gray-700 z-10 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{editingTopo ? '修改拓扑属性' : '新增拓扑方案'}</h3>
                    </div>
                    <button onClick={() => setIsTopoModalOpen(false)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTopo} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">拓扑图名称 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="例如: 2# 变压器高压侧拓扑图 / 充放电回路拓扑"
                        value={topoForm.name}
                        onChange={e => setTopoForm({ ...topoForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">备注说明</label>
                      <textarea
                        rows={3}
                        placeholder="说明本套拓扑架构的配电用途或特定运行说明..."
                        value={topoForm.remarks}
                        onChange={e => setTopoForm({ ...topoForm, remarks: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-xs resize-none"
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsTopoModalOpen(false)}
                        className="px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded font-bold text-xs"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow-sm transition"
                      >
                        保存拓扑属性
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}


        {/* ==================== TAB: CONFIGURATION (组态维护 - 空白处理) ==================== */}
        {activeTab === 'configuration' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 min-h-[520px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-4 shadow-2xs">
              <LayoutGrid size={28} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">组态维护</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              当前站点暂未配置组态画面，内容暂时空白处理。
            </p>
          </div>
        )}


        {/* ==================== TAB 4: PRICING CONFIG ==================== */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">

            {/* Top Sub-Tab Navigation Bar & Right Header */}
            <div className="bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-6">
                <button
                  type="button"
                  onClick={() => setPriceTab('purchase')}
                  className={`py-1 text-sm font-bold transition border-b-2 flex items-center space-x-1.5 ${
                    priceTab === 'purchase'
                      ? 'border-emerald-500 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Zap size={16} className={priceTab === 'purchase' ? 'text-emerald-500' : 'text-gray-400'} />
                  <span>电网购电</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPriceTab('sale')}
                  className={`py-1 text-sm font-bold transition border-b-2 flex items-center space-x-1.5 ${
                    priceTab === 'sale'
                      ? 'border-emerald-500 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Activity size={16} className={priceTab === 'sale' ? 'text-emerald-500' : 'text-gray-400'} />
                  <span>上网电价</span>
                </button>
              </div>

              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={() => setIsStrategyModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold transition flex items-center space-x-1 shadow-xs"
                >
                  <SlidersHorizontal size={13} />
                  <span>修改策略配置</span>
                </button>
              </div>
            </div>

            {/* 24-Hour Electricity Price Trend & Current Price Details */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

              {/* Left 3 Cols: 24小时电价趋势 Chart */}
              <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-gray-900 text-sm">24小时电价趋势</h3>
                    {/* Mode Toggle Pills (only for 电网购电 where fixed TOU is applicable) */}
                    {priceTab === 'purchase' && (
                      <div className="bg-gray-100 p-0.5 rounded-lg flex items-center space-x-0.5 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setPriceMode('fixed')}
                          className={`px-3 py-1 rounded-md transition ${
                            priceMode === 'fixed'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          固定分时
                        </button>
                        <button
                          type="button"
                          onClick={() => setPriceMode('market')}
                          className={`px-3 py-1 rounded-md transition ${
                            priceMode === 'market'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          市场化电价
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>实际结算电价</span>
                      </span>
                      <span className="flex items-center space-x-1 text-sky-500 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-dashed border-sky-600"></span>
                        <span>预测结算电价</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 bg-white">
                      <input
                        type="date"
                        value={priceDate}
                        onChange={e => setPriceDate(e.target.value)}
                        className="outline-none text-xs font-mono text-gray-700 bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Recharts Trend Line */}
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 11, fill: '#888888' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#888888' }}
                        axisLine={false}
                        tickLine={false}
                        domain={priceTab === 'sale' ? [-0.1, 0.5] : [0, 1.2]}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-xs space-y-1 font-sans">
                                <div className="font-bold text-gray-800 flex items-center justify-between space-x-3">
                                  <span>{label} ({data.period || '时段'})</span>
                                </div>
                                {data.actual !== null && (
                                  <div className="flex items-center justify-between space-x-4 text-emerald-600 font-medium">
                                    <span>实际结算电价:</span>
                                    <span className="font-mono font-bold">¥ {data.actual.toFixed(4)} /kWh</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between space-x-4 text-sky-600 font-medium">
                                  <span>预测结算电价:</span>
                                  <span className="font-mono font-bold">¥ {data.predicted.toFixed(4)} /kWh</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="actual"
                        name="实际结算电价"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: '#10b981' }}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="predicted"
                        name="预测结算电价"
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        strokeDasharray="4 4"
                        dot={{ r: 2, fill: '#38bdf8' }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right 1 Col: 当前价格详情 */}
              <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-gray-900 text-xs">当前价格详情</h3>
                  <span className="text-[11px] font-mono text-gray-400">{priceDate}</span>
                </div>

                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-gray-700 block">当前时段价格</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">09:00~09:30</span>
                    </div>
                    <span className="text-base font-black text-gray-900 font-mono">
                      ¥ {priceTab === 'purchase' ? '0.4403' : '0.0931'}
                    </span>
                  </div>

                  <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-gray-700 block">今日最高价</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">18:30~19:00</span>
                    </div>
                    <span className="text-base font-black text-gray-900 font-mono">
                      ¥ {priceTab === 'purchase' ? '0.9946' : '0.4601'}
                    </span>
                  </div>

                  <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-gray-700 block">今日最低价</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">09:30~10:00</span>
                    </div>
                    <span className="text-base font-black text-gray-900 font-mono">
                      ¥ {priceTab === 'purchase' ? '0.3238' : '-0.0234'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 固定分时电价 Table & Rules Management Card (Only for 电网购电) */}
            {priceTab === 'purchase' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-gray-900 text-sm">固定分时电价</h3>
                    <span className="text-xs text-gray-400 font-medium">(已对接系统分时规则引擎)</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {/* Auto Sync Toggle */}
                    <div className="flex items-center space-x-1.5 font-medium text-gray-600">
                      <Info size={13} className="text-gray-400" />
                      <span>自动同步电价</span>
                      <button
                        type="button"
                        onClick={() => setAutoSyncPrice(!autoSyncPrice)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          autoSyncPrice ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            autoSyncPrice ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`font-bold text-[10px] uppercase px-1 rounded ${autoSyncPrice ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                        {autoSyncPrice ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingRuleId(null);
                        setRuleForm({
                          dateRange: '2026-08-01~2026-08-31',
                          timeSlot: '17:00~22:00',
                          type: '尖峰',
                          price: 1.1200
                        });
                        setIsAddRuleModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1"
                    >
                      <Plus size={13} />
                      <span>新增电价配置</span>
                    </button>
                  </div>
                </div>

                {/* Rules Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-700 border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200 text-gray-500 font-bold">
                        <th className="py-2.5 px-4">适用日期</th>
                        <th className="py-2.5 px-4">适用时段</th>
                        <th className="py-2.5 px-4">电价类型</th>
                        <th className="py-2.5 px-4">电价 (元/kWh)</th>
                        <th className="py-2.5 px-4">更新时间</th>
                        <th className="py-2.5 px-4 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {touRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-gray-50/80 transition">
                          <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">{rule.dateRange}</td>
                          <td className="py-3 px-4 font-mono text-gray-800 font-medium">{rule.timeSlot}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-md border font-bold text-[11px] ${getTypeBadgeColor(rule.type)}`}>
                              {rule.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-gray-900">{rule.price.toFixed(4)}</td>
                          <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">{rule.updatedAt}</td>
                          <td className="py-3 px-4 text-center space-x-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRuleId(rule.id);
                                setRuleForm({
                                  dateRange: rule.dateRange,
                                  timeSlot: rule.timeSlot,
                                  type: rule.type,
                                  price: rule.price
                                });
                                setIsAddRuleModalOpen(true);
                              }}
                              className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTouRules(prev => prev.filter(r => r.id !== rule.id));
                                showNotification('已成功删除该电价规则！');
                              }}
                              className="text-red-500 hover:text-red-700 font-medium hover:underline"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}


        {/* ==================== TAB 5: EVENT LOGS ==================== */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            
            {/* Search and Category filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="relative max-w-md">
                <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="按照日志内容, 触发源进行检索..."
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['全部', '设备告警', '策略变更', '版本升级', '设备新增', '拓扑变更', '建站'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveEventCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      activeEventCategory === cat 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Records Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 font-bold z-10 text-gray-600">
                    <tr>
                      <th className="px-5 py-3 text-xs">触发时间</th>
                      <th className="px-5 py-3 text-xs">日志等级</th>
                      <th className="px-5 py-3 text-xs">类型</th>
                      <th className="px-5 py-3 text-xs">事件来源</th>
                      <th className="px-5 py-3 text-xs">事件明细</th>
                      <th className="px-5 py-3 text-xs">处理方式</th>
                      <th className="px-5 py-3 text-xs text-center">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-mono">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">
                          暂无符合检索条件的事件日志记录
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{log.time}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              log.level === 'error' ? 'bg-red-50 text-red-700' :
                              log.level === 'warning' ? 'bg-amber-50 text-amber-700' :
                              'bg-blue-50 text-blue-700'
                            }`}>
                              {log.level === 'error' ? '高危' : log.level === 'warning' ? '警告' : '普通信息'}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-semibold text-gray-800">{log.type}</td>
                          <td className="px-5 py-3 text-gray-600">{log.source}</td>
                          <td className="px-5 py-3 font-sans text-gray-800 max-w-[300px] truncate" title={log.content}>{log.content}</td>
                          <td className="px-5 py-3 font-sans text-gray-500">{log.handler}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === '未处理' ? 'bg-red-50 text-red-600 border border-red-200' :
                              log.status === '处理中' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                              'bg-green-50 text-green-600 border border-green-200'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-gray-400 text-[10px] font-bold tracking-wider">
                <span>站点运行日志记录总计: {filteredLogs.length} 条</span>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* =============================================================== */}
      {/* ==================== CREATE/EDIT DEVICE MODAL ================= */}
      {isCreateDeviceOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleSaveDevice}
            className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                <Server size={16} className="text-blue-600" />
                <span>{editingDevice ? '编辑设备信息' : '新建设备'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsCreateDeviceOpen(false);
                  setEditingDevice(null);
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">设备ID</label>
                  <input 
                    type="text" 
                    placeholder="系统自动分配ID"
                    value={deviceForm.id}
                    onChange={e => setDeviceForm(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">设备类型 <span className="text-red-500">*</span></label>
                  <select 
                    value={deviceForm.type}
                    onChange={e => setDeviceForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="EMS">EMS</option>
                    <option value="PCS">PCS</option>
                    <option value="储能空调">储能空调</option>
                    <option value="变压器">变压器</option>
                    <option value="储能柜">储能柜</option>
                    <option value="电池簇">电池簇</option>
                    <option value="并网柜">并网柜</option>
                    <option value="光伏逆变器">光伏逆变器</option>
                    <option value="电表">电表</option>
                    <option value="储能消防">储能消防</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">设备名称 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder={`例如: 1#${deviceForm.type}`}
                    value={deviceForm.name}
                    onChange={e => setDeviceForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">设备SN <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="请输入设备SN串码"
                    value={deviceForm.sn}
                    onChange={e => setDeviceForm(prev => ({ ...prev, sn: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-mono font-medium bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">设备型号</label>
                  <input 
                    type="text" 
                    placeholder="例如: PCS-100KW-V2"
                    value={deviceForm.model}
                    onChange={e => setDeviceForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">设备父级</label>
                  <input 
                    type="text" 
                    placeholder="例如: 1#变压器 或 留空"
                    value={deviceForm.parent}
                    onChange={e => setDeviceForm(prev => ({ ...prev, parent: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-medium bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">所属站点</label>
                  <input 
                    type="text" 
                    value={deviceForm.station}
                    onChange={e => setDeviceForm(prev => ({ ...prev, station: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">所属企业</label>
                  <input 
                    type="text" 
                    value={deviceForm.enterprise}
                    onChange={e => setDeviceForm(prev => ({ ...prev, enterprise: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-medium bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-[11px] leading-relaxed">
                提示: 设备创建或编辑完成后，将自动同步更新到站点列表及逻辑设备模型库中。
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => {
                  setIsCreateDeviceOpen(false);
                  setEditingDevice(null);
                }}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition cursor-pointer"
              >
                取消
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs transition cursor-pointer"
              >
                {editingDevice ? '保存修改' : '确认新建'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== VIEW DEVICE DETAILS MODAL ================= */}
      {viewingDevice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                <FileText size={16} className="text-blue-600" />
                <span>设备详情 - {viewingDevice.name}</span>
              </h3>
              <button 
                onClick={() => setViewingDevice(null)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <span className="text-gray-400 text-[10px]">设备ID</span>
                <p className="font-mono font-bold text-gray-800 break-all">{viewingDevice.id}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <span className="text-gray-400 text-[10px]">设备类型</span>
                <p className="font-bold text-gray-800">{viewingDevice.type}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <span className="text-gray-400 text-[10px]">设备SN</span>
                <p className="font-mono font-bold text-gray-800 break-all">{viewingDevice.sn}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <span className="text-gray-400 text-[10px]">设备型号</span>
                <p className="font-mono text-gray-800">{viewingDevice.model || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <span className="text-gray-400 text-[10px]">设备父级</span>
                <p className="text-gray-800">{viewingDevice.parent || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <span className="text-gray-400 text-[10px]">所属站点</span>
                <p className="text-gray-800">{viewingDevice.station}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 col-span-2">
                <span className="text-gray-400 text-[10px]">所属企业</span>
                <p className="text-gray-800 font-medium">{viewingDevice.enterprise}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 col-span-2">
                <span className="text-gray-400 text-[10px]">创建时间</span>
                <p className="font-mono text-gray-600">{viewingDevice.createdAt || '2026-08-18 16:30:00'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button 
                onClick={() => setViewingDevice(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}


      {/* =============================================================== */}
      {/* ==================== IMPORT FROM APPLICATION MODAL ============ */}
      {isImportFromApplyOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                <Database size={14} className="text-gray-500" />
                <span>从网关申请接入队列快速导入</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsImportFromApplyOpen(false);
                  setSelectedApps([]);
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-400"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-[10px] text-gray-400">选择待绑定的网关物理资源明细（系统将按照申请清单中的物理规格、物模型自动生成关联设备）：</p>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden max-h-[240px] overflow-y-auto">
                {MOCK_STATION_APPLICATIONS.map(app => (
                  <label key={app.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={selectedApps.includes(app.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedApps(prev => [...prev, app.id]);
                        } else {
                          setSelectedApps(prev => prev.filter(id => id !== app.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">{app.station} (SN: {app.gatewaySn})</span>
                        <span className="text-[10px] font-mono text-gray-400">{app.applyTime}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 leading-relaxed">
                        待导入规格数量: <span className="text-blue-600 font-bold">{app.deviceCount}</span> 台设备，包含 {app.devices.map(d => `${d.count}台${d.type}`).join(', ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="p-3 bg-purple-50 text-purple-700 rounded-lg text-[10px] leading-relaxed">
                提示: 导入完成后，所选申请清单中的物理资产将直接绑定在<b>【{station.name}】</b>中，物理设备对应的逻辑拓扑图也将一并就绪。
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => {
                  setIsImportFromApplyOpen(false);
                  setSelectedApps([]);
                }}
                className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition"
              >
                取消
              </button>
              <button 
                type="button"
                onClick={handleImportDevices}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                确认导入接入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STRATEGY CONFIG MODAL ==================== */}
      {isStrategyModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={(e) => {
              handleSavePricing(e);
              setIsStrategyModalOpen(false);
            }}
            className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                <SlidersHorizontal size={14} className="text-blue-500" />
                <span>修改购售电电价策略配置</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsStrategyModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <span className="block text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">电价策略维护参数</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-0.5 font-bold">*</span>1级行政地区:
                    </label>
                    <select 
                      value={pricingConfig.province}
                      onChange={e => setPricingConfig(prev => ({ ...prev, province: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                    >
                      {['上海市', '北京市', '天津市', '江苏省', '浙江省', '广东省', '山东省', '河北省', '安徽省', '四川省', '湖北省'].map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-0.5 font-bold">*</span>用电类型I:
                    </label>
                    <select 
                      value={pricingConfig.electricityTypeI}
                      onChange={e => setPricingConfig(prev => ({ ...prev, electricityTypeI: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                    >
                      {['两部制', '单一制'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-0.5 font-bold">*</span>用电类型II:
                    </label>
                    <select 
                      value={pricingConfig.electricityTypeII}
                      onChange={e => setPricingConfig(prev => ({ ...prev, electricityTypeII: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                    >
                      {['一般工商业', '大工业', '农业生产', '居民生活'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-0.5 font-bold">*</span>电压等级:
                    </label>
                    <select 
                      value={pricingConfig.voltageLevel}
                      onChange={e => setPricingConfig(prev => ({ ...prev, voltageLevel: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                    >
                      {['10千伏', '35千伏', '110千伏', '1千伏以下'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">购电电价类型</label>
                <select 
                  value={pricingConfig.purchaseType}
                  onChange={e => setPricingConfig(prev => ({ ...prev, purchaseType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                >
                  <option value="固定分时电价">固定分时电价 (峰谷平模式)</option>
                  <option value="市场化电价">市场化电价 (省网双向竞价预测模式)</option>
                  <option value="固定单价">固定单价 (全天统一单价模式)</option>
                </select>
              </div>

              {pricingConfig.purchaseType === '市场化电价' && (
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-2">
                  <label className="block text-[11px] font-bold text-blue-700 flex items-center space-x-1">
                    <span className="text-red-500 mr-0.5">*</span>
                    <span>选择对应动态购电电价</span>
                  </label>
                  <select
                    value={pricingConfig.dynamicPurchasePriceId}
                    onChange={e => {
                      const val = e.target.value;
                      const matched = PROVINCES.find(p => p.id === val);
                      setPricingConfig(prev => ({
                        ...prev,
                        dynamicPurchasePriceId: val,
                        purchaseDetail: matched ? `动态购电电价 [${matched.priceName}] - 自动对接 ${matched.level1Region} 现货竞价系统` : prev.purchaseDetail
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium text-gray-800"
                  >
                    <option value="">-- 请选择动态购电电价 (来自购电电价管理) --</option>
                    {PROVINCES.map(prov => (
                      <option key={prov.id} value={prov.id}>
                        {prov.level1Region} - {prov.priceName} ({prov.usageType1} | {prov.voltage})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {pricingConfig.purchaseType !== '市场化电价' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">购电电价价格计划明细 (元/kWh)</label>
                  <textarea 
                    rows={2}
                    value={pricingConfig.purchaseDetail}
                    onChange={e => setPricingConfig(prev => ({ ...prev, purchaseDetail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-gray-400">提示: 格式将自动适配并入系统EMS，执行削峰填谷智能调度。</span>
                </div>
              )}

              <div className="h-px bg-gray-100"></div>

              <div className={pricingConfig.feedInType === '市场化电价' ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"}>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">售电电价类型</label>
                  <select 
                    value={pricingConfig.feedInType}
                    onChange={e => setPricingConfig(prev => ({ ...prev, feedInType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="固定价格">固定上网单价</option>
                    <option value="市场化电价">市场化电价</option>
                  </select>
                </div>
                {pricingConfig.feedInType !== '市场化电价' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">上网售电单价 (元/kWh)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={pricingConfig.feedInPrice}
                      onChange={e => setPricingConfig(prev => ({ ...prev, feedInPrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {pricingConfig.feedInType === '市场化电价' && (
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-2">
                  <label className="block text-[11px] font-bold text-indigo-700 flex items-center space-x-1">
                    <span className="text-red-500 mr-0.5">*</span>
                    <span>选择对应动态售电电价</span>
                  </label>
                  <select
                    value={pricingConfig.dynamicSalesPriceId}
                    onChange={e => {
                      const val = e.target.value;
                      const matched = SALES_PRICES.find(s => s.id === val);
                      setPricingConfig(prev => ({
                        ...prev,
                        dynamicSalesPriceId: val,
                        feedInPrice: matched ? '0.48' : prev.feedInPrice
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium text-gray-800"
                  >
                    <option value="">-- 请选择动态售电电价 (来自售电电价管理) --</option>
                    {SALES_PRICES.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.level1Region} - 售电价格策略 (最新预测: {sp.latestPredictedDate})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setIsStrategyModalOpen(false)}
                className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition"
              >
                取消
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                保存策略配置
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== ADD/EDIT TOU RULE MODAL ==================== */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (editingRuleId) {
                setTouRules(prev => prev.map(r => r.id === editingRuleId ? {
                  ...r,
                  dateRange: ruleForm.dateRange,
                  timeSlot: ruleForm.timeSlot,
                  type: ruleForm.type,
                  price: Number(ruleForm.price),
                  updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
                } : r));
                showNotification('已更新分时电价配置！');
              } else {
                const newId = `R${String(touRules.length + 1).padStart(2, '0')}`;
                setTouRules(prev => [
                  {
                    id: newId,
                    dateRange: ruleForm.dateRange,
                    timeSlot: ruleForm.timeSlot,
                    type: ruleForm.type,
                    price: Number(ruleForm.price),
                    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
                  },
                  ...prev
                ]);
                showNotification('新增分时电价规则成功！');
              }
              setIsAddRuleModalOpen(false);
            }}
            className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                <Plus size={14} className="text-emerald-500" />
                <span>{editingRuleId ? '编辑分时电价规则' : '新增分时电价规则'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddRuleModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-400"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">适用日期范围</label>
                <input 
                  type="text" 
                  value={ruleForm.dateRange}
                  onChange={e => setRuleForm(prev => ({ ...prev, dateRange: e.target.value }))}
                  placeholder="如 2026-08-01~2026-08-31"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-mono bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">适用时段 (多段用顿号分隔)</label>
                <input 
                  type="text" 
                  value={ruleForm.timeSlot}
                  onChange={e => setRuleForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                  placeholder="如 17:00~22:00 或 16:00~17:00、22:00~23:00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-mono bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">电价类型</label>
                  <select 
                    value={ruleForm.type}
                    onChange={e => setRuleForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="尖峰">尖峰</option>
                    <option value="高峰">高峰</option>
                    <option value="平段">平段</option>
                    <option value="低谷">低谷</option>
                    <option value="深谷">深谷</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">电价 (元/kWh)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    value={ruleForm.price}
                    onChange={e => setRuleForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-mono bg-white"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] leading-relaxed">
                提示: 配置保存后，系统 EMS 引擎将自动依据所配时段下发电池充放电控制响应。
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setIsAddRuleModalOpen(false)}
                className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition"
              >
                取消
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                {editingRuleId ? '保存修改' : '确认添加'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Switch Topology Password Confirmation Modal */}
      {switchConfirmTopoId && (() => {
        const targetTopo = stationTopologies.find(t => t.id === switchConfirmTopoId);
        const currentTopo = stationTopologies.find(t => t.id === operationalTopoId);
        if (!targetTopo) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSwitchConfirmTopoId(null)}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-[400px] p-6 text-xs text-gray-700 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">切换拓扑二次确认</h3>
                </div>
                <button onClick={() => setSwitchConfirmTopoId(null)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleConfirmSwitchTopo} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">当前运行:</span>
                    <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                      {currentTopo && <span className="text-[9px] bg-gray-600 text-white font-mono font-bold px-1.5 py-0.2 rounded">{currentTopo.id}</span>}
                      <span>{currentTopo?.name || '-'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">切换为:</span>
                    <span className="font-bold text-blue-700 flex items-center space-x-1.5">
                      <span className="text-[9px] bg-blue-600 text-white font-mono font-bold px-1.5 py-0.2 rounded">{targetTopo.id}</span>
                      <span>{targetTopo.name}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">操作密码 <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    autoFocus
                    value={switchPassword}
                    onChange={e => { setSwitchPassword(e.target.value); setSwitchPasswordError(''); }}
                    placeholder="请输入操作密码"
                    className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-500 font-medium text-xs ${switchPasswordError ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {switchPasswordError && (
                    <p className="text-[10px] text-red-500 mt-1">{switchPasswordError}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSwitchConfirmTopoId(null)}
                    className="px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded font-bold text-xs"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded font-bold text-xs shadow-sm transition flex items-center space-x-1"
                  >
                    <ShieldCheck size={12} />
                    <span>确认切换</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Topology Dispatch & Gateway Synchronization Modal */}
      <TopologyDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        station={station}
        currentTopology={stationTopologies.find(t => t.id === (activeTopoId || stationTopologies[0]?.id)) || stationTopologies[0]}
        allTopologies={stationTopologies}
        topoNodes={topoTrees[activeTopoId || 'T01'] || DEFAULT_TOPOLOGY_NODES_MAP['T01'] || []}
        incomerLines={incomerLines}
        onDispatchSuccess={handleDispatchSuccess}
        onRollback={handleRollbackTopo}
      />

    </div>
  );
}
