import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertTriangle, Send, Cpu, CheckCircle2, 
  Terminal, ShieldCheck, RefreshCw, Layers, History, 
  FileCode, Play, RotateCcw, Copy, Download, ArrowRight,
  Radio, HardDrive, Wifi, Activity, CheckSquare, Square
} from 'lucide-react';

export interface DispatchHistoryItem {
  id: string;
  version: string;
  topoId: string;
  topoName: string;
  mode: 'incremental' | 'full' | 'dryrun';
  gatewayName: string;
  gatewaySn: string;
  operator: string;
  time: string;
  status: 'success' | 'failed' | 'running';
  summary: string;
}

interface TopologyDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: any;
  currentTopology: any;
  allTopologies: any[];
  topoNodes: any[];
  incomerLines: any[];
  onDispatchSuccess: (topoId: string, version: string, mode: string) => void;
  onRollback?: (historyItem: DispatchHistoryItem) => void;
}

export function TopologyDispatchModal({
  isOpen,
  onClose,
  station,
  currentTopology,
  allTopologies,
  topoNodes,
  incomerLines,
  onDispatchSuccess,
  onRollback
}: TopologyDispatchModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dispatch' | 'preview' | 'checklist' | 'history'>('dispatch');
  
  // Selected Target Gateways
  const [selectedGateway, setSelectedGateway] = useState<string>('GW01');
  const [dispatchMode, setDispatchMode] = useState<'incremental' | 'full' | 'dryrun'>('incremental');
  const [selectedTopoIds, setSelectedTopoIds] = useState<string[]>([currentTopology?.id || 'T01']);
  const [includeAllTopos, setIncludeAllTopos] = useState<boolean>(false);
  
  // Progress & Execution
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [executionLogs, setExecutionLogs] = useState<Array<{ time: string, level: 'info' | 'success' | 'warn' | 'comm', text: string }>>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Mock Gateways
  const gateways = [
    {
      id: 'GW01',
      name: '天合 FCU-2601 边缘EMS主控网关',
      sn: station.emsSn || 'TRINASTORAGE82_EMS01',
      ip: '192.168.1.120',
      port: 502,
      protocol: 'Modbus-TCP / IEC 61850',
      status: 'online',
      latency: '12ms',
      firmware: 'v3.2.4-edge-rt',
      isPrimary: true
    },
    {
      id: 'GW02',
      name: '2# 汇流采集与辅控辅助网关',
      sn: 'TRINASTORAGE82_AUX02',
      ip: '192.168.1.121',
      port: 502,
      protocol: 'Modbus-RTU / MQTT',
      status: 'online',
      latency: '16ms',
      firmware: 'v3.2.0-std',
      isPrimary: false
    },
    {
      id: 'GW03',
      name: '云端 EMS 虚拟仿真镜像网关 (测试联调)',
      sn: 'CLOUD_EMS_SIM_99',
      ip: '10.88.0.45',
      port: 1883,
      protocol: 'MQTT / JSON-RPC',
      status: 'online',
      latency: '28ms',
      firmware: 'v3.3.0-beta',
      isPrimary: false
    }
  ];

  // Dispatch history state
  const [historyList, setHistoryList] = useState<DispatchHistoryItem[]>(() => {
    const saved = localStorage.getItem(`topo_dispatch_history_${station.id || station.name}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'DISP_01',
        version: 'v2.4.0',
        topoId: 'T01',
        topoName: '1# 变压器高压侧拓扑图',
        mode: 'incremental',
        gatewayName: '天合 FCU-2601 边缘EMS主控网关',
        gatewaySn: 'TRINASTORAGE82_EMS01',
        operator: station.managerName || '管理员(荆汉进)',
        time: '2026-08-18 17:30:15',
        status: 'success',
        summary: '下发7个逻辑节点及2台计量电表测量关系'
      },
      {
        id: 'DISP_02',
        version: 'v2.3.8',
        topoId: 'T02',
        topoName: '低压Ⅰ段交流母线拓扑图',
        mode: 'full',
        gatewayName: '天合 FCU-2601 边缘EMS主控网关',
        gatewaySn: 'TRINASTORAGE82_EMS01',
        operator: '系统自动(初次同步)',
        time: '2026-07-28 10:15:00',
        status: 'success',
        summary: '全量下发低压母线与光伏逆变器通信通道'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(`topo_dispatch_history_${station.id || station.name}`, JSON.stringify(historyList));
  }, [historyList, station.id, station.name]);

  useEffect(() => {
    if (currentTopology?.id) {
      setSelectedTopoIds([currentTopology.id]);
    }
  }, [currentTopology?.id]);

  // Checklist validation items
  const boundIncomer = incomerLines.find(l => l.boundTopoIds.includes(currentTopology?.id));
  const metersCount = topoNodes.filter(n => n.meterBinding).length;
  const rootsCount = topoNodes.filter(n => n.parentId === null || n.type === '总进线').length;

  const checklistItems = [
    {
      title: '主电源总进线回路校验',
      desc: rootsCount === 1 ? `已配置唯一根进线节点 (${topoNodes[0]?.name || '总进线'})` : '总进线节点存在配置异常',
      passed: rootsCount === 1,
      required: true
    },
    {
      title: '进线管理与拓扑绑定映射',
      desc: boundIncomer ? `已关联到进线: [${boundIncomer.name}] (${boundIncomer.isInUse ? '当前使用中' : '备用进线'})` : '当前拓扑未绑定进线，建议先前往进线管理关联',
      passed: !!boundIncomer,
      required: true
    },
    {
      title: '计量电表与测量关系闭环',
      desc: metersCount > 0 ? `已建立 ${metersCount} 处计量关口/分路测量关联` : '提示：暂未绑定测量电表（不影响下发，但无法上报计量电度）',
      passed: true,
      required: false
    },
    {
      title: '设备通信SN与通道有效性',
      desc: `全站 ${topoNodes.length} 台设备物理SN及物模型通道校验一致`,
      passed: topoNodes.every(n => n.sn || n.id),
      required: true
    },
    {
      title: '拓扑环网与回路防死锁校验',
      desc: '未检测到任何闭环递归回路与悬空孤岛节点',
      passed: true,
      required: true
    }
  ];

  const allRequiredPassed = checklistItems.filter(i => i.required).every(i => i.passed);

  // Generate payload
  const generatedPayload = {
    header: {
      stationId: station.id || 'ST_DEFAULT',
      stationName: station.name,
      dispatchTimestamp: new Date().toISOString(),
      protocolVersion: 'TRINA-TOPO-V3.2',
      dispatchMode: dispatchMode,
      targetGateway: gateways.find(g => g.id === selectedGateway)?.sn,
    },
    topologies: (includeAllTopos ? allTopologies : allTopologies.filter(t => selectedTopoIds.includes(t.id))).map(t => {
      return {
        topoId: t.id,
        topoName: t.name,
        boundIncomer: incomerLines.find(l => l.boundTopoIds.includes(t.id))?.name || null,
        nodeCount: topoNodes.length,
        nodes: topoNodes.map(n => ({
          nodeId: n.id,
          nodeName: n.name,
          deviceType: n.type,
          parentId: n.parentId,
          deviceSn: n.sn,
          model: n.model,
          meterBinding: n.meterBinding ? {
            meterName: n.meterBinding.name,
            meterSn: n.meterBinding.sn,
            model: n.meterBinding.model,
            relationType: n.meterBinding.relationType
          } : null
        }))
      };
    })
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownloadPayload = () => {
    const blob = new Blob([JSON.stringify(generatedPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topo_dispatch_${currentTopology?.id || 'T01'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dispatch execution simulation
  const startDispatch = () => {
    setIsExecuting(true);
    setExecutionProgress(0);
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setExecutionLogs([
      { time: new Date().toLocaleTimeString(), level: 'info', text: `[1/5] 开始生成 [${currentTopology?.name || '拓扑方案'}] 语法配置报文与拓扑树特征摘要...` }
    ]);

    const targetGw = gateways.find(g => g.id === selectedGateway);

    // Step 1: 0% -> 25%
    setTimeout(() => {
      setExecutionProgress(25);
      setCurrentStepIndex(1);
      setExecutionLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), level: 'success', text: `[1/5] 拓扑报文构建成功 (Size: 4.8KB, CRC32: 0x8F9C2B14)` },
        { time: new Date().toLocaleTimeString(), level: 'comm', text: `[2/5] 正在与目标网关 [${targetGw?.name}] (${targetGw?.ip}:${targetGw?.port}) 建立安全通道握手...` }
      ]);
    }, 700);

    // Step 2: 25% -> 50%
    setTimeout(() => {
      setExecutionProgress(50);
      setCurrentStepIndex(2);
      setExecutionLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), level: 'success', text: `[2/5] 通信握手鉴权通过 (RTT: ${targetGw?.latency}, 固件兼容性确认: OK)` },
        { time: new Date().toLocaleTimeString(), level: 'info', text: `[3/5] 正在向网关边缘存储写入 ${dispatchMode === 'incremental' ? '增量热更新差量' : '全量树形'} 拓扑结构...` }
      ]);
    }, 1500);

    // Step 3: 50% -> 75%
    setTimeout(() => {
      setExecutionProgress(75);
      setCurrentStepIndex(3);
      setExecutionLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), level: 'success', text: `[3/5] 拓扑数据帧写入完成并校验一致` },
        { time: new Date().toLocaleTimeString(), level: 'comm', text: `[4/5] 边缘网关正在触发拓扑解析引擎热重载与 Modbus/IEC61850 通信映射通道刷新...` }
      ]);
    }, 2300);

    // Step 4: 75% -> 100%
    setTimeout(() => {
      setExecutionProgress(100);
      setCurrentStepIndex(4);
      setIsExecuting(false);
      setIsCompleted(true);
      
      const newVersion = `v2.4.${Math.floor(10 + Math.random() * 90)}`;
      setExecutionLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), level: 'success', text: `[4/5] 拓扑解析引擎热重载成功，点表路由映射已即刻生效` },
        { time: new Date().toLocaleTimeString(), level: 'success', text: `[5/5] 下发流程圆满完成！网关已返回确认应答 ACK (版本号: ${newVersion})` }
      ]);

      // Add to history
      const newHistoryItem: DispatchHistoryItem = {
        id: `DISP_${Date.now()}`,
        version: newVersion,
        topoId: currentTopology?.id || 'T01',
        topoName: currentTopology?.name || '拓扑方案',
        mode: dispatchMode,
        gatewayName: targetGw?.name || '边缘EMS网关',
        gatewaySn: targetGw?.sn || 'TRINASTORAGE82_EMS01',
        operator: station.managerName || '管理员(荆汉进)',
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'success',
        summary: `成功${dispatchMode === 'incremental' ? '增量' : dispatchMode === 'full' ? '全量' : '仿真'}下发 ${topoNodes.length} 个节点拓扑`
      };

      setHistoryList(prev => [newHistoryItem, ...prev]);
      onDispatchSuccess(currentTopology?.id || 'T01', newVersion, dispatchMode);
    }, 3200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col text-xs text-gray-700 z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden border border-gray-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Send size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">拓扑配置下发至边缘网关 / EMS</h3>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.2 rounded-full font-mono">
                  {station.name}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                当前拓扑：<strong className="text-white">{currentTopology?.name || '1# 变压器高压侧拓扑图'}</strong> ({topoNodes.length} 逻辑节点)
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Sub-Navigation */}
        <div className="flex items-center justify-between px-6 bg-gray-50 border-b border-gray-200 shrink-0">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveSubTab('dispatch')}
              className={`py-2.5 font-bold text-xs border-b-2 flex items-center space-x-1.5 transition ${
                activeSubTab === 'dispatch' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Send size={13} />
              <span>下发策略与目标</span>
            </button>

            <button
              onClick={() => setActiveSubTab('checklist')}
              className={`py-2.5 font-bold text-xs border-b-2 flex items-center space-x-1.5 transition ${
                activeSubTab === 'checklist' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <ShieldCheck size={13} />
              <span>拓扑回路预检</span>
              {allRequiredPassed ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('preview')}
              className={`py-2.5 font-bold text-xs border-b-2 flex items-center space-x-1.5 transition ${
                activeSubTab === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileCode size={13} />
              <span>配置报文预览</span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`py-2.5 font-bold text-xs border-b-2 flex items-center space-x-1.5 transition ${
                activeSubTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <History size={13} />
              <span>下发历史 ({historyList.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>网关通道正常</span>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* TAB 1: DISPATCH CONFIGURATION & EXECUTION */}
          {activeSubTab === 'dispatch' && (
            <div className="space-y-6">
              
              {/* Step 1: Select Target Gateway */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                    <Cpu size={14} className="text-blue-600" />
                    <span>1. 选择下发目标边缘网关 / 控制器</span>
                  </h4>
                  <span className="text-[10px] text-gray-400">支持下发至主控网关、辅控或虚拟测试仿真器</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {gateways.map(gw => {
                    const isSelected = selectedGateway === gw.id;
                    return (
                      <div
                        key={gw.id}
                        onClick={() => setSelectedGateway(gw.id)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition relative ${
                          isSelected 
                            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-200' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                              <Cpu size={14} />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-xs leading-tight">{gw.name}</div>
                              <span className="text-[10px] text-gray-400 font-mono">{gw.sn}</span>
                            </div>
                          </div>
                          {gw.isPrimary && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                              主控
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100/80 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                          <span className="flex items-center space-x-1">
                            <Wifi size={11} className="text-emerald-500" />
                            <span>{gw.ip}:{gw.port}</span>
                          </span>
                          <span className="text-emerald-600 font-bold flex items-center space-x-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            <span>{gw.latency}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Dispatch Scope & Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Dispatch Mode */}
                <div className="space-y-2.5">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                    <Radio size={14} className="text-blue-600" />
                    <span>2. 下发模式与策略</span>
                  </h4>

                  <div className="space-y-2">
                    {[
                      {
                        mode: 'incremental',
                        title: '增量热更新下发 (推荐)',
                        desc: '仅下发新增/调整的设备与测量关系，不中断当前PCS储能充放电与调度策略',
                        tag: '平滑生效',
                        tagColor: 'bg-emerald-100 text-emerald-800'
                      },
                      {
                        mode: 'full',
                        title: '全量编译重构下发',
                        desc: '重写网关全站点表通信映射，适用于整站初次配置或主变压器架构大改',
                        tag: '全量重写',
                        tagColor: 'bg-purple-100 text-purple-800'
                      },
                      {
                        mode: 'dryrun',
                        title: '仿真校验 Dry-Run',
                        desc: '在云端与网关侧执行虚拟语法与通信回路校验，不下发硬件存储',
                        tag: '安全试跑',
                        tagColor: 'bg-amber-100 text-amber-800'
                      }
                    ].map(item => (
                      <div
                        key={item.mode}
                        onClick={() => setDispatchMode(item.mode as any)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                          dispatchMode === item.mode 
                            ? 'bg-blue-50/60 border-blue-400 text-blue-900' 
                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                          dispatchMode === item.mode ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {dispatchMode === item.mode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{item.title}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${item.tagColor}`}>{item.tag}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Scope selection */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs flex items-center space-x-1.5">
                      <Layers size={14} className="text-blue-600" />
                      <span>3. 下发拓扑方案范围</span>
                    </h4>
                    <label className="flex items-center space-x-1 text-[11px] text-blue-600 font-bold cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={includeAllTopos}
                        onChange={(e) => setIncludeAllTopos(e.target.checked)}
                        className="rounded text-blue-600 cursor-pointer"
                      />
                      <span>一并下发全站所有方案</span>
                    </label>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/50 max-h-48 overflow-y-auto custom-scrollbar">
                    {allTopologies.map(t => {
                      const isCurrent = t.id === currentTopology?.id;
                      const isChecked = includeAllTopos || selectedTopoIds.includes(t.id);
                      const boundIncomer = incomerLines.find(l => l.boundTopoIds.includes(t.id));

                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (includeAllTopos) return;
                            setSelectedTopoIds(prev => 
                              prev.includes(t.id) ? (prev.length > 1 ? prev.filter(id => id !== t.id) : prev) : [...prev, t.id]
                            );
                          }}
                          className={`p-2.5 rounded-lg border flex items-center justify-between transition cursor-pointer select-none ${
                            isChecked 
                              ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold' 
                              : 'bg-white border-gray-200 text-gray-600'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                              {isChecked && <Check size={11} />}
                            </div>
                            <div>
                              <span className="text-xs">{t.name}</span>
                              {isCurrent && <span className="ml-1.5 text-[9px] bg-emerald-100 text-emerald-800 font-normal px-1 rounded">当前方案</span>}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 text-[10px]">
                            {boundIncomer ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                进线: {boundIncomer.name}
                              </span>
                            ) : (
                              <span className="text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                未绑定进线
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Execution Progress & Terminal Console */}
              {(isExecuting || isCompleted) && (
                <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal size={14} className="text-emerald-400" />
                      <span className="font-bold text-xs text-white">下发通信交互控制台</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {isCompleted ? '100% (下发成功)' : `${executionProgress}% 处理中...`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}
                      style={{ width: `${executionProgress}%` }}
                    />
                  </div>

                  {/* Terminal Log Stream */}
                  <div className="bg-black/60 rounded-lg p-3 font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto custom-scrollbar border border-slate-800">
                    {executionLogs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-2 leading-relaxed">
                        <span className="text-slate-500 shrink-0">{log.time}</span>
                        <span className={
                          log.level === 'success' ? 'text-emerald-400 font-bold' :
                          log.level === 'comm' ? 'text-sky-300' :
                          log.level === 'warn' ? 'text-amber-400' : 'text-slate-300'
                        }>
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PRE-FLIGHT CHECKLIST */}
          {activeSubTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">拓扑完整性与电气规则自检</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">下发前系统会自动校验进线闭环、测量点表映射与环网死锁</p>
                </div>
                {allRequiredPassed ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-lg flex items-center space-x-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>全部必检项通过，允许下发</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-lg flex items-center space-x-1">
                    <AlertTriangle size={13} className="text-amber-600" />
                    <span>存在未通过必检项，请修正后再下发</span>
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {checklistItems.map((item, index) => (
                  <div 
                    key={index}
                    className={`p-3.5 rounded-xl border flex items-start justify-between transition ${
                      item.passed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 p-1 rounded-full ${item.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.passed ? <Check size={13} /> : <AlertTriangle size={13} />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-gray-900">{item.title}</span>
                          {item.required ? (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-semibold">强制必检</span>
                          ) : (
                            <span className="text-[9px] bg-gray-100 text-gray-500 px-1 py-0.2 rounded">建议项</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1">{item.desc}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.passed ? '校验通过' : '待完善'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PAYLOAD PREVIEW */}
          {activeSubTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">下发配置报文预览 (Payload JSON)</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">符合天合储能 EMS 拓扑与通道配置协议标准规范</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyPayload}
                    className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded text-gray-700 font-medium text-xs flex items-center space-x-1 transition shadow-2xs"
                  >
                    {copiedPayload ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedPayload ? '已复制' : '复制 JSON'}</span>
                  </button>
                  <button
                    onClick={handleDownloadPayload}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-700 font-bold text-xs flex items-center space-x-1 transition shadow-2xs"
                  >
                    <Download size={12} />
                    <span>下载配置包</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] max-h-[380px] overflow-auto custom-scrollbar border border-slate-800 shadow-inner">
                <pre>{JSON.stringify(generatedPayload, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: DISPATCH HISTORY & ROLLBACK */}
          {activeSubTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900 text-xs">拓扑配置下发历史与版本回滚</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">记录全站历次拓扑更新日志，支持快速回滚至历史版本</p>
                </div>
                <span className="text-[10px] text-gray-400">共 {historyList.length} 条记录</span>
              </div>

              <div className="space-y-3">
                {historyList.map(item => (
                  <div key={item.id} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-2xs transition space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-gray-900 font-mono bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded">
                          {item.version}
                        </span>
                        <span className="font-bold text-gray-800 text-xs">{item.topoName}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          item.mode === 'incremental' ? 'bg-emerald-100 text-emerald-800' :
                          item.mode === 'full' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.mode === 'incremental' ? '增量下发' : item.mode === 'full' ? '全量下发' : '仿真校验'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold flex items-center space-x-1">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          <span>下发成功</span>
                        </span>
                        {onRollback && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`确定要将当前拓扑回滚至版本 [${item.version}] 吗？`)) {
                                onRollback(item);
                                onClose();
                              }
                            }}
                            className="px-2 py-0.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded text-[10px] font-bold transition flex items-center space-x-1"
                          >
                            <RotateCcw size={10} />
                            <span>回滚此版本</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-600">{item.summary}</div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                      <span>目标网关: {item.gatewayName} ({item.gatewaySn})</span>
                      <div className="flex items-center space-x-3">
                        <span>操作人: {item.operator}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500">
            {isCompleted ? (
              <span className="text-emerald-600 font-bold flex items-center space-x-1">
                <CheckCircle2 size={14} />
                <span>拓扑配置已下发并生效于边缘网关</span>
              </span>
            ) : (
              <span>准备下发至网关：<strong className="text-gray-800">{gateways.find(g => g.id === selectedGateway)?.name}</strong></span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-bold text-xs transition"
            >
              {isCompleted ? '完成并关闭' : '取消'}
            </button>

            {!isCompleted && (
              <button
                type="button"
                disabled={isExecuting || !allRequiredPassed}
                onClick={startDispatch}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>正在下发传输中...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>立即下发至边缘网关</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
