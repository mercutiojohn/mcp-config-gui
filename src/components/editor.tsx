import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, X, ArrowUp, ArrowDown, Settings, FileUp, Check, Trash, Minus, Square, X as Close, Maximize2 } from "lucide-react"
import { MCPConfig, ServerConfig, getServerType, ServerType, serverTypeMap, fieldNameMap } from '@/types/mcp-config'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from '@/lib/utils'


// 声明全局 electronAPI
declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<any>
      saveFile: (data: any) => Promise<boolean>
      windowControl: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
      }
      platform: string
    }
    require?: any
  }
}

// 使用 window.electron 代替直接导入
const { } = window.require ? window.require('electron') : { }

export const MCPConfigEditor: React.FC = () => {
  const { t } = useTranslation()
  const [config, setConfig] = useState<MCPConfig | null>(null)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newServerName, setNewServerName] = useState('')
  const [importConfig, setImportConfig] = useState('')

  const handleOpenFile = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await window.electronAPI.openFile()
      if (result) {
        setConfig(JSON.parse(result.content))
        setCurrentPath(result.path)
      }
    } catch (err) {
      setError(t('errors.openFileFailed', { message: (err as Error).message }))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFile = async () => {
    if (!config) return
    try {
      setLoading(true)
      setError(null)
      await window.electronAPI.saveFile({
        content: config,
        path: currentPath
      })
    } catch (err) {
      setError(t('errors.saveFileFailed', { message: (err as Error).message }))
    } finally {
      setLoading(false)
    }
  }

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

  const handleArrayItemChange = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: keyof ServerConfig,
    index: number,
    newValue: string
  ) => {
    const newArray = [...((serverConfig[fieldKey] || []) as string[])]
    newArray[index] = newValue
    updateServerConfig(serverName, {
      ...serverConfig,
      [fieldKey]: newArray
    } as ServerConfig)
  }

  const handleArrayItemDelete = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: keyof ServerConfig,
    index: number
  ) => {
    const newArray = [...((serverConfig[fieldKey] || []) as string[])]
    newArray.splice(index, 1)
    updateServerConfig(serverName, {
      ...serverConfig,
      [fieldKey]: newArray
    } as ServerConfig)
  }

  const handleArrayItemAdd = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: keyof ServerConfig
  ) => {
    const newArray = [...((serverConfig[fieldKey] || []) as string[]), '']
    updateServerConfig(serverName, {
      ...serverConfig,
      [fieldKey]: newArray
    } as ServerConfig)
  }

  const handleArrayItemMove = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: keyof ServerConfig,
    index: number,
    direction: 'up' | 'down'
  ) => {
    const newArray = [...((serverConfig[fieldKey] || []) as string[])]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newArray.length) return
    [newArray[index], newArray[newIndex]] = [newArray[newIndex], newArray[index]]
    updateServerConfig(serverName, {
      ...serverConfig,
      [fieldKey]: newArray
    } as ServerConfig)
  }

  const handleEnvChange = (
    serverName: string,
    serverConfig: ServerConfig,
    key: string,
    value: string
  ) => {
    if (!('env' in serverConfig)) return
    updateServerConfig(serverName, {
      ...serverConfig,
      env: {
        ...serverConfig.env,
        [key]: value
      }
    } as ServerConfig)
  }

  const handleEnvDelete = (
    serverName: string,
    serverConfig: ServerConfig,
    key: string
  ) => {
    if (!('env' in serverConfig)) return
    const newEnv = { ...serverConfig.env }
    delete newEnv[key]
    updateServerConfig(serverName, {
      ...serverConfig,
      env: newEnv
    } as ServerConfig)
  }

  const handleEnvAdd = (
    serverName: string,
    serverConfig: ServerConfig
  ) => {
    if (!('env' in serverConfig)) return
    updateServerConfig(serverName, {
      ...serverConfig,
      env: {
        ...serverConfig.env,
        'NEW_KEY': ''
      }
    } as ServerConfig)
  }

  const handleImportConfig = () => {
    try {
      let parsedConfig = JSON.parse(importConfig)

      // 如果是完整的 MCP 配置格式
      if ('mcpServers' in parsedConfig) {
        setConfig(prev => ({
          ...prev,
          mcpServers: {
            ...prev?.mcpServers,
            ...parsedConfig.mcpServers
          }
        }))
      }
      // 如果是单个服务器配置
      else {
        const serverName = Object.keys(parsedConfig)[0]
        const serverConfig = parsedConfig[serverName]
        setConfig(prev => ({
          ...prev,
          mcpServers: {
            ...prev?.mcpServers,
            [serverName]: serverConfig
          }
        }))
      }
      setImportConfig('')
      setError(null)
    } catch (err) {
      setError('导入配置失败：' + (err as Error).message)
    }
  }

  const renderArrayField = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: string,
    array: string[]
  ) => (
    <div className="space-y-2">
      {array.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            title={item}
            onChange={(e) => handleArrayItemChange(serverName, serverConfig, fieldKey as keyof ServerConfig, index, e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleArrayItemMove(serverName, serverConfig, fieldKey as keyof ServerConfig, index, 'up')}
            disabled={index === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleArrayItemMove(serverName, serverConfig, fieldKey as keyof ServerConfig, index, 'down')}
            disabled={index === array.length - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleArrayItemDelete(serverName, serverConfig, fieldKey as keyof ServerConfig, index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleArrayItemAdd(serverName, serverConfig, fieldKey as keyof ServerConfig)}
      >
        <Plus className="h-4 w-4 mr-2" />
        添加项目
      </Button>
    </div>
  )

  const renderEnvField = (
    serverName: string,
    serverConfig: ServerConfig,
    env: Record<string, string>
  ) => (
    <div className="space-y-2">
      {Object.entries(env).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <Input
            value={key}
            onChange={(e) => {
              const newEnv = { ...env }
              delete newEnv[key]
              updateServerConfig(serverName, {
                ...serverConfig,
                env: {
                  ...newEnv,
                  [e.target.value]: value
                }
              } as ServerConfig)
            }}
          />
          <Input
            value={value}
            onChange={(e) => handleEnvChange(serverName, serverConfig, key, e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEnvDelete(serverName, serverConfig, key)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleEnvAdd(serverName, serverConfig)}
      >
        <Plus className="h-4 w-4 mr-2" />
        添加环境变量
      </Button>
    </div>
  )

  const renderConfigField = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: string,
    value: unknown,
    isEditing: boolean
  ) => {
    if (!isEditing) {
      // 只读模式的渲染
      if (Array.isArray(value)) {
        return (
          <div className="space-y-1">
            {value.map((item, index) => (
              <div key={index} className="text-sm text-muted-foreground truncate hover:text-clip" title={String(item)}>
                {String(item)}
              </div>
            ))}
          </div>
        )
      }

      if (typeof value === 'boolean') {
        return <div className="text-sm text-muted-foreground">{value ? '是' : '否'}</div>
      }

      if (typeof value === 'object' && value !== null) {
        if (fieldKey === 'env' && typeof value === 'object') {
          const envVars = value as Record<string, string>
          return (
            <div className="space-y-1">
              {Object.entries(envVars).map(([key, val]) => (
                <div key={key} className="text-sm text-muted-foreground truncate hover:text-clip" title={`${key}: ${val}`}>
                  {`${key}: ${val}`}
                </div>
              ))}
            </div>
          )
        }
        const stringified = JSON.stringify(value, null, 2)
        return <div className="text-sm text-muted-foreground truncate hover:text-clip" title={stringified}>{stringified}</div>
      }

      return <div className="text-sm text-muted-foreground truncate hover:text-clip" title={String(value)}>{String(value)}</div>
    }

    // 编辑模式的原有逻辑
    if (fieldKey === 'command' && typeof value === 'string') {
      return (
        <Select
          value={value}
          onValueChange={(newValue: ServerType) => {
            updateServerConfig(serverName, {
              ...serverConfig,
              command: newValue
            } as ServerConfig)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择命令类型" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ServerType).map((type) => (
              <SelectItem key={type} value={type}>
                {serverTypeMap[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (Array.isArray(value)) {
      return renderArrayField(serverName, serverConfig, fieldKey, value)
    }

    if (typeof value === 'boolean') {
      return (
        <Checkbox
          checked={value}
          onCheckedChange={(checked) => {
            updateServerConfig(serverName, {
              ...serverConfig,
              [fieldKey]: checked
            } as ServerConfig)
          }}
        />
      )
    }

    if (typeof value === 'object' && value !== null) {
      if (fieldKey === 'env') {
        return renderEnvField(serverName, serverConfig, value as Record<string, string>)
      }
      return (
        <Textarea
          value={JSON.stringify(value, null, 2)}
          onChange={e => {
            try {
              const newValue = JSON.parse(e.target.value)
              updateServerConfig(serverName, {
                ...serverConfig,
                [fieldKey]: newValue
              } as ServerConfig)
            } catch (err) {
              // Handle JSON parse error if needed
            }
          }}
        />
      )
    }

    return (
      <Input
        type="text"
        value={value as string}
        onChange={e => {
          updateServerConfig(serverName, {
            ...serverConfig,
            [fieldKey]: e.target.value
          } as ServerConfig)
        }}
      />
    )
  }

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
      <div className="container mx-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between mb-6">
          <div className="flex gap-2">
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
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                                      {renderConfigField(serverName, serverConfig, key, value, true)}
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
                        {renderConfigField(serverName, serverConfig, key, value, false)}
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
  )
}