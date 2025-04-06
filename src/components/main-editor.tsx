import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, FileUp } from "lucide-react"
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

// 新增导入
import { ServerRelationshipView } from './server-relationship-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const MCPConfigEditor: React.FC = () => {
  const { t } = useTranslation()
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [customPath, setCustomPath] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'relationship'>('cards'); // 新增状态
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

  const addNewServer = (serverName: string) => {
    if (!config || !serverName.trim()) return
    setConfig(prev => {
      if (!prev) return prev
      return {
        ...prev,
        mcpServers: {
          ...prev.mcpServers,
          [serverName]: {
            command: 'npx',
            args: [],
            autoApprove: [],
            env: {}
          }
        }
      }
    })
  }

  const deleteServer = (serverName: string) => {
    setConfig(prev => {
      if (!prev) return prev
      const newConfig = { ...prev }
      delete newConfig.mcpServers[serverName]
      return newConfig
    })
  }

  const updateServerConfig = (serverName: string, newConfig: ServerConfig) => {
    setConfig(prev => {
      if (!prev) return prev
      return {
        ...prev,
        mcpServers: {
          ...prev.mcpServers,
          [serverName]: newConfig
        }
      }
    })
  }

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

  // 添加这个函数来处理全选/取消全选
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
            {t('buttons.new')}
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

        <div className={cn(
          "border-b py-4 w-full",
          isMac ? "vibrancy-header-custom" : "bg-background",
        )}>
          <div className={cn(
            "px-4",
            "flex justify-between"
          )}>
            <div className="flex gap-2 app-region-no-drag">
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
                ) : t('buttons.openFile')}
              </Button>

              <Button
                variant="outline"
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
                {t('buttons.new')}
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

              {/* 使用提取的保存配置对话框 */}
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
                serverNames={config ? Object.keys(config.mcpServers) : []}
                onConfirm={handleConfirmSave}
              />

              {/* 使用提取的导入配置对话框 */}
              <ImportConfigDialog
                importConfig={importConfig}
                setImportConfig={setImportConfig}
                handleImportConfig={handleImportConfig}
              />

              {/* 路径历史记录管理对话框 */}
              <PathHistoryDialog
                pathHistory={pathHistory}
                currentPath={currentPath}
                onSelectPath={selectSavePath}
                onRemovePath={removePathFromHistory}
                onClearHistory={clearPathHistory}
              />
            </div>

            <div className="flex items-center gap-2 app-region-no-drag">
              {/* 使用新的添加服务器对话框组件 */}
              <AddServerDialog onAddServer={addNewServer} />
              <ModeToggle />
            </div>
          </div>
        </div>
        <div className={cn(
          "py-6 px-4 flex-1 overflow-y-auto",
          isMac ? "vibrancy-content-custom" : "bg-background",
        )}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue="cards" className="w-full">
            <div className="flex justify-between mb-4">
              <TabsList>
                <TabsTrigger value="cards">{t('views.cardView')}</TabsTrigger>
                <TabsTrigger value="relationship">{t('views.relationshipView')}</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="cards">
              <div className={cn("grid grid-cols-2 gap-4")}>
                {Object.entries(config.mcpServers).map(([serverName, serverConfig]) => (
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
            </TabsContent>
            <TabsContent value="relationship">
              <ServerRelationshipView
              // generateConfigId={generateConfigId} // 如果有的话
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}