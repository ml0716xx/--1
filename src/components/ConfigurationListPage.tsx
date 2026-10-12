import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutGrid, Plus, Edit2, Trash2, Power, CheckCircle2,
  ExternalLink, Info, Clock, RefreshCw,
} from 'lucide-react';
import {
  getConfigs, createConfig, updateConfigStatus, deleteConfig, SiteConfig,
} from '../lib/configApi';

/* ==========================================================================
   站点工作台 · 组态管理
   --------------------------------------------------------------------------
   版面参照「进线管理」：单列组态卡片列表 + 编辑 / 禁用 / 启用 / 删除。
   编辑不在此处内联展开 —— 点「编辑」在新标签页打开独立的组态编辑页
   （入口见 main.tsx 的 ?page=config-editor 分支），沿用微网 2.0 的组态编辑画面。
   数据与编辑页共用 lib/configApi 的同一份存储，因此列表侧的启用/禁用/删除即时生效。

   启用口径（2026-10-12 领导明确）：一个站点只能有一个启用的组态，
   所以下面的 isEnabled 只认 'in_use'；启用某个时数据层会把其余全部落为未启用。
   ========================================================================== */

/** 编辑页独立入口：新标签页 URL。改这里的参数名必须同步改 main.tsx 的解析 */
const editorUrl = (configId: string, stationName: string) =>
  `${window.location.origin}${window.location.pathname}?page=config-editor`
  + `&id=${encodeURIComponent(configId)}&station=${encodeURIComponent(stationName)}`;

/** 站点内「启用」唯一：只有 in_use 算启用，editing（新建未启用）与 unused 都算未启用 */
const isEnabled = (c: SiteConfig) => c.status === 'in_use';

const STATUS_BADGE: Record<SiteConfig['status'], { text: string; cls: string; dot: string }> = {
  in_use: {
    text: '已启用',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  editing: {
    text: '未启用 · 编辑中',
    cls: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
  },
  unused: {
    text: '已禁用',
    cls: 'bg-gray-100 text-gray-500 border-gray-200',
    dot: 'bg-gray-400',
  },
};

interface ConfigurationListPageProps {
  /** 当前站点名（页头归属 + 编辑页 URL 透传） */
  stationName: string;
  /** 复用站点工作台的提示条 */
  onNotify?: (n: { type: 'success' | 'error'; text: string } | null) => void;
}

export const ConfigurationListPage: React.FC<ConfigurationListPageProps> = ({ stationName, onNotify }) => {
  const [configs, setConfigs] = useState<SiteConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // 用 ref 存 onNotify，保证 notify / reload 引用稳定 ——
  // 否则父组件每次渲染换一个函数引用，会把下面的 useEffect 拖进无限重载。
  const onNotifyRef = useRef(onNotify);
  useEffect(() => { onNotifyRef.current = onNotify; });
  const notify = useCallback(
    (type: 'success' | 'error', text: string) => onNotifyRef.current?.({ type, text }),
    [],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setConfigs(await getConfigs('site-1'));
    } catch {
      notify('error', '组态列表加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { reload(); }, [reload]);

  const stats = useMemo(() => ({
    total: configs.length,
    enabled: configs.filter(isEnabled).length,
    disabled: configs.filter(c => !isEnabled(c)).length,
  }), [configs]);

  /** 编辑：新标签页进入组态编辑态（本页不跳转、不内联） */
  const handleOpenEditor = (cfg: SiteConfig) => {
    const win = window.open(editorUrl(cfg.id, stationName), '_blank', 'noopener');
    if (!win) {
      notify('error', '浏览器拦截了新标签页，请允许本站点弹出窗口后重试');
      return;
    }
    notify('success', `已在新标签页打开组态「${cfg.name}」的编辑页`);
  };

  /** 新增：建一张空组态，直接进编辑页画 */
  const handleCreate = async () => {
    const name = window.prompt('请输入组态名称', `新建组态 ${configs.length + 1}`);
    if (name === null) return;
    if (!name.trim()) {
      notify('error', '组态名称不能为空');
      return;
    }
    if (configs.some(c => c.name === name.trim())) {
      notify('error', '组态名称已存在，请换一个');
      return;
    }
    try {
      const created = await createConfig(name.trim());
      await reload();
      notify('success', `已新建组态「${created.name}」`);
      window.open(editorUrl(created.id, stationName), '_blank', 'noopener');
    } catch {
      notify('error', '新建组态失败，请重试');
    }
  };

  /** 启用 / 禁用：启用时数据层会把其余组态一并落为未启用（站点内启用唯一） */
  const handleToggleStatus = async (cfg: SiteConfig) => {
    const enabling = !isEnabled(cfg);
    setBusyId(cfg.id);
    try {
      await updateConfigStatus(cfg.id, enabling ? 'in_use' : 'unused');
      await reload();
      if (enabling) {
        notify('success', `已启用组态「${cfg.name}」，该站点其余组态已自动禁用`);
      } else {
        notify('success', `已禁用组态「${cfg.name}」，用户端不再展示该画面`);
      }
    } catch {
      notify('error', '状态切换失败，请重试');
    } finally {
      setBusyId(null);
    }
  };

  /** 删除 */
  const handleDelete = async (cfg: SiteConfig) => {
    const tip = cfg.status === 'in_use' && configs.length > 1
      ? `确定要删除组态「${cfg.name}」吗？\n该组态当前处于启用状态，删除后系统会自动把另一张组态切换为启用。`
      : `确定要删除组态「${cfg.name}」吗？此操作不可撤销。`;
    if (!window.confirm(tip)) return;
    setBusyId(cfg.id);
    try {
      await deleteConfig(cfg.id);
      await reload();
      notify('success', `已删除组态「${cfg.name}」`);
    } catch {
      notify('error', '删除失败，请重试');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-2">
          <span>站内组态列表</span>
          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">{stats.total}</span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
            已启用 {stats.enabled}
          </span>
          <span className="text-[10px] bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-bold">
            未启用 {stats.disabled}
          </span>
        </h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={reload}
            className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-bold text-xs rounded-lg transition flex items-center space-x-1"
          >
            <RefreshCw size={13} />
            <span>刷新</span>
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center space-x-1"
          >
            <Plus size={13} />
            <span>新增组态</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-xs text-gray-400">
          正在加载组态列表…
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center space-y-3">
          <p className="text-xs font-bold text-gray-700">当前站点尚未创建任何组态画面</p>
          <p className="text-[11px] text-gray-400">组态用于用户端的电气主接线监控，可点击右上角「新增组态」创建第一张。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map(cfg => {
            const enabled = isEnabled(cfg);
            const badge = STATUS_BADGE[cfg.status];
            const busy = busyId === cfg.id;
            return (
              <div
                key={cfg.id}
                data-config-card={cfg.id}
                className={`bg-white p-5 rounded-xl border shadow-sm transition ${enabled ? 'border-emerald-200 hover:border-emerald-300' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${enabled ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                      <LayoutGrid size={18} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="font-bold text-gray-900 text-sm">{cfg.name}</h5>
                        <span className={`px-2 py-0.5 border font-bold text-[10px] rounded-full flex items-center space-x-1 ${badge.cls}`}>
                          {enabled ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          )}
                          <span>{badge.text}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {cfg.remark ? (
                          <span><strong className="text-gray-700 font-semibold">备注说明:</strong> {cfg.remark}</span>
                        ) : (
                          <span className="text-gray-400 italic">暂无备注说明</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditor(cfg)}
                      className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 border border-blue-100 rounded text-xs font-bold transition flex items-center space-x-1"
                      title="在新标签页打开组态编辑页"
                    >
                      <Edit2 size={12} />
                      <span>编辑</span>
                      <ExternalLink size={10} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(cfg)}
                      disabled={busy}
                      className={`px-2.5 py-1 border rounded text-xs font-bold transition flex items-center space-x-1 ${
                        enabled
                          ? 'text-amber-600 hover:bg-amber-50 border-amber-100'
                          : 'text-emerald-600 hover:bg-emerald-50 border-emerald-100'
                      } ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Power size={12} />
                      <span>{enabled ? '禁用' : '启用'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(cfg)}
                      disabled={busy}
                      className={`px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-100 rounded text-xs font-medium transition flex items-center space-x-1 ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Trash2 size={12} />
                      <span>删除</span>
                    </button>
                  </div>
                </div>

                {/* 组态档案 */}
                <div className="pt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Clock size={12} className="text-gray-400" />
                    <span>创建 {cfg.createdAt}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock size={12} className="text-gray-400" />
                    <span>更新 {cfg.updatedAt}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2">
        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-blue-900">
          <Info size={13} className="text-blue-600" />
          <span>组态管理说明</span>
        </div>
        <ul className="text-[11px] text-blue-900/80 leading-relaxed space-y-1 list-disc pl-4">
          <li><strong>一个站点只能有一个启用的组态。</strong>启用某张组态时，该站点其余组态会自动变为已禁用。</li>
          <li>点「编辑」在新标签页打开组态编辑页，画布改动保存后回到本页刷新即可看到。</li>
          <li>禁用的组态保留画面与配置，仅从用户端下架，可随时重新启用。</li>
        </ul>
      </div>

    </div>
  );
};

export default ConfigurationListPage;
