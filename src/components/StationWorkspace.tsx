import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, ArrowRight, Check, X, Search, Settings, Activity, Cpu, 
  Database, AlertTriangle, Layers, Plus, Trash2, Edit2, Info, Sliders, 
  Globe, Calendar, SlidersHorizontal, ShieldAlert, BadgeCheck, FileText,
  Clock, Server, Network, Zap, RefreshCw, Link, Unlink, CheckSquare, Square,
  CheckCircle2, Power, ChevronDown, BatteryCharging, Plug, Gauge, SunMedium, 
  Wind, Flame, Box, Sun, CornerDownRight, Move, ZoomIn, ZoomOut, Maximize2, RotateCcw,
  ChevronLeft, ChevronRight, LayoutGrid
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { INITIAL_VERSIONS, INITIAL_FEATURE_PACKS, PROVINCES, SALES_PRICES } from '../App';

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

export interface MeterBinding {
  name: string;
  sn: string;
  model?: string;
  relationType?: string;
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
    const storageKey = `station_topologies_${station.id || station.name}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 'T01', name: '1# 变压器高压侧拓扑图', remarks: '主变与高压开关柜配电逻辑节点', updatedAt: '2026-07-28 10:00' },
      { id: 'T02', name: '低压Ⅰ段交流母线拓扑图', remarks: '380V低压交流母线及分支逻辑节点', updatedAt: '2026-07-28 10:00' },
      { id: 'T03', name: '1# 储能充放电系统拓扑图', remarks: '1# PCS变流器与储能电池簇系统', updatedAt: '2026-07-28 10:00' },
      { id: 'T04', name: '光伏发电并网逆变拓扑图', remarks: '光伏逆变器与并网汇流柜逻辑节点', updatedAt: '2026-07-28 10:00' },
    ];
  });

  useEffect(() => {
    const storageKey = `station_topologies_${station.id || station.name}`;
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

  // Layout mode state: Vertical tree vs Horizontal tree
  const [treeLayoutMode, setTreeLayoutMode] = useState<'vertical' | 'horizontal'>('vertical');
  
  // Canvas Zoom Scale state (50% ~ 200%)
  const [canvasScale, setCanvasScale] = useState<number>(1);
  // Hovered node state for floating popover details
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  // Left pending devices sidebar collapse state
  const [isPendingCollapsed, setIsPendingCollapsed] = useState<boolean>(false);

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
  }, []);

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<{ id: string, source: 'pending' | 'canvas', type: string, name: string } | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [isDragOverPendingArea, setIsDragOverPendingArea] = useState<boolean>(false);

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

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, item: { id: string, name: string, type: string }, source: 'pending' | 'canvas') => {
    setDraggedItem({ id: item.id, name: item.name, type: item.type, source });
    e.dataTransfer.setData('text/plain', item.id);
  };

  // Handle Drop on Canvas Node (Snap Connection or Meter Measurement Relation)
  const handleDropOnNode = (e: React.DragEvent, targetParentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverNodeId(null);

    if (!draggedItem) return;

    const currentTopoId = activeTopoId || 'T01';
    const currentNodes = topoTrees[currentTopoId] || DEFAULT_TOPOLOGY_NODES_MAP['T01'] || [];
    const targetParent = currentNodes.find(n => n.id === targetParentId);
    const parentName = targetParent ? targetParent.name : '目标节点';

    // Special handling for Electric Meters (电表和测量节点是测量关系，不是树层级连线节点)
    if (draggedItem.type === '电表') {
      if (draggedItem.source === 'pending') {
        const device = pendingDevices.find(p => p.id === draggedItem.id);
        if (!device) return;

        setTopoTrees(prev => ({
          ...prev,
          [currentTopoId]: (prev[currentTopoId] || []).map(n => {
            if (n.id === targetParentId) {
              return {
                ...n,
                meterBinding: {
                  name: device.name,
                  sn: device.sn,
                  model: device.model,
                  relationType: '测量节点/关口计量'
                }
              };
            }
            return n;
          })
        }));

        setPendingDevices(prev => prev.filter(p => p.id !== draggedItem.id));
        showNotification(`已建立测量关系：将电表 [${device.name}] 关联至节点 [${parentName}]！`);
      }
      setDraggedItem(null);
      return;
    }

    if (draggedItem.source === 'pending') {
      const device = pendingDevices.find(p => p.id === draggedItem.id);
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

      setPendingDevices(prev => prev.filter(p => p.id !== draggedItem.id));
      showNotification(`已自动吸附连线：[${device.name}] 挂载至 [${parentName}] 下级！`);

    } else if (draggedItem.source === 'canvas') {
      if (draggedItem.id === targetParentId) {
        setDraggedItem(null);
        return;
      }

      let curr: string | null = targetParentId;
      let isAncestor = false;
      while (curr) {
        if (curr === draggedItem.id) {
          isAncestor = true;
          break;
        }
        const p = currentNodes.find(n => n.id === curr);
        curr = p?.parentId || null;
      }

      if (isAncestor) {
        showNotification('不能将父节点挂载至其子节点下级！', 'error');
        setDraggedItem(null);
        return;
      }

      setTopoTrees(prev => ({
        ...prev,
        [currentTopoId]: (prev[currentTopoId] || []).map(n => n.id === draggedItem.id ? { ...n, parentId: targetParentId } : n)
      }));

      showNotification(`节点 [${draggedItem.name}] 自动吸附并重定向连线至 [${parentName}] 下！`);
    }

    setDraggedItem(null);
  };

  // Handle unbinding meter measurement relationship from node
  const handleUnbindMeter = (nodeId: string) => {
    const currentTopoId = activeTopoId || 'T01';
    const currentNodes = topoTrees[currentTopoId] || [];
    const targetNode = currentNodes.find(n => n.id === nodeId);
    if (!targetNode || !targetNode.meterBinding) return;

    const meterBinding = targetNode.meterBinding;

    setTopoTrees(prev => ({
      ...prev,
      [currentTopoId]: (prev[currentTopoId] || []).map(n => n.id === nodeId ? { ...n, meterBinding: undefined } : n)
    }));

    const returnedMeter: PendingDevice = {
      id: `p_dev_${Date.now()}`,
      name: meterBinding.name,
      type: '电表',
      sn: meterBinding.sn,
      model: meterBinding.model || 'DTSD1352'
    };

    setPendingDevices(prev => [returnedMeter, ...prev]);
    showNotification(`已解绑测量关系，将电表 [${returnedMeter.name}] 退回至待编辑设备区！`);
  };

  // Handle returning node from canvas to Pending Devices Area
  const handleRemoveNodeToPending = (nodeId: string) => {
    const currentTopoId = activeTopoId || 'T01';
    const currentNodes = topoTrees[currentTopoId] || [];
    const nodeToRemove = currentNodes.find(n => n.id === nodeId);
    
    if (!nodeToRemove) return;

    if (nodeToRemove.type === '总进线' || nodeToRemove.parentId === null) {
      showNotification('总进线为画布默认根节点，不可移出拓扑！', 'error');
      return;
    }

    const updatedNodes = currentNodes
      .filter(n => n.id !== nodeId)
      .map(n => n.parentId === nodeId ? { ...n, parentId: nodeToRemove.parentId } : n);

    setTopoTrees(prev => ({
      ...prev,
      [currentTopoId]: updatedNodes
    }));

    const returnedDevice: PendingDevice = {
      id: `p_dev_${Date.now()}`,
      name: nodeToRemove.name,
      type: nodeToRemove.type,
      sn: nodeToRemove.sn || `SN-${nodeToRemove.id}`,
      model: nodeToRemove.model || `${nodeToRemove.type}-MOD`
    };

    setPendingDevices(prev => [returnedDevice, ...prev]);
    showNotification(`已将设备 [${nodeToRemove.name}] 退回至待编辑设备区域！`);
  };

  // Handle Drop on Pending Devices Area
  const handleDropOnPendingArea = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverPendingArea(false);

    if (draggedItem && draggedItem.source === 'canvas') {
      handleRemoveNodeToPending(draggedItem.id);
    }
    setDraggedItem(null);
  };

  // Incomer Line state
  const [incomerLines, setIncomerLines] = useState<any[]>(() => {
    const storageKey = `incomer_lines_${station.id || station.name}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Default: 1 incomer line, bound to ALL topologies, marked as in-use
    return [
      {
        id: 'INC_01',
        name: '1# 变压器总进线',
        remarks: '站内主电源进线，默认绑定全站拓扑',
        isInUse: true,
        boundTopoIds: ['T01', 'T02', 'T03', 'T04'],
        createdAt: '2026-07-10 11:30:00'
      }
    ];
  });

  useEffect(() => {
    const storageKey = `incomer_lines_${station.id || station.name}`;
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
    setIsSyncingTopo(true);
    setTimeout(() => {
      setIsSyncingTopo(false);
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
      showNotification('已成功从本地网关 (SN: 8842b5) 同步最新拓扑节点与物理连线！');
    }, 600);
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

  // Filters for Tab 2 (Device Management)
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [deviceStatusFilter, setDeviceStatusFilter] = useState('');

  const filteredDevices = useMemo(() => {
    return stationDevices.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(deviceSearch.toLowerCase()) || d.sn.toLowerCase().includes(deviceSearch.toLowerCase());
      const matchType = !deviceTypeFilter || d.type === deviceTypeFilter;
      // Mocking status mapping for filtering
      const status = d.status || (d.id.charCodeAt(0) % 3 === 0 ? 'alarm' : d.id.charCodeAt(0) % 5 === 0 ? 'offline' : 'online');
      const matchStatus = !deviceStatusFilter || status === deviceStatusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [stationDevices, deviceSearch, deviceTypeFilter, deviceStatusFilter]);

  // Modals inside Device Tab
  const [isCreateDeviceOpen, setIsCreateDeviceOpen] = useState(false);
  const [isImportFromApplyOpen, setIsImportFromApplyOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);

  // New/Edit Device form states
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    type: '储能柜',
    sn: '',
    thingModelId: 'TM04'
  });

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
    setDeviceForm(prev => ({ ...prev, thingModelId: modelMap[prev.type] || 'TM04' }));
  }, [deviceForm.type]);

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const model = MOCK_THING_MODELS.find(m => m.id === deviceForm.thingModelId);
    
    const newDevice = {
      id: 'TH' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      name: deviceForm.name || `${deviceForm.type}设备`,
      type: deviceForm.type,
      sn: deviceForm.sn || `SN-${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      model: model?.name || 'GENERIC',
      parent: station.name,
      station: station.name,
      enterprise: station.enterpriseName,
      status: 'online',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      remarks: '手动创建并分配物模型'
    };

    setDevices(prev => [newDevice, ...prev]);
    
    // Save to localStorage
    const saved = localStorage.getItem('wizard_created_devices');
    let devicesList = [];
    if (saved) {
      try { devicesList = JSON.parse(saved); } catch (e) {}
    }
    devicesList.push(newDevice);
    localStorage.setItem('wizard_created_devices', JSON.stringify(devicesList));

    setIsCreateDeviceOpen(false);
    setDeviceForm({ name: '', type: '储能柜', sn: '', thingModelId: 'TM04' });
    showNotification('成功添加物理设备并绑定物模型！');
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
            enterprise: station.enterpriseName,
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
    if (confirm(`确定要从本站移除设备 "${name}" 吗？`)) {
      setDevices(prev => prev.filter(d => d.id !== id));
      
      const saved = localStorage.getItem('wizard_created_devices');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const filtered = parsed.filter((d: any) => d.id !== id);
          localStorage.setItem('wizard_created_devices', JSON.stringify(filtered));
        } catch (e) {}
      }
      showNotification('设备已成功移除');
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
            
            {/* Filter controls bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-4xl">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    placeholder="搜索设备名称/SN..."
                    value={deviceSearch}
                    onChange={e => setDeviceSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 bg-white"
                  />
                </div>
                <div>
                  <select 
                    value={deviceTypeFilter} 
                    onChange={e => setDeviceTypeFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500"
                  >
                    <option value="">全部设备类型</option>
                    <option value="变压器">变压器</option>
                    <option value="储能柜">储能柜</option>
                    <option value="PCS">PCS</option>
                    <option value="电池簇">电池簇</option>
                    <option value="并网柜">并网柜</option>
                    <option value="光伏逆变器">光伏逆变器</option>
                    <option value="电表">电表</option>
                  </select>
                </div>
                <div>
                  <select 
                    value={deviceStatusFilter} 
                    onChange={e => setDeviceStatusFilter(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500"
                  >
                    <option value="">全部状态</option>
                    <option value="online">正常在线</option>
                    <option value="alarm">发生告警</option>
                    <option value="offline">设备离线</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end lg:self-auto shrink-0">
                <button 
                  onClick={() => setIsImportFromApplyOpen(true)}
                  className="px-3 py-1.5 border border-blue-200 hover:bg-blue-50 text-blue-600 font-bold rounded-lg text-xs transition flex items-center space-x-1 bg-white"
                >
                  <Plus size={13} />
                  <span>从建站申请选择</span>
                </button>
                <button 
                  onClick={() => setIsCreateDeviceOpen(true)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center space-x-1"
                >
                  <Plus size={13} />
                  <span>直接创建设备</span>
                </button>
              </div>
            </div>

            {/* Devices Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 font-bold z-10 text-gray-600">
                    <tr>
                      <th className="px-5 py-3 text-xs">设备名称</th>
                      <th className="px-5 py-3 text-xs">设备类型</th>
                      <th className="px-5 py-3 text-xs">物联/通信SN</th>
                      <th className="px-5 py-3 text-xs">关联物模型</th>
                      <th className="px-5 py-3 text-xs">关联站点 (默认)</th>
                      <th className="px-5 py-3 text-xs">状态</th>
                      <th className="px-5 py-3 text-xs text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {filteredDevices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">
                          <Server size={32} className="mx-auto mb-2 text-gray-300 opacity-60" />
                          <span>暂无符合过滤条件的站点设备</span>
                        </td>
                      </tr>
                    ) : (
                      filteredDevices.map(d => {
                        const status = d.status || (d.id.charCodeAt(0) % 3 === 0 ? 'alarm' : d.id.charCodeAt(0) % 5 === 0 ? 'offline' : 'online');
                        return (
                          <tr key={d.id} className="hover:bg-gray-50/50 transition">
                            <td className="px-5 py-3 font-semibold text-gray-900">{d.name}</td>
                            <td className="px-5 py-3">
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">{d.type}</span>
                            </td>
                            <td className="px-5 py-3 font-mono text-gray-500">{d.sn}</td>
                            <td className="px-5 py-3 font-medium text-gray-600">{d.model || '通用物模型'}</td>
                            <td className="px-5 py-3 text-gray-400 font-semibold">{station.name}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                status === 'online' ? 'bg-green-50 text-green-700 border border-green-200' :
                                status === 'alarm' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}>
                                <span className={`w-1 h-1 rounded-full mr-1.5 ${
                                  status === 'online' ? 'bg-green-500' :
                                  status === 'alarm' ? 'bg-amber-500' :
                                  'bg-gray-400'
                                }`} />
                                {status === 'online' ? '在线' : status === 'alarm' ? '告警' : '离线'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex justify-center space-x-1.5">
                                <button 
                                  onClick={() => {
                                    setEditingDevice(d);
                                    setDeviceForm({ name: d.name, type: d.type, sn: d.sn, thingModelId: 'TM04' });
                                    setIsCreateDeviceOpen(true);
                                  }}
                                  className="px-2 py-0.5 text-blue-600 border border-blue-200 hover:bg-blue-50 rounded text-[10px] font-bold"
                                >
                                  编辑
                                </button>
                                <button 
                                  onClick={() => handleDeleteDevice(d.id, d.name)}
                                  className="px-2 py-0.5 text-red-600 border border-red-200 hover:bg-red-50 rounded text-[10px] font-bold"
                                >
                                  移除
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-gray-400 text-[10px] font-bold tracking-wider">
                <span>过滤结果: {filteredDevices.length} 台</span>
                <span>当前站点设备总计: {stationDevices.length} 台</span>
              </div>
            </div>
          </div>
        )}


        {/* ==================== TAB: INCOMER LINE MANAGEMENT ==================== */}
        {activeTab === 'incomer' && (
          <div className="space-y-5">
            {/* Top Toolbar & Summary Header */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                  <Zap size={14} className="text-amber-500" />
                  <span>站内进线管理与拓扑绑定映射</span>
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  维护站内进线名称与备注说明，标记正在使用的进线，配置与拓扑图的关联关系
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleOpenAddIncomer}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center space-x-1"
                >
                  <Plus size={13} />
                  <span>新增进线</span>
                </button>
              </div>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">进线总数</span>
                  <Zap size={15} className="text-amber-500" />
                </div>
                <div className="text-2xl font-black text-gray-900 mt-1">{incomerLines.length} <span className="text-xs font-normal text-gray-400">条</span></div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">正在使用的进线</span>
                  <CheckCircle2 size={15} className="text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {incomerLines.filter(l => l.isInUse).length} <span className="text-xs font-normal text-gray-400">/ {incomerLines.length}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">已绑定进线的拓扑</span>
                  <Link size={15} className="text-blue-500" />
                </div>
                {(() => {
                  const boundCount = stationTopologies.filter(t => incomerLines.some(l => l.boundTopoIds.includes(t.id))).length;
                  return (
                    <div className="text-2xl font-black text-blue-600 mt-1">
                      {boundCount} <span className="text-xs font-normal text-gray-400">/ {stationTopologies.length}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">未绑定进线的拓扑</span>
                  <Unlink size={15} className="text-amber-500" />
                </div>
                {(() => {
                  const unboundCount = stationTopologies.filter(t => !incomerLines.some(l => l.boundTopoIds.includes(t.id))).length;
                  return (
                    <div className={`text-2xl font-black mt-1 ${unboundCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {unboundCount} <span className="text-xs font-normal text-gray-400">个</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Incomer Lines Grid & Mapping Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Incomer Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                    <span>站内进线列表</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{incomerLines.length}</span>
                  </h4>
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
                            <span className="text-[10px] text-gray-400">1个拓扑图独占绑定1条进线</span>
                          </div>

                          {boundTopos.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {boundTopos.map(t => (
                                <div key={t.id} className="flex items-center space-x-1.5 bg-blue-50/70 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-lg text-xs font-medium">
                                  <Network size={12} className="text-blue-600" />
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
                  <span>拓扑进线绑定图谱</span>
                  <span className="text-[10px] text-gray-400">（1个拓扑只能被1条进线绑定）</span>
                </h4>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  {stationTopologies.map(topo => {
                    const bindingIncomer = incomerLines.find(l => l.boundTopoIds.includes(topo.id));
                    return (
                      <div key={topo.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50/40 hover:bg-gray-50 transition space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-xs flex items-center space-x-1">
                            <Network size={13} className="text-blue-600" />
                            <span>{topo.name}</span>
                          </span>
                          <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.2 rounded font-mono">{topo.type}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                          <span className="text-gray-400 text-[10px]">关联进线状态:</span>
                          {bindingIncomer ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 border ${
                              bindingIncomer.isInUse 
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                                : 'text-gray-600 bg-gray-100 border-gray-200'
                            }`}>
                              <Zap size={10} className={bindingIncomer.isInUse ? 'text-emerald-600' : 'text-gray-400'} />
                              <span>{bindingIncomer.name}</span>
                              <span className="text-[9px] opacity-80">({bindingIncomer.isInUse ? '使用中' : '备用'})</span>
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
                        <label className="block text-xs font-bold text-gray-800">选择要绑定的拓扑图 <span className="text-[10px] text-gray-400 font-normal">（可勾选多个；1个拓扑独占绑定1条进线）</span></label>
                        <button
                          type="button"
                          onClick={() => {
                            setIncomerForm(prev => ({ ...prev, selectedTopoIds: stationTopologies.map(t => t.id) }));
                          }}
                          className="text-[10px] text-blue-600 font-bold hover:underline"
                        >
                          全选全部拓扑
                        </button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-auto border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                        {stationTopologies.map(topo => {
                          const isChecked = incomerForm.selectedTopoIds.includes(topo.id);
                          const otherBoundLine = incomerLines.find(l => l.id !== editingIncomer?.id && l.boundTopoIds.includes(topo.id));

                          return (
                            <div
                              key={topo.id}
                              onClick={() => {
                                setIncomerForm(prev => {
                                  const exists = prev.selectedTopoIds.includes(topo.id);
                                  if (exists) {
                                    return { ...prev, selectedTopoIds: prev.selectedTopoIds.filter(id => id !== topo.id) };
                                  } else {
                                    return { ...prev, selectedTopoIds: [...prev.selectedTopoIds, topo.id] };
                                  }
                                });
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold'
                                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded flex items-center justify-center border text-white ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                  {isChecked && <Check size={11} />}
                                </div>
                                <span className="text-xs font-medium">{topo.name}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                {otherBoundLine && !isChecked && (
                                  <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                    绑定在: {otherBoundLine.name}
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
          <div className="space-y-4">
            
            {/* Top Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                  <Network size={14} className="text-blue-600" />
                  <span>站点拓扑维护 ({stationTopologies.length} 套拓扑方案)</span>
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">支持横向/纵向树布局展示，可通过拖拽待编辑设备至画布节点实现自动吸附与连线</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleOpenAddTopo}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center space-x-1"
                >
                  <Plus size={13} />
                  <span>新增拓扑图</span>
                </button>
                {isTopologyEditMode ? (
                  <button 
                    onClick={() => {
                      setIsTopologyEditMode(false);
                      setDragOverNodeId(null);
                      showNotification('拓扑修改完成，连线关系已保存并发布！');
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center space-x-1.5"
                  >
                    <CheckCircle2 size={13} />
                    <span>完成并保存编辑</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setIsTopologyEditMode(true);
                      showNotification('已进入拓扑编辑模式：可拖拽待编辑设备到节点下，也可拖回待编辑区或点击删除');
                    }}
                    className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center space-x-1.5"
                  >
                    <Edit2 size={13} />
                    <span>编辑拓扑图</span>
                  </button>
                )}
              </div>
            </div>

            {/* Multi-topology Tab Selector */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2 overflow-x-auto py-0.5 custom-scrollbar">
                <span className="text-xs font-bold text-gray-500 shrink-0 mr-1 flex items-center space-x-1">
                  <Layers size={13} className="text-blue-600" />
                  <span>拓扑方案列表:</span>
                </span>
                {stationTopologies.map((topo) => {
                  const isActive = (activeTopoId || stationTopologies[0]?.id) === topo.id;
                  const boundIncomer = incomerLines.find(l => l.boundTopoIds.includes(topo.id));
                  return (
                    <button
                      key={topo.id}
                      onClick={() => {
                        setActiveTopoId(topo.id);
                        setSelectedNodeId(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center space-x-2 shrink-0 select-none ${
                        isActive 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{topo.name}</span>
                      {boundIncomer && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                          绑定: {boundIncomer.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Topology Details & Actions */}
              {(() => {
                const currentActiveTopo = stationTopologies.find(t => t.id === (activeTopoId || stationTopologies[0]?.id)) || stationTopologies[0];
                if (!currentActiveTopo) return null;
                return (
                  <div className="flex items-center space-x-2 shrink-0 pl-3 border-l border-gray-200">
                    <button
                      onClick={() => handleOpenEditTopo(currentActiveTopo)}
                      className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded text-xs font-bold transition flex items-center space-x-1"
                      title="修改拓扑名称与备注说明"
                    >
                      <Edit2 size={12} />
                      <span>修改拓扑属性</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTopo(currentActiveTopo.id, currentActiveTopo.name)}
                      className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded text-xs font-medium transition flex items-center space-x-1"
                      title="删除此套拓扑图配置"
                    >
                      <Trash2 size={12} />
                      <span>删除拓扑</span>
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Main Topology Editor Workspace Container */}
            <div className="flex flex-col xl:flex-row gap-4 items-start">
              
              {/* Left Side: Pending Device Area (待编辑设备区域) */}
              {(isPendingCollapsed || pendingDevices.length === 0) ? (
                /* Collapsed / Empty Sidebar state - retracts to the left */
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (isTopologyEditMode && !isDragOverPendingArea) setIsDragOverPendingArea(true);
                  }}
                  onDragLeave={() => isDragOverPendingArea && setIsDragOverPendingArea(false)}
                  onDrop={handleDropOnPendingArea}
                  onClick={() => setIsPendingCollapsed(false)}
                  className={`w-12 shrink-0 bg-white rounded-xl border-2 transition-all p-2 flex flex-col items-center justify-between cursor-pointer hover:bg-gray-50 shadow-xs min-h-[500px] ${
                    isDragOverPendingArea ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300' : 'border-gray-200'
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

                  {isDragOverPendingArea && (
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
                /* Expanded Pending Device Sidebar */
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (isTopologyEditMode && !isDragOverPendingArea) setIsDragOverPendingArea(true);
                  }}
                  onDragLeave={() => isDragOverPendingArea && setIsDragOverPendingArea(false)}
                  onDrop={handleDropOnPendingArea}
                  className={`w-full xl:w-72 shrink-0 bg-white rounded-xl border-2 transition-all p-4 space-y-3.5 flex flex-col justify-between ${
                    isDragOverPendingArea ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300' : 'border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-2.5">
                      <div className="flex items-center space-x-1.5">
                        <Box size={15} className="text-amber-600" />
                        <h4 className="font-bold text-xs text-gray-900">待编辑设备区域</h4>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full font-mono">
                          {pendingDevices.length} 台
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsPendingCollapsed(true)}
                          className="p-1 hover:bg-gray-100 text-gray-500 rounded transition"
                          title="向左缩进隐藏"
                        >
                          <ChevronLeft size={15} />
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
                      在编辑模式下，可将本区域待分配设备按住拖拽至右侧画布的目标节点下方吸附组网；也可将画布中的逻辑节点拖回此处复原。
                    </p>

                    {/* Devices List */}
                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                      {pendingDevices.map(device => {
                        const cfg = DEVICE_TYPE_CONFIG[device.type] || DEVICE_TYPE_CONFIG['变压器'];
                        const DevIcon = cfg.icon;
                        return (
                          <div
                            key={device.id}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, { id: device.id, name: device.name, type: device.type }, 'pending')}
                            className={`p-2.5 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${cfg.bg} ${cfg.border} select-none group`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-1.5">
                                <div className={`p-1 rounded bg-white/80 ${cfg.color}`}>
                                  <DevIcon size={12} />
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${cfg.badge}`}>
                                  {device.type}
                                </span>
                              </div>
                              <span className="text-[9px] text-gray-400 font-mono flex items-center space-x-1 opacity-60 group-hover:opacity-100">
                                <Move size={10} />
                                <span>按住可拖拽</span>
                              </span>
                            </div>

                            <div className="font-bold text-xs text-gray-800 truncate" title={device.name}>
                              {device.name}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex justify-between">
                              <span>{device.sn}</span>
                              <span className="opacity-75">{device.model}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {isDragOverPendingArea && (
                    <div className="p-2 bg-amber-100 border border-amber-300 rounded text-center text-amber-900 font-bold text-xs animate-bounce mt-2">
                      ⬇ 松开鼠标，将节点退回至待编辑区
                    </div>
                  )}
                </div>
              )}

              {/* Main Center Canvas Area (拓扑图形画布) */}
              <div className="flex-1 min-w-0 w-full bg-white rounded-xl border border-gray-200 shadow-sm p-5 min-h-[600px] flex flex-col relative overflow-hidden">
                
                {/* Canvas Toolbar Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 shrink-0 flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-700">拓扑渲染画布</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono border border-blue-200">
                      {(topoTrees[activeTopoId || 'T01'] || []).length} 个逻辑节点
                    </span>
                    {(isPendingCollapsed || pendingDevices.length === 0) && (
                      <button
                        type="button"
                        onClick={() => setIsPendingCollapsed(false)}
                        className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold transition flex items-center space-x-1 ml-2"
                        title="展开待编辑设备区"
                      >
                        <Box size={11} />
                        <span>待编辑设备 ({pendingDevices.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Canvas Zoom Controls */}
                    <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg border border-gray-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setCanvasScale(s => Math.max(0.4, Number((s - 0.1).toFixed(1))))}
                        disabled={canvasScale <= 0.4}
                        className="p-1 hover:bg-white hover:text-blue-600 rounded text-gray-600 disabled:opacity-40 transition"
                        title="缩小画布 (-10%)"
                      >
                        <ZoomOut size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCanvasScale(1)}
                        className="px-2 py-0.5 hover:bg-white text-gray-700 font-mono font-bold text-[11px] rounded transition"
                        title="点击重置为 100% 缩放"
                      >
                        {Math.round(canvasScale * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={() => setCanvasScale(s => Math.min(2.0, Number((s + 0.1).toFixed(1))))}
                        disabled={canvasScale >= 2.0}
                        className="p-1 hover:bg-white hover:text-blue-600 rounded text-gray-600 disabled:opacity-40 transition"
                        title="放大画布 (+10%)"
                      >
                        <ZoomIn size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCanvasScale(1)}
                        className="p-1 hover:bg-white text-gray-500 hover:text-gray-800 rounded transition border-l border-gray-200 pl-1.5"
                        title="重置缩放"
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>

                    {/* Layout Mode Switcher */}
                    <div className="flex items-center space-x-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setTreeLayoutMode('vertical')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center space-x-1 ${
                          treeLayoutMode === 'vertical' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <span>纵向树 ↕</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTreeLayoutMode('horizontal')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center space-x-1 ${
                          treeLayoutMode === 'horizontal' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <span>横向树 ↔</span>
                      </button>
                    </div>
                  </div>
                </div>

                {isTopologyEditMode && (
                  <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                      <span><strong>拓扑编辑模式进行中：</strong> 从左侧待编辑区拖拽设备放置到目标节点上吸附组网；支持<strong>鼠标滚轮在画布上直接放大/缩小</strong>（40%~200%）。</span>
                    </span>
                  </div>
                )}

                {/* Tree Canvas Render Area */}
                <div ref={canvasContainerRef} className="flex-1 overflow-auto p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/40 custom-scrollbar flex items-center justify-center min-h-[460px] relative">
                  <div 
                    className="transition-transform duration-150 origin-top flex items-center justify-center p-4 min-w-full"
                    style={{ transform: `scale(${canvasScale})`, transformOrigin: 'top center' }}
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
                        const IconComp = cfg.icon;
                        const isSelected = selectedNodeId === node.id;
                        const isDragOver = dragOverNodeId === node.id;
                        const isRoot = node.type === '总进线' || node.parentId === null;

                        return (
                          <div key={node.id} className={`flex ${treeLayoutMode === 'vertical' ? 'flex-col items-center' : 'flex-row items-center'} relative shrink-0`}>
                            {/* Node Card Container with Hover Popover */}
                            <div className="relative group/node">
                              <div
                                draggable={!isRoot && isTopologyEditMode}
                                onDragStart={(e) => isTopologyEditMode && handleDragStart(e, { id: node.id, name: node.name, type: node.type }, 'canvas')}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (isTopologyEditMode && dragOverNodeId !== node.id) setDragOverNodeId(node.id);
                                }}
                                onDragLeave={() => isTopologyEditMode && setDragOverNodeId(null)}
                                onDrop={(e) => isTopologyEditMode && handleDropOnNode(e, node.id)}
                                onClick={() => setSelectedNodeId(node.id)}
                                className={`relative p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none shadow-xs w-44 ${
                                  cfg.bg
                                } ${cfg.border} ${
                                  isSelected ? 'ring-2 ring-offset-2 ring-blue-500 scale-105 z-10 shadow-md' : 'hover:scale-102 hover:shadow-md'
                                } ${
                                  isDragOver ? 'ring-4 ring-emerald-500 bg-emerald-100 scale-105 shadow-xl border-emerald-400 animate-pulse' : ''
                                }`}
                              >
                                {isDragOver && (
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md z-20 whitespace-nowrap">
                                    {draggedItem?.type === '电表' ? '🎯 松开建立【测量关系】关联电表' : '🎯 松开自动吸附挂载至此节点'}
                                  </div>
                                )}

                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-1">
                                    <div className={`p-1 rounded bg-white/90 shadow-2xs ${cfg.color}`}>
                                      <IconComp size={13} />
                                    </div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${cfg.badge}`}>
                                      {node.type}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="正常上报" />
                                    {isTopologyEditMode && !isRoot && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveNodeToPending(node.id);
                                        }}
                                        className="p-1 hover:bg-red-100 text-red-600 rounded transition"
                                        title="退回待编辑设备区"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="font-bold text-xs text-gray-900 truncate" title={node.name}>
                                  {node.name}
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate flex justify-between">
                                  <span>{node.sn || `SN-${node.id}`}</span>
                                  {children.length > 0 && (
                                    <span className="text-blue-600 font-bold bg-blue-50 px-1 rounded text-[9px]">
                                      {children.length}下级
                                    </span>
                                  )}
                                </div>

                                {/* Bound Measurement Relation (Meter) badge */}
                                {node.meterBinding && (
                                  <div className="mt-2 pt-1 border-t border-dashed border-orange-200 flex flex-col space-y-0.5 bg-orange-50/90 p-1.5 rounded-lg border border-orange-200 text-[10px] text-orange-900 shadow-2xs">
                                    <div className="flex items-center justify-between font-bold">
                                      <span className="flex items-center space-x-1 text-orange-700 truncate max-w-[105px]" title={node.meterBinding.name}>
                                        <Gauge size={11} className="shrink-0 text-orange-600" />
                                        <span className="truncate">{node.meterBinding.name}</span>
                                      </span>
                                      {isTopologyEditMode && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnbindMeter(node.id);
                                          }}
                                          className="text-[9px] text-red-600 hover:bg-red-100 px-1 py-0.2 rounded font-medium ml-1 transition"
                                          title="解绑测量电表"
                                        >
                                          解绑
                                        </button>
                                      )}
                                    </div>
                                    <div className="text-[9px] text-orange-600 font-mono flex justify-between items-center">
                                      <span className="truncate">{node.meterBinding.sn}</span>
                                      <span className="text-[8px] bg-orange-100 text-orange-800 px-1 rounded shrink-0 font-sans">测量节点</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Hover Floating Details Popover Tooltip */}
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 hidden group-hover/node:block w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-3.5 text-xs text-gray-700 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                                  <div className="flex items-center space-x-1.5">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${cfg.badge}`}>
                                      {node.type}
                                    </span>
                                    <span className="font-bold text-gray-900 text-xs truncate max-w-[120px]">{node.name}</span>
                                  </div>
                                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                                    通讯正常
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-[11px]">
                                  <div className="flex justify-between py-0.5 border-b border-gray-50">
                                    <span className="text-gray-400">设备序列号:</span>
                                    <span className="font-mono text-gray-800">{node.sn || `SN-${node.id}`}</span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-gray-50">
                                    <span className="text-gray-400">设备规格型号:</span>
                                    <span className="font-mono text-gray-800">{node.model || '通用标准款'}</span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-gray-50">
                                    <span className="text-gray-400">上级挂载节点:</span>
                                    <span className="font-medium text-gray-800 truncate max-w-[120px]">
                                      {parentNode ? parentNode.name : '无 (根进线节点)'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-gray-50">
                                    <span className="text-gray-400">测量关联电表:</span>
                                    <span className={`font-medium truncate max-w-[120px] ${node.meterBinding ? 'text-orange-600 font-bold' : 'text-gray-400'}`}>
                                      {node.meterBinding ? `${node.meterBinding.name}` : '未绑定测量关系'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between py-0.5">
                                    <span className="text-gray-400">直接下级设备:</span>
                                    <span className="font-bold text-blue-600">{children.length} 台</span>
                                  </div>
                                </div>

                                {isTopologyEditMode && !isRoot && (
                                  <div className="mt-2 pt-1.5 border-t border-gray-100 text-[10px] text-amber-600 flex items-center justify-between">
                                    <span>💡 拖拽或右上角按键退回待编辑区</span>
                                  </div>
                                )}

                                {/* Arrow down */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-white drop-shadow-xs" />
                              </div>
                            </div>

                            {/* Children branch connector */}
                            {children.length > 0 && (
                              <div className={`flex ${treeLayoutMode === 'vertical' ? 'flex-col items-center' : 'flex-row items-center'}`}>
                                {/* Connector segment from parent */}
                                <div className={`bg-gray-300 ${treeLayoutMode === 'vertical' ? 'w-0.5 h-6' : 'h-0.5 w-6'}`} />

                                {/* Children container with connecting line */}
                                <div className={`flex ${
                                  treeLayoutMode === 'vertical'
                                    ? 'flex-row items-start space-x-6 pt-2 border-t-2 border-gray-300'
                                    : 'flex-col items-start space-y-6 pl-2 border-l-2 border-gray-300'
                                }`}>
                                  {children.map(child => renderNodeTree(child.id))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      };

                      return renderNodeTree(rootNode.id);
                    })()}
                  </div>
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
                      <p className="text-[10px] text-gray-400 mt-0.5">仅配置拓扑图名称与备注说明，逻辑连线在画布编辑中维护</p>
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
            onSubmit={handleCreateDevice}
            className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                <Server size={14} className="text-gray-500" />
                <span>{editingDevice ? '编辑设备明细' : '分配并创建新物理设备'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsCreateDeviceOpen(false);
                  setEditingDevice(null);
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-400"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">设备类型</label>
                <select 
                  value={deviceForm.type}
                  onChange={e => setDeviceForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="变压器">变压器</option>
                  <option value="储能柜">储能柜</option>
                  <option value="PCS">PCS</option>
                  <option value="电池簇">电池簇</option>
                  <option value="并网柜">并网柜</option>
                  <option value="光伏逆变器">光伏逆变器</option>
                  <option value="电表">电表</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">设备名称 (不填则自动根据类型生成)</label>
                <input 
                  type="text" 
                  placeholder={`例如: 1#${deviceForm.type}`}
                  value={deviceForm.name}
                  onChange={e => setDeviceForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">物理通信SN (或物联串码)</label>
                <input 
                  type="text" 
                  placeholder="请输入SN"
                  value={deviceForm.sn}
                  onChange={e => setDeviceForm(prev => ({ ...prev, sn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500 font-mono font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">适配绑定物模型</label>
                <select 
                  value={deviceForm.thingModelId}
                  onChange={e => setDeviceForm(prev => ({ ...prev, thingModelId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:border-blue-500 font-medium"
                >
                  {MOCK_THING_MODELS.filter(m => m.deviceType === deviceForm.type).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-gray-50 text-gray-400 rounded-lg text-[10px] leading-relaxed">
                提示: 直接创建设备将被自动标记分配到当前工作的站点：<b>【{station.name}】</b>，处于在线就绪状态。
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => {
                  setIsCreateDeviceOpen(false);
                  setEditingDevice(null);
                }}
                className="px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition"
              >
                取消
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                {editingDevice ? '保存修改' : '确认分配创建'}
              </button>
            </div>
          </form>
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

    </div>
  );
}
