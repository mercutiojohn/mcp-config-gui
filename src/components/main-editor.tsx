import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Settings, FileUp, Check, Trash } from "lucide-react"
import { MCPConfig, ServerConfig, getServerType, ServerType, serverTypeMap, fieldNameMap } from '@/types/mcp-config'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from '@/lib/utils'
import { ConfigFieldRenderer } from './config-field-renderer'
import { useArrayOperations } from '@/hooks/use-array-operations';
import { useEnvOperations } from '@/hooks/use-env-operations';
import { useFileOperations } from '@/hooks/use-file-operations';
import { electronAPI } from '@/utils/electron-api';
import { useWindowControls } from '@/hooks/use-window-controls'
import { ModeToggle } from './mode-toggle'
import { Switch } from "@/components/ui/switch"

export const MCPConfigEditor: React.FC = () => {
  const { t } = useTranslation()
  const [newServerName, setNewServerName] = useState('')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [customPath, setCustomPath] = useState(''); // 新增：自定义路径
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
    pathHistory,        // 新增：路径历史
    currentPath,        // 读取当前路径
    selectSavePath,     // 新增：选择路径方法
    createNewConfig     // 新增：创建新配置方法
  } = useFileOperations();

  const { isMac } = useWindowControls();

  const addNewServer = () => {
    if (!config || !newServerName.trim()) return
    setConfig(prev => {
      if (!prev) return prev
      return {
        ...prev,
        mcpServers: {
          ...prev.mcpServers,
          [newServerName]: {
            command: 'npx',
            args: [],
            autoApprove: [],
            env: {}
          }
        }
      }
    })
    setNewServerName('')
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

  // 修改保存对话框确认函数，添加自定义路径支持
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

          {/* 添加新建配置按钮 */}
          <Button
            variant="outline"
            onClick={createNewConfig}
          >
            {t('buttons.new')}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileUp className="h-4 w-4 mr-2" />
                {t('buttons.import')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('dialog.importConfig')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder={t('dialog.importPlaceholder')}
                    value={importConfig}
                    onChange={(e) => setImportConfig(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
                <Button onClick={handleImportConfig}>
                  {t('buttons.import')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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

              {/* 添加新建配置按钮 */}
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

              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    disabled={loading || !config}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('buttons.processing')}
                      </>
                    ) : t('buttons.export')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('dialog.selectConfigToExport')}</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        id="select-all"
                        className="w-4 h-4"
                        onChange={handleSelectAll}
                        checked={Object.values(selectedServers).every(v => v)}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">
                        {t('dialog.selectAll')}
                      </label>
                    </div>
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                      {config && Object.keys(config.mcpServers).map(serverName => (
                        <div key={serverName} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`server-${serverName}`}
                            checked={selectedServers[serverName] || false}
                            onChange={() => toggleServerSelection(serverName)}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`server-${serverName}`} className="text-sm">
                            {serverName}
                          </label>
                        </div>
                      ))}
                    </div>
                    {/* 新增：保存路径选择部分 */}
                    <div className="mt-6 space-y-4">
                      <h4 className="font-medium text-sm">{t('dialog.savePath')}</h4>
                      {/* 当前路径 */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="current-path"
                          name="save-path"
                          checked={!customPath}
                          onChange={() => setCustomPath('')}
                          className="w-4 h-4"
                        />
                        <label htmlFor="current-path" className="text-sm truncate">
                          {currentPath || t('dialog.defaultPath')}
                        </label>
                      </div>
                      {/* 历史路径 */}
                      {pathHistory.length > 0 && (
                        <div className="space-y-2 max-h-[20vh] overflow-y-auto border rounded p-2">
                          <p className="text-xs text-muted-foreground mb-1">{t('dialog.recentPaths')}</p>
                          {pathHistory.map((path, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`path-${index}`}
                                name="save-path"
                                checked={customPath === path}
                                onChange={() => setCustomPath(path)}
                                className="w-4 h-4"
                              />
                              <label htmlFor={`path-${index}`} className="text-sm truncate">
                                {path}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* 添加自定义路径输入框 */}
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-1">{t('dialog.customPath')}</p>
                        <div className="flex gap-2">
                          <Input
                            value={customPath}
                            onChange={(e) => {
                              setCustomPath(e.target.value);
                              if (e.target.value) {
                                selectSavePath(e.target.value);
                              }
                            }}
                            placeholder={t('dialog.enterCustomPath')}
                          />
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const result = await electronAPI.selectSavePath();
                              if (result) {
                                setCustomPath(result);
                                selectSavePath(result); // 使用selectSavePath更新当前路径
                              }
                            }}
                          >
                            {t('buttons.browse')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleConfirmSave}>
                      {t('buttons.confirmExport')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* 导入配置对话框保持不变 */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileUp className="h-4 w-4 mr-2" />
                    {t('buttons.import')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('dialog.importConfig')}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Textarea
                        placeholder={t('dialog.importPlaceholder')}
                        value={importConfig}
                        onChange={(e) => setImportConfig(e.target.value)}
                        className="min-h-[200px]"
                      />
                    </div>
                    <Button onClick={handleImportConfig}>
                      {t('buttons.import')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* 其余内容保持不变 */}
            <div className="flex items-center gap-2 app-region-no-drag">
              <Input
                placeholder={t('placeholders.newServerName')}
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={addNewServer}
                disabled={!newServerName.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('buttons.add')}
              </Button>
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
          <div className={cn(
            "grid grid-cols-2 gap-4",
          )}>
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
                    {/* 添加禁用开关 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t('fields.disabled')}</span>
                      <Switch
                        checked={Boolean(serverConfig.disabled)}
                        onCheckedChange={(checked) => {
                          updateServerConfig(serverName, {
                            ...serverConfig,
                            disabled: checked
                          })
                        }}
                      />
                    </div>
                    <div className="">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Settings className="h-3 w-3 mr-1" />
                            {t('buttons.editDetails')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                          <DialogHeader>
                            <DialogTitle>{t('dialog.serverSettings')} - {serverName}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
                            <div className="space-y-4">
                              <h4 className="font-medium">{t('dialog.serverType')}</h4>
                              <Select
                                value={getServerType(serverConfig)}
                                onValueChange={(newType: ServerType) => {
                                  let newConfig: ServerConfig
                                  if (newType === ServerType.SSE) {
                                    newConfig = {
                                      url: '',
                                      autoApprove: serverConfig.autoApprove || []
                                    }
                                  } else {
                                    newConfig = {
                                      command: newType as 'npx' | 'uvx' | 'node',
                                      args: [],
                                      env: {},
                                      autoApprove: serverConfig.autoApprove || []
                                    }
                                  }
                                  updateServerConfig(serverName, newConfig)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('dialog.selectServerType')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(ServerType).map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {serverTypeMap[type]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="space-y-4 mt-6">
                                <h4 className="font-medium">{t('dialog.serverConfig')}</h4>
                                <div className="grid gap-4">
                                  {Object.entries(serverConfig).map(([key, value]) => {
                                    const fieldClass = cn(
                                      `space-y-2 p-3 border rounded-md`,
                                    );

                                    return (
                                      <div key={key} className={fieldClass}>
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                          {fieldNameMap[key] || key}
                                        </label>
                                        <ConfigFieldRenderer
                                          serverName={serverName}
                                          serverConfig={serverConfig}
                                          fieldKey={key}
                                          value={value}
                                          isEditing={true}
                                          onUpdateServerConfig={updateServerConfig}
                                          onArrayItemChange={handleArrayItemChange}
                                          onArrayItemMove={handleArrayItemMove}
                                          onArrayItemDelete={handleArrayItemDelete}
                                          onArrayItemAdd={handleArrayItemAdd}
                                          onEnvChange={handleEnvChange}
                                          onEnvDelete={handleEnvDelete}
                                          onEnvAdd={handleEnvAdd}
                                          onEnvKeyChange={handleEnvKeyChange}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between gap-2 mt-6">
                            <Button
                              variant="destructive"
                              onClick={() => deleteServer(serverName)}
                            >
                              <Trash className="h-4 w-4" />
                              {t('buttons.delete')}
                            </Button>
                            <DialogTrigger asChild>
                              <Button variant="outline">
                                <Check className="h-4 w-4" />
                                {t('buttons.ok')}
                              </Button>
                            </DialogTrigger>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className=''>
                  <div className="flex flex-col gap-2">
                    {Object.entries(serverConfig).map(([key, value]) => {
                      // 跳过禁用字段，因为它已经在卡片头部显示为开关
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
                            renderDisabled={false} // 不再渲染disable字段
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