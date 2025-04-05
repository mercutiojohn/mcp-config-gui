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

export const MCPConfigEditor: React.FC = () => {
  const { t } = useTranslation()
  const [newServerName, setNewServerName] = useState('')
  const {
    config,
    setConfig,
    loading,
    error,
    setError,
    importConfig,
    setImportConfig,
    handleOpenFile,
    handleSaveFile,
    handleImportConfig
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

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={handleOpenFile}
          >
            {t('buttons.open')}
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
          // "flex justify-center",
        )}>
          <div className={cn(
            // "container",
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
                ) : t('buttons.open')}
              </Button>
              <Button
                variant="default"
                onClick={handleSaveFile}
                disabled={loading || !config}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('buttons.processing')}
                  </>
                ) : t('buttons.save')}
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
                    <div className="">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Settings className="h-3 w-3 mr-1" />
                            {t('buttons.editDetails')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{t('dialog.serverSettings')} - {serverName}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
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