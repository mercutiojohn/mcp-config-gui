import React, { useState } from 'react'

// 声明全局 electronAPI
declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<any>
      saveFile: (data: any) => Promise<boolean>
    }
  }
}

interface MCPConfig {
  mcpServers: {
    [key: string]: {
      url?: string
      command?: string
      args?: string[]
      env?: Record<string, string>
      autoApprove?: string[]
      disabled?: boolean
    }
  }
}

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

  const updateServerConfig = (serverName: string, newConfig: any) => {
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

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={handleOpenFile}
        >
          打开配置文件
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex justify-between mb-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          onClick={handleOpenFile}
          disabled={loading}
        >
          {loading ? '处理中...' : '打开'}
        </button>
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          onClick={handleSaveFile}
          disabled={loading || !config}
        >
          {loading ? '处理中...' : '保存'}
        </button>
      </div>
      
      <div className="space-y-4">
        {Object.entries(config.mcpServers).map(([serverName, serverConfig]) => (
          <div key={serverName} className="border p-4 rounded">
            <h3 className="font-bold">{serverName}</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(serverConfig).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium">{key}</label>
                  {Array.isArray(value) ? (
                    <textarea
                      className="w-full border rounded p-2"
                      value={value.join('\n')}
                      onChange={e => {
                        const newValue = e.target.value.split('\n')
                        updateServerConfig(serverName, {
                          ...serverConfig,
                          [key]: newValue
                        })
                      }}
                    />
                  ) : typeof value === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={e => {
                        updateServerConfig(serverName, {
                          ...serverConfig,
                          [key]: e.target.checked
                        })
                      }}
                    />
                  ) : (
                    <input
                      className="w-full border rounded p-2"
                      value={value}
                      onChange={e => {
                        updateServerConfig(serverName, {
                          ...serverConfig,
                          [key]: e.target.value
                        })
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 