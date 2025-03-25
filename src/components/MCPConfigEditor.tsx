import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { MCPConfig, ServerConfig, getServerType, ServerType } from '@/types/mcp-config'

// 声明全局 electronAPI
declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<any>
      saveFile: (data: any) => Promise<boolean>
    }
  }
}

// 使用 window.electron 代替直接导入
const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }

export const MCPConfigEditor: React.FC = () => {
  const [config, setConfig] = useState<MCPConfig | null>(null)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError('打开文件失败：' + (err as Error).message)
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
      setError('保存文件失败：' + (err as Error).message)
    } finally {
      setLoading(false)
    }
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

  const renderConfigField = (
    serverName: string, 
    serverConfig: ServerConfig,
    fieldKey: string, 
    value: any
  ) => {
    if (Array.isArray(value)) {
      return (
        <Textarea
          value={value.join('\n')}
          onChange={e => {
            const newValue = e.target.value.split('\n')
            updateServerConfig(serverName, {
              ...serverConfig,
              [fieldKey]: newValue
            } as ServerConfig)
          }}
        />
      )
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
        <Button 
          variant="default"
          onClick={handleOpenFile}
        >
          打开配置文件
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between mb-6">
        <Button 
          variant="outline"
          onClick={handleOpenFile}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              处理中...
            </>
          ) : '打开'}
        </Button>
        <Button 
          variant="default"
          onClick={handleSaveFile}
          disabled={loading || !config}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              处理中...
            </>
          ) : '保存'}
        </Button>
      </div>
      
      <div className="space-y-6">
        {Object.entries(config.mcpServers).map(([serverName, serverConfig]) => (
          <Card key={serverName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {serverName}
                <span className="text-sm text-muted-foreground">
                  {getServerType(serverConfig)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(serverConfig).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {key}
                    </label>
                    {renderConfigField(serverName, serverConfig, key, value)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}