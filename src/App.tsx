import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Building2, MapPin, Server, BadgeDollarSign, ChevronLeft, Search, RotateCcw, Plus, User, Bell, Calendar, X, ChevronDown, RefreshCw } from 'lucide-react';

// --- Types & Mock Data ---

type Province = {
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
};

type SalesPrice = {
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

const SALES_PRICES: SalesPrice[] = [
  { id: '1', level1Region: '湖北省', latestPredictedDate: '2026-05-21', latestSettlementDate: '2026-05-15', boundStationsCount: 3 },
  { id: '2', level1Region: '河南省', latestPredictedDate: '2026-05-24', latestSettlementDate: '2026-05-18', boundStationsCount: 0 },
  { id: '3', level1Region: '湖南省', latestPredictedDate: '2026-05-24', latestSettlementDate: '2026-05-18', boundStationsCount: 1 },
];

const PROVINCES: Province[] = [
  { id: '1', level1Region: '江苏省', name: '江苏省', priceName: '江苏省固定分时', usageType1: '单一制(100千伏安及以上)', usageType2: '工商业', voltage: '1~10（20）千伏', boundStationsCount: 1, latestMonth: '2026-05', latestPredictedDate: '2026-05-21' },
  { id: '2', level1Region: '山东省', name: '山东省', priceName: '山东电价07', usageType1: '单一制', usageType2: '工商业', voltage: '1~10千伏', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24' },
  { id: '3', level1Region: '山东省', name: '山东省', priceName: '山东电价06', usageType1: '单一制', usageType2: '工商业', voltage: '不满1千伏', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24' },
  { id: '4', level1Region: '山东省', name: '山东省', priceName: '山东电价05', usageType1: '两部制', usageType2: '工商业', voltage: '220千伏及以上', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24' },
  { id: '5', level1Region: '山东省', name: '山东省', priceName: '山东电价04', usageType1: '两部制', usageType2: '工商业', voltage: '110~220千伏以下', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24' },
  { id: '6', level1Region: '山东省', name: '山东省', priceName: '山东电价03', usageType1: '两部制', usageType2: '工商业', voltage: '1~10千伏', boundStationsCount: 0, latestMonth: '2026-05', latestPredictedDate: '2026-05-24' },
  { id: '7', level1Region: '山东省', name: '山东省', priceName: '山东电价02', usageType1: '两部制', usageType2: '工商业', voltage: '35~110千伏以下', boundStationsCount: 1, latestMonth: '2026-05', latestPredictedDate: '2026-05-24' },
  { id: '8', level1Region: '山东省', name: '山东省', priceName: '山东电价01', usageType1: '单一制', usageType2: '工商业', voltage: '35千伏及以上', boundStationsCount: 1, latestMonth: '2026-05', latestPredictedDate: '2026-05-24' },
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

// --- Components ---

export default function App() {
  const [activeMenu, setActiveMenu] = useState('purchase-price');
  const [priceSubMenuOpen, setPriceSubMenuOpen] = useState(true);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedSalesPrice, setSelectedSalesPrice] = useState<SalesPrice | null>(null);

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

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <div className="flex items-center text-blue-600 font-bold text-lg">
            <div className="w-6 h-6 bg-blue-600 rounded-md mr-2 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            智能微网
          </div>
        </div>
        <div className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">主导航</div>
        <nav className="flex-1 px-2 space-y-1">
          <NavItem icon={<Building2 size={18} />} label="企业管理" active={activeMenu === 'enterprise'} onClick={() => navTo('enterprise')} />
          <NavItem icon={<MapPin size={18} />} label="站点管理" active={activeMenu === 'site'} onClick={() => navTo('site')} />
          <NavItem icon={<Server size={18} />} label="设备管理" active={activeMenu === 'device'} onClick={() => navTo('device')} />
          
          <div>
            <button
              onClick={() => setPriceSubMenuOpen(!priceSubMenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeMenu.includes('price') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BadgeDollarSign size={18} />
                <span>电价管理</span>
              </div>
              <ChevronDown size={14} className={`transform transition-transform ${priceSubMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {priceSubMenuOpen && (
              <div className="mt-1 ml-9 space-y-1">
                <button
                  onClick={() => navTo('purchase-price')}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeMenu === 'purchase-price' 
                      ? 'text-blue-600 font-medium' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  购电电价管理
                </button>
                <button
                  onClick={() => navTo('sales-price')}
                  className={`w-full flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeMenu === 'sales-price' 
                      ? 'text-blue-600 font-medium' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  售电价格管理
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">当前位置：</span>
            <span className="text-gray-500">电价管理</span>
            <span className="text-gray-400">/</span>
            <span className="font-medium">
              {activeMenu === 'purchase-price' ? '购电电价管理' : activeMenu === 'sales-price' ? '售电价格管理' : '其他模块'}
            </span>
            {view === 'detail' && (selectedProvince || selectedSalesPrice) && (
              <>
                <span className="text-gray-400">/</span>
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
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                <User size={16} />
              </div>
              <span className="text-sm font-medium">管理员</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
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
          ) : activeMenu === 'site' ? (
            <StationManagement />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              请选择左侧菜单查看功能
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
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
              <Search size={14} className="mr-1.5" />
              查询
            </button>
            <button 
              onClick={() => setFilterRegion('')}
              className="px-4 py-1.5 bg-white border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors flex items-center"
            >
              <RotateCcw size={14} className="mr-1.5" />
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
            <Search size={14} className="mr-1.5" />
            搜索
          </button>
          <button 
            onClick={() => { setFilterId(''); setFilterName(''); setFilterEnterprise(''); setFilterPhone(''); }}
            className="px-5 py-1.5 bg-white border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <RotateCcw size={14} className="mr-1.5" />
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
                      <button className="px-2 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 text-xs transition-colors">管理设备</button>
                      <button className="px-2 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 text-xs transition-colors">管理拓扑</button>
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
              <Search size={14} className="mr-1.5" />
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
              <RotateCcw size={14} className="mr-1.5" />
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

  const handleFormulaChange = (key: string, value: string) => {
    // Read-only in details view now, handled in FormulaConfigTab
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
        
        // 实际参数计算出的实际值（基于当月平均购电价格等实际参数，无小时波动）
        const actualPrice = evaluateFormula(formula, params);

        data.push({
          datetime: `${dateStr} ${h.toString().padStart(2, '0')}:00`,
          hour: h,
          periodId,
          periodName: PERIODS.find(p => p.id === periodId)?.name,
          predictedPrice,
          actualPrice: month === '2026-02' ? actualPrice : null,
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

  const isCurrentMonth = month === '2026-03';

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
              <option value="2026-03">2026-03 (当前月)</option>
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
                    当前: {province.elecType} - {province.voltage}
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
                      <div className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-1.5 text-sm font-mono text-gray-600 truncate" title={formulas[period.id]}>
                        {formulas[period.id]}
                      </div>
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
                  if (!isCurrentMonth) {
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
                  {!isCurrentMonth && (
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase border-b border-gray-200">实际电价 (元/kWh)</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedHourlyData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">{row.datetime}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: PERIODS.find(p => p.id === row.periodId)?.color }}>
                        {row.periodName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-blue-600 font-medium">{row.predictedPrice.toFixed(4)}</td>
                    {!isCurrentMonth && (
                      <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{row.actualPrice?.toFixed(4)}</td>
                    )}
                  </tr>
                ))}
                {selectedHourlyData.length === 0 && (
                  <tr>
                    <td colSpan={isCurrentMonth ? 3 : 4} className="px-4 py-8 text-center text-gray-500 text-sm">
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
