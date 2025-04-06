import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, FileUp, History, Trash2, Import, File } from "lucide-react"
import { ServerConfig, getServerType, serverTypeMap, fieldNameMap } from '@/types/mcp-config'
import { cn } from '@/lib/utils'
import { ConfigFieldRenderer } from './config-field-renderer'
import { useArrayOperations } from '@/hooks/use-array-operations';
import { useEnvOperations } from '@/hooks/use-env-operations';
import { useFileOperations } from '@/hooks/use-file-operations';
import { useWindowControls } from '@/hooks/use-window-controls'
import { ModeToggle } from './mode-toggle'
import { Switch } from "@/components/ui/switch"
import { PathHistoryDialog } from './path-history-dialog'

// 导入新的对话框组件
import { SaveConfigDialog } from './dialogs/save-config-dialog'
import { ImportConfigDialog } from './dialogs/import-config-dialog'
import { ServerSettingsDialog } from './dialogs/server-settings-dialog'
import { AddServerDialog } from './dialogs/add-server-dialog'

// 使用新的服务器操作 hook
import { useServerOperations } from '@/hooks/use-server-operations';

export const MCPConfigEditor: React.FC = () => {
  const { t } = useTranslation()
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [customPath, setCustomPath] = useState('');
  const {
    config,
    setConfig,
    loading,
    error,
    setError,
    importConfig,
    setImportConfig,
    selectedServers,
    toggleServerSelection,
    selectAllServers,
    handleOpenFile,
    handleSaveFile,
    handleImportConfig,
    pathHistory,
    currentPath,
    selectSavePath,
    createNewConfig,
    removePathFromHistory,
    clearPathHistory
  } = useFileOperations();

  const { isMac } = useWindowControls();

  // 使用新的服务器操作 hook
  const {
    addNewServer,
    deleteServer,
    updateServerConfig
  } = useServerOperations(config, setConfig);

  // 使用自定义 hooks
  const {
    handleArrayItemChange,
    handleArrayItemDelete,
    handleArrayItemAdd,
    handleArrayItemMove
  } = useArrayOperations(updateServerConfig);

  const {
    handleEnvChange,
    handleEnvDelete,
    handleEnvAdd,
    handleEnvKeyChange
  } = useEnvOperations(updateServerConfig);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectAllServers(e.target.checked);
  };

  // 保存对话框确认函数
  const handleConfirmSave = async () => {
    await handleSaveFile(customPath);
    setSaveDialogOpen(false);
    setCustomPath(''); // 清空自定义路径
  };

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={handleOpenFile}
          >
            {t('buttons.openFile')}
          </Button>

          <Button
            variant="outline"
            onClick={createNewConfig}
          >
            {t('buttons.newConfig')}
          </Button>

          <ImportConfigDialog
            importConfig={importConfig}
            setImportConfig={setImportConfig}
            handleImportConfig={handleImportConfig}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className={cn(
        "mx-auto relative flex flex-col h-[calc(100vh-theme(height.header))]",
      )}>
        {/* 顶栏 */}
        <div className={cn(
          "border-b py-4 w-full",
          isMac ? "vibrancy-header-custom" : "bg-background",
        )}>
          <div className={cn(
            "px-4",
            "flex justify-between"
          )}>
            <div className="flex gap-2 app-region-no-drag">
              {/* 打开文件对话框 */}
              <Button
                variant="outline"
                onClick={handleOpenFile}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('buttons.processing')}
                  </>
                ) : (
                  <>
                    <File className="mr-2 h-4 w-4" />
                    {t('buttons.importConfigJson')}
                  </>
                )}
              </Button>

              {/* 导入配置对话框 */}
              <ImportConfigDialog
                importConfig={importConfig}
                setImportConfig={setImportConfig}
                handleImportConfig={handleImportConfig}
              >
                <Button variant="outline">
                  <Import className="h-4 w-4" />
                  {t('buttons.pasteConfig')}
                </Button>
              </ImportConfigDialog>

              <Button
                variant="destructive"
                onClick={() => {
                  if (config && Object.keys(config.mcpServers).length > 0) {
                    if (window.confirm(t('prompts.createNewConfig') || '确定要创建新的配置吗？现有配置将被清除。')) {
                      createNewConfig();
                    }
                  } else {
                    createNewConfig();
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('buttons.processing')}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('buttons.clearConfig')}
                  </>
                )}
              </Button>

              <Button
                variant="default"
                disabled={loading || !config}
                onClick={() => setSaveDialogOpen(true)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('buttons.processing')}
                  </>
                ) : t('buttons.export')}
              </Button>

              {/* 保存配置对话框 */}
              <SaveConfigDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                selectedServers={selectedServers}
                toggleServerSelection={toggleServerSelection}
                handleSelectAll={handleSelectAll}
                customPath={customPath}
                setCustomPath={setCustomPath}
                currentPath={currentPath}
                selectSavePath={selectSavePath}
                pathHistory={pathHistory}
                serverNames={config && config.mcpServers ? Object.keys(config.mcpServers) : []}
                onConfirm={handleConfirmSave}
              />

              {/* 路径历史记录管理对话框 */}
              <PathHistoryDialog
                pathHistory={pathHistory}
                currentPath={currentPath}
                onSelectPath={selectSavePath}
                onRemovePath={removePathFromHistory}
                onClearHistory={clearPathHistory}
              >
                <Button variant="outline">
                  <History className="h-4 w-4 mr-2" />
                  {t('buttons.pathHistory')}
                </Button>
              </PathHistoryDialog>
            </div>

            <div className="flex items-center gap-2 app-region-no-drag">
              {/* 添加 MCP 服务器对话框 */}
              <AddServerDialog onAddServer={addNewServer}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('buttons.add')}
                </Button>
              </AddServerDialog>
            </div>
          </div>
        </div>
        {/* 列表 */}
        <div className={cn(
          "py-6 px-4 flex-1 overflow-y-auto",
          isMac ? "vibrancy-content-custom" : "bg-background",
        )}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className={cn(
            "grid grid-cols-2 gap-4",
          )}>
            {Object.entries(config && config.mcpServers ? config.mcpServers : {})?.map(([serverName, serverConfig]) => (
              <Card key={serverName}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 !pt-1">
                  <CardTitle className="text-lg font-bold truncate">
                    {serverName}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {serverTypeMap[getServerType(serverConfig)]}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {/* <span className="text-sm text-muted-foreground">{t('fields.enabled')}</span> */}
                      <Switch
                        checked={!Boolean(serverConfig.disabled)}
                        onCheckedChange={(checked) => {
                          updateServerConfig(serverName, {
                            ...serverConfig,
                            disabled: !checked
                          })
                        }}
                      />
                    </div>
                    <div className="">
                      {/* 使用提取的服务器设置对话框 */}
                      <ServerSettingsDialog
                        serverName={serverName}
                        serverConfig={serverConfig}
                        updateServerConfig={updateServerConfig}
                        deleteServer={deleteServer}
                        handleArrayItemChange={handleArrayItemChange}
                        handleArrayItemMove={handleArrayItemMove}
                        handleArrayItemDelete={handleArrayItemDelete}
                        handleArrayItemAdd={handleArrayItemAdd}
                        handleEnvChange={handleEnvChange}
                        handleEnvDelete={handleEnvDelete}
                        handleEnvAdd={handleEnvAdd}
                        handleEnvKeyChange={handleEnvKeyChange}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className=''>
                  <div className="flex flex-col gap-2">
                    {Object.entries(serverConfig).map(([key, value]) => {
                      if (key === 'disabled') return null;
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            {fieldNameMap[key] || key}
                          </label>
                          <ConfigFieldRenderer
                            serverName={serverName}
                            serverConfig={serverConfig}
                            fieldKey={key}
                            value={value}
                            isEditing={false}
                            onUpdateServerConfig={updateServerConfig}
                            onArrayItemChange={handleArrayItemChange}
                            onArrayItemMove={handleArrayItemMove}
                            onArrayItemDelete={handleArrayItemDelete}
                            onArrayItemAdd={handleArrayItemAdd}
                            onEnvChange={handleEnvChange}
                            onEnvDelete={handleEnvDelete}
                            onEnvAdd={handleEnvAdd}
                            onEnvKeyChange={handleEnvKeyChange}
                            renderDisabled={false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}