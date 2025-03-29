import { useState } from 'react'
import { MCPConfigEditor } from './components/editor'
import { Minus, Square, Maximize2, X as Close, Copy } from 'lucide-react'
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from './lib/utils'

function App() {
  const [isMaximized, setIsMaximized] = useState(false)
  const isMac = window.electronAPI.platform === 'darwin'

  const handleWindowControl = async (action: 'minimize' | 'maximize' | 'close') => {
    await window.electronAPI.windowControl[action]()
    if (action === 'maximize') {
      setIsMaximized(await window.electronAPI.windowControl.isMaximized())
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className={`w-full h-screen flex flex-col ${isMac ? 'bg-transparent' : 'bg-background bg-transparent'}`}>
        {isMac ? (
          <div className="h-9 flex items-center justify-center border-b select-none app-region-drag w-screen vibrancy-header-custom">
            <span className='text-sm'>MCP Config</span>
          </div>
        ) : (
          <div className="h-8 flex items-center justify-between border-b select-none app-region-drag">
            <div className="flex-1 px-4">
              MCP Config
            </div>
            <div className="flex h-full">
              <button
                onClick={() => handleWindowControl('minimize')}
                className="h-full px-4 hover:bg-gray-200 transition-colors"
              >
                <Minus className="size-3" />
              </button>
              <button
                onClick={() => handleWindowControl('maximize')}
                className="h-full px-4 hover:bg-gray-200 transition-colors"
              >
                {!isMaximized ? <Square className="size-3" /> : <Copy className="size-3" />}
              </button>
              <button
                onClick={() => handleWindowControl('close')}
                className="h-full px-4 hover:bg-red-500 hover:text-white transition-colors"
              >
                <Close className="size-3" />
              </button>
            </div>
          </div>
        )}
        <div className={`flex-1 overflow-auto ${isMac ? cn(
          // 'vibrancy-content-custom',
          'bg-background'
          ) : 'bg-background bg-transparent'}`}>
          <MCPConfigEditor />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
