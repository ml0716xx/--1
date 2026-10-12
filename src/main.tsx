import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ConfigurationEditorPage from './components/ConfigurationEditorPage.tsx';
import './index.css';

/**
 * 独立入口：站点工作台「组态管理」点「编辑」时，以新标签页打开
 *   ?page=config-editor&id=<组态id>&station=<站点名>
 * 命中该参数时只渲染组态编辑页，不带后台导航与站点工作台外框（真正的一页一编辑器）。
 * ⚠️ 参数名改动必须同步改 src/components/ConfigurationListPage.tsx 里的 editorUrl()。
 */
const params = new URLSearchParams(window.location.search);
const isConfigEditor = params.get('page') === 'config-editor';
const stationName = params.get('station') ?? undefined;

if (isConfigEditor) {
  document.title = `组态编辑${stationName ? ` · ${stationName}` : ''}`;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isConfigEditor ? (
      <div className="h-screen w-screen bg-slate-100 p-3 flex flex-col">
        <ConfigurationEditorPage
          configId={params.get('id') ?? undefined}
          stationName={stationName}
        />
      </div>
    ) : (
      <App />
    )}
  </StrictMode>,
);
