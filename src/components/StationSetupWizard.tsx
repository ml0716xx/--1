import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, MapPin, Server, ChevronRight, Check, AlertTriangle, Info, Trash2, 
  Sparkles, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, Layers, Cpu, Link2, Plus, 
  HelpCircle, Settings, X, Network, FileText, CheckCircle
} from 'lucide-react';

// ===== Types =====
interface Enterprise {
  id: string;
  name: string;
  code: string;
  contact: string;
  phone: string;
  stationCount: number;
}

interface StationForm {
  name: string;
  category: string;
  code: string;
  address: string;
  manager: string;
  phone: string;
  purchasePriceType: string;
  feedInPriceType: string;
  
  // Dynamic Pricing fields (Requirement 5)
  purchaseDynamicPricePlan?: string;
  powerConsumptionType?: string;
  feedInDynamicPricePlan?: string;
  
  // PV Info
  pvCapacity: string;
  pvInverterCount: string;
  pvHasRadiometer: string;
  pvAllowGrid: string;
  pvTiltAngle: string;
  pvAzimuthAngle: string;

  // ESS Info
  essCapacity: string;
  essCount: string;
  essCycles: string;
  essDod: string;

  // Charging pile Info
  chargingPileCount: string;
  stationImage: string;

  // Other Info
  insuranceRemark: string;

  // Legacy compatibility
  emsSn: string;
}

interface VersionPackage {
  id: string;
  name: string;
  description: string;
  isRecommended: boolean;
}

interface FeatureItem {
  id: string;
  name: string;
  defaultEnabled: boolean;
}

interface ThingModel {
  id: string;
  name: string;
  deviceType: string;
  version: string;
  product: string;
}

interface ApplyDevice {
  type: string;
  name: string;
  count: number;
}

interface StationApplication {
  id: string;
  gatewaySn: string;
  station: string;
  deviceCount: number;
  applyTime: string;
  status: 'pending' | 'approved';
  devices: ApplyDevice[];
  topologyRelation: any;
}

interface ListDeviceItem {
  id: string;
  type: string;
  name: string;
  thingModel: ThingModel;
  count: number;
  
  // High-fidelity detail fields (Requirement 3)
  sn?: string;
  productName?: string;
  modelCode?: string;
  capacity?: string;
  power?: string;
  reactivePower?: string;
  gridType?: string;
  cycles?: string;
  backflow?: string;
  ipAddress?: string;
  port?: string;
  baudRate?: string;
  parity?: string;
  commType?: string;
  pvModulePower?: string;
  stringCount?: string;
  remark?: string;
  errors?: Record<string, boolean>;
}

interface TopologyTemplate {
  id: string;
  name: string;
  layers: number;
  description: string;
  structure: any;
}

// ===== Initial Mock Data =====
const MOCK_ENTERPRISES: Enterprise[] = [
  { id: 'E3', name: '深圳光明储能示范项目有限公司', code: 'CO00048039', contact: '李四', phone: '13900139000', stationCount: 0 },
  { id: 'E4', name: '北京大兴智慧能源示范项目部', code: 'CO00048040', contact: '王五', phone: '13700137000', stationCount: 0 },
  { id: 'E1', name: '山东威海荣成中医院', code: 'CO00048037', contact: '荆汉进', phone: '18661675886', stationCount: 1 },
  { id: 'E2', name: '上海国际汽车城核心项目', code: 'CO00048038', contact: '张三', phone: '13800138000', stationCount: 2 },
];

const MOCK_VERSION_PACKAGES: VersionPackage[] = [
  { id: 'V1', name: 'v2.1 标准版', description: '包含基础调度、远程监控、实时报警以及核心数据分析报表，适合日常常规运营需求。', isRecommended: false },
  { id: 'V2', name: 'v2.1 高级版', description: '标准版全部特性 + 多能互补联调、高精度功率预测及AI优化排程，适合综合多能微网。', isRecommended: true },
  { id: 'V3', name: 'v1.8 稳定版', description: '聚焦核心基础采集和简单遥调，排除一切复杂算法，极低配置开销，适合单点简单设备。', isRecommended: false },
];

const MOCK_FEATURES: FeatureItem[] = [
  { id: 'F1', name: '远程监控', defaultEnabled: true },
  { id: 'F2', name: '基础调度', defaultEnabled: true },
  { id: 'F3', name: '高级调度', defaultEnabled: false },
  { id: 'F4', name: '多能互补优化', defaultEnabled: false },
  { id: 'F5', name: '需量管理', defaultEnabled: false },
];

const MOCK_THING_MODELS: ThingModel[] = [
  { id: 'TM01', name: '变压器物模型 v2.0', deviceType: '变压器', version: 'v2.0', product: '变压器通用产品线' },
  { id: 'TM02', name: '变压器物模型 v1.0', deviceType: '变压器', version: 'v1.0', product: '变压器通用产品线' },
  { id: 'TM03', name: '并网柜物模型 v1.2', deviceType: '并网柜', version: 'v1.2', product: '高低压并网柜系列' },
  { id: 'TM04', name: '储能柜物模型 v1.5', deviceType: '储能柜', version: 'v1.5', product: '天合液冷储能一体柜' },
  { id: 'TM05', name: 'PCS物模型 v2.1', deviceType: 'PCS', version: 'v2.1', product: '高频PCS变流器' },
  { id: 'TM06', name: '电池簇物模型 v1.0', deviceType: '电池簇', version: 'v1.0', product: '磷酸铁锂高压电池簇' },
  { id: 'TM07', name: '光伏逆变器物模型 v1.3', deviceType: '光伏逆变器', version: 'v1.3', product: '组串式光伏逆变器' },
  { id: 'TM08', name: '电表物模型 v1.1', deviceType: '电表', version: 'v1.1', product: '多功能双向计量电能表' },
];

const MOCK_STATION_APPLICATIONS: StationApplication[] = [
  { 
    id: 'APP001', 
    gatewaySn: '8842b5aab845d7', 
    station: '核心贸易区步行街项目',
    deviceCount: 11, 
    applyTime: '2026-07-10 13:49:54', 
    status: 'pending',
    devices: [
      { type: '变压器', name: '主变压器', count: 1 },
      { type: '并网柜', name: '总并网柜', count: 1 },
      { type: '储能柜', name: '1#储能柜', count: 2 },
      { type: 'PCS', name: 'PCS变流柜', count: 4 },
      { type: '电池簇', name: '高压电池簇', count: 3 },
    ],
    topologyRelation: null
  },
  { 
    id: 'APP002', 
    gatewaySn: 'AB12cdef3456gh', 
    station: '光明储能项目',
    deviceCount: 8, 
    applyTime: '2026-07-12 09:20:00', 
    status: 'pending',
    devices: [
      { type: '变压器', name: '1#隔离变压器', count: 1 },
      { type: '并网柜', name: '防逆流并网柜', count: 1 },
      { type: '储能柜', name: '一体储能柜', count: 1 },
      { type: 'PCS', name: '双向储能PCS', count: 2 },
      { type: '电池簇', name: '能量型电池簇', count: 2 },
      { type: '光伏逆变器', name: '组串光伏逆变器', count: 1 },
    ],
    topologyRelation: {
      nodes: [
        { id: 'n-grid', type: 'root', label: '大电网', color: 'gray' },
        { id: 'n-grid-cabinet', type: 'node', label: '并网柜', deviceType: '并网柜', color: 'green' },
        { id: 'n-transformer', type: 'node', label: '主变压器', deviceType: '变压器', color: 'blue' },
        { id: 'n-busbar', type: 'bus', label: '低压交流母线', color: 'gray' },
        { id: 'n-ess-area', type: 'area', label: '储能柜区域', deviceType: '储能柜', color: 'purple' },
        { id: 'n-pv-area', type: 'area', label: '光伏并网点', deviceType: '光伏逆变器', color: 'yellow' },
      ],
      edges: [
        { from: 'n-grid', to: 'n-grid-cabinet' },
        { from: 'n-grid-cabinet', to: 'n-transformer' },
        { from: 'n-transformer', to: 'n-busbar' },
        { from: 'n-busbar', to: 'n-ess-area' },
        { from: 'n-busbar', to: 'n-pv-area' },
      ]
    }
  },
  { 
    id: 'APP003', 
    gatewaySn: 'EF56ghij7890kl', 
    station: '大兴智慧能源',
    deviceCount: 5, 
    applyTime: '2026-07-11 15:30:00', 
    status: 'pending',
    devices: [
      { type: '变压器', name: '厂区主变', count: 1 },
      { type: '储能柜', name: '核心储能集装箱', count: 1 },
      { type: 'PCS', name: '高压PCS柜', count: 2 },
      { type: '电池簇', name: '动力电池包', count: 1 },
    ],
    topologyRelation: null
  },
];

const MOCK_TOPOLOGY_TEMPLATES: TopologyTemplate[] = [
  {
    id: 'T1', 
    name: '标准储能拓扑', 
    layers: 4, 
    description: '适用于标准工商业储能电站：电网 → 并网柜 → 变压器 → 交流母线 → 储能区域。',
    structure: {
      nodes: [
        { id: 't1-grid', type: 'root', label: '公共电网' },
        { id: 't1-grid-cabinet', type: 'node', label: '并网柜', deviceType: '并网柜' },
        { id: 't1-transformer', type: 'node', label: '隔离变压器', deviceType: '变压器' },
        { id: 't1-busbar', type: 'bus', label: '低压交流母线' },
        { id: 't1-ess-container', type: 'area', label: '储能仓/储能柜', deviceType: '储能柜' },
      ],
      edges: [
        { from: 't1-grid', to: 't1-grid-cabinet' },
        { from: 't1-grid-cabinet', to: 't1-transformer' },
        { from: 't1-transformer', to: 't1-busbar' },
        { from: 't1-busbar', to: 't1-ess-container' },
      ]
    }
  },
  {
    id: 'T2', 
    name: '光伏并网拓扑', 
    layers: 3,
    description: '适用于常规光伏发电项目：电网 → 并网柜 → 变压器 → 交流母线 → 光伏逆变。',
    structure: {
      nodes: [
        { id: 't2-grid', type: 'root', label: '高压电网' },
        { id: 't2-grid-cabinet', type: 'node', label: '并网高压柜', deviceType: '并网柜' },
        { id: 't2-transformer', type: 'node', label: '升压变压器', deviceType: '变压器' },
        { id: 't2-busbar', type: 'bus', label: '汇流母线' },
        { id: 't2-pv', type: 'node', label: '并网光伏逆变器', deviceType: '光伏逆变器' },
      ],
      edges: [
        { from: 't2-grid', to: 't2-grid-cabinet' },
        { from: 't2-grid-cabinet', to: 't2-transformer' },
        { from: 't2-transformer', to: 't2-busbar' },
        { from: 't2-busbar', to: 't2-pv' },
      ]
    }
  },
  {
    id: 'T3', 
    name: '光储混合拓扑', 
    layers: 4,
    description: '适用于光储一体化项目：电网 → 并网柜 → 变压器 → 交流母线 → 分流储能区域与光伏区。',
    structure: {
      nodes: [
        { id: 't3-grid', type: 'root', label: '公共大电网' },
        { id: 't3-grid-cabinet', type: 'node', label: '总并网柜', deviceType: '并网柜' },
        { id: 't3-transformer', type: 'node', label: '联络变压器', deviceType: '变压器' },
        { id: 't3-busbar', type: 'bus', label: '中枢母线' },
        { id: 't3-ess', type: 'area', label: '微网储能区', deviceType: '储能柜' },
        { id: 't3-pv', type: 'node', label: '分布式光伏区', deviceType: '光伏逆变器' },
      ],
      edges: [
        { from: 't3-grid', to: 't3-grid-cabinet' },
        { from: 't3-grid-cabinet', to: 't3-transformer' },
        { from: 't3-transformer', to: 't3-busbar' },
        { from: 't3-busbar', to: 't3-ess' },
        { from: 't3-busbar', to: 't3-pv' },
      ]
    }
  },
];

interface StationSetupWizardProps {
  onComplete: (newStation?: any) => void;
  versions?: any[];
  featurePacks?: any[];
  enterprises?: any[];
}

export function StationSetupWizard({ onComplete, versions, featurePacks, enterprises }: StationSetupWizardProps) {
  // Wizard Core Steps
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Validation states
  const [step1Errors, setStep1Errors] = useState<Record<string, boolean>>({});

  // Step 1: Enterprise & Station States
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);
  const [isEnterpriseConfirmed, setIsEnterpriseConfirmed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [stationForm, setStationForm] = useState<StationForm>({
    name: '',
    category: '光储充站点',
    code: '',
    address: '江苏省常州市新北区天合路2号',
    manager: '',
    phone: '',
    purchasePriceType: '固定分时电价',
    feedInPriceType: '固定价格',
    purchaseDynamicPricePlan: '',
    powerConsumptionType: '',
    feedInDynamicPricePlan: '',
    pvCapacity: '150000',
    pvInverterCount: '8',
    pvHasRadiometer: '否',
    pvAllowGrid: '否',
    pvTiltAngle: '15',
    pvAzimuthAngle: '0',
    essCapacity: '3000',
    essCount: '3',
    essCycles: '6000',
    essDod: '90',
    chargingPileCount: '12',
    stationImage: '',
    insuranceRemark: '电站设备承保，维保期限至2029年',
    emsSn: ''
  });

  // Step 2: Version & Features mapped from parent panel (Requirement 2)
  const displayVersions = useMemo(() => {
    if (versions && versions.length > 0) {
      return versions.map(v => ({
        id: v.id,
        name: v.name,
        code: v.code,
        description: v.description,
        isRecommended: v.id === 'V2' // Mark standard version as recommended by default
      }));
    }
    return MOCK_VERSION_PACKAGES;
  }, [versions]);

  const displayFeatures = useMemo(() => {
    if (featurePacks && featurePacks.length > 0) {
      return featurePacks.map(fp => ({
        id: fp.id,
        name: fp.name,
        code: fp.code,
        description: fp.description,
        isBase: fp.id === 'FP1' || fp.id === 'FP2' // base required feature packs
      }));
    }
    return MOCK_FEATURES.map(f => ({
      id: f.id,
      name: f.name,
      code: f.id,
      description: f.name,
      isBase: f.id === 'F1' || f.id === 'F2'
    }));
  }, [featurePacks]);

  const [selectedVersion, setSelectedVersion] = useState<string>('V2'); // Default recommended v2.1 高级版
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['F1', 'F2']); // Default enabled F1, F2

  // Determine if the selected enterprise already has a station or has an assigned version
  const hasAssignedVersion = useMemo(() => {
    if (!selectedEnterprise) return false;
    return selectedEnterprise.stationCount > 0 || !!selectedEnterprise.baseVersionId;
  }, [selectedEnterprise]);

  // Find all feature codes that are already configured for the selected enterprise
  const alreadyConfiguredFeatureCodes = useMemo(() => {
    if (!selectedEnterprise) return [];
    const entFeatures = selectedEnterprise.features || [];
    return entFeatures.map((f: any) => f.featureId);
  }, [selectedEnterprise]);

  // Sync selected features with displayFeatures and enterprise's existing features
  useEffect(() => {
    const baseIds = displayFeatures.filter(f => f.isBase).map(f => f.id);
    
    // Include any features that are already configured for the selected enterprise
    const alreadyConfiguredIds = displayFeatures.filter(f => {
      const isConfigured = alreadyConfiguredFeatureCodes.includes(f.id) || alreadyConfiguredFeatureCodes.includes(f.code);
      return isConfigured;
    }).map(f => f.id);

    // Merge them and remove duplicates
    const uniqueIds = Array.from(new Set([...baseIds, ...alreadyConfiguredIds]));
    setSelectedFeatures(uniqueIds);
  }, [displayFeatures, alreadyConfiguredFeatureCodes]);

  // Auto-set selectedVersion when the selected enterprise changes and has an assigned version
  useEffect(() => {
    if (selectedEnterprise && hasAssignedVersion) {
      // Find version pkg where pkg.code === selectedEnterprise.baseVersionId OR maps appropriately
      const mappedVersion = displayVersions.find(v => v.code === selectedEnterprise.baseVersionId || v.id === selectedEnterprise.baseVersionId);
      if (mappedVersion) {
        setSelectedVersion(mappedVersion.id);
      } else if (selectedEnterprise.id === 'E1' || selectedEnterprise.baseVersionId === 'standard') {
        const vStandard = displayVersions.find(v => v.code === 'standard' || v.id === 'V2');
        if (vStandard) setSelectedVersion(vStandard.id);
      } else if (selectedEnterprise.id === 'E2' || selectedEnterprise.id === 'E3' || selectedEnterprise.baseVersionId === 'test-version') {
        const vTest = displayVersions.find(v => v.code === 'test-version' || v.id === 'V8' || v.id === 'V3');
        if (vTest) setSelectedVersion(vTest.id);
      }
    }
  }, [selectedEnterprise, hasAssignedVersion, displayVersions]);

  // Step 3: Devices
  const [deviceTab, setDeviceTab] = useState<'sync' | 'manual'>('sync');
  const [rightDeviceTab, setRightDeviceTab] = useState<string>('全部'); // Right side categorized tabs (Requirement 3)
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [deviceList, setDeviceList] = useState<ListDeviceItem[]>([]);
  
  // Manual Device Inputs
  const [manualType, setManualType] = useState<string>('储能柜');
  const [manualName, setManualName] = useState<string>('');
  const [manualCount, setManualCount] = useState<number>(1);

  // Model selection modal
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);

  // Step 4: Topology
  const [topologySource, setTopologySource] = useState<'app' | 'template' | 'custom'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('T1');
  const [customNodes, setCustomNodes] = useState<any[]>([]);
  const [customEdges, setCustomEdges] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connStartNode, setConnStartNode] = useState<string | null>(null);

  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Generate EMS SN automatically when an enterprise is selected
  useEffect(() => {
    if (selectedEnterprise) {
      const randHex = Math.random().toString(16).substr(2, 12);
      const randomCode = `CS${Math.floor(1780000000 + Math.random() * 10000000)}`;
      setStationForm(prev => ({
        ...prev,
        emsSn: `ems-${randHex}`,
        code: randomCode,
        category: '光储充站点',
        manager: selectedEnterprise.contact,
        phone: selectedEnterprise.phone,
        name: `${selectedEnterprise.name.replace('有限公司', '').replace('示范项目', '')}一号站`,
        address: '江苏省常州市新北区天合路2号',
        purchasePriceType: '固定分时电价',
        feedInPriceType: '固定价格',
        pvCapacity: '150000',
        pvInverterCount: '8',
        pvHasRadiometer: '否',
        pvAllowGrid: '否',
        pvTiltAngle: '15',
        pvAzimuthAngle: '0',
        essCapacity: '3000',
        essCount: '3',
        essCycles: '6000',
        essDod: '90',
        chargingPileCount: '12',
        stationImage: '',
        insuranceRemark: '电站设备承保，维保期限至2029年'
      }));
    }
  }, [selectedEnterprise]);

  // Priority logic for Step 4 Topology source
  useEffect(() => {
    if (currentStep === 4) {
      // Check if any selected application from Step 3 has a topologyRelation
      const hasAppWithTopo = selectedApplications.some(appId => {
        const app = MOCK_STATION_APPLICATIONS.find(a => a.id === appId);
        return app && app.topologyRelation;
      });

      if (hasAppWithTopo) {
        setTopologySource('app');
      } else {
        setTopologySource('template');
        setSelectedTemplateId('T1');
      }
    }
  }, [currentStep, selectedApplications]);

  // Dynamically map enterprises, merging with the prop if provided
  const actualEnterprises = useMemo(() => {
    if (enterprises && enterprises.length > 0) {
      return enterprises.map(ent => {
        const mockEnt = MOCK_ENTERPRISES.find(me => me.id === ent.id);
        return {
          id: ent.id,
          name: ent.name,
          code: mockEnt?.code || `CO_ENT_${ent.id}`,
          contact: mockEnt?.contact || '联系人',
          phone: mockEnt?.phone || '13800000000',
          stationCount: mockEnt ? mockEnt.stationCount : (ent.id === 'E1' ? 1 : ent.id === 'E2' ? 2 : 0),
          baseVersionId: ent.baseVersionId,
          features: ent.features || []
        };
      });
    }
    return MOCK_ENTERPRISES.map(me => {
      let baseVersionId = undefined;
      if (me.id === 'E1' || me.id === 'E4') baseVersionId = 'standard';
      if (me.id === 'E2' || me.id === 'E3') baseVersionId = 'test-version';
      return {
        ...me,
        baseVersionId,
        features: me.id === 'E2' ? [
          { featureId: 'ai-scheduler' },
          { featureId: 'peak-valley' },
          { featureId: 'demand-control' },
          { featureId: 'monitoring-screen' }
        ] : me.id === 'E3' ? [
          { featureId: 'multi-transformer' }
        ] : []
      };
    });
  }, [enterprises]);

  // Sort enterprises so stationCount === 0 comes first
  const sortedEnterprises = useMemo(() => {
    return [...actualEnterprises].sort((a, b) => a.stationCount - b.stationCount);
  }, [actualEnterprises]);

  // Filtered enterprises for display list (only those with no stations)
  const zeroStationEnterprises = useMemo(() => {
    return actualEnterprises.filter(ent => ent.stationCount === 0);
  }, [actualEnterprises]);

  // Enterprises with existing stations for search selection
  const existingEnterprises = useMemo(() => {
    return actualEnterprises.filter(ent => ent.stationCount > 0);
  }, [actualEnterprises]);

  // Filtered existing enterprises based on search query
  const filteredExistingEnterprises = useMemo(() => {
    if (!searchQuery.trim()) return existingEnterprises;
    const lower = searchQuery.toLowerCase();
    return existingEnterprises.filter(
      ent => ent.name.toLowerCase().includes(lower) || 
             ent.contact.toLowerCase().includes(lower) || 
             ent.phone.includes(lower) || 
             ent.code.toLowerCase().includes(lower)
    );
  }, [searchQuery, existingEnterprises]);

  // Helper functions for matching thing models
  const getLatestThingModel = (deviceType: string): ThingModel => {
    const models = MOCK_THING_MODELS.filter(tm => tm.deviceType === deviceType);
    return models.length > 0 ? models[0] : MOCK_THING_MODELS[0];
  };

  const getThingModelsByType = (deviceType: string): ThingModel[] => {
    return MOCK_THING_MODELS.filter(tm => tm.deviceType === deviceType);
  };

  // Update a specific field for a list device item
  const updateDeviceField = (id: string, field: keyof ListDeviceItem, value: any) => {
    setDeviceList(prev => prev.map(d => {
      if (d.id === id) {
        const updated = { ...d, [field]: value };
        // Clear this field error on change
        if (updated.errors && updated.errors[field as string]) {
          updated.errors = { ...updated.errors, [field as string]: false };
        }
        return updated;
      }
      return d;
    }));
  };

  // Step 3 Device Validation (Requirement 3)
  const handleNextFromStep3 = () => {
    if (deviceList.length === 0) {
      alert('请导入或手动录入至少一台设备才可以继续下一步！');
      return;
    }

    let hasErrors = false;
    const updatedList = deviceList.map(dev => {
      const errors: Record<string, boolean> = {};
      if (!dev.name || !dev.name.trim()) errors.name = true;
      if (!dev.sn || !dev.sn.trim()) errors.sn = true;

      // Type specific checks
      if (dev.type === '储能柜') {
        if (!dev.capacity || !dev.capacity.trim()) errors.capacity = true;
        if (!dev.power || !dev.power.trim()) errors.power = true;
        if (!dev.cycles || !dev.cycles.trim()) errors.cycles = true;
      } else if (dev.type === '光伏逆变器') {
        if (!dev.power || !dev.power.trim()) errors.power = true;
        if (!dev.pvModulePower || !dev.pvModulePower.trim()) errors.pvModulePower = true;
        if (!dev.stringCount || !dev.stringCount.trim()) errors.stringCount = true;
      } else if (dev.type === 'PCS') {
        if (!dev.power || !dev.power.trim()) errors.power = true;
      } else if (dev.type === '电池簇') {
        if (!dev.capacity || !dev.capacity.trim()) errors.capacity = true;
      }

      if (Object.keys(errors).length > 0) {
        hasErrors = true;
      }

      return { ...dev, errors };
    });

    if (hasErrors) {
      setDeviceList(updatedList);
      alert('设备清单中存在未完善的必填字段，请在右侧清单中补充完整(缺失项已标红框)！');
      return;
    }

    setCurrentStep(4);
  };

  // Step 1: Form Validation (Requirement 1 & Requirement 5)
  const handleNextFromStep1 = () => {
    if (!selectedEnterprise) {
      alert('请先选择一家目标企业');
      return;
    }

    const errors: Record<string, boolean> = {};

    if (!stationForm.name.trim()) errors.name = true;
    if (!stationForm.address.trim()) errors.address = true;
    if (!stationForm.emsSn.trim()) errors.emsSn = true;
    if (!stationForm.manager.trim()) errors.manager = true;
    if (!stationForm.phone.trim()) errors.phone = true;
    if (!stationForm.purchasePriceType) errors.purchasePriceType = true;
    if (!stationForm.feedInPriceType) errors.feedInPriceType = true;
    
    // Dynamic Pricing validations (Requirement 5)
    if (
      (stationForm.purchasePriceType === '市场化价格' || stationForm.purchasePriceType === '动态电价') &&
      !stationForm.purchaseDynamicPricePlan
    ) {
      errors.purchaseDynamicPricePlan = true;
    }
    if (stationForm.purchasePriceType === '固定电价' && !stationForm.powerConsumptionType) {
      errors.powerConsumptionType = true;
    }
    if (
      (stationForm.feedInPriceType === '分时上网电价' || stationForm.feedInPriceType === '动态电价') &&
      !stationForm.feedInDynamicPricePlan
    ) {
      errors.feedInDynamicPricePlan = true;
    }

    // PV Info
    if (!stationForm.pvCapacity.trim()) errors.pvCapacity = true;
    if (!stationForm.pvInverterCount.trim()) errors.pvInverterCount = true;
    if (!stationForm.pvHasRadiometer) errors.pvHasRadiometer = true;

    // ESS Info
    if (!stationForm.essCapacity.trim()) errors.essCapacity = true;
    if (!stationForm.essCount.trim()) errors.essCount = true;
    if (!stationForm.essCycles.trim()) errors.essCycles = true;
    if (!stationForm.essDod.trim()) errors.essDod = true;

    // Charging Pile Info
    if (!stationForm.chargingPileCount.trim()) errors.chargingPileCount = true;

    setStep1Errors(errors);

    if (Object.keys(errors).length > 0) {
      alert('有必填站点信息未填写完整，已标红提示，请完善后继续！');
      return;
    }

    setCurrentStep(2);
  };

  // Step 2 Toggle Feature
  const toggleFeature = (featureId: string) => {
    const feat = displayFeatures.find(f => f.id === featureId);
    if (feat?.isBase) return; // Cannot toggle base required feature packs
    
    // Also cannot toggle already configured features
    const isConfigured = feat && (alreadyConfiguredFeatureCodes.includes(feat.id) || alreadyConfiguredFeatureCodes.includes(feat.code));
    if (isConfigured) return;

    setSelectedFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(id => id !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
  };

  // Step 3 Actions
  const handleToggleApplication = (appId: string) => {
    setSelectedApplications(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
  };

  const handleSyncApplications = () => {
    if (selectedApplications.length === 0) {
      alert('请至少勾选一个待同步的建站申请');
      return;
    }

    let importedDevices: ListDeviceItem[] = [];
    selectedApplications.forEach(appId => {
      const app = MOCK_STATION_APPLICATIONS.find(a => a.id === appId);
      if (app) {
        app.devices.forEach((dev, idx) => {
          for (let i = 0; i < dev.count; i++) {
            const suffix = dev.count > 1 ? `_#${i + 1}` : '';
            const tModel = getLatestThingModel(dev.type);
            importedDevices.push({
              id: `sync-${appId}-${idx}-${i}-${Date.now()}`,
              type: dev.type,
              name: `${dev.name}${suffix}`,
              thingModel: tModel,
              count: 1, // Treat each physical device as count 1
              sn: `SN-${dev.type === '储能柜' ? 'ESS' : dev.type === '光伏逆变器' ? 'INV' : 'DEV'}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
              productName: tModel.name,
              modelCode: tModel.version,
              capacity: dev.type === '储能柜' ? '200' : '',
              power: ['储能柜', 'PCS', '光伏逆变器'].includes(dev.type) ? '100' : '',
              reactivePower: dev.type === '储能柜' ? '50' : '',
              gridType: '三相无中性线三线制',
              cycles: dev.type === '储能柜' ? '6000' : '',
              backflow: '否',
              commType: 'Modbus TCP',
              ipAddress: '192.168.1.10',
              port: '502',
              baudRate: '9600',
              parity: '无校验',
              pvModulePower: dev.type === '光伏逆变器' ? '120' : '',
              stringCount: dev.type === '光伏逆变器' ? '12' : '',
              remark: '',
              errors: {}
            });
          }
        });
      }
    });

    setDeviceList(prev => {
      return [...prev, ...importedDevices];
    });
  };

  const handleAddManualDevice = () => {
    const finalName = manualName.trim() || `${manualType}-${Date.now().toString().slice(-4)}`;
    const newDevs: ListDeviceItem[] = [];
    
    for (let i = 0; i < manualCount; i++) {
      const suffix = manualCount > 1 ? `_#${i + 1}` : '';
      const tModel = getLatestThingModel(manualType);
      newDevs.push({
        id: `manual-${Date.now()}-${i}`,
        type: manualType,
        name: `${finalName}${suffix}`,
        thingModel: tModel,
        count: 1,
        sn: `SN-${manualType === '储能柜' ? 'ESS' : manualType === '光伏逆变器' ? 'INV' : 'DEV'}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        productName: tModel.name,
        modelCode: tModel.version,
        capacity: manualType === '储能柜' ? '200' : '',
        power: ['储能柜', 'PCS', '光伏逆变器'].includes(manualType) ? '100' : '',
        reactivePower: manualType === '储能柜' ? '50' : '',
        gridType: '三相无中性线三线制',
        cycles: manualType === '储能柜' ? '6000' : '',
        backflow: '否',
        commType: 'Modbus TCP',
        ipAddress: '192.168.1.10',
        port: '502',
        baudRate: '9600',
        parity: '无校验',
        pvModulePower: manualType === '光伏逆变器' ? '120' : '',
        stringCount: manualType === '光伏逆变器' ? '12' : '',
        remark: '',
        errors: {}
      });
    }
    
    setDeviceList(prev => [...prev, ...newDevs]);
    setManualName('');
    setManualCount(1);
  };

  const handleDeleteDevice = (id: string) => {
    setDeviceList(prev => prev.filter(item => item.id !== id));
  };

  const openModelSelection = (deviceId: string) => {
    setEditingDeviceId(deviceId);
    setIsModelModalOpen(true);
  };

  const handleUpdateThingModel = (model: ThingModel) => {
    if (editingDeviceId) {
      setDeviceList(prev => prev.map(item => {
        if (item.id === editingDeviceId) {
          return { ...item, thingModel: model };
        }
        return item;
      }));
    }
    setIsModelModalOpen(false);
    setEditingDeviceId(null);
  };

  // Custom topology canvas tools
  const addCustomNode = (type: string) => {
    const label = `${type}-${customNodes.length + 1}`;
    const newNode = {
      id: `custom-node-${Date.now()}`,
      type: type === '电网' ? 'root' : type === '母线' ? 'bus' : 'node',
      label: label,
      deviceType: type,
      color: type === '电网' ? 'gray' : type === '母线' ? 'gray' : 
             type === '并网柜' ? 'green' : type === '变压器' ? 'blue' : 
             type === '储能柜' ? 'purple' : type === '光伏逆变器' ? 'yellow' : 'cyan'
    };
    setCustomNodes(prev => [...prev, newNode]);
  };

  const handleCanvasNodeClick = (nodeId: string) => {
    if (topologySource !== 'custom') return;
    
    if (!connStartNode) {
      setConnStartNode(nodeId);
    } else {
      if (connStartNode !== nodeId) {
        // Add edge
        const newEdge = { from: connStartNode, to: nodeId };
        // Avoid duplicate edges
        const exists = customEdges.some(e => (e.from === connStartNode && e.to === nodeId) || (e.from === nodeId && e.to === connStartNode));
        if (!exists) {
          setCustomEdges(prev => [...prev, newEdge]);
        }
      }
      setConnStartNode(null);
    }
    setSelectedNodeId(nodeId);
  };

  const clearCustomTopology = () => {
    setCustomNodes([]);
    setCustomEdges([]);
    setConnStartNode(null);
    setSelectedNodeId(null);
  };

  // Initialize Custom Canvas with Step 3 Devices
  const handleInitCustomCanvas = () => {
    const initialNodes = [
      { id: 'c-grid', type: 'root', label: '大电网', color: 'gray', deviceType: '电网' },
      { id: 'c-busbar', type: 'bus', label: '低压交流母线', color: 'gray', deviceType: '母线' }
    ];
    
    deviceList.forEach((dev, idx) => {
      initialNodes.push({
        id: `c-dev-${idx}`,
        type: 'node',
        label: dev.name,
        deviceType: dev.type,
        color: dev.type === '并网柜' ? 'green' : dev.type === '变压器' ? 'blue' : 
               dev.type === '储能柜' ? 'purple' : dev.type === '光伏逆变器' ? 'yellow' : 'cyan'
      });
    });

    const initialEdges = [
      { from: 'c-grid', to: 'c-busbar' }
    ];

    setCustomNodes(initialNodes);
    setCustomEdges(initialEdges);
  };

  // Convert and edit classic template in custom canvas
  const handleEditTemplateAsCustom = () => {
    const template = MOCK_TOPOLOGY_TEMPLATES.find(t => t.id === selectedTemplateId) || MOCK_TOPOLOGY_TEMPLATES[0];
    
    const initialNodes = [
      { id: 'c-grid', type: 'root', label: '公共电网', color: 'gray', deviceType: '电网' }
    ];
    const initialEdges: { from: string, to: string }[] = [];

    if (template.id !== 'T2') {
      initialNodes.push({ id: 'c-gridbar', type: 'node', label: '并网柜', color: 'green', deviceType: '并网柜' });
      initialEdges.push({ from: 'c-grid', to: 'c-gridbar' });
    }

    const parentId = template.id !== 'T2' ? 'c-gridbar' : 'c-grid';
    initialNodes.push({ id: 'c-transformer', type: 'node', label: '隔离变压器', color: 'blue', deviceType: '变压器' });
    initialEdges.push({ from: parentId, to: 'c-transformer' });

    initialNodes.push({ id: 'c-busbar', type: 'bus', label: '低压交流母线', color: 'gray', deviceType: '母线' });
    initialEdges.push({ from: 'c-transformer', to: 'c-busbar' });

    if (template.id !== 'T2') {
      initialNodes.push({ id: 'c-ess', type: 'node', label: '储能柜', color: 'purple', deviceType: '储能柜' });
      initialEdges.push({ from: 'c-busbar', to: 'c-ess' });
    }

    if (template.id !== 'T1') {
      initialNodes.push({ id: 'c-pv', type: 'node', label: '光伏逆变器', color: 'yellow', deviceType: '光伏逆变器' });
      initialEdges.push({ from: 'c-busbar', to: 'c-pv' });
    }

    setCustomNodes(initialNodes);
    setCustomEdges(initialEdges);
    setTopologySource('custom');
    setSelectedNodeId(null);
    setConnStartNode(null);
  };

  const handleRenameSelectedNode = (newLabel: string) => {
    if (!selectedNodeId) return;
    setCustomNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, label: newLabel } : n));
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setCustomNodes(prev => prev.filter(n => n.id !== selectedNodeId));
    setCustomEdges(prev => prev.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId));
    setSelectedNodeId(null);
    if (connStartNode === selectedNodeId) {
      setConnStartNode(null);
    }
  };

  // Total device counter
  const totalCount = deviceList.reduce((acc, item) => acc + item.count, 0);

  // Complete Creation
  const handleFinishCreation = () => {
    setShowSuccessModal(true);
  };

  const handleResetWizard = () => {
    setShowSuccessModal(false);
    setCurrentStep(1);
    setSelectedEnterprise(null);
    setIsEnterpriseConfirmed(false);
    setSearchQuery('');
    setStationForm({
      name: '',
      category: '光储充站点',
      code: '',
      address: '江苏省常州市新北区天合路2号',
      manager: '',
      phone: '',
      purchasePriceType: '固定分时电价',
      feedInPriceType: '固定价格',
      purchaseDynamicPricePlan: '',
      powerConsumptionType: '',
      feedInDynamicPricePlan: '',
      pvCapacity: '150000',
      pvInverterCount: '8',
      pvHasRadiometer: '否',
      pvAllowGrid: '否',
      pvTiltAngle: '15',
      pvAzimuthAngle: '0',
      essCapacity: '3000',
      essCount: '3',
      essCycles: '6000',
      essDod: '90',
      chargingPileCount: '12',
      stationImage: '',
      insuranceRemark: '电站设备承保，维保期限至2029年',
      emsSn: ''
    });
    setSelectedVersion('V2');
    setSelectedFeatures(['F1', 'F2']);
    setSelectedApplications([]);
    setDeviceList([]);
    setTopologySource('template');
    setSelectedTemplateId('T1');
    setCustomNodes([]);
    setCustomEdges([]);
    setSelectedNodeId(null);
    setConnStartNode(null);
  };

  const handleGoToWorkspace = () => {
    setShowSuccessModal(false);
    
    // Construct new station payload exactly matching the structure used in GridWorkspace.tsx
    const newStationId = stationForm.code || `CS${Math.floor(1780000000 + Math.random() * 10000000)}`;
    const newStation = {
      id: newStationId,
      name: stationForm.name,
      enterpriseName: selectedEnterprise?.name || '天合储能项目',
      emsSn: stationForm.emsSn,
      status: 'normal',
      address: stationForm.address,
      managerName: stationForm.manager,
      phone: stationForm.phone,
      purchasePriceType: stationForm.purchasePriceType || '固定分时电价',
      feedInPriceType: stationForm.feedInPriceType || '固定价格',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      category: stationForm.category || '光储充站点',
      pvCapacity: stationForm.pvCapacity,
      pvInverterCount: stationForm.pvInverterCount,
      pvHasRadiometer: stationForm.pvHasRadiometer,
      pvAllowGrid: stationForm.pvAllowGrid,
      pvTiltAngle: stationForm.pvTiltAngle,
      pvAzimuthAngle: stationForm.pvAzimuthAngle,
      essCapacity: stationForm.essCapacity,
      essCount: stationForm.essCount,
      essCycles: stationForm.essCycles,
      essDod: stationForm.essDod,
      chargingPileCount: stationForm.chargingPileCount,
      stationImage: stationForm.stationImage,
      insuranceRemark: stationForm.insuranceRemark
    };

    // Save station to localStorage
    const savedStations = localStorage.getItem('wizard_created_stations');
    let stationsList = [];
    if (savedStations) {
      try {
        stationsList = JSON.parse(savedStations);
      } catch (e) {}
    }
    stationsList.push(newStation);
    localStorage.setItem('wizard_created_stations', JSON.stringify(stationsList));

    // Also construct and save matched devices
    const savedDevices = localStorage.getItem('wizard_created_devices');
    let devicesList = [];
    if (savedDevices) {
      try {
        devicesList = JSON.parse(savedDevices);
      } catch (e) {}
    }
    
    deviceList.forEach((dev) => {
      // Repeat according to count
      for (let i = 0; i < dev.count; i++) {
        const uniqueId = `TH${dev.type === '变压器' ? 'PT' : dev.type === '电表' ? 'ME' : 'ES'}${Math.random().toString(36).substr(2, 10).toUpperCase()}`;
        devicesList.push({
          id: uniqueId,
          name: dev.count > 1 ? `${dev.name}_#${i + 1}` : dev.name,
          type: dev.type,
          sn: `SN-${Math.random().toString(36).substr(2, 15).toUpperCase()}`,
          model: dev.thingModel?.id || 'transfo01',
          parent: stationForm.name,
          station: stationForm.name,
          enterprise: selectedEnterprise?.name || '',
          createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          level: '一级',
          capacity: dev.type === '储能柜' ? parseFloat(stationForm.essCapacity) || 500 : dev.type === '光伏逆变器' ? parseFloat(stationForm.pvCapacity) || 100 : 0,
          power: dev.type === '储能柜' ? parseFloat(stationForm.essCapacity) / 2 || 250 : dev.type === '光伏逆变器' ? parseFloat(stationForm.pvCapacity) || 100 : 0,
          voltage: 380,
          current: 0,
          reverseFlow: '否',
          remarks: `${dev.name}由建站向导自动匹配物模型创建`
        });
      }
    });
    localStorage.setItem('wizard_created_devices', JSON.stringify(devicesList));

    onComplete(newStation);
  };

  // Rendering of active topology preview
  const renderTopologyPreview = () => {
    if (topologySource === 'app') {
      const activeApp = MOCK_STATION_APPLICATIONS.find(app => selectedApplications.includes(app.id) && app.topologyRelation);
      const topo = activeApp?.topologyRelation || MOCK_STATION_APPLICATIONS[1].topologyRelation;

      return (
        <div className="bg-[#1e293b] rounded-lg p-5 border border-slate-700 min-h-[320px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-slate-200">自动解析：网关上报拓扑（已自动对齐设备）</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">SN: {activeApp?.gatewaySn || 'AB12cdef3456gh'}</span>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            {/* Layer 1: Grid */}
            <div className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-center text-xs text-slate-100 font-bold min-w-[120px]">
              🌐 大电网 (Grid)
            </div>
            <div className="h-4 w-0.5 bg-slate-500" />

            {/* Layer 2: Grid Cabinet */}
            <div className="bg-emerald-950 border border-emerald-500/50 rounded-lg px-4 py-2 text-center text-xs text-emerald-200 font-bold min-w-[120px] shadow-sm shadow-emerald-900/50">
              🟢 并网柜 (1台已匹配)
            </div>
            <div className="h-4 w-0.5 bg-slate-500" />

            {/* Layer 3: Transformer */}
            <div className="bg-blue-950 border border-blue-500/50 rounded-lg px-4 py-2 text-center text-xs text-blue-200 font-bold min-w-[120px] shadow-sm shadow-blue-900/50">
              🔵 隔离变压器 (1台已匹配)
            </div>
            <div className="h-4 w-0.5 bg-slate-500" />

            {/* Layer 4: Busbar */}
            <div className="bg-slate-700/80 border border-slate-500/30 rounded px-6 py-1.5 text-center text-[11px] text-slate-300 font-mono tracking-widest min-w-[200px]">
              ━━━━━━ 低压交流母线 (BUS) ━━━━━━
            </div>

            <div className="flex space-x-6 pt-1">
              {/* ESS Zone */}
              <div className="flex flex-col items-center">
                <div className="h-3 w-0.5 bg-slate-500" />
                <div className="bg-purple-950 border border-purple-500/50 rounded-lg p-2 text-center min-w-[120px] shadow-sm shadow-purple-900/50">
                  <div className="text-[11px] font-bold text-purple-200">🔮 储能一体柜</div>
                  <div className="text-[9px] text-purple-400 mt-0.5 font-semibold">配套 PCS ×2 | 电池簇 ×2</div>
                </div>
              </div>

              {/* PV Zone */}
              <div className="flex flex-col items-center">
                <div className="h-3 w-0.5 bg-slate-500" />
                <div className="bg-amber-950 border border-amber-500/50 rounded-lg p-2 text-center min-w-[120px] shadow-sm shadow-amber-900/50">
                  <div className="text-[11px] font-bold text-amber-200">☀️ 光伏逆变器</div>
                  <div className="text-[9px] text-amber-400 mt-0.5 font-semibold">1台已就绪</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded border border-emerald-500/20 text-center">
            🎉 检测到物理设备数量与层级关联关系完美吻合，无冲突，推荐直接完成建站。
          </div>
        </div>
      );
    }

    if (topologySource === 'template') {
      const template = MOCK_TOPOLOGY_TEMPLATES.find(t => t.id === selectedTemplateId) || MOCK_TOPOLOGY_TEMPLATES[0];
      return (
        <div className="bg-[#1e293b] rounded-lg p-5 border border-slate-700 min-h-[320px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Layers size={15} className="text-blue-400" />
              <span className="text-sm font-semibold text-slate-200">模板自动映射：{template.name}</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={handleEditTemplateAsCustom}
                className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2.5 py-1 rounded transition flex items-center space-x-1"
                title="套用此经典模板并进入自定义绘制编辑模式"
              >
                <span>🎨 套用并自定义编辑</span>
              </button>
              <span className="text-xs text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded font-bold">{template.layers}层拓扑结构</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-1.5 text-center text-xs text-slate-100 font-bold min-w-[120px]">
              🌐 公共电网
            </div>
            <div className="h-4 w-0.5 bg-slate-500" />

            {/* Check alignment with deviceList */}
            {template.id !== 'T2' && (
              <>
                <div className={`border rounded-lg px-4 py-1.5 text-center text-xs font-bold min-w-[120px] ${
                  deviceList.some(d => d.type === '并网柜')
                    ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
                }`}>
                  {deviceList.some(d => d.type === '并网柜') ? '🟢 并网柜 (自动匹配)' : '⚪ 并网柜 (空缺)'}
                </div>
                <div className="h-4 w-0.5 bg-slate-500" />
              </>
            )}

            <div className={`border rounded-lg px-4 py-1.5 text-center text-xs font-bold min-w-[120px] ${
              deviceList.some(d => d.type === '变压器')
                ? 'bg-blue-950 border-blue-500/50 text-blue-200'
                : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
            }`}>
              {deviceList.some(d => d.type === '变压器') ? '🔵 变压器 (自动匹配)' : '⚪ 变压器 (空缺)'}
            </div>
            <div className="h-4 w-0.5 bg-slate-500" />

            <div className="bg-slate-700/80 border border-slate-500/30 rounded px-6 py-1 text-center text-[10px] text-slate-300 font-mono tracking-wider min-w-[180px]">
              ━━━━━ 低压交流母线 ━━━━━
            </div>

            <div className="flex space-x-4 pt-1">
              {template.id !== 'T2' && (
                <div className={`border rounded-lg p-2 text-center min-w-[110px] ${
                  deviceList.some(d => d.type === '储能柜')
                    ? 'bg-purple-950 border-purple-500/50 text-purple-200'
                    : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
                }`}>
                  <div className="text-[11px] font-bold">🔮 储能柜层</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {deviceList.filter(d => d.type === '储能柜').reduce((sum, d) => sum + d.count, 0)} 台已挂载
                  </div>
                </div>
              )}

              {template.id !== 'T1' && (
                <div className={`border rounded-lg p-2 text-center min-w-[110px] ${
                  deviceList.some(d => d.type === '光伏逆变器')
                    ? 'bg-amber-950 border-amber-500/50 text-amber-200'
                    : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
                }`}>
                  <div className="text-[11px] font-bold">☀️ 光伏发电层</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {deviceList.filter(d => d.type === '光伏逆变器').reduce((sum, d) => sum + d.count, 0)} 台已挂载
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border border-slate-700 bg-slate-800/50 rounded p-2.5 text-xs">
            <div className="font-semibold text-slate-300 mb-1">匹配状态日志：</div>
            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} className={deviceList.some(d => d.type === '并网柜') ? 'text-emerald-500' : 'text-slate-500'} />
                <span className="text-slate-400">并网柜：</span>
                <span className={deviceList.some(d => d.type === '并网柜') ? 'text-emerald-400' : 'text-amber-400'}>
                  {deviceList.some(d => d.type === '并网柜') ? '已自动匹配' : '未导入'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} className={deviceList.some(d => d.type === '变压器') ? 'text-emerald-500' : 'text-slate-500'} />
                <span className="text-slate-400">变压器：</span>
                <span className={deviceList.some(d => d.type === '变压器') ? 'text-emerald-400' : 'text-amber-400'}>
                  {deviceList.some(d => d.type === '变压器') ? '已自动匹配' : '未导入'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} className={deviceList.some(d => d.type === '储能柜') ? 'text-emerald-500' : 'text-slate-500'} />
                <span className="text-slate-400">储能柜：</span>
                <span className={deviceList.some(d => d.type === '储能柜') ? 'text-emerald-400' : 'text-amber-400'}>
                  {deviceList.some(d => d.type === '储能柜') ? '已自动匹配' : '未导入'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={12} className={deviceList.some(d => d.type === '光伏逆变器') ? 'text-emerald-500' : 'text-slate-500'} />
                <span className="text-slate-400">光伏逆变器：</span>
                <span className={deviceList.some(d => d.type === '光伏逆变器') ? 'text-emerald-400' : 'text-amber-400'}>
                  {deviceList.some(d => d.type === '光伏逆变器') ? '已自动匹配' : '未导入'}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (topologySource === 'custom') {
      return (
        <div className="bg-[#1e293b] rounded-lg p-5 border border-slate-700 min-h-[320px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Network size={15} className="text-purple-400" />
              <span className="text-sm font-semibold text-slate-200">自定义拓扑画布（经典模板转换/自定义连线）</span>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                type="button"
                onClick={handleInitCustomCanvas}
                className="text-[11px] bg-purple-950 border border-purple-500/40 text-purple-200 px-2.5 py-1 rounded hover:bg-purple-900/60"
              >
                📥 导入清单设备
              </button>
              <button 
                type="button"
                onClick={clearCustomTopology}
                className="text-[11px] border border-slate-600 hover:border-slate-500 text-slate-300 px-2.5 py-1 rounded"
              >
                清空画布
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 flex-1">
            {/* Left element editor or generator */}
            <div className="col-span-1 bg-slate-900/60 rounded p-3 border border-slate-800 flex flex-col justify-between min-h-[220px] max-h-[260px] overflow-y-auto">
              {selectedNodeId ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">节点属性编辑</span>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId(null)}
                      className="text-slate-500 hover:text-slate-300 text-[10px]"
                    >
                      取消选择
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">节点名称</label>
                    <input
                      type="text"
                      value={customNodes.find(n => n.id === selectedNodeId)?.label || ''}
                      onChange={(e) => handleRenameSelectedNode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">设备类型</span>
                    <span className="text-xs font-bold text-slate-300 font-mono">
                      {customNodes.find(n => n.id === selectedNodeId)?.deviceType || '未知'}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                    {connStartNode === selectedNodeId ? (
                      <button
                        type="button"
                        onClick={() => setConnStartNode(null)}
                        className="w-full text-center py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded"
                      >
                        🚫 取消连线起点
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConnStartNode(selectedNodeId)}
                        className="w-full text-center py-1 bg-blue-950 hover:bg-blue-900 border border-blue-500/30 text-blue-300 text-[11px] rounded"
                      >
                        🔗 设为连线起点
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleDeleteSelectedNode}
                      className="w-full text-center py-1 bg-red-950 hover:bg-red-900 border border-red-500/30 text-red-300 text-[11px] rounded"
                    >
                      🗑️ 删除此节点
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">快捷生成节点</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['电网', '母线', '变压器', '储能柜', '并网柜', '光伏逆变器'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addCustomNode(t)}
                        className="px-2 py-1 text-[11px] text-slate-300 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 transition font-medium text-left"
                      >
                        ➕ {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Canvas Area & Lines */}
            <div className="col-span-3 flex flex-col gap-3">
              <div className="bg-slate-950 rounded-lg p-3 relative overflow-auto border border-slate-800 flex flex-wrap content-start items-start gap-3 min-h-[160px] max-h-[220px]">
                {customNodes.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                    <HelpCircle size={24} className="mb-1 text-slate-600 animate-bounce" />
                    画布为空。请点击左侧按钮或使用上方 [导入清单设备]
                  </div>
                ) : (
                  <>
                    {customNodes.map((node) => {
                      const isSelected = selectedNodeId === node.id;
                      const isStart = connStartNode === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => handleCanvasNodeClick(node.id)}
                          className={`cursor-pointer select-none rounded p-2 text-center text-xs min-w-[90px] border-2 transition ${
                            node.color === 'green' ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50' :
                            node.color === 'blue' ? 'bg-blue-950 text-blue-200 border-blue-500/50' :
                            node.color === 'purple' ? 'bg-purple-950 text-purple-200 border-purple-500/50' :
                            node.color === 'yellow' ? 'bg-amber-950 text-amber-200 border-amber-500/50' :
                            'bg-slate-800 text-slate-100 border-slate-700'
                          } ${isSelected ? 'ring-2 ring-blue-500 scale-105' : ''} ${isStart ? 'border-dashed border-red-500 animate-pulse' : ''}`}
                        >
                          <div className="font-semibold truncate">{node.label}</div>
                          <div className="text-[9px] opacity-70 mt-0.5">{node.deviceType}</div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Connections list */}
              {customEdges.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">已建立的拓扑连接关系 ({customEdges.length})：</span>
                  <div className="flex flex-wrap gap-2 max-h-[70px] overflow-y-auto custom-scrollbar">
                    {customEdges.map((edge, index) => {
                      const fromNode = customNodes.find(n => n.id === edge.from)?.label || '电网';
                      const toNode = customNodes.find(n => n.id === edge.to)?.label || '节点';
                      return (
                        <div key={index} className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300">
                          <span>{fromNode} ── {toNode}</span>
                          <button
                            type="button"
                            onClick={() => setCustomEdges(prev => prev.filter((_, idx) => idx !== index))}
                            className="text-slate-500 hover:text-red-400 font-bold ml-1"
                            title="断开此连接"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
            💡 <b>交互说明：</b> 1.点击设备节点选择该设备；2.依次将两个设备设为连线端点即可<b>连线绑定</b>；3.当前已连通 <b>{customEdges.length}</b> 组物理链路。
          </div>
        </div>
      );
    }
  };

  return (
    <div className="station-setup-wizard-light-theme bg-[#0f172a] text-slate-100 p-8 rounded-xl shadow-2xl border border-slate-800 flex flex-col h-full min-h-[640px]">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Custom Theme Overrides to convert dark theme classes to light theme cleanly */
        .station-setup-wizard-light-theme {
          background-color: #ffffff !important;
          color: #374151 !important;
          border-color: #e5e7eb !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03) !important;
        }
        .station-setup-wizard-light-theme .text-slate-100 {
          color: #111827 !important;
        }
        .station-setup-wizard-light-theme .text-slate-200 {
          color: #1f2937 !important;
        }
        .station-setup-wizard-light-theme .text-slate-300 {
          color: #374151 !important;
        }
        .station-setup-wizard-light-theme .text-slate-400 {
          color: #4b5563 !important;
        }
        .station-setup-wizard-light-theme .text-slate-500 {
          color: #5a6270 !important;
        }
        .station-setup-wizard-light-theme .text-blue-400 {
          color: #2563eb !important;
        }
        .station-setup-wizard-light-theme .text-blue-300 {
          color: #1d4ed8 !important;
        }
        .station-setup-wizard-light-theme .text-emerald-400 {
          color: #059669 !important;
        }
        .station-setup-wizard-light-theme .text-purple-300 {
          color: #7c3aed !important;
        }
        .station-setup-wizard-light-theme .text-purple-200 {
          color: #6d28d9 !important;
        }
        .station-setup-wizard-light-theme .text-amber-400,
        .station-setup-wizard-light-theme .text-amber-500 {
          color: #b45309 !important;
        }
        .station-setup-wizard-light-theme .bg-slate-950,
        .station-setup-wizard-light-theme .bg-slate-950\\/80,
        .station-setup-wizard-light-theme .bg-slate-950\\/50 {
          background-color: #ffffff !important;
          border-color: #d1d5db !important;
        }
        .station-setup-wizard-light-theme .bg-slate-900 {
          background-color: #f9fafb !important;
          border-color: #e5e7eb !important;
        }
        .station-setup-wizard-light-theme .bg-slate-900\\/60,
        .station-setup-wizard-light-theme .bg-slate-900\\/50,
        .station-setup-wizard-light-theme .bg-slate-900\\/40 {
          background-color: #f3f4f6 !important;
          border-color: #e5e7eb !important;
        }
        .station-setup-wizard-light-theme .bg-slate-800,
        .station-setup-wizard-light-theme .bg-slate-800\\/50,
        .station-setup-wizard-light-theme .bg-slate-800\\/40 {
          background-color: #f3f4f6 !important;
          border-color: #e5e7eb !important;
        }
        .station-setup-wizard-light-theme .bg-slate-850 {
          background-color: #f3f4f6 !important;
          border-color: #e5e7eb !important;
        }
        .station-setup-wizard-light-theme .bg-slate-700,
        .station-setup-wizard-light-theme .bg-slate-700\\/80 {
          background-color: #f3f4f6 !important;
          border-color: #d1d5db !important;
        }
        .station-setup-wizard-light-theme .bg-slate-600 {
          background-color: #e5e7eb !important;
          border-color: #d1d5db !important;
        }
        .station-setup-wizard-light-theme .bg-\\[\\#1e293b\\] {
          background-color: #ffffff !important;
          border-color: #e5e7eb !important;
        }
        .station-setup-wizard-light-theme .bg-\\[\\#0f172a\\] {
          background-color: #ffffff !important;
        }
        .station-setup-wizard-light-theme .border-slate-800,
        .station-setup-wizard-light-theme .border-slate-800\\/80,
        .station-setup-wizard-light-theme .border-slate-800\\/60 {
          border-color: #e5e7eb !important;
        }
        .station-setup-wizard-light-theme .border-slate-700 {
          border-color: #d1d5db !important;
        }
        .station-setup-wizard-light-theme input,
        .station-setup-wizard-light-theme select,
        .station-setup-wizard-light-theme textarea {
          background-color: #ffffff !important;
          border-color: #d1d5db !important;
          color: #1f2937 !important;
        }
        .station-setup-wizard-light-theme input:focus,
        .station-setup-wizard-light-theme select:focus,
        .station-setup-wizard-light-theme textarea:focus {
          border-color: #3b82f6 !important;
          outline: none !important;
          box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2) !important;
        }
        .station-setup-wizard-light-theme input[disabled],
        .station-setup-wizard-light-theme select[disabled] {
          background-color: #f3f4f6 !important;
          color: #9ca3af !important;
          cursor: not-allowed !important;
        }
        /* Step indicator active */
        .station-setup-wizard-light-theme .bg-slate-800.border-blue-500 {
          background-color: #eff6ff !important;
          border-color: #2563eb !important;
          color: #2563eb !important;
        }
        /* Step indicator inactive */
        .station-setup-wizard-light-theme .bg-slate-900.border-slate-800 {
          background-color: #f3f4f6 !important;
          border-color: #e5e7eb !important;
          color: #9ca3af !important;
        }
        /* Checkbox inside dropdown or cards */
        .station-setup-wizard-light-theme input[type="radio"],
        .station-setup-wizard-light-theme input[type="checkbox"] {
          background-color: #ffffff !important;
          border-color: #d1d5db !important;
        }
        /* Selected cards background and borders */
        .station-setup-wizard-light-theme .bg-blue-950\\/40.border-blue-500\\/80,
        .station-setup-wizard-light-theme .bg-blue-950\\/40.border-blue-500,
        .station-setup-wizard-light-theme .bg-blue-950\\/20.border-blue-500\\/10 {
          background-color: #eff6ff !important;
          border-color: #3b82f6 !important;
          color: #1e3a8a !important;
        }
        .station-setup-wizard-light-theme .bg-blue-950\\/20 b {
          color: #1e3a8a !important;
        }
        /* Emerald badges & cards */
        .station-setup-wizard-light-theme .bg-emerald-950\\/60.border-emerald-500\\/30,
        .station-setup-wizard-light-theme .bg-emerald-950 {
          background-color: #ecfdf5 !important;
          border-color: #a7f3d0 !important;
        }
        .station-setup-wizard-light-theme .text-emerald-200,
        .station-setup-wizard-light-theme .text-emerald-300 {
          color: #047857 !important;
        }
        /* Purple topology badge & cards */
        .station-setup-wizard-light-theme .bg-purple-950,
        .station-setup-wizard-light-theme .bg-purple-950\\/40 {
          background-color: #f5f3ff !important;
          border-color: #ddd6fe !important;
        }
        .station-setup-wizard-light-theme .text-purple-200,
        .station-setup-wizard-light-theme .text-purple-300 {
          color: #6d28d9 !important;
        }
        /* Blue badges & cards */
        .station-setup-wizard-light-theme .bg-blue-950 {
          background-color: #eff6ff !important;
          border-color: #bfdbfe !important;
        }
        .station-setup-wizard-light-theme .text-blue-200,
        .station-setup-wizard-light-theme .text-blue-300 {
          color: #1d4ed8 !important;
        }
        .station-setup-wizard-light-theme .bg-blue-900\\/60 {
          background-color: #dbeafe !important;
          border-color: #bfdbfe !important;
          color: #1e40af !important;
        }
        .station-setup-wizard-light-theme .bg-blue-950\\/30.border-blue-500\\/50 {
          background-color: #eff6ff !important;
          border-color: #bfdbfe !important;
          color: #1d4ed8 !important;
        }
        /* Amber badges & cards */
        .station-setup-wizard-light-theme .bg-amber-950,
        .station-setup-wizard-light-theme .bg-amber-950\\/40,
        .station-setup-wizard-light-theme .bg-amber-950\\/20 {
          background-color: #fffbef !important;
          border-color: #fef3c7 !important;
        }
        .station-setup-wizard-light-theme .text-amber-200,
        .station-setup-wizard-light-theme .text-amber-300 {
          color: #b45309 !important;
        }
        /* Scrollbars */
        .station-setup-wizard-light-theme .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #d1d5db !important;
        }
        /* Hover effects */
        .station-setup-wizard-light-theme .hover\\:bg-slate-900:hover {
          background-color: #f3f4f6 !important;
        }
        .station-setup-wizard-light-theme .hover\\:bg-slate-800\\/50:hover {
          background-color: #f3f4f6 !important;
        }
        .station-setup-wizard-light-theme .hover\\:border-slate-700:hover {
          border-color: #9ca3af !important;
        }
        /* Manual category list items count */
        .station-setup-wizard-light-theme .bg-slate-900.text-slate-500 {
          background-color: #f3f4f6 !important;
          color: #6b7280 !important;
        }
        /* Modal backgrounds and headers */
        .station-setup-wizard-light-theme .fixed.bg-slate-950\\/80 {
          background-color: rgba(17, 24, 39, 0.6) !important;
        }
        .station-setup-wizard-light-theme .bg-slate-900.rounded-xl.border-slate-800 {
          background-color: #ffffff !important;
          border-color: #e5e7eb !important;
          color: #1f2937 !important;
        }
        .station-setup-wizard-light-theme .bg-slate-950.p-4.rounded-lg {
          background-color: #f9fafb !important;
          border-color: #e5e7eb !important;
        }
        /* Custom topology canvas styling */
        .station-setup-wizard-light-theme .bg-slate-950.border-dashed {
          background-color: #f9fafb !important;
          border-color: #d1d5db !important;
        }
        /* Red/Error border indicator */
        .station-setup-wizard-light-theme .border-slate-850 {
          border-color: #e5e7eb !important;
        }
        /* Topology status badges */
        .station-setup-wizard-light-theme .bg-slate-900\\/40 {
          background-color: #f3f4f6 !important;
          border-color: #e5e7eb !important;
        }
        /* Sync list background for device types */
        .station-setup-wizard-light-theme .bg-slate-900.px-1\\.5 {
          background-color: #f3f4f6 !important;
          border-color: #e5e7eb !important;
          color: #4b5563 !important;
        }
        /* Text inputs and other controls */
        .station-setup-wizard-light-theme textarea {
          background-color: #ffffff !important;
          border-color: #d1d5db !important;
          color: #1f2937 !important;
        }
      ` }} />
      
      {/* Step Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800 shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <Sparkles size={20} className="mr-2 text-blue-400" />
            全新微网一键智能建站向导
          </h2>
          <p className="text-xs text-slate-400 mt-1">从零碳平台同步企业，分配服务，秒级批量录入物理设备与主网拓扑逻辑</p>
        </div>
        
        {/* Simplified clean progress bar */}
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((stepNum) => {
            const isCompleted = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            return (
              <div key={stepNum} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                  isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                  isActive ? 'bg-slate-800 border-blue-500 text-blue-400 ring-2 ring-blue-500/20' :
                  'bg-slate-900 border-slate-800 text-slate-500'
                }`}>
                  {isCompleted ? <Check size={12} /> : stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-8 h-0.5 ml-2 ${currentStep > stepNum ? 'bg-blue-600' : 'bg-slate-800'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 overflow-y-auto py-6">
        
        {/* ================= STEP 1: SELECT ENTERPRISE & NEW STATION ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Enterprise selector column */}
              <div className="space-y-3">
                {/* Search / Select Existing Enterprise Component */}
                <div className="relative bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>
                    🔍 搜索选择已有企业新建站点
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="输入企业名称、联系人或手机号搜索已有企业..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition"
                    />
                    {searchQuery && (
                      <button 
                        type="button"
                        onClick={() => { setSearchQuery(''); }}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 transition"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {isDropdownOpen && (
                    <>
                      {/* Transparent backdrop overlay to close dropdown on click outside */}
                      <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                      
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl max-h-[220px] overflow-y-auto custom-scrollbar">
                        {filteredExistingEnterprises.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 text-center">未找到匹配的已有企业</div>
                        ) : (
                          filteredExistingEnterprises.map((ent) => (
                            <div
                              key={ent.id}
                              onClick={() => {
                                setSelectedEnterprise(ent);
                                setIsEnterpriseConfirmed(true);
                                setIsDropdownOpen(false);
                              }}
                              className="p-2.5 hover:bg-slate-900 cursor-pointer border-b border-slate-900 last:border-none flex items-center justify-between text-xs transition"
                            >
                              <div className="pr-2">
                                <div className="font-semibold text-slate-200">{ent.name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  编号: {ent.code} | 联系人: {ent.contact} ({ent.phone})
                                </div>
                              </div>
                              <span className="shrink-0 text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full border border-blue-900/50">
                                已建 {ent.stationCount} 站
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-slate-200">选择同步的无站点企业：</span>
                  <span className="text-[11px] text-emerald-400 font-mono">共 {zeroStationEnterprises.length} 家</span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {/* If selected enterprise is an existing enterprise (has stationCount > 0), show it as selected at the top of the cards list */}
                  {selectedEnterprise && selectedEnterprise.stationCount > 0 && (
                    <div
                      key={selectedEnterprise.id}
                      onClick={() => { setSelectedEnterprise(selectedEnterprise); setIsEnterpriseConfirmed(true); }}
                      className="p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/30 shadow-md shadow-blue-950/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="selected-enterprise"
                            checked={true}
                            onChange={() => {}}
                            className="text-blue-600 bg-slate-800 border-slate-700"
                          />
                          <span className="font-semibold text-slate-200 text-sm">{selectedEnterprise.name}</span>
                        </div>
                        <span className="text-[10px] bg-blue-900/60 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                          已选 · 已建 {selectedEnterprise.stationCount} 站
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-slate-800/60 text-xs text-slate-400">
                        <div>
                          <span className="text-slate-500">编号:</span> <span className="font-mono">{selectedEnterprise.code}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500">联系人:</span> <span>{selectedEnterprise.contact} ({selectedEnterprise.phone})</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {zeroStationEnterprises.map((ent) => {
                    const isSelected = selectedEnterprise?.id === ent.id;
                    const isNewUser = ent.stationCount === 0;
                    return (
                      <div
                        key={ent.id}
                        onClick={() => { setSelectedEnterprise(ent); setIsEnterpriseConfirmed(true); }}
                        className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/30 shadow-md shadow-blue-950/50' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="selected-enterprise"
                              checked={isSelected}
                              onChange={() => {}} // handled by div onClick
                              className="text-blue-600 bg-slate-800 border-slate-700"
                            />
                            <span className="font-semibold text-slate-200 text-sm">{ent.name}</span>
                          </div>
                          {isNewUser ? (
                            <span className="text-[10px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                              新企业 · 暂无站点
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                              已有 {ent.stationCount} 个站点
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-slate-800/60 text-xs text-slate-400">
                          <div>
                            <span className="text-slate-500">编号:</span> <span className="font-mono">{ent.code}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500">联系人:</span> <span>{ent.contact} ({ent.phone})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Station details form column */}
              <div className="space-y-3">
                <span className="text-sm font-semibold text-slate-200">第二步：新建站点详细档案</span>
                
                {isEnterpriseConfirmed && selectedEnterprise ? (
                  <div className="bg-slate-900/60 p-5 rounded-lg border border-slate-800/80 space-y-6 max-h-[620px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-blue-950/20 px-3.5 py-2 rounded border border-blue-500/10 flex items-center text-xs text-blue-300">
                      <Info size={14} className="mr-2 text-blue-400 shrink-0" />
                      正在为企业 <b className="mx-1 text-slate-100">{selectedEnterprise.name}</b> 开设全新站点
                    </div>

                    {/* ===== Group 1: 基本信息 ===== */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                        <span className="w-1.5 h-3.5 bg-blue-500 rounded-sm"></span>
                        <h3 className="text-xs font-bold text-slate-200">基本信息</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 所属企业 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>所属企业
                          </label>
                          <select
                            disabled
                            value={selectedEnterprise.name}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-400 cursor-not-allowed"
                          >
                            <option value={selectedEnterprise.name}>{selectedEnterprise.name}</option>
                          </select>
                        </div>

                        {/* 站点分类 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>站点分类
                          </label>
                          <select
                            value={stationForm.category}
                            onChange={(e) => setStationForm({ ...stationForm, category: e.target.value })}
                            className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                              step1Errors.category ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                            }`}
                          >
                            <option value="光储充站点">光储充站点</option>
                            <option value="光储站点">光储站点</option>
                            <option value="光伏站点">光伏站点</option>
                            <option value="储能站点">储能站点</option>
                            <option value="充电站点">充电站点</option>
                          </select>
                        </div>

                        {/* 站点编号 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">站点编号</label>
                          <input
                            type="text"
                            disabled
                            value={stationForm.code}
                            placeholder="自动生成站点编号"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-400 cursor-not-allowed font-mono"
                          />
                        </div>

                        {/* 站点名称 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>站点名称
                          </label>
                          <input
                            type="text"
                            value={stationForm.name}
                            onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                            placeholder="请输入站点名称"
                            className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                              step1Errors.name ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                            }`}
                          />
                        </div>

                        {/* 负责人名称 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>负责人名称
                          </label>
                          <input
                            type="text"
                            value={stationForm.manager}
                            onChange={(e) => setStationForm({ ...stationForm, manager: e.target.value })}
                            placeholder="请输入负责人名称"
                            className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                              step1Errors.manager ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                            }`}
                          />
                        </div>

                        {/* 手机号 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>手机号
                          </label>
                          <input
                            type="text"
                            value={stationForm.phone}
                            onChange={(e) => setStationForm({ ...stationForm, phone: e.target.value })}
                            placeholder="请输入手机号"
                            className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono ${
                              step1Errors.phone ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                            }`}
                          />
                        </div>

                        {/* 电价类型 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>电价类型
                          </label>
                          <select
                            value={stationForm.purchasePriceType}
                            onChange={(e) => setStationForm({ ...stationForm, purchasePriceType: e.target.value })}
                            className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                              step1Errors.purchasePriceType ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                            }`}
                          >
                            <option value="">请选择电价类型</option>
                            <option value="固定电价">固定电价</option>
                            <option value="固定分时电价">固定分时电价</option>
                            <option value="动态电价">动态电价</option>
                            <option value="市场化价格">市场化价格</option>
                            <option value="行业中位数电价">行业中位数电价</option>
                          </select>
                        </div>

                        {/* 用电类型 (If fixed price) */}
                        {stationForm.purchasePriceType === '固定电价' && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                              <span className="text-red-500 mr-1">*</span>用电类型
                            </label>
                            <select
                              value={stationForm.powerConsumptionType || ''}
                              onChange={(e) => setStationForm({ ...stationForm, powerConsumptionType: e.target.value })}
                              className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                                step1Errors.powerConsumptionType ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            >
                              <option value="">请选择用电类型</option>
                              <option value="大工业用电">大工业用电</option>
                              <option value="一般工商业用电">一般工商业用电</option>
                              <option value="农业生产用电">农业生产用电</option>
                              <option value="居民生活用电">居民生活用电</option>
                            </select>
                          </div>
                        )}

                        {/* 购电动态电价方案 (If dynamic price) */}
                        {(stationForm.purchasePriceType === '市场化价格' || stationForm.purchasePriceType === '动态电价') && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                              <span className="text-red-500 mr-1">*</span>购电动态电价方案
                            </label>
                            <select
                              value={stationForm.purchaseDynamicPricePlan || ''}
                              onChange={(e) => setStationForm({ ...stationForm, purchaseDynamicPricePlan: e.target.value })}
                              className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                                step1Errors.purchaseDynamicPricePlan ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            >
                              <option value="">请选择购电动态电价方案</option>
                              <option value="江苏工商业两部制电价方案 (2026)">江苏工商业两部制电价方案 (2026)</option>
                              <option value="浙江大工业分时电价方案 (2026)">浙江大工业分时电价方案 (2026)</option>
                              <option value="上海市非居民两部制电价方案">上海市非居民两部制电价方案</option>
                              <option value="广东工商业峰谷电价方案">广东工商业峰谷电价方案</option>
                            </select>
                          </div>
                        )}

                        {/* 上网电价类型 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>上网电价类型
                          </label>
                          <select
                            value={stationForm.feedInPriceType}
                            onChange={(e) => setStationForm({ ...stationForm, feedInPriceType: e.target.value })}
                            className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                              step1Errors.feedInPriceType ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                            }`}
                          >
                            <option value="">请选择上网电价类型</option>
                            <option value="固定价格">固定价格</option>
                            <option value="分时上网电价">分时上网电价</option>
                            <option value="动态电价">动态电价</option>
                            <option value="一站一议价格">一站一议价格</option>
                          </select>
                        </div>

                        {/* 上网动态电价方案 (If dynamic/time-of-use feed-in price) */}
                        {(stationForm.feedInPriceType === '分时上网电价' || stationForm.feedInPriceType === '动态电价') && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                              <span className="text-red-500 mr-1">*</span>上网动态电价方案
                            </label>
                            <select
                              value={stationForm.feedInDynamicPricePlan || ''}
                              onChange={(e) => setStationForm({ ...stationForm, feedInDynamicPricePlan: e.target.value })}
                              className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                                step1Errors.feedInDynamicPricePlan ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            >
                              <option value="">请选择上网动态电价方案</option>
                              <option value="江苏脱硫燃煤上网标杆电价方案">江苏脱硫燃煤上网标杆电价方案</option>
                              <option value="浙江分布式上网峰谷电价方案">浙江分布式上网峰谷电价方案</option>
                              <option value="安徽省燃煤发电标杆上网电价">安徽省燃煤发电标杆上网电价</option>
                            </select>
                          </div>
                        )}
                      </div>
                      </div>

                      {/* 站点地址 with blue anchor text and interactive mock map */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-semibold text-slate-400">
                            <span className="text-red-500 mr-1">*</span>站点地址
                          </label>
                          <span className="text-[10px] text-blue-400 hover:text-blue-300 transition cursor-pointer flex items-center">
                            请在下方地图中定位站点地址
                          </span>
                        </div>
                        <input
                          type="text"
                          value={stationForm.address}
                          onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                          placeholder="请输入站点地址"
                          className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                            step1Errors.address ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                          }`}
                        />

                        {/* High fidelity interactive AutoNavi Map mockup */}
                        <div className="relative h-48 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex flex-col justify-between group">
                          {/* Floating map inputs / overlays */}
                          <div className="absolute top-2.5 left-2.5 z-10 w-60 bg-slate-900/95 border border-slate-800 rounded p-1.5 flex items-center shadow-lg">
                            <input
                              type="text"
                              value={stationForm.address}
                              onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                              placeholder="请输入站点地址"
                              className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none"
                            />
                          </div>

                          {/* Map Visuals (styled SVG representation resembling high-fidelity map of Changzhou/Wuxi region) */}
                          <div className="w-full h-full bg-[#111827] relative opacity-90 cursor-crosshair">
                            {/* Gridlines of a map */}
                            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#475569" strokeWidth="0.5" />
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#mapGrid)" />
                            </svg>

                            {/* Rivers & roads */}
                            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                              {/* Blue river */}
                              <path d="M -10 100 Q 150 150 250 80 T 500 130" fill="none" stroke="#2563eb" strokeWidth="12" strokeLinecap="round" />
                              <path d="M 250 80 Q 280 160 320 220" fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" />
                              {/* Highways orange */}
                              <path d="M 50 -10 L 150 220" fill="none" stroke="#ea580c" strokeWidth="2" />
                              <path d="M -10 140 L 510 140" fill="none" stroke="#ea580c" strokeWidth="3" />
                              <path d="M 300 -10 L 300 220" fill="none" stroke="#ea580c" strokeWidth="2" />
                            </svg>

                            {/* Location landmark dots */}
                            {[
                              { label: '常州 (天合光能)', lat: 110, lng: 130, addr: '江苏省常州市新北区天合路2号' },
                              { label: '无锡 (核心站)', lat: 330, lng: 160, addr: '江苏省无锡市梁溪区解放路188号' },
                              { label: '丹阳 (开发区)', lat: 60, lng: 80, addr: '江苏省镇江市丹阳市开发区新和路' },
                              { label: '江阴 (并网站)', lat: 260, lng: 50, addr: '江苏省无锡市江阴市滨江中路55号' },
                              { label: '宜兴 (新能站)', lat: 410, lng: 110, addr: '江苏省无锡市宜兴市环保科技园' },
                            ].map((landmark, i) => {
                              const isSelected = stationForm.address.includes(landmark.label) || (i === 0 && !stationForm.address);
                              return (
                                <button
                                  key={landmark.label}
                                  type="button"
                                  onClick={() => setStationForm({ ...stationForm, address: landmark.addr })}
                                  className="absolute group/landmark transition-all hover:scale-110 flex flex-col items-center justify-center focus:outline-none"
                                  style={{ left: `${landmark.lat}px`, top: `${landmark.lng}px` }}
                                >
                                  {isSelected ? (
                                    <>
                                      <span className="absolute inline-flex h-4 w-4 rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                                      <MapPin size={16} className="text-blue-500 z-10 filter drop-shadow" />
                                    </>
                                  ) : (
                                    <MapPin size={12} className="text-slate-500 group-hover/landmark:text-slate-300" />
                                  )}
                                  <span className={`text-[9px] mt-0.5 px-1 rounded select-none shadow whitespace-nowrap ${
                                    isSelected 
                                      ? 'bg-blue-600 text-white font-bold' 
                                      : 'bg-slate-900/80 text-slate-400 group-hover/landmark:text-slate-200'
                                  }`}>
                                    {landmark.label}
                                  </span>
                                </button>
                              );
                            })}

                            <div className="absolute bottom-2 left-2 z-10 flex items-center bg-slate-900/80 px-2 py-0.5 rounded text-[8px] text-slate-500 font-mono tracking-tighter">
                              <MapPin size={8} className="mr-0.5 text-blue-500" />
                              <span>高德地图 © 2026 AutoNavi - GS(2025)5996号</span>
                            </div>

                            <div className="absolute right-2 top-2 z-10 bg-slate-900/80 px-2 py-1 rounded text-[8px] text-slate-400 pointer-events-none">
                              💡 点击地图点快速定位站点
                            </div>
                          </div>
                        </div>
                      </div>

                    {/* ===== Group 2: 光伏信息 ===== */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                        <span className="w-1.5 h-3.5 bg-yellow-500 rounded-sm"></span>
                        <h3 className="text-xs font-bold text-slate-200">光伏信息</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 光伏装机容量 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>光伏装机容量
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              value={stationForm.pvCapacity}
                              onChange={(e) => setStationForm({ ...stationForm, pvCapacity: e.target.value })}
                              placeholder="请输入光伏装机容量"
                              className={`w-full bg-slate-950 border rounded pl-3 pr-10 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono ${
                                step1Errors.pvCapacity ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            />
                            <span className="absolute right-3 text-slate-500 text-[10px] font-bold">Wp</span>
                          </div>
                        </div>

                        {/* 逆变器数量 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>逆变器数量
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              value={stationForm.pvInverterCount}
                              onChange={(e) => setStationForm({ ...stationForm, pvInverterCount: e.target.value })}
                              placeholder="请输入逆变器数量"
                              className={`w-full bg-slate-950 border rounded pl-3 pr-10 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono ${
                                step1Errors.pvInverterCount ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            />
                            <span className="absolute right-3 text-slate-500 text-[10px]">台</span>
                          </div>
                        </div>

                        {/* 是否配置辐射仪 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>是否配置辐射仪
                          </label>
                          <select
                            value={stationForm.pvHasRadiometer}
                            onChange={(e) => setStationForm({ ...stationForm, pvHasRadiometer: e.target.value })}
                            className={`w-full bg-slate-950 border rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition ${
                              step1Errors.pvHasRadiometer ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                            }`}
                          >
                            <option value="">请选择是否配置辐射仪</option>
                            <option value="是">是</option>
                            <option value="否">否</option>
                          </select>
                        </div>

                        {/* 是否允许光伏上网 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">是否允许光伏上网</label>
                          <select
                            value={stationForm.pvAllowGrid}
                            onChange={(e) => setStationForm({ ...stationForm, pvAllowGrid: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                          >
                            <option value="是">是</option>
                            <option value="否">否</option>
                          </select>
                        </div>

                        {/* 光伏安装倾斜角度 */}
                        <div>
                          <div className="flex items-center mb-1.5">
                            <label className="block text-[11px] font-semibold text-slate-400">光伏安装倾斜角度</label>
                            <HelpCircle size={12} className="text-slate-500 ml-1 cursor-help" title="光伏支架相对于地面的倾斜角度" />
                          </div>
                          <input
                            type="text"
                            value={stationForm.pvTiltAngle}
                            onChange={(e) => setStationForm({ ...stationForm, pvTiltAngle: e.target.value })}
                            placeholder="0~90度"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                          />
                        </div>

                        {/* 光伏朝向角度 */}
                        <div>
                          <div className="flex items-center mb-1.5">
                            <label className="block text-[11px] font-semibold text-slate-400">光伏朝向角度</label>
                            <HelpCircle size={12} className="text-slate-500 ml-1 cursor-help" title="偏东偏西角，0度代表正南" />
                          </div>
                          <input
                            type="text"
                            value={stationForm.pvAzimuthAngle}
                            onChange={(e) => setStationForm({ ...stationForm, pvAzimuthAngle: e.target.value })}
                            placeholder="-180~180度，0度为正南"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ===== Group 3: 储能信息 ===== */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                        <span className="w-1.5 h-3.5 bg-purple-500 rounded-sm"></span>
                        <h3 className="text-xs font-bold text-slate-200">储能信息</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 储能装机容量 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>储能装机容量
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              value={stationForm.essCapacity}
                              onChange={(e) => setStationForm({ ...stationForm, essCapacity: e.target.value })}
                              placeholder="请输入储能装机容量"
                              className={`w-full bg-slate-950 border rounded pl-3 pr-12 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono ${
                                step1Errors.essCapacity ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            />
                            <span className="absolute right-3 text-slate-500 text-[10px] font-bold">kWh</span>
                          </div>
                        </div>

                        {/* 储能数量 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>储能数量
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              value={stationForm.essCount}
                              onChange={(e) => setStationForm({ ...stationForm, essCount: e.target.value })}
                              placeholder="请输入储能数量"
                              className={`w-full bg-slate-950 border rounded pl-3 pr-10 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono ${
                                step1Errors.essCount ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            />
                            <span className="absolute right-3 text-slate-500 text-[10px]">台</span>
                          </div>
                        </div>

                        {/* 测算模型充放电次数 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>测算模型充放电次数
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              value={stationForm.essCycles}
                              onChange={(e) => setStationForm({ ...stationForm, essCycles: e.target.value })}
                              placeholder="请输入测算模型充放电次数"
                              className={`w-full bg-slate-950 border rounded pl-3 pr-10 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono ${
                                step1Errors.essCycles ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            />
                            <span className="absolute right-3 text-slate-500 text-[10px]">次</span>
                          </div>
                        </div>

                        {/* DoD放电深度 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>DoD放电深度
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              value={stationForm.essDod}
                              onChange={(e) => setStationForm({ ...stationForm, essDod: e.target.value })}
                              placeholder="请输入DoD放电深度"
                              className={`w-full bg-slate-950 border rounded pl-3 pr-10 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono ${
                                step1Errors.essDod ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            />
                            <span className="absolute right-3 text-slate-500 text-[10px] font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ===== Group 4: 充电站信息 ===== */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                        <span className="w-1.5 h-3.5 bg-indigo-500 rounded-sm"></span>
                        <h3 className="text-xs font-bold text-slate-200">充电站信息</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 充电桩数量 */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>充电桩数量
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              value={stationForm.chargingPileCount}
                              onChange={(e) => setStationForm({ ...stationForm, chargingPileCount: e.target.value })}
                              placeholder="请输入充电桩数量"
                              className={`w-full bg-slate-950 border rounded pl-3 pr-10 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono ${
                                step1Errors.chargingPileCount ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                              }`}
                            />
                            <span className="absolute right-3 text-slate-500 text-[10px]">台</span>
                          </div>
                        </div>

                        {/* 监控站点图片 with upload logic */}
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">监控站点图片</label>
                          <div className="flex items-center space-x-3">
                            <label className="cursor-pointer bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded px-4 py-2 flex items-center space-x-1.5 text-xs text-slate-300">
                              <Plus size={14} className="text-slate-400" />
                              <span>点击上传</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setStationForm({ ...stationForm, stationImage: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            {stationForm.stationImage ? (
                              <div className="relative w-12 h-12 rounded border border-slate-800 overflow-hidden group">
                                <img src={stationForm.stationImage} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setStationForm({ ...stationForm, stationImage: '' })}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-red-500"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">（格式限jpg, png）</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ===== Group 5: 其他信息 ===== */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
                        <span className="w-1.5 h-3.5 bg-slate-500 rounded-sm"></span>
                        <h3 className="text-xs font-bold text-slate-200">其他信息</h3>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">保险，维保期限说明</label>
                        <textarea
                          rows={3}
                          value={stationForm.insuranceRemark}
                          onChange={(e) => setStationForm({ ...stationForm, insuranceRemark: e.target.value })}
                          placeholder="请输入保险，维保截止时间说明(少于200个字符)"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition custom-scrollbar resize-none"
                        />
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-slate-950 border border-dashed border-slate-800 rounded-lg p-10 text-center text-slate-500 text-xs h-[400px] flex flex-col items-center justify-center">
                    <Building2 size={36} className="text-slate-700 mb-2" />
                    请在左侧列表中点击选择一家企业，激活建站表单。
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: ALLOCATE VERSION & FEATURES ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            
            {/* Top summary row */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-1">
                <span>目标企业：</span>
                <b className="text-slate-200">{selectedEnterprise?.name}</b>
              </div>
              <div className="flex items-center space-x-1">
                <span>新建站点：</span>
                <b className="text-slate-200">{stationForm.name}</b>
              </div>
              <div className="flex items-center space-x-1">
                <span>地址：</span>
                <b className="text-slate-200 max-w-xs truncate">{stationForm.address}</b>
              </div>
            </div>

            {hasAssignedVersion && (
              <div className="bg-blue-950/40 border border-blue-900/80 rounded-lg p-3.5 flex items-start space-x-2.5 text-xs text-blue-300 animate-in fade-in slide-in-from-top-4 duration-200">
                <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">
                    💡 企业已分配服务版本
                  </p>
                  <p className="leading-relaxed">
                    由于该企业 [<strong className="text-white">{selectedEnterprise?.name}</strong>] 拥有已有站点或已分配核心版本，当前的站点版本默认与企业设置保持一致，此处不支持修改。您可以为该站点额外选配新增的算法特性包。
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-200">1. 选择该站点的核心服务版本</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayVersions.map((pkg) => {
                  const isSelected = selectedVersion === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        if (hasAssignedVersion) return;
                        setSelectedVersion(pkg.id);
                      }}
                      className={`p-4 rounded-lg border transition flex flex-col justify-between min-h-[160px] relative ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/20 shadow-lg'
                          : hasAssignedVersion
                            ? 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-50 cursor-not-allowed select-none'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer'
                      }`}
                    >
                      {hasAssignedVersion && isSelected ? (
                        <span className="absolute top-3 right-3 text-[10px] bg-blue-900/80 border border-blue-500/30 text-blue-300 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <ShieldCheck size={11} className="text-blue-400" />
                          <span>企业绑定版本</span>
                        </span>
                      ) : pkg.isRecommended && !hasAssignedVersion ? (
                        <span className="absolute top-0 right-4 transform -translate-y-1/2 text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          官方推荐
                        </span>
                      ) : null}
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-sm">{pkg.name}</span>
                          <input
                            type="radio"
                            name="version-package"
                            checked={isSelected}
                            disabled={hasAssignedVersion}
                            onChange={() => {}}
                            className="text-blue-600 bg-slate-800 border-slate-700 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{pkg.description}</p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">基础订阅状态:</span>
                        <span className={isSelected ? 'text-blue-400 font-bold' : 'text-slate-400'}>
                          {isSelected ? '已选配部署' : '未选择'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-3">
              <span className="text-sm font-semibold text-slate-200">2. 自定义选配增值算法特性包</span>
              <div className="bg-slate-900/60 p-5 rounded-lg border border-slate-800/80">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {displayFeatures.map((feat) => {
                    const isRequired = feat.isBase;
                    const isAlreadyConfigured = alreadyConfiguredFeatureCodes.includes(feat.id) || alreadyConfiguredFeatureCodes.includes(feat.code);
                    const isChecked = selectedFeatures.includes(feat.id);
                    return (
                      <div
                        key={feat.id}
                        onClick={() => toggleFeature(feat.id)}
                        className={`p-3 rounded border transition flex items-center justify-between ${
                          isRequired 
                            ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed opacity-80' 
                            : isAlreadyConfigured
                              ? 'bg-blue-950/20 border-blue-900/60 text-blue-300/80 cursor-not-allowed opacity-90'
                              : isChecked 
                                ? 'bg-blue-950/30 border-blue-500/50 text-blue-200 cursor-pointer' 
                                : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                            isRequired ? 'bg-slate-800 border-slate-700 text-slate-600' :
                            isAlreadyConfigured ? 'bg-blue-900/60 border-blue-800/80 text-blue-300' :
                            isChecked ? 'bg-blue-600 border-blue-600 text-white' :
                            'border-slate-700 bg-slate-900'
                          }`}>
                            {(isChecked || isAlreadyConfigured) && <Check size={11} />}
                          </div>
                          <span className="text-xs font-semibold">{feat.name}</span>
                        </div>
                        {isRequired ? (
                          <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-500 px-1.5 py-0.2 rounded-full font-medium select-none">
                            基础必选
                          </span>
                        ) : isAlreadyConfigured ? (
                          <span className="text-[9px] bg-blue-950 border border-blue-800 text-blue-400 px-1.5 py-0.2 rounded-full font-medium select-none flex items-center space-x-0.5">
                            <ShieldCheck size={10} className="text-blue-400" />
                            <span>已配置</span>
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= STEP 3: CREATE DEVICE LIST ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Input Modes */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* Method selector tabs */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setDeviceTab('sync')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md text-center transition ${
                      deviceTab === 'sync'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    从建站申请一键同步
                  </button>
                  <button
                    onClick={() => setDeviceTab('manual')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md text-center transition ${
                      deviceTab === 'manual'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    手动逐台录入设备
                  </button>
                </div>

                {/* Tab 1: Sync from app */}
                {deviceTab === 'sync' && (
                  <div className="space-y-3 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">物理网关上报待确认设备</span>
                    
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                      {MOCK_STATION_APPLICATIONS.map((app) => {
                        const isChecked = selectedApplications.includes(app.id);
                        return (
                          <div
                            key={app.id}
                            onClick={() => handleToggleApplication(app.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition ${
                              isChecked
                                ? 'bg-blue-950/20 border-blue-500/50'
                                : 'bg-slate-950 border-slate-850 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // div handles click
                                className="text-blue-600 bg-slate-800 border-slate-700 mt-0.5 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-200 truncate">{app.station}</span>
                                  {app.topologyRelation && (
                                    <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.2 rounded font-semibold border border-purple-800/40 shrink-0">
                                      📎 附带主网拓扑
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  网关SN: <span className="font-mono text-blue-400">{app.gatewaySn}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1">
                                  {app.devices.map((d, i) => (
                                    <span key={i} className="bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800/80">
                                      {d.type}×{d.count}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleSyncApplications}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded transition flex items-center justify-center shadow-lg"
                    >
                      🔄 智能导入选中的 {selectedApplications.length} 组设备
                    </button>
                  </div>
                )}

                {/* Tab 2: Manual add */}
                {deviceTab === 'manual' && (
                  <div className="space-y-4.5 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">手动快速录入设备参数</span>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">设备类别选择</label>
                        <select
                          value={manualType}
                          onChange={(e) => setManualType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          {['变压器', '并网柜', '储能柜', 'PCS', '电池簇', '光伏逆变器', '电表'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">设备实例名称</label>
                        <input
                          type="text"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          placeholder="例如: 1#工商业储能柜"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">导入数量 (台/套)</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={manualCount}
                          onChange={(e) => setManualCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        onClick={handleAddManualDevice}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-2 rounded transition flex items-center justify-center"
                      >
                        ➕ 添加到下方临时清单
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Device List Category Tabs and Detail Form Editor */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-200">物理设备台账及参数完善</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">请切换下方页签，核对并完善各类型设备的物理参数和对齐物模型</p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    IOT平台物模型已就绪
                  </span>
                </div>

                {/* Horizontal Category Tab Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {['全部', '变压器', '并网柜', '储能柜', 'PCS', '电池簇', '光伏逆变器', '电表'].map((cat) => {
                    const count = cat === '全部' ? deviceList.length : deviceList.filter(d => d.type === cat).length;
                    const isActive = rightDeviceTab === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setRightDeviceTab(cat)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 border ${
                          isActive
                            ? 'bg-blue-600/95 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                            : 'bg-slate-950/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200 border-slate-800'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-blue-500 text-white font-bold' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Device Cards List */}
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar min-h-[300px]">
                  {(() => {
                    const filteredDevices = rightDeviceTab === '全部'
                      ? deviceList
                      : deviceList.filter(d => d.type === rightDeviceTab);

                    if (filteredDevices.length === 0) {
                      return (
                        <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
                          <Server size={32} className="text-slate-700 mb-2 animate-pulse" />
                          <span>当前分类下无待编录设备，请在左侧导入或切换页签</span>
                        </div>
                      );
                    }

                    return filteredDevices.map((item) => {
                      const compatibleModels = getThingModelsByType(item.type);
                      return (
                        <div 
                          key={item.id} 
                          className={`bg-slate-900/60 border rounded-lg p-4 space-y-4 transition-all hover:bg-slate-900/90 ${
                            item.errors && Object.keys(item.errors).some(k => item.errors![k])
                              ? 'border-red-500/80 bg-red-950/5 shadow-lg shadow-red-950/5'
                              : 'border-slate-800'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/60">
                            <div className="flex items-center space-x-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.type === '变压器' ? 'bg-blue-950 text-blue-300 border border-blue-800/40' :
                                item.type === '并网柜' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                                item.type === '储能柜' ? 'bg-purple-950 text-purple-300 border border-purple-800/40' :
                                item.type === 'PCS' ? 'bg-orange-950 text-orange-300 border border-orange-800/40' :
                                'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                              }`}>
                                {item.type}
                              </span>
                              
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateDeviceField(item.id, 'name', e.target.value)}
                                placeholder="设备名称"
                                className={`bg-slate-950 text-xs font-semibold text-slate-200 px-2 py-1 rounded border focus:outline-none focus:border-blue-500 min-w-[150px] ${
                                  item.errors?.name ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                }`}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Serial Number Input */}
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-500 whitespace-nowrap"><span className="text-red-500 mr-0.5">*</span>SN:</span>
                                <input
                                  type="text"
                                  value={item.sn || ''}
                                  onChange={(e) => updateDeviceField(item.id, 'sn', e.target.value)}
                                  placeholder="请输入SN编号"
                                  className={`bg-slate-950 text-[10px] text-slate-300 font-mono px-2 py-1 rounded border focus:outline-none focus:border-blue-500 w-36 ${
                                    item.errors?.sn ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                  }`}
                                />
                              </div>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteDevice(item.id)}
                                className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-950 transition ml-1"
                                title="从清单中移除"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Card Content: Thing Model and parameters */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            
                            {/* Aligned Thing Model Selection */}
                            <div className="md:col-span-1 space-y-1">
                              <label className="block text-[10px] font-semibold text-slate-400">对齐IOT平台物模型</label>
                              <select
                                value={item.thingModel.id}
                                onChange={(e) => {
                                  const matched = compatibleModels.find(m => m.id === e.target.value);
                                  if (matched) {
                                    updateDeviceField(item.id, 'thingModel', matched);
                                  }
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                              >
                                {compatibleModels.map(tm => (
                                  <option key={tm.id} value={tm.id}>
                                    {tm.name} ({tm.version})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Technical inputs based on type */}
                            <div className="md:col-span-2 grid grid-cols-2 gap-3">
                              
                              {/* 储能柜 required parameters */}
                              {item.type === '储能柜' && (
                                <>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">
                                      <span className="text-red-500 mr-0.5">*</span>装机容量 (kWh)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.capacity || ''}
                                      onChange={(e) => updateDeviceField(item.id, 'capacity', e.target.value)}
                                      placeholder="例: 200"
                                      className={`w-full bg-slate-950 border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                                        item.errors?.capacity ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">
                                      <span className="text-red-500 mr-0.5">*</span>额定功率 (kW)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.power || ''}
                                      onChange={(e) => updateDeviceField(item.id, 'power', e.target.value)}
                                      placeholder="例: 100"
                                      className={`w-full bg-slate-950 border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                                        item.errors?.power ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">
                                      <span className="text-red-500 mr-0.5">*</span>充放电循环次数 (次)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.cycles || ''}
                                      onChange={(e) => updateDeviceField(item.id, 'cycles', e.target.value)}
                                      placeholder="例: 6000"
                                      className={`w-full bg-slate-950 border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                                        item.errors?.cycles ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">无功补偿功率 (kVar)</label>
                                    <input
                                      type="number"
                                      value={item.reactivePower || ''}
                                      onChange={(e) => updateDeviceField(item.id, 'reactivePower', e.target.value)}
                                      placeholder="例: 50"
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                </>
                              )}

                              {/* 光伏逆变器 parameters */}
                              {item.type === '光伏逆变器' && (
                                <>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">
                                      <span className="text-red-500 mr-0.5">*</span>额定交流功率 (kW)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.power || ''}
                                      onChange={(e) => updateDeviceField(item.id, 'power', e.target.value)}
                                      placeholder="例: 110"
                                      className={`w-full bg-slate-950 border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                                        item.errors?.power ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">
                                      <span className="text-red-500 mr-0.5">*</span>光伏组件单瓦功率 (Wp)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.pvModulePower || ''}
                                      onChange={(e) => updateDeviceField(item.id, 'pvModulePower', e.target.value)}
                                      placeholder="例: 550"
                                      className={`w-full bg-slate-950 border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                                        item.errors?.pvModulePower ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">
                                      <span className="text-red-500 mr-0.5">*</span>接入组串数量 (串)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.stringCount || ''}
                                      onChange={(e) => updateDeviceField(item.id, 'stringCount', e.target.value)}
                                      placeholder="例: 12"
                                      className={`w-full bg-slate-950 border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                                        item.errors?.stringCount ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">接入网形式</label>
                                    <select
                                      value={item.gridType || '三相三线制'}
                                      onChange={(e) => updateDeviceField(item.id, 'gridType', e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                                    >
                                      <option value="三相三线制">三相三线制</option>
                                      <option value="三相四线制">三相四线制</option>
                                      <option value="单相接入">单相接入</option>
                                    </select>
                                  </div>
                                </>
                              )}

                              {/* PCS parameters */}
                              {item.type === 'PCS' && (
                                <>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">
                                      <span className="text-red-500 mr-0.5">*</span>额定变流功率 (kW)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.power || ''}
                                      onChange={(e) => updateDeviceField(item.id, 'power', e.target.value)}
                                      placeholder="例: 100"
                                      className={`w-full bg-slate-950 border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                                        item.errors?.power ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">电网类型</label>
                                    <select
                                      value={item.gridType || '三相三线制'}
                                      onChange={(e) => updateDeviceField(item.id, 'gridType', e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                                    >
                                      <option value="三相三线制">三相三线制</option>
                                      <option value="三相四线制">三相四线制</option>
                                    </select>
                                  </div>
                                </>
                              )}

                              {/* 电池簇 parameters */}
                              {item.type === '电池簇' && (
                                <>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">
                                      <span className="text-red-500 mr-0.5">*</span>容量 (kWh)
                                    </label>
                                    <input
                                      type="number"
                                      value={item.capacity || ''}
                                      onChange={(e) => updateDeviceField(item.id, 'capacity', e.target.value)}
                                      placeholder="例: 233"
                                      className={`w-full bg-slate-950 border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                                        item.errors?.capacity ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-800'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">允许反流控制</label>
                                    <select
                                      value={item.backflow || '否'}
                                      onChange={(e) => updateDeviceField(item.id, 'backflow', e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                                    >
                                      <option value="是">是</option>
                                      <option value="否">否</option>
                                    </select>
                                  </div>
                                </>
                              )}

                              {/* General device default fields (变压器, 并网柜, 电表) */}
                              {!['储能柜', '光伏逆变器', 'PCS', '电池簇'].includes(item.type) && (
                                <>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">通信接口方式</label>
                                    <select
                                      value={item.commType || 'Modbus TCP'}
                                      onChange={(e) => updateDeviceField(item.id, 'commType', e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                                    >
                                      <option value="Modbus TCP">Modbus TCP</option>
                                      <option value="Modbus RTU">Modbus RTU</option>
                                      <option value="DL/T 645">DL/T 645</option>
                                      <option value="IEC104">IEC104</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 mb-0.5">IP地址/物理串口</label>
                                    <input
                                      type="text"
                                      value={item.ipAddress || '192.168.1.10'}
                                      onChange={(e) => updateDeviceField(item.id, 'ipAddress', e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Footer totals */}
                {deviceList.length > 0 && (
                  <div className="bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>已编入物理设备种类：{deviceList.length} 个</span>
                    <span className="text-slate-200">
                      物理实例总计：<b className="text-blue-400 text-sm font-mono">{totalCount}</b> 台设备
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ================= STEP 4: CONFIGURE TOPOLOGY CONNECTION ================= */}
        {currentStep === 4 && (
          <div className="space-y-5">
            
            {/* Top configuration options */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              
              <div className="lg:col-span-1 bg-slate-900/60 p-4 rounded-lg border border-slate-800 space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">拓扑构建方式</span>
                  
                  {/* Disable App Topo if no application chosen has one */}
                  {selectedApplications.some(id => MOCK_STATION_APPLICATIONS.find(a => a.id === id)?.topologyRelation) ? (
                    <button
                      onClick={() => setTopologySource('app')}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs mb-2 transition flex items-center justify-between ${
                        topologySource === 'app'
                          ? 'bg-blue-950/40 border-blue-500 text-blue-200'
                          : 'bg-slate-950 border-slate-850 text-slate-400'
                      }`}
                    >
                      <span>🔄 沿用网关上报拓扑</span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-bold shrink-0">推荐</span>
                    </button>
                  ) : (
                    <div className="p-2.5 border border-dashed border-slate-800/80 rounded-lg text-[10px] text-slate-500 leading-normal mb-2">
                      ⚠️ 选中的同步网关未发现物理拓扑附件，不可选沿用网关拓扑方式。
                    </div>
                  )}

                  <button
                    onClick={() => setTopologySource('template')}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs mb-2 transition flex items-center justify-between ${
                      topologySource === 'template'
                        ? 'bg-blue-950/40 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    <span>📋 经典拓扑模板匹配</span>
                    <span className="text-[9px] bg-blue-950 text-blue-400 px-1.5 py-0.2 rounded font-bold shrink-0">一键对齐</span>
                  </button>

                  <button
                    onClick={() => { setTopologySource('custom'); handleInitCustomCanvas(); }}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                      topologySource === 'custom'
                        ? 'bg-blue-950/40 border-blue-500 text-blue-200'
                        : 'bg-slate-950 border-slate-850 text-slate-400'
                    }`}
                  >
                    <span>🎨 自定义绘制主网拓扑</span>
                  </button>
                </div>

                {topologySource === 'template' && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">选择主控物理拓扑模板</span>
                    {MOCK_TOPOLOGY_TEMPLATES.map(t => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`p-2 rounded cursor-pointer transition border text-left ${
                          selectedTemplateId === t.id
                            ? 'bg-slate-950 border-blue-500/50 text-slate-200'
                            : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-300">{t.name}</div>
                        <p className="text-[9px] mt-0.5 text-slate-500 leading-normal">{t.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visual canvas representation */}
              <div className="lg:col-span-3">
                {renderTopologyPreview()}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Wizard Footer Controls */}
      <div className="pt-6 border-t border-slate-800 flex items-center justify-between shrink-0">
        <div>
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex items-center space-x-1.5 px-4 py-2 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition"
            >
              <ArrowLeft size={14} />
              <span>上一步</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[10px] text-slate-500">向导支持：所有输入将实时写入系统环境</span>
          {currentStep < 4 ? (
            <button
              onClick={currentStep === 1 ? handleNextFromStep1 : currentStep === 3 ? handleNextFromStep3 : () => setCurrentStep(prev => prev + 1)}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg hover:shadow-blue-500/20 transition"
            >
              <span>继续下一步</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleFinishCreation}
              className="flex items-center space-x-1.5 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-lg hover:shadow-emerald-500/20 transition"
            >
              <span>验证并完成建站</span>
              <Check size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ================= MODAL: UPDATE THING MODEL ================= */}
      {isModelModalOpen && editingDeviceId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <span className="font-bold text-sm text-slate-200">修改设备对齐物模型</span>
              <button onClick={() => setIsModelModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-500 block">设备实例</span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {deviceList.find(d => d.id === editingDeviceId)?.name}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">可兼容物模型列表 (按版本倒序)</span>
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {getThingModelsByType(deviceList.find(d => d.id === editingDeviceId)?.type || '').map(tm => {
                    const isCurrent = deviceList.find(d => d.id === editingDeviceId)?.thingModel.id === tm.id;
                    return (
                      <div
                        key={tm.id}
                        onClick={() => handleUpdateThingModel(tm)}
                        className={`p-2.5 rounded border text-left cursor-pointer transition ${
                          isCurrent
                            ? 'bg-blue-950/30 border-blue-500 text-blue-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{tm.name}</span>
                          <span className="text-[9px] bg-slate-900 px-1.5 py-0.2 rounded text-slate-500 border border-slate-800">
                            {tm.version}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">所属产品组: {tm.product}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setIsModelModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs rounded transition"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS FULL WORKSPACE INTEGRATION MODAL ================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-7 max-w-md w-full text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-sm">
              <Check size={24} className="animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-gray-900">恭喜！智能建站已成功完成 ✅</h3>
              <p className="text-xs text-gray-500">您的全新站点已配置完毕，并成功部署上线</p>
            </div>

            {/* Configured resources overview list */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                <span className="text-gray-500">企业档案</span>
                <span className="text-gray-900 font-semibold">{selectedEnterprise?.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                <span className="text-gray-500">新建站点</span>
                <span className="text-blue-600 font-semibold">{stationForm.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                <span className="text-gray-500">部署版本</span>
                <span className="text-gray-800 font-medium">
                  {MOCK_VERSION_PACKAGES.find(v => v.id === selectedVersion)?.name || 'v2.1 高级版'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">物理设备</span>
                <span className="text-emerald-600 font-bold">{totalCount} 台</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={handleResetWizard}
                className="flex-1 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-lg transition-colors"
              >
                关闭，返回建站向导
              </button>
              <button
                type="button"
                onClick={handleGoToWorkspace}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm hover:shadow-blue-500/10 transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>去工作台</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
