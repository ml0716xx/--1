import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, MapPin, Server, Search, RotateCcw, Plus, X, ChevronDown, 
  ChevronRight, Check, AlertTriangle, Info, Trash2, Edit, Sparkles, Layout, RefreshCw,
  Upload, Download, Calendar
} from 'lucide-react';

// Compact rich mock data
const INITIAL_ENTERPRISES = [
  { id: 'E1', name: '山东威海荣成中医院', code: 'CO00048037', creditCode: '91371082724810374A', clientSource: '天合储能用户', stationCount: 1, contact: '荆汉进', phone: '18661675886' },
  { id: 'E2', name: '上海国际汽车城核心项目', code: 'CO00047815', creditCode: '91310114MA1GT47815', clientSource: '天合储能用户', stationCount: 1, contact: '汤勇', phone: '13918336813' },
  { id: 'E3', name: '天津市顺和食品有限公司', code: 'CO00047164', creditCode: '91120222MA07164716', clientSource: '天合储能用户', stationCount: 2, contact: '田旭雷', phone: '19902053388' },
  { id: 'E4', name: '扬州元氢项目', code: 'CO00046557', creditCode: '91321000MA26555577', clientSource: '富家新增用户', stationCount: 1, contact: '贺文有', phone: '13338707018' }
];

const INITIAL_STATIONS = [
  { id: 'CS1783648428', name: '荣成中医院', enterpriseName: '山东威海荣成中医院', emsSn: 'e60d3bb31b53791a', status: 'normal', address: '山东省威海市荣成市中医院', managerName: '荆汉进', phone: '18661675886', purchasePriceType: '固定分时电价', feedInPriceType: '固定价格', createdAt: '2026-07-10 09:54:37' },
  { id: 'CS1783565555', name: '核心贸易区步行街项目', enterpriseName: '上海国际汽车城核心项目', emsSn: '884285b2aab845d7', status: 'fault', address: '上海市嘉定区国际汽车城', managerName: '汤勇', phone: '13918336813', purchasePriceType: '固定分时电价', feedInPriceType: '固定价格', createdAt: '2026-07-09 11:07:54' },
  { id: 'CS1783405234', name: '顺和食品有限公司2#', enterpriseName: '天津市顺和食品有限公司', emsSn: '9cb40fc708313ac4', status: 'normal', address: '天津市武清区顺和食品有限公司', managerName: '田旭雷', phone: '19902053388', purchasePriceType: '固定分时电价', feedInPriceType: '固定价格', createdAt: '2026-07-07 14:22:26' },
  { id: 'CS1782554639', name: '天合元氢站点', enterpriseName: '扬州元氢项目', emsSn: '481d6dcf0072f348', status: 'normal', address: '江苏省扬州市邗江区天合元氢', managerName: '贺文有', phone: '13338707018', purchasePriceType: '固定分时电价', feedInPriceType: '固定价格', createdAt: '2026-06-27 18:05:03' }
];

const INITIAL_DEVICES = [
  { 
    id: 'THPT0000007L7C6IQN03S', 
    name: '变压器', 
    type: '变压器', 
    sn: 'THPT0000007L7C6IQN03S', 
    model: 'transfo01', 
    parent: '核心贸易区步行街项目', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-07-10 13:49:54',
    level: '一级',
    capacity: 2000,
    power: 2000,
    voltage: 0,
    current: 0,
    reverseFlow: '否',
    remarks: '主变压器设备'
  },
  { 
    id: 'THMEMET000P0SJ77D5LDS', 
    name: '关口电表', 
    type: '电表', 
    sn: 'TMEAA380400ED00M6260710560', 
    model: 'E200', 
    parent: '核心贸易区步行街项目', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-07-10 11:03:42',
    level: '--',
    capacity: 0,
    power: 0,
    voltage: 380,
    current: 100,
    reverseFlow: '否',
    remarks: '关口计量电表'
  },
  { 
    id: 'THBESSPCS0YIA4QSII5DS', 
    name: '1#PCS', 
    type: 'PCS', 
    sn: 'TESAR125261GT00M6260710607-PCS-001', 
    model: 'PCS', 
    parent: '1#储能', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-07-10 10:53:50',
    level: '--',
    capacity: 125,
    power: 125,
    voltage: 400,
    current: 180,
    reverseFlow: '否',
    remarks: '1#PCS变流器'
  },
  { 
    id: 'THBESSPCS0MPY7R1TM5BS', 
    name: '3#PCS', 
    type: 'PCS', 
    sn: 'TESAR125261GT00M6260710552-PCS-001', 
    model: 'PCS', 
    parent: '3#储能', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-07-07 13:45:36',
    level: '--',
    capacity: 125,
    power: 125,
    voltage: 400,
    current: 180,
    reverseFlow: '否',
    remarks: '3#PCS变流器'
  },
  { 
    id: 'THBESSPCS0LT2FWJ3DBTS', 
    name: '2#PCS', 
    type: 'PCS', 
    sn: 'TESAR125261GT00M6260710084-PCS-001', 
    model: 'PCS', 
    parent: '2#储能', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-07-06 17:35:30',
    level: '--',
    capacity: 125,
    power: 125,
    voltage: 400,
    current: 180,
    reverseFlow: '否',
    remarks: '2#PCS变流器'
  },
  { 
    id: 'THBESSBAT0TVIKI8XS4PS', 
    name: '1#电池簇', 
    type: '电池簇', 
    sn: 'TESAR125261GT00M6260710607-BAT-001', 
    model: 'BAT', 
    parent: '1#储能', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-07-06 14:05:38',
    level: '--',
    capacity: 200,
    power: 200,
    voltage: 750,
    current: 250,
    reverseFlow: '否',
    remarks: '1#储能电池模组'
  },
  { 
    id: 'THBESSBAT0QGQPJ54IKS', 
    name: '3#电池簇', 
    type: '电池簇', 
    sn: 'TESAR125261GT00M6260710552-BAT-001', 
    model: 'BAT', 
    parent: '3#储能', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-07-06 14:02:22',
    level: '--',
    capacity: 200,
    power: 200,
    voltage: 750,
    current: 250,
    reverseFlow: '否',
    remarks: '3#储能电池模组'
  },
  { 
    id: 'THBESSBAT010CR05SZX4S', 
    name: '2#电池簇', 
    type: '电池簇', 
    sn: 'TESAR125261GT00M6260710084-BAT-001', 
    model: 'BAT', 
    parent: '2#储能', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-07-02 15:47:34',
    level: '--',
    capacity: 200,
    power: 200,
    voltage: 750,
    current: 250,
    reverseFlow: '否',
    remarks: '2#储能电池模组'
  },
  { 
    id: 'THBESS000JVZL80689S', 
    name: '1#储能', 
    type: '储能', 
    sn: 'TESAR125261GT00M6260710607', 
    model: 'TSCI261-C', 
    parent: '变压器', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-06-26 09:14:57',
    level: '--',
    capacity: 261,
    power: 125,
    voltage: 400,
    current: 180,
    reverseFlow: '否',
    remarks: '1#储能系统集成柜'
  },
  { 
    id: 'THBESS000DDF50V25S7S', 
    name: '3#储能', 
    type: '储能', 
    sn: 'TESAR125261GT00M6260710552', 
    model: 'TSCI261-C', 
    parent: '变压器', 
    station: '核心贸易区步行街项目', 
    enterprise: '上海国际汽车城核心项目', 
    createdAt: '2026-06-25 17:23:27',
    level: '--',
    capacity: 261,
    power: 125,
    voltage: 400,
    current: 180,
    reverseFlow: '否',
    remarks: '3#储能系统集成柜'
  }
];

const INITIAL_LOCAL_APPLICATIONS = [
  { id: '2075457462867595264', name: '网关', type: '网关', sn: '884285b2aab845d7', applyTime: '2026-07-10 13:49:54', status: 'approved', deviceCount: 11, station: '核心贸易区步行街项目', enterprise: '上海国际汽车城核心项目' },
  { id: '2075415639046492160', name: '网关', type: '网关', sn: 'e60d3bb31b53791a', applyTime: '2026-07-10 11:03:42', status: 'approved', deviceCount: 8, station: '荣成中医院', enterprise: '山东威海荣成中医院' },
  { id: '2075413156175282176', name: '网关', type: '网关', sn: 'e60d3bb31b53791a', applyTime: '2026-07-10 10:53:50', status: 'pending', deviceCount: 8, station: '荣成中医院', enterprise: '山东威海荣成中医院' },
  { id: '2074369215844974592', name: '网关', type: '网关', sn: '9cb40fc708313ac4', applyTime: '2026-07-07 13:45:36', status: 'approved', deviceCount: 20, station: '顺和食品有限公司2#', enterprise: '天津市顺和食品有限公司' },
  { id: '2074064685276991488', name: '网关', type: '网关', sn: 'af176b0da30e09fc', applyTime: '2026-07-06 17:35:30', status: 'approved', deviceCount: 20, station: '天合元氢站点', enterprise: '扬州元氢项目' },
  { id: '2074011870904320000', name: '网关', type: '网关', sn: 'wbq12322', applyTime: '2026-07-06 14:05:38', status: 'pending', deviceCount: 5, station: '天合元氢站点', enterprise: '扬州元氢项目' },
  { id: '2074011049413455872', name: '网关', type: '网关', sn: 'wbq12322', applyTime: '2026-07-06 14:02:22', status: 'pending', deviceCount: 5, station: '天合元氢站点', enterprise: '扬州元氢项目' },
  { id: '2072587971882786816', name: '网关', type: '网关', sn: '50f9a0c9249178f7', applyTime: '2026-07-02 15:47:34', status: 'approved', deviceCount: 26, station: '顺和食品有限公司2#', enterprise: '天津市顺和食品有限公司' },
  { id: '2070314839809855488', name: '网关', type: '网关', sn: '4d6d90865057ad5d', applyTime: '2026-06-26 09:14:57', status: 'approved', deviceCount: 8, station: '顺和食品有限公司2#', enterprise: '天津市顺和食品有限公司' },
  { id: '2070075386058518528', name: '网关', type: '网关', sn: '4d6d90865057ad5d', applyTime: '2026-06-25 17:23:27', status: 'rejected', deviceCount: 8, station: '顺和食品有限公司2#', enterprise: '天津市顺和食品有限公司' }
];

export function GridWorkspaceContainer({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const [openTabs, setOpenTabs] = useState<string[]>(['enterprise', 'site', 'device', 'device-apply', 'topo']);
  
  const [enterprises, setEnterprises] = useState(INITIAL_ENTERPRISES);
  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [localDevices, setLocalDevices] = useState(INITIAL_LOCAL_APPLICATIONS);
  
  // Shared Navigation / Filtering States
  const [selectedStationForTopo, setSelectedStationForTopo] = useState('荣成中医院');
  const [siteFilterEnterprise, setSiteFilterEnterprise] = useState('');
  const [deviceFilterStation, setDeviceFilterStation] = useState('');
  const [addSitePreEnterprise, setAddSitePreEnterprise] = useState('');

  // Handle Tab sync with sidebar nav
  useEffect(() => {
    if (activeTab && !openTabs.includes(activeTab)) {
      setOpenTabs(prev => [...prev, activeTab]);
    }
  }, [activeTab]);

  const handleCloseTab = (tab: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tab === 'enterprise') return; // Non-closable primary dashboard
    const filtered = openTabs.filter(t => t !== tab);
    setOpenTabs(filtered);
    if (activeTab === tab) {
      const idx = openTabs.indexOf(tab);
      const nextActive = filtered[idx - 1] || filtered[0] || 'enterprise';
      setActiveTab(nextActive);
    }
  };

  const pendingCount = localDevices.filter(d => d.status === 'pending').length;

  return (
    <div className="flex flex-col h-full bg-gray-50/50 overflow-hidden">
      {/* Dynamic Multi-Tab Bar */}
      <div className="flex items-end bg-[#f3f4f6] border-b border-gray-200 px-4 pt-1.5 shrink-0">
        {openTabs.map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'enterprise' ? '企业管理' : 
                        tab === 'site' ? '站点管理' : 
                        tab === 'device' ? '设备管理' : 
                        tab === 'device-apply' ? '本地新建设备申请' : '拓扑管理';
          return (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`group relative flex items-center h-8 px-4 mr-1 rounded-t border-t border-x cursor-pointer transition-all text-xs font-semibold select-none ${
                isActive 
                  ? 'bg-white border-gray-200 text-blue-600 font-bold z-10 -mb-[1px]' 
                  : 'bg-gray-100/80 border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {tab === 'device-apply' && pendingCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
              )}
              <span>{label}</span>
              {tab === 'device-apply' && pendingCount > 0 && (
                <span className="ml-1.5 px-1 py-0.2 rounded-full text-[9px] bg-red-500 text-white font-bold scale-90">
                  {pendingCount}
                </span>
              )}
              {tab !== 'enterprise' && (
                <button
                  onClick={(e) => handleCloseTab(tab, e)}
                  className="ml-2 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all opacity-40 group-hover:opacity-100"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Dynamic Tab Panel Content */}
      <div className="flex-1 overflow-hidden p-4">
        {activeTab === 'enterprise' && (
          <EnterpriseTab 
            enterprises={enterprises} 
            onViewStations={(entName) => {
              setSiteFilterEnterprise(entName);
              setActiveTab('site');
            }}
            onAddStation={(entName) => {
              setAddSitePreEnterprise(entName);
              setActiveTab('site');
            }}
          />
        )}
        {activeTab === 'site' && (
          <SiteTab 
            stations={stations} 
            setStations={setStations}
            enterprises={enterprises}
            initialFilterEnterprise={siteFilterEnterprise}
            clearInitialFilterEnterprise={() => setSiteFilterEnterprise('')}
            preselectedEnterprise={addSitePreEnterprise}
            clearPreselectedEnterprise={() => setAddSitePreEnterprise('')}
            onManageDevices={(stName) => {
              setDeviceFilterStation(stName);
              setActiveTab('device');
            }}
            onEditTopology={(stName) => {
              setSelectedStationForTopo(stName);
              setActiveTab('topo');
            }}
          />
        )}
        {activeTab === 'device' && (
          <DeviceTab 
            devices={devices} 
            setDevices={setDevices}
            stations={stations}
            enterprises={enterprises}
            initialFilterStation={deviceFilterStation}
            clearInitialFilterStation={() => setDeviceFilterStation('')}
            pendingCount={pendingCount}
            onGoToApply={() => setActiveTab('device-apply')}
          />
        )}
        {activeTab === 'device-apply' && (
          <DeviceApplyTab 
            localDevices={localDevices} 
            setLocalDevices={setLocalDevices}
            onApprove={(app) => {
              // Update status to 'approved'
              setLocalDevices(prev => prev.map(d => d.id === app.id ? { ...d, status: 'approved' } : d));
              
              // Generate simulated devices corresponding to this gateway application!
              const generated = [];
              const count = app.deviceCount || 1;
              for (let i = 1; i <= count; i++) {
                const isPCS = i % 3 === 1;
                const isBat = i % 3 === 2;
                const type = isPCS ? 'PCS' : (isBat ? '电池簇' : '储能');
                const model = isPCS ? 'PCS' : (isBat ? 'BAT' : 'TSCI261-C');
                generated.push({
                  id: `TH${type.toUpperCase()}${Math.random().toString(36).substring(5, 10).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`,
                  name: `${Math.floor((i + 1) / 3) + 1}#${type}`,
                  type: type,
                  sn: `TESAR125261GT00M6260710${Math.floor(100 + Math.random() * 900)}-${type === '储能' ? '' : type.toUpperCase() + '-00' + i}`,
                  model: model,
                  parent: type === '储能' ? '变压器' : '1#储能',
                  station: app.station,
                  enterprise: app.enterprise,
                  createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
                  level: '--',
                  capacity: type === '储能' ? 261 : (type === '电池簇' ? 200 : 125),
                  power: type === '储能' ? 125 : (type === '电池簇' ? 200 : 125),
                  voltage: type === '电池簇' ? 750 : 400,
                  current: type === '电池簇' ? 250 : 180,
                  reverseFlow: '否',
                  remarks: '申请通过自动生成的本地设备'
                });
              }
              setDevices(prev => [...generated, ...prev]);
            }}
            onReject={(id) => {
              // Update status to 'rejected'
              setLocalDevices(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' } : d));
            }}
          />
        )}
        {activeTab === 'topo' && (
          <TopologyTab 
            stationName={selectedStationForTopo}
            stations={stations}
            setSelectedStation={setSelectedStationForTopo}
            devices={devices}
            setDevices={setDevices}
          />
        )}
      </div>
    </div>
  );
}

/* ================== TAB 1: Enterprise Tab ================== */
function EnterpriseTab({ enterprises, onViewStations, onAddStation }: { 
  enterprises: any[], onViewStations: (name: string) => void, onAddStation: (name: string) => void 
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contact, setContact] = useState('');
  const [source, setSource] = useState('');

  const filtered = enterprises.filter(e => 
    (!name || e.name.includes(name)) &&
    (!code || e.code.includes(code)) &&
    (!contact || e.contact.includes(contact)) &&
    (!source || e.clientSource.includes(source))
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 bg-[#fbfcfd] grid grid-cols-4 gap-4 items-end shrink-0">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">企业名称</label>
          <input type="text" placeholder="请输入" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">企业编号</label>
          <input type="text" placeholder="请输入" value={code} onChange={e => setCode(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">联系人</label>
          <input type="text" placeholder="请输入" value={contact} onChange={e => setContact(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500" />
        </div>
        <div className="flex space-x-2">
          <button onClick={() => { setName(''); setCode(''); setContact(''); setSource(''); }} className="flex-1 py-1.5 border border-gray-200 rounded text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center">重置</button>
          <button className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center">搜索</button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-[#f8f9fa] sticky top-0 font-bold border-b border-gray-200 z-10">
            <tr>
              <th className="px-4 py-2.5 text-xs text-gray-600">企业名称</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">企业编号</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">统一社会信用代码</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">客户来源</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">站点数量</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">联系人</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">手机号</th>
              <th className="px-4 py-2.5 text-xs text-gray-600 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filtered.map(e => (
              <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-700">{e.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{e.code}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{e.creditCode}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">{e.clientSource}</span></td>
                <td className="px-4 py-3 font-bold text-blue-600">{e.stationCount} 个</td>
                <td className="px-4 py-3 text-gray-600">{e.contact}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{e.phone}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center space-x-1.5">
                    <button onClick={() => onViewStations(e.name)} className="px-2 py-1 text-blue-600 border border-blue-200 hover:bg-blue-50/50 rounded text-[10px] font-medium transition-colors">查看站点</button>
                    <button onClick={() => onAddStation(e.name)} className="px-2 py-1 text-green-600 border border-green-200 hover:bg-green-50/50 rounded text-[10px] font-medium transition-colors">新增站点</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-500 flex justify-between">
        <span>共 {filtered.length} 条记录</span>
        <span>第 1/1 页</span>
      </div>
    </div>
  );
}

/* ================== TAB 2: Site Tab ================== */
function SiteTab({ 
  stations, setStations, enterprises, initialFilterEnterprise, clearInitialFilterEnterprise, 
  preselectedEnterprise, clearPreselectedEnterprise, onManageDevices, onEditTopology 
}: {
  stations: any[], setStations: any, enterprises: any[], initialFilterEnterprise: string, clearInitialFilterEnterprise: () => void,
  preselectedEnterprise: string, clearPreselectedEnterprise: () => void, onManageDevices: (name: string) => void, onEditTopology: (name: string) => void
}) {
  const [filterId, setFilterId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterEnterprise, setFilterEnterprise] = useState(initialFilterEnterprise || '');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);
  const [topoModalStation, setTopoModalStation] = useState<any>(null);
  const [newTopoName, setNewTopoName] = useState('');

  // Handle cross-tab navigation filter
  useEffect(() => {
    if (initialFilterEnterprise) {
      setFilterEnterprise(initialFilterEnterprise);
      clearInitialFilterEnterprise();
    }
  }, [initialFilterEnterprise]);

  // Handle cross-tab add pre-select
  useEffect(() => {
    if (preselectedEnterprise) {
      setEditingStation({ enterpriseName: preselectedEnterprise });
      setIsDrawerOpen(true);
      clearPreselectedEnterprise();
    }
  }, [preselectedEnterprise]);

  const filtered = stations.filter(s => 
    (!filterId || s.id.includes(filterId)) &&
    (!filterName || s.name.includes(filterName)) &&
    (!filterEnterprise || s.enterpriseName.includes(filterEnterprise))
  );

  const handleEdit = (station: any) => {
    setEditingStation(station);
    setIsDrawerOpen(true);
  };

  const handleSave = (formData: any) => {
    if (editingStation && editingStation.id) {
      setStations(stations.map(s => s.id === editingStation.id ? { ...s, ...formData } : s));
    } else {
      const newS = {
        ...formData,
        id: 'CS' + Math.floor(1000000000 + Math.random() * 9000000000),
        createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
        status: 'normal',
        emsSn: 'ems-' + Math.random().toString(36).substring(5)
      };
      setStations([newS, ...stations]);
    }
    setIsDrawerOpen(false);
    setEditingStation(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Filters & Actions */}
      <div className="p-4 border-b border-gray-100 bg-[#fbfcfd] flex flex-col gap-3 shrink-0">
        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">站点名称</label>
            <input type="text" placeholder="请输入" value={filterName} onChange={e => setFilterName(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">所属企业</label>
            <select value={filterEnterprise} onChange={e => setFilterEnterprise(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs bg-white outline-none focus:border-blue-500">
              <option value="">全部</option>
              {enterprises.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => { setFilterId(''); setFilterName(''); setFilterEnterprise(''); }} className="flex-1 py-1.5 border border-gray-200 rounded text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center">重置</button>
            <button className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center">搜索</button>
          </div>
          <div className="flex justify-end">
            <button onClick={() => { setEditingStation(null); setIsDrawerOpen(true); }} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center">新增站点</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead className="bg-[#f8f9fa] sticky top-0 font-bold border-b border-gray-200 z-10">
            <tr>
              <th className="px-4 py-2.5 text-xs text-gray-600">站点编号</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">站点名称</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">所属企业</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">主EMS网关SN</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">负责人</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">手机号</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">站点状态</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">购电类型</th>
              <th className="px-4 py-2.5 text-xs text-gray-600">创建时间</th>
              <th className="px-4 py-2.5 text-xs text-gray-600 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-gray-500">{s.id}</td>
                <td className="px-4 py-3 font-semibold text-gray-700">{s.name}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={s.enterpriseName}>{s.enterpriseName}</td>
                <td className="px-4 py-3 text-gray-400 font-mono">{s.emsSn}</td>
                <td className="px-4 py-3 text-gray-600">{s.managerName}</td>
                <td className="px-4 py-3 text-gray-500 font-mono">{s.phone}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    s.status === 'normal' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.status === 'normal' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {s.status === 'normal' ? '正常' : '故障'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.purchasePriceType}</td>
                <td className="px-4 py-3 text-gray-400 font-mono">{s.createdAt}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center space-x-1">
                    <button onClick={() => handleEdit(s)} className="px-1.5 py-0.5 text-blue-600 border border-blue-200 hover:bg-blue-50/50 rounded text-[10px] font-medium transition-colors">编辑</button>
                    <button onClick={() => onManageDevices(s.name)} className="px-1.5 py-0.5 text-blue-600 border border-blue-200 hover:bg-blue-50/50 rounded text-[10px] font-medium transition-colors">管理设备</button>
                    <button onClick={() => setTopoModalStation(s)} className="px-1.5 py-0.5 text-blue-600 border border-blue-200 hover:bg-blue-50/50 rounded text-[10px] font-medium transition-colors">管理拓扑</button>
                    <button onClick={() => setStations(stations.filter(st => st.id !== s.id))} className="px-1.5 py-0.5 text-red-600 border border-red-200 hover:bg-red-50/50 rounded text-[10px] font-medium transition-colors">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer consistent with Screenshot 2 */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
          <div className="relative w-[780px] bg-white h-full shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#fbfcfd]">
              <h3 className="text-sm font-bold text-gray-800">{editingStation?.id ? '编辑基础信息' : '新增站点'}</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X size={16} /></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleSave({
                name: fd.get('name'),
                enterpriseName: fd.get('enterpriseName'),
                managerName: fd.get('managerName'),
                phone: fd.get('phone'),
                purchasePriceType: fd.get('purchasePriceType') || '固定分时电价',
                feedInPriceType: fd.get('feedInPriceType') || '固定价格',
                address: fd.get('address')
              });
            }} className="flex-1 overflow-auto p-6 space-y-6 text-xs text-gray-700">
              
              {/* Basic Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-950 flex items-center border-l-2 border-blue-600 pl-2">基本信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600"><span className="text-red-500 mr-0.5">*</span>所属企业</label>
                    <select name="enterpriseName" defaultValue={editingStation?.enterpriseName || ''} required className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white">
                      <option value="">请选择</option>
                      {enterprises.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600">站点分类</label>
                    <select className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white">
                      <option value="storage">光储电站</option>
                      <option value="pv">纯光伏站</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600">站点名称</label>
                    <input name="name" type="text" required defaultValue={editingStation?.name || ''} className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600">负责人</label>
                    <input name="managerName" type="text" required defaultValue={editingStation?.managerName || ''} className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600">手机号</label>
                    <input name="phone" type="text" required defaultValue={editingStation?.phone || ''} className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600">购电电价类型</label>
                    <select name="purchasePriceType" defaultValue={editingStation?.purchasePriceType || '固定分时电价'} className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white">
                      <option value="固定分时电价">固定分时电价</option>
                      <option value="市场化价格">市场化价格</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-600">站点地址</label>
                  <input name="address" type="text" required defaultValue={editingStation?.address || ''} placeholder="请输入站点地址" className="w-full px-3 py-1.5 border border-gray-200 rounded mb-2 outline-none" />
                  <div className="h-44 bg-slate-100 rounded flex flex-col items-center justify-center border border-dashed border-gray-300 text-gray-400 font-mono relative">
                    <MapPin className="text-blue-500 opacity-60 mb-1" size={24} />
                    <span>AutoNavi Map Simulated Area</span>
                    <span className="absolute bottom-1.5 left-2 text-[9px] text-gray-400">高德地图 © 2026 AutoNavi - GS(2025)5996号</span>
                  </div>
                </div>
              </div>

              {/* PV Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-950 flex items-center border-l-2 border-blue-600 pl-2">光伏信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600">光伏装机容量 (Wp)</label>
                    <input type="text" defaultValue="140000" className="w-full px-3 py-1.5 border border-gray-200 rounded outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-600">是否配置辐照仪</label>
                    <select className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white"><option value="no">否</option><option value="yes">是</option></select>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-1.5 border border-gray-200 rounded hover:bg-gray-50 font-semibold">取消</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topology Selector Modal consistent with Screenshot 5 */}
      {topoModalStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTopoModalStation(null)}></div>
          <div className="relative bg-white rounded-lg shadow-2xl w-[480px] p-6 text-xs text-gray-700 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">管理拓扑图</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">站点：{topoModalStation.name}</p>
              </div>
              <button onClick={() => setTopoModalStation(null)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X size={14} /></button>
            </div>

            {/* Create */}
            <div className="mb-6 space-y-1.5">
              <label className="font-semibold text-gray-600">新增拓扑图</label>
              <div className="flex space-x-2">
                <input type="text" placeholder="请输入拓扑图名称" value={newTopoName} onChange={e => setNewTopoName(e.target.value)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded outline-none" />
                <button onClick={() => { if (newTopoName) { setNewTopoName(''); } }} className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center"><Plus size={12} className="mr-1"/> 添加</button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 mb-6">
              <label className="font-semibold text-gray-600 block">现有拓扑图列表</label>
              <div className="border border-gray-100 rounded-lg p-3 hover:border-blue-100 transition-all flex items-center justify-between bg-blue-50/20">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-800">站点拓扑</span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[9px] font-bold">使用中</span>
                  </div>
                  <p className="text-[10px] text-gray-400">创建时间：2026-07-10 11:28:11</p>
                </div>
                <button onClick={() => { onEditTopology(topoModalStation.name); setTopoModalStation(null); }} className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded font-bold transition-all shadow-sm">编辑拓扑</button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => setTopoModalStation(null)} className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 rounded font-semibold">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== TAB 3: Device Tab ================== */
function DeviceTab({ 
  devices, setDevices, stations, enterprises, initialFilterStation, clearInitialFilterStation, pendingCount, onGoToApply 
}: {
  devices: any[], setDevices: any, stations: any[], enterprises: any[], initialFilterStation: string, clearInitialFilterStation: () => void, pendingCount: number, onGoToApply: () => void
}) {
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [createSubTab, setCreateSubTab] = useState<'manual' | 'batch'>('manual');
  
  // List view search filters
  const [filterId, setFilterId] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterStation, setFilterStation] = useState(initialFilterStation || '');
  const [filterEnterprise, setFilterEnterprise] = useState('');

  // Edit drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [detailDevice, setDetailDevice] = useState<any>(null);

  // Manual creation states
  const [createStation, setCreateStation] = useState('全部');
  const [createBlocks, setCreateBlocks] = useState([
    { id: 1, type: '', sn: '', productName: '', name: '', model: '', remarks: '' }
  ]);

  // Sync station filter cross-tab
  useEffect(() => {
    if (initialFilterStation) {
      setFilterStation(initialFilterStation);
      clearInitialFilterStation();
    }
  }, [initialFilterStation]);

  // Handle resets
  const handleResetFilters = () => {
    setFilterId('');
    setFilterName('');
    setFilterType('');
    setFilterModel('');
    setFilterStation('');
    setFilterEnterprise('');
  };

  // Filter devices list
  const filtered = useMemo(() => {
    return devices.filter(d => 
      (!filterId || d.id.toLowerCase().includes(filterId.toLowerCase())) &&
      (!filterName || d.name.toLowerCase().includes(filterName.toLowerCase())) &&
      (!filterType || d.type === filterType) &&
      (!filterModel || d.model.toLowerCase().includes(filterModel.toLowerCase())) &&
      (!filterStation || d.station === filterStation) &&
      (!filterEnterprise || d.enterprise === filterEnterprise)
    );
  }, [devices, filterId, filterName, filterType, filterModel, filterStation, filterEnterprise]);

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPage, setJumpPage] = useState('');

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Save changes from drawer
  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updated = {
      ...editingDevice,
      station: fd.get('station') as string,
      enterprise: fd.get('enterprise') as string,
      name: fd.get('name') as string,
      parent: fd.get('parent') as string,
      type: fd.get('type') as string,
      model: fd.get('model') as string,
      level: fd.get('level') as string || '--',
      capacity: Number(fd.get('capacity')) || 0,
      power: Number(fd.get('power')) || 0,
      voltage: Number(fd.get('voltage')) || 0,
      current: Number(fd.get('current')) || 0,
      reverseFlow: fd.get('reverseFlow') as string,
      remarks: fd.get('remarks') as string,
      sn: fd.get('sn') as string,
    };
    setDevices(devices.map(d => d.id === editingDevice.id ? updated : d));
    setIsDrawerOpen(false);
    setEditingDevice(null);
  };

  // Add block in Manual Create
  const handleAddCreateBlock = () => {
    setCreateBlocks(prev => [
      ...prev,
      { id: Date.now() + Math.random(), type: '', sn: '', productName: '', name: '', model: '', remarks: '' }
    ]);
  };

  // Delete block in Manual Create
  const handleRemoveCreateBlock = (id: number) => {
    if (createBlocks.length > 1) {
      setCreateBlocks(prev => prev.filter(b => b.id !== id));
    }
  };

  // Update block fields in Manual Create
  const handleUpdateBlockField = (id: number, field: string, value: string) => {
    setCreateBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Confirm manual creation
  const handleConfirmManualCreate = () => {
    const actualStation = createStation === '全部' ? (stations[0]?.name || '核心贸易区步行街项目') : createStation;
    const matchSt = stations.find(s => s.name === actualStation);
    const actualEnterprise = matchSt ? matchSt.enterpriseName : (enterprises[0]?.name || '上海国际汽车城核心项目');

    const newDevicesList = createBlocks.map((block, idx) => {
      const parent = block.type === 'PCS' || block.type === '电池簇' ? '1#储能' : '变压器';
      return {
        id: 'THDEV' + Math.floor(1000000 + Math.random() * 9000000),
        name: block.name || `${block.type || '设备'}-${idx + 1}`,
        type: block.type || '储能',
        sn: block.sn || 'TME' + Math.floor(1000000000 + Math.random() * 9000000000),
        model: block.model || 'E200',
        parent: parent,
        station: actualStation,
        enterprise: actualEnterprise,
        createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
        level: '--',
        capacity: 0,
        power: 0,
        voltage: 0,
        current: 0,
        reverseFlow: '否',
        remarks: block.remarks || ''
      };
    });

    setDevices(prev => [...newDevicesList, ...prev]);
    setViewMode('list');
    setCreateBlocks([{ id: 1, type: '', sn: '', productName: '', name: '', model: '', remarks: '' }]);
    alert(`成功创建了 ${newDevicesList.length} 个新设备！`);
  };

  // Confirm batch creation (simulated)
  const handleConfirmBatchCreate = () => {
    const actualStation = createStation === '全部' ? (stations[0]?.name || '核心贸易区步行街项目') : createStation;
    const matchSt = stations.find(s => s.name === actualStation);
    const actualEnterprise = matchSt ? matchSt.enterpriseName : (enterprises[0]?.name || '上海国际汽车城核心项目');

    const batchList = [
      {
        id: 'THDEV' + Math.floor(1000000 + Math.random() * 9000000),
        name: '4#储能柜',
        type: '储能',
        sn: 'TESAR125261GT00M6260710999',
        model: 'TSCI261-C',
        parent: '变压器',
        station: actualStation,
        enterprise: actualEnterprise,
        createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
        level: '--',
        capacity: 261,
        power: 125,
        voltage: 400,
        current: 180,
        reverseFlow: '否',
        remarks: '批量导入设备'
      }
    ];

    setDevices(prev => [...batchList, ...prev]);
    setViewMode('list');
    alert('批量导入模板并创建设备成功！');
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "设备名称,设备类型,设备SN,设备型号,产品名称,备注\n"
      + "4#储能柜,储能,TESAR125261GT00M6260710999,TSCI261-C,1#储能柜,批量导入示例";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "新建设备批量模板.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {viewMode === 'list' ? (
        <>
          {/* Top Title Bar & Nav Links */}
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
            <h3 className="text-sm font-bold text-gray-800">设备管理</h3>
            <div className="flex items-center space-x-2">
              <button onClick={onGoToApply} className="relative px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded text-xs font-semibold flex items-center shadow-sm">
                本地新建设备申请
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-red-500 text-white font-bold leading-none animate-bounce">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setViewMode('create'); setCreateSubTab('manual'); }} 
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center shadow-sm"
              >
                新建设备
              </button>
            </div>
          </div>

          {/* Screenshot 1: Filters Grid */}
          <div className="p-4 border-b border-gray-100 bg-[#fbfcfd] shrink-0 space-y-3">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium shrink-0 w-16">设备ID</span>
                <input 
                  type="text" 
                  placeholder="请输入" 
                  value={filterId} 
                  onChange={e => { setFilterId(e.target.value); setCurrentPage(1); }} 
                  className="flex-1 px-3 py-1 border border-gray-200 rounded text-xs outline-none bg-white focus:border-blue-500" 
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium shrink-0 w-16">设备名称</span>
                <input 
                  type="text" 
                  placeholder="请输入" 
                  value={filterName} 
                  onChange={e => { setFilterName(e.target.value); setCurrentPage(1); }} 
                  className="flex-1 px-3 py-1 border border-gray-200 rounded text-xs outline-none bg-white focus:border-blue-500" 
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium shrink-0 w-16">设备类型</span>
                <select 
                  value={filterType} 
                  onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }} 
                  className="flex-1 px-2.5 py-1 border border-gray-200 rounded text-xs outline-none bg-white focus:border-blue-500"
                >
                  <option value="">全部</option>
                  <option value="变压器">变压器</option>
                  <option value="电表">电表</option>
                  <option value="PCS">PCS</option>
                  <option value="电池簇">电池簇</option>
                  <option value="储能">储能</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium shrink-0 w-16">设备型号</span>
                <input 
                  type="text" 
                  placeholder="请输入" 
                  value={filterModel} 
                  onChange={e => { setFilterModel(e.target.value); setCurrentPage(1); }} 
                  className="flex-1 px-3 py-1 border border-gray-200 rounded text-xs outline-none bg-white focus:border-blue-500" 
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium shrink-0 w-16">所属站点</span>
                <select 
                  value={filterStation} 
                  onChange={e => { setFilterStation(e.target.value); setCurrentPage(1); }} 
                  className="flex-1 px-2.5 py-1 border border-gray-200 rounded text-xs outline-none bg-white focus:border-blue-500"
                >
                  <option value="">全部</option>
                  {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium shrink-0 w-16">所属企业</span>
                <select 
                  value={filterEnterprise} 
                  onChange={e => { setFilterEnterprise(e.target.value); setCurrentPage(1); }} 
                  className="flex-1 px-2.5 py-1 border border-gray-200 rounded text-xs outline-none bg-white focus:border-blue-500"
                >
                  <option value="">全部</option>
                  {enterprises.map(ent => <option key={ent.id} value={ent.name}>{ent.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-1 border-t border-gray-50">
              <button 
                onClick={handleResetFilters} 
                className="px-4 py-1.5 border border-gray-200 rounded text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center shadow-sm"
              >
                重置
              </button>
              <button 
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center shadow-sm"
              >
                搜索
              </button>
            </div>
          </div>

          {/* Devices Data Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead className="bg-[#f8f9fa] border-b border-gray-200 sticky top-0 font-bold z-10 text-[11px] text-gray-600">
                <tr>
                  <th className="px-4 py-2.5">设备ID</th>
                  <th className="px-4 py-2.5">设备名称</th>
                  <th className="px-4 py-2.5">设备类型</th>
                  <th className="px-4 py-2.5">设备SN</th>
                  <th className="px-4 py-2.5">设备型号</th>
                  <th className="px-4 py-2.5">设备父级</th>
                  <th className="px-4 py-2.5">所属站点</th>
                  <th className="px-4 py-2.5">所属企业</th>
                  <th className="px-4 py-2.5">创建时间</th>
                  <th className="px-4 py-2.5 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px] text-gray-700">
                {currentRecords.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-gray-400 select-all">{d.id}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{d.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        d.type === '变压器' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        d.type === '电表' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        d.type === 'PCS' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        d.type === '电池簇' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {d.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-gray-400 select-all" title={d.sn}>{d.sn}</td>
                    <td className="px-4 py-2.5 text-gray-600">{d.model}</td>
                    <td className="px-4 py-2.5 text-gray-500 font-medium">{d.parent || '--'}</td>
                    <td className="px-4 py-2.5 text-gray-600 font-medium">{d.station}</td>
                    <td className="px-4 py-2.5 text-gray-500 font-medium truncate max-w-[160px]" title={d.enterprise}>{d.enterprise}</td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono">{d.createdAt}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => setDetailDevice(d)} className="text-blue-600 hover:underline font-semibold">详情</button>
                        <button onClick={() => { setEditingDevice(d); setIsDrawerOpen(true); }} className="text-blue-600 hover:underline font-semibold">编辑</button>
                        <button onClick={() => { if(confirm('确定删除该设备吗？')) setDevices(devices.filter(dv => dv.id !== d.id)); }} className="text-red-500 hover:underline font-semibold">删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination controls matching Screenshot 2 style */}
          <div className="p-3 bg-[#f8f9fa] border-t border-gray-150 flex items-center justify-between text-xs text-gray-600 shrink-0 select-none">
            <div>
              共 <span className="font-bold text-gray-800">{filtered.length}</span> 条记录 第 <span className="font-bold text-gray-800">{currentPage}/{totalPages}</span> 页
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-200 bg-white hover:bg-gray-50 rounded text-xs font-semibold disabled:opacity-40"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    currentPage === i + 1 
                      ? 'bg-blue-600 text-white border border-blue-600' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-200 bg-white hover:bg-gray-50 rounded text-xs font-semibold disabled:opacity-40"
              >
                &gt;
              </button>

              <select 
                value={pageSize} 
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-gray-200 bg-white px-1.5 py-1 rounded text-xs font-medium"
              >
                <option value={5}>5条/页</option>
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
              </select>

              <div className="flex items-center space-x-1 pl-1">
                <span className="text-gray-400">跳转至</span>
                <input 
                  type="text" 
                  value={jumpPage} 
                  onChange={e => setJumpPage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const p = parseInt(jumpPage);
                      if (p >= 1 && p <= totalPages) {
                        setCurrentPage(p);
                        setJumpPage('');
                      }
                    }
                  }}
                  className="w-8 border border-gray-200 px-1 py-1 rounded text-center text-xs outline-none bg-white" 
                />
                <span className="text-gray-400">页</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Sub-pages: Manual & Batch Device Creation (Screenshot 3 & 4) */}
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
            <div className="flex space-x-6">
              <button 
                onClick={() => setCreateSubTab('manual')}
                className={`pb-1 text-sm font-bold transition-all select-none border-b-2 ${
                  createSubTab === 'manual' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                手动创建
              </button>
              <button 
                onClick={() => setCreateSubTab('batch')}
                className={`pb-1 text-sm font-bold transition-all select-none border-b-2 ${
                  createSubTab === 'batch' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                批量创建
              </button>
            </div>
            <button onClick={() => setViewMode('list')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>

          <div className="flex-1 overflow-auto p-5 space-y-4">
            {/* Header selection row */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-bold text-gray-600">设备所属站点</span>
                <select 
                  value={createStation} 
                  onChange={e => setCreateStation(e.target.value)}
                  className="px-2.5 py-1 border border-gray-200 rounded outline-none bg-white font-medium"
                >
                  <option value="全部">全部</option>
                  {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              {createSubTab === 'manual' && (
                <button 
                  onClick={handleAddCreateBlock}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center"
                >
                  添加设备
                </button>
              )}
            </div>

            {/* Dynamic Content Panels */}
            {createSubTab === 'manual' ? (
              <div className="space-y-4">
                {createBlocks.map((block, idx) => (
                  <div key={block.id} className="p-4 border border-gray-150 rounded-lg bg-gray-50/50 space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-800">设备序号 {String(idx + 1).padStart(2, '0')}</span>
                      {createBlocks.length > 1 && (
                        <button 
                          onClick={() => handleRemoveCreateBlock(block.id)}
                          className="text-[11px] font-bold text-red-500 hover:underline"
                        >
                          删除
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-xs text-gray-600">
                      <div className="space-y-1">
                        <label className="font-semibold block"><span className="text-red-500 mr-0.5">*</span>设备类型</label>
                        <select 
                          value={block.type} 
                          onChange={e => handleUpdateBlockField(block.id, 'type', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white outline-none"
                        >
                          <option value="">请选择设备类型</option>
                          <option value="变压器">变压器</option>
                          <option value="电表">电表</option>
                          <option value="PCS">PCS</option>
                          <option value="电池簇">电池簇</option>
                          <option value="储能">储能</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold block"><span className="text-red-500 mr-0.5">*</span>设备SN</label>
                        <input 
                          type="text" 
                          placeholder="请输入设备SN" 
                          value={block.sn}
                          onChange={e => handleUpdateBlockField(block.id, 'sn', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold block"><span className="text-red-500 mr-0.5">*</span>产品名称</label>
                        <select 
                          value={block.productName} 
                          onChange={e => handleUpdateBlockField(block.id, 'productName', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white outline-none"
                        >
                          <option value="">请选择产品名称</option>
                          <option value="关口电表">关口电表</option>
                          <option value="1#储能柜">1#储能柜</option>
                          <option value="1#PCS">1#PCS</option>
                          <option value="1#电池簇">1#电池簇</option>
                          <option value="3#PCS">3#PCS</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold block"><span className="text-red-500 mr-0.5">*</span>设备名称</label>
                        <input 
                          type="text" 
                          placeholder="请输入设备名称" 
                          value={block.name}
                          onChange={e => handleUpdateBlockField(block.id, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold block"><span className="text-red-500 mr-0.5">*</span>设备型号</label>
                        <select 
                          value={block.model} 
                          onChange={e => handleUpdateBlockField(block.id, 'model', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white outline-none"
                        >
                          <option value="">请选择设备型号</option>
                          <option value="transfo01">transfo01</option>
                          <option value="E200">E200</option>
                          <option value="PCS">PCS</option>
                          <option value="BAT">BAT</option>
                          <option value="TSCI261-C">TSCI261-C</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold block">备注</label>
                        <input 
                          type="text" 
                          placeholder="请输入" 
                          value={block.remarks}
                          onChange={e => handleUpdateBlockField(block.id, 'remarks', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded bg-white outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Screenshot 4: Batch Import Card
              <div className="border border-dashed border-gray-200 rounded-lg p-10 bg-white flex flex-col items-center justify-center space-y-4">
                <div className="flex space-x-3">
                  <label className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center">
                    上传
                    <input type="file" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        alert(`已选择文件: ${e.target.files[0].name}，点击“确认”即可导入。`);
                      }
                    }} />
                  </label>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="px-5 py-2 border border-blue-500 hover:bg-blue-50 text-blue-500 rounded text-xs font-bold transition-colors flex items-center"
                  >
                    下载模板
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-medium flex items-center">
                  已上传新建设备模板，将根据文件内容进行新建设备
                </p>
              </div>
            )}
          </div>

          {/* Bottom creation actions */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 shrink-0">
            <button 
              onClick={() => setViewMode('list')} 
              className="px-5 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-600 rounded text-xs font-bold transition-all"
            >
              取消
            </button>
            <button 
              onClick={createSubTab === 'manual' ? handleConfirmManualCreate : handleConfirmBatchCreate}
              className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-black transition-all shadow-md"
            >
              确认
            </button>
          </div>
        </>
      )}

      {/* Screenshot 1: Edit Device Slide-out Drawer */}
      {isDrawerOpen && editingDevice && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Gray masked backdrop */}
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" onClick={() => { setIsDrawerOpen(false); setEditingDevice(null); }}></div>
          
          {/* Right sliding panel */}
          <div className="relative bg-white w-[780px] h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h3 className="text-sm font-bold text-blue-600">编辑设备</h3>
              <button onClick={() => { setIsDrawerOpen(false); setEditingDevice(null); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50"><X size={16} /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-auto p-6 space-y-5 text-xs text-gray-700">
              <div className="grid grid-cols-3 gap-x-4 gap-y-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block"><span className="text-red-500 mr-0.5">*</span>所属站点</label>
                  <select name="station" defaultValue={editingDevice.station} required className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none bg-white">
                    {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block"><span className="text-red-500 mr-0.5">*</span>所属企业</label>
                  <select name="enterprise" defaultValue={editingDevice.enterprise} required className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none bg-white">
                    {enterprises.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 block">设备ID</label>
                  <input name="id" type="text" disabled value={editingDevice.id} className="w-full px-2.5 py-1.5 border border-gray-100 bg-gray-100 text-gray-400 rounded outline-none cursor-not-allowed font-mono font-bold" />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block"><span className="text-red-500 mr-0.5">*</span>设备名称</label>
                  <input name="name" type="text" required defaultValue={editingDevice.name} className="w-full px-2.5 py-1.5 border border-gray-200 rounded bg-white outline-none font-medium text-gray-800" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block">设备父级</label>
                  <select name="parent" defaultValue={editingDevice.parent || ''} className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none bg-white">
                    <option value="">无</option>
                    <option value="核心贸易区步行街项目">核心贸易区步行街项目</option>
                    <option value="变压器">变压器</option>
                    <option value="1#储能">1#储能</option>
                    <option value="2#储能">2#储能</option>
                    <option value="3#储能">3#储能</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block"><span className="text-red-500 mr-0.5">*</span>设备类型</label>
                  <select name="type" defaultValue={editingDevice.type} required className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none bg-white">
                    <option value="变压器">变压器</option>
                    <option value="电表">电表</option>
                    <option value="PCS">PCS</option>
                    <option value="电池簇">电池簇</option>
                    <option value="储能">储能</option>
                    <option value="EMS">EMS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block">设备型号</label>
                  <select name="model" defaultValue={editingDevice.model || 'transfo01'} className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none bg-white">
                    <option value="transfo01">transfo01</option>
                    <option value="E200">E200</option>
                    <option value="PCS">PCS</option>
                    <option value="BAT">BAT</option>
                    <option value="TSCI261-C">TSCI261-C</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block"><span className="text-red-500 mr-0.5">*</span>变压器层级</label>
                  <select name="level" defaultValue={editingDevice.level || '一级'} className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none bg-white">
                    <option value="一级">一级</option>
                    <option value="二级">二级</option>
                    <option value="三级">三级</option>
                    <option value="--">--</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block"><span className="text-red-500 mr-0.5">*</span>容量</label>
                  <div className="relative flex items-center">
                    <input name="capacity" type="number" required defaultValue={editingDevice.capacity || 2000} className="w-full pl-2.5 pr-10 py-1.5 border border-gray-200 rounded bg-white outline-none font-medium" />
                    <span className="absolute right-3 text-gray-400 font-bold select-none text-[10px]">kVA</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block"><span className="text-red-500 mr-0.5">*</span>额定功率</label>
                  <div className="relative flex items-center">
                    <input name="power" type="number" required defaultValue={editingDevice.power || 2000} className="w-full pl-2.5 pr-10 py-1.5 border border-gray-200 rounded bg-white outline-none font-medium" />
                    <span className="absolute right-3 text-gray-400 font-bold select-none text-[10px]">kW</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block">额定电压</label>
                  <div className="relative flex items-center">
                    <input name="voltage" type="number" defaultValue={editingDevice.voltage || 0} className="w-full pl-2.5 pr-10 py-1.5 border border-gray-200 rounded bg-white outline-none font-medium" />
                    <span className="absolute right-3 text-gray-400 font-bold select-none text-[10px]">V</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block">额定电流</label>
                  <div className="relative flex items-center">
                    <input name="current" type="number" defaultValue={editingDevice.current || 0} className="w-full pl-2.5 pr-10 py-1.5 border border-gray-200 rounded bg-white outline-none font-medium" />
                    <span className="absolute right-3 text-gray-400 font-bold select-none text-[10px]">A</span>
                  </div>
                </div>

                <div className="col-span-3 space-y-1 pt-1.5">
                  <label className="font-bold text-gray-600 block"><span className="text-red-500 mr-0.5">*</span>是否支持逆流</label>
                  <div className="flex items-center space-x-6 text-sm font-semibold">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input type="radio" name="reverseFlow" value="是" defaultChecked={editingDevice.reverseFlow === '是'} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                      <span>是</span>
                    </label>
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input type="radio" name="reverseFlow" value="否" defaultChecked={editingDevice.reverseFlow !== '是'} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                      <span>否</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="font-bold text-gray-600 block">备注</label>
                <textarea name="remarks" placeholder="请输入" defaultValue={editingDevice.remarks || ''} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded bg-white outline-none text-gray-800 focus:border-blue-500"></textarea>
              </div>

              {/* SN Section */}
              <div className="space-y-2 pt-2">
                <label className="font-bold text-gray-700 block text-xs">SN编号</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-700 font-mono font-bold tracking-wider select-all">
                  {editingDevice.sn}
                </div>
              </div>
            </form>

            {/* Slide-out Drawer Actions */}
            <div className="p-4 border-t border-gray-150 bg-gray-50 flex justify-end space-x-3 shrink-0">
              <button 
                type="button" 
                onClick={() => { setIsDrawerOpen(false); setEditingDevice(null); }} 
                className="px-5 py-1.5 border border-gray-300 bg-white hover:bg-gray-100 rounded text-xs font-bold transition-all text-gray-600"
              >
                取消
              </button>
              <button 
                type="submit"
                onClick={() => {}}
                className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-black transition-all shadow-md"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal Dialog */}
      {detailDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDetailDevice(null)}></div>
          <div className="relative bg-white rounded-lg shadow-2xl w-[440px] p-6 text-xs text-gray-700 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-gray-900">设备详细属性</h3>
              <button onClick={() => setDetailDevice(null)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><X size={14} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">设备名称:</span><span className="font-semibold text-gray-800">{detailDevice.name}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">设备类型:</span><span className="font-semibold text-blue-600">{detailDevice.type}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">设备编号/ID:</span><span className="font-mono text-gray-700 select-all">{detailDevice.id}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">序列号 (SN):</span><span className="font-mono text-gray-700 select-all">{detailDevice.sn}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">设备型号:</span><span className="text-gray-700 font-bold">{detailDevice.model}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">父级关联:</span><span className="text-gray-700">{detailDevice.parent || '--'}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">所属站点:</span><span className="text-gray-700">{detailDevice.station}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">所属企业:</span><span className="text-gray-700">{detailDevice.enterprise}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">逆流控制:</span><span className="font-bold">{detailDevice.reverseFlow || '否'}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">容量 / 额定功率:</span><span className="text-gray-700">{(detailDevice.capacity || 0) + ' kVA / ' + (detailDevice.power || 0) + ' kW'}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">额定电压 / 电流:</span><span className="text-gray-700">{(detailDevice.voltage || 0) + ' V / ' + (detailDevice.current || 0) + ' A'}</span></div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5"><span className="text-gray-400">注册时间:</span><span className="font-mono text-gray-500">{detailDevice.createdAt}</span></div>
              <div className="flex justify-between pb-1.5"><span className="text-gray-400">备注说明:</span><span className="text-gray-600 font-medium italic">{detailDevice.remarks || '无'}</span></div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button onClick={() => setDetailDevice(null)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold shadow-sm">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== TAB 4: Local Applications Tab ================== */
function DeviceApplyTab({ localDevices, setLocalDevices, onApprove, onReject }: {
  localDevices: any[], setLocalDevices: any, onApprove: (app: any) => void, onReject: (id: string) => void
}) {
  // Search & Filter state values (Screenshot 2)
  const [snSearch, setSnSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Date range state simulation
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredApps = useMemo(() => {
    return localDevices.filter(app => {
      const matchSn = !snSearch || app.sn.toLowerCase().includes(snSearch.toLowerCase());
      const matchStatus = !statusFilter || app.status === statusFilter;
      const matchDate = (!startDate || app.applyTime >= startDate) && (!endDate || app.applyTime <= endDate);
      return matchSn && matchStatus && matchDate;
    });
  }, [localDevices, snSearch, statusFilter, startDate, endDate]);

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPage, setJumpPage] = useState('');

  const totalPages = Math.ceil(filteredApps.length / pageSize) || 1;
  const currentRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApps.slice(start, start + pageSize);
  }, [filteredApps, currentPage, pageSize]);

  const handleReset = () => {
    setSnSearch('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Title section */}
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
        <div>
          <h3 className="text-sm font-bold text-gray-800">就地新建设备申请</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">记录网关自动上报采集发现的设备，支持多维条件过滤与一键审核</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold">
          待审核申请：{localDevices.filter(d => d.status === 'pending').length} 个
        </span>
      </div>

      {/* Screenshot 2 Filter Bar */}
      <div className="p-4 border-b border-gray-100 bg-[#fbfcfd] shrink-0 space-y-3">
        <div className="grid grid-cols-3 gap-x-4 gap-y-3 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-semibold shrink-0 w-16">网关SN</span>
            <input 
              type="text" 
              placeholder="请输入网关SN" 
              value={snSearch} 
              onChange={e => { setSnSearch(e.target.value); setCurrentPage(1); }} 
              className="flex-1 px-3 py-1 border border-gray-200 rounded text-xs outline-none bg-white focus:border-blue-500 font-mono" 
            />
          </div>

          {/* Date Picker Range Picker Styled like Screenshot 2 */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-semibold shrink-0 w-16">申请时间</span>
            <div className="flex-1 border border-gray-200 rounded px-2.5 py-1 bg-white flex items-center space-x-1.5 focus-within:border-blue-500">
              <Calendar size={12} className="text-gray-400 shrink-0" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs text-gray-600 border-none outline-none bg-transparent" 
              />
              <span className="text-gray-300 text-[10px]">至</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs text-gray-600 border-none outline-none bg-transparent" 
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-semibold shrink-0 w-16">申请状态</span>
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none bg-white focus:border-blue-500 font-medium"
            >
              <option value="">请选择申请状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-1 border-t border-gray-50">
          <button 
            onClick={handleReset} 
            className="px-4 py-1.5 border border-gray-200 rounded text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center shadow-sm"
          >
            重置
          </button>
          <button 
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center shadow-sm"
          >
            搜索
          </button>
        </div>
      </div>

      {/* Screenshot 2: Data Table */}
      <div className="flex-1 overflow-auto">
        {filteredApps.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 py-16">
            <Check size={32} className="text-green-500 bg-green-50 p-2 rounded-full" />
            <span className="text-xs font-medium">暂无匹配的就地申请记录</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#f8f9fa] border-b border-gray-200 sticky top-0 font-bold z-10 text-[11px] text-gray-600">
              <tr>
                <th className="px-5 py-2.5">申请ID</th>
                <th className="px-5 py-2.5">申请说明</th>
                <th className="px-5 py-2.5">网关SN</th>
                <th className="px-5 py-2.5">申请时间</th>
                <th className="px-5 py-2.5">申请状态</th>
                <th className="px-5 py-2.5">设备数量</th>
                <th className="px-5 py-2.5 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px] text-gray-700">
              {currentRecords.map(app => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-gray-500 font-bold select-all">{app.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{app.name}</td>
                  <td className="px-5 py-3 font-mono text-gray-600 font-semibold select-all">{app.sn}</td>
                  <td className="px-5 py-3 font-mono text-gray-400">{app.applyTime}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center font-bold">
                      {app.status === 'approved' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                          <span className="text-green-600">已通过</span>
                        </>
                      )}
                      {app.status === 'pending' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse" />
                          <span className="text-blue-600">待审核</span>
                        </>
                      )}
                      {app.status === 'rejected' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
                          <span className="text-red-600">已拒绝</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-800 font-bold">{app.deviceCount || 1}</td>
                  <td className="px-5 py-3 text-center">
                    {app.status === 'pending' ? (
                      <div className="flex justify-center space-x-3 text-xs font-bold">
                        <button 
                          onClick={() => {
                            if (confirm(`确定批准该申请并自动绑定其 ${app.deviceCount} 个就地设备吗？`)) {
                              onApprove(app);
                            }
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          审核
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('确定拒绝该就地设备绑定申请吗？')) {
                              onReject(app.id);
                            }
                          }}
                          className="text-red-500 hover:underline"
                        >
                          拒绝
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Pagination controls matching Screenshot 2 style exactly */}
      <div className="p-3 bg-[#f8f9fa] border-t border-gray-150 flex items-center justify-between text-xs text-gray-600 shrink-0 select-none">
        <div>
          共 <span className="font-bold text-gray-800">{filteredApps.length}</span> 条记录 第 <span className="font-bold text-gray-800">{currentPage}/{totalPages}</span> 页
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 border border-gray-200 bg-white hover:bg-gray-50 rounded text-xs font-semibold disabled:opacity-40"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentPage(i + 1)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                currentPage === i + 1 
                  ? 'bg-blue-600 text-white border border-blue-600' 
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border border-gray-200 bg-white hover:bg-gray-50 rounded text-xs font-semibold disabled:opacity-40"
          >
            &gt;
          </button>

          <select 
            value={pageSize} 
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-200 bg-white px-1.5 py-1 rounded text-xs font-medium"
          >
            <option value={5}>5条/页</option>
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
          </select>

          <div className="flex items-center space-x-1 pl-1">
            <span className="text-gray-400">跳转至</span>
            <input 
              type="text" 
              value={jumpPage} 
              onChange={e => setJumpPage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const p = parseInt(jumpPage);
                  if (p >= 1 && p <= totalPages) {
                    setCurrentPage(p);
                    setJumpPage('');
                  }
                }
              }}
              className="w-8 border border-gray-200 px-1 py-1 rounded text-center text-xs outline-none bg-white" 
            />
            <span className="text-gray-400">页</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================== TAB 5: Topology Tab ================== */
function TopologyTab({ stationName, stations, setSelectedStation, devices, setDevices }: {
  stationName: string, stations: any[], setSelectedStation: (n: string) => void, devices: any[], setDevices: any
}) {
  const [layout, setLayout] = useState<'V' | 'H'>('H');
  const [isEditMode, setIsEditMode] = useState(false);
  const [addingNodeParent, setAddingNodeParent] = useState<string | null>(null);

  // Active station selection
  const activeStation = stations.find(s => s.name === stationName) || stations[0] || { name: '荣成中医院', id: 'CS1783648428' };

  // Generate dynamic topology nodes based on current devices list
  const topoDevices = useMemo(() => {
    return devices.filter(d => d.station === activeStation.name);
  }, [devices, activeStation.name]);

  const handleAddNode = (parentName: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const type = fd.get('type') as string;
    const name = fd.get('name') as string;

    const newDev = {
      id: 'TDEV' + Math.floor(1000 + Math.random() * 9000),
      name: name,
      type: type,
      sn: 'SN-' + Math.random().toString(36).substring(5).toUpperCase(),
      model: type + '-GEN',
      parent: parentName,
      station: activeStation.name,
      enterprise: activeStation.enterpriseName || '天合储能',
      createdAt: new Date().toISOString().replace('T', ' ').split('.')[0]
    };

    setDevices(prev => [...prev, newDev]);
    setAddingNodeParent(null);
  };

  return (
    <div className="flex h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm text-xs">
      {/* Left Sidebar Tree consistent with Screenshot 6 */}
      <div className="w-56 border-r border-gray-200 bg-gray-50/50 flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-100 bg-white">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">当前拓扑站点</label>
          <select value={activeStation.name} onChange={e => setSelectedStation(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white outline-none">
            {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <p className="font-bold text-gray-800 mb-2 flex items-center">设备层级树</p>
          <div className="space-y-2">
            <div className="font-semibold text-gray-900 bg-blue-50/50 p-1.5 rounded flex items-center"><ChevronDown size={12} className="mr-1 text-blue-500" /> {activeStation.name}</div>
            
            {/* Transformer */}
            <div className="pl-3 space-y-1.5 border-l border-gray-200 ml-2">
              <div className="text-gray-700 flex items-center font-medium"><ChevronDown size={11} className="mr-1 text-amber-500" /> ⚡ 变压器</div>
              
              {/* Bus */}
              <div className="pl-3 space-y-1 border-l border-gray-200 ml-1.5">
                <div className="text-gray-600 flex items-center"><ChevronDown size={11} className="mr-1 text-indigo-500" /> 📦 Bus2</div>
                
                {/* Storages */}
                <div className="pl-3 space-y-1.5 border-l border-gray-200 ml-1.5">
                  {topoDevices.filter(d => d.type === '储能').map(d => (
                    <div key={d.id} className="space-y-1">
                      <div className="text-gray-600 font-semibold flex items-center">🔋 {d.name}</div>
                      <div className="pl-3 ml-1 text-gray-400 space-y-0.5">
                        {topoDevices.filter(sub => sub.parent === d.name).map(sub => (
                          <div key={sub.id} className="flex items-center">
                            <span className="text-[10px] mr-1">{sub.type === 'PCS' ? '🔌' : '🔋'}</span> {sub.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Canvas Layout consistent with Screenshot 6 */}
      <div className="flex-1 flex flex-col bg-[#fbfcfd] overflow-hidden">
        {/* Top bar controls */}
        <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-6">
            <div className="flex bg-gray-100 rounded p-0.5 border border-gray-200">
              <button onClick={() => setLayout('V')} className={`px-3 py-1 rounded text-[10px] font-semibold transition-all ${layout === 'V' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>纵向视图</button>
              <button onClick={() => setLayout('H')} className={`px-3 py-1 rounded text-[10px] font-semibold transition-all ${layout === 'H' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>横向视图</button>
            </div>
            
            {/* Status Legends */}
            <div className="flex items-center space-x-3 text-[10px] text-gray-500 font-medium">
              <span>运行状态：</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span> 正常</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> 故障</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-gray-400 mr-1"></span> 离线</span>
            </div>
          </div>

          <button onClick={() => setIsEditMode(!isEditMode)} className={`px-4 py-1 rounded text-[10px] font-bold shadow-sm transition-all ${isEditMode ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {isEditMode ? '退出编辑' : '编辑拓扑'}
          </button>
        </div>

        {/* Visual Node Diagram Canvas */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center min-h-[500px]">
          <div className={`flex ${layout === 'H' ? 'flex-row items-center space-x-12' : 'flex-col items-center space-y-12'} relative`}>
            
            {/* Level 1: Station Root */}
            <div className="relative flex flex-col items-center">
              <div className="bg-white border border-blue-200 rounded-lg p-3 w-40 shadow-sm border-l-4 border-l-blue-600">
                <div className="font-bold text-gray-800 flex items-center">站点Bus</div>
                <div className="text-[10px] text-gray-400 mt-1">编号: {activeStation.id.slice(0, 12)}</div>
                <div className="text-[10px] text-gray-600 mt-0.5 truncate font-semibold">{activeStation.name}</div>
              </div>
              {layout === 'H' && <div className="absolute right-[-48px] top-1/2 w-12 h-[1px] bg-gray-300 border-dashed border-t"></div>}
              {layout === 'V' && <div className="absolute bottom-[-48px] left-1/2 w-[1px] h-12 bg-gray-300 border-dashed border-l"></div>}
            </div>

            {/* Level 2: Transformer & Electric Meter Sidecar */}
            <div className="relative flex flex-col items-center">
              <div className="flex space-x-3">
                {/* Transformer Node */}
                <div className="bg-white border border-amber-200 rounded-lg p-3 w-40 shadow-sm border-l-4 border-l-amber-500">
                  <div className="font-bold text-gray-800 flex items-center">⚡ 变压器</div>
                  <div className="text-[10px] text-gray-400 mt-1">设备ID: THPT001</div>
                  <div className="text-[10px] text-gray-600 mt-0.5 font-semibold">主厂变压器A</div>
                  {isEditMode && (
                    <button onClick={() => setAddingNodeParent('变压器')} className="mt-2 w-full py-0.5 border border-dashed border-amber-300 rounded text-[9px] text-amber-600 font-bold hover:bg-amber-50 transition-all">+ 添加下级</button>
                  )}
                </div>

                {/* Meter Sidecar */}
                <div className="bg-white border border-indigo-200 rounded-lg p-3 w-36 shadow-sm border-l-4 border-l-indigo-500 relative">
                  <div className="font-bold text-gray-800 flex items-center">🔌 关口电表</div>
                  <div className="text-[10px] text-gray-400 mt-1">型号: E200</div>
                  <div className="text-[10px] text-gray-600 mt-0.5 truncate font-semibold">关口计量表A</div>
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
              </div>
              {layout === 'H' && <div className="absolute right-[-48px] top-1/2 w-12 h-[1px] bg-gray-300 border-dashed border-t"></div>}
              {layout === 'V' && <div className="absolute bottom-[-48px] left-1/2 w-[1px] h-12 bg-gray-300 border-dashed border-l"></div>}
            </div>

            {/* Level 3: Bus2 Node */}
            <div className="relative flex flex-col items-center">
              <div className="bg-white border border-indigo-200 rounded-lg p-3 w-40 shadow-sm border-l-4 border-l-indigo-500">
                <div className="font-bold text-gray-800 flex items-center">📦 节点Bus</div>
                <div className="text-[10px] text-gray-400 mt-1">节点名称</div>
                <div className="text-[10px] text-gray-600 mt-0.5 font-semibold">Bus2 交流汇流母线</div>
              </div>
              {layout === 'H' && <div className="absolute right-[-48px] top-1/2 w-12 h-[1px] bg-gray-300 border-dashed border-t"></div>}
              {layout === 'V' && <div className="absolute bottom-[-48px] left-1/2 w-[1px] h-12 bg-gray-300 border-dashed border-l"></div>}
            </div>

            {/* Level 4: Dynamically Renders Energy Storage Cabinet list and sub nodes */}
            <div className={`flex ${layout === 'H' ? 'flex-col space-y-6' : 'flex-row space-x-6'} relative`}>
              {topoDevices.filter(d => d.type === '储能').map(( cabinet, idx, arr ) => {
                const subNodes = topoDevices.filter(sub => sub.parent === cabinet.name);
                return (
                  <div key={cabinet.id} className="flex items-center space-x-6 border border-dashed border-gray-200 rounded-lg p-3.5 bg-white shadow-sm relative">
                    
                    {/* Cabinet Card */}
                    <div className="bg-white border border-green-200 rounded-lg p-2.5 w-36 border-l-4 border-l-green-500 shadow-sm relative">
                      <div className="font-bold text-gray-800 flex items-center justify-between">
                        <span>🔋 {cabinet.name}</span>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      </div>
                      <p className="text-[9px] text-gray-400 font-mono mt-1">{cabinet.sn}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">{cabinet.model}</p>
                      {isEditMode && (
                        <div className="mt-2 flex space-x-1">
                          <button onClick={() => setAddingNodeParent(cabinet.name)} className="flex-1 py-0.5 border border-dashed border-green-300 rounded text-[9px] text-green-600 font-bold hover:bg-green-50">+ 下级</button>
                          <button onClick={() => setDevices(devices.filter(dv => dv.id !== cabinet.id))} className="px-1.5 py-0.5 text-red-500 border border-red-100 rounded hover:bg-red-50"><Trash2 size={10}/></button>
                        </div>
                      )}
                    </div>

                    {/* Sub Nodes linked (e.g. PCS, Battery Cluster) */}
                    <div className="flex flex-col space-y-2">
                      {subNodes.map(sub => (
                        <div key={sub.id} className="bg-gray-50 border border-gray-200 rounded p-1.5 w-32 flex items-center justify-between shadow-xs">
                          <div>
                            <p className="font-semibold text-gray-700 text-[10px]">{sub.name}</p>
                            <p className="text-[8px] text-gray-400">{sub.model}</p>
                          </div>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* Inline Node creation dialog in Edit mode */}
      {addingNodeParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddingNodeParent(null)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-[320px] p-5 text-xs text-gray-700 z-10">
            <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">添加拓扑下级设备</h3>
            <p className="text-[10px] text-gray-400 mb-4">父级节点: {addingNodeParent}</p>
            
            <form onSubmit={(e) => handleAddNode(addingNodeParent, e)} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-gray-600">设备类型</label>
                <select name="type" className="w-full px-2.5 py-1.5 border border-gray-200 rounded bg-white outline-none">
                  <option value="PCS">PCS (变流器)</option>
                  <option value="电池簇">电池簇 (BAT)</option>
                  <option value="储能">储能柜 (Cabinet)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-600">设备名称</label>
                <input name="name" type="text" required placeholder="如: 3#PCS" className="w-full px-2.5 py-1.5 border border-gray-200 rounded outline-none" />
              </div>
              <div className="flex justify-end pt-2 space-x-2">
                <button type="button" onClick={() => setAddingNodeParent(null)} className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
