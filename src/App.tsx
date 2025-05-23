import { MCPConfigEditor } from './components/main-editor'
import { Minus, Square, Maximize2, X as Close } from 'lucide-react'
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from './lib/utils'
import { useWindowControls } from './hooks/use-window-controls'
import { TopBar } from './components/top-bar'

function App() {
  const { isMac, isMaximized, handleWindowControl } = useWindowControls();

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className={`w-full h-screen flex flex-col ${isMac ? 'bg-transparent' : 'bg-background'}`}>
        {!isMac ? (
          <div className="h-8 flex items-center justify-between bg-background border-b select-none app-region-drag">
            <div className="flex-1 px-4">
              <TopBar className={cn(
                "h-full",
                "px-4 w-full",
                isMac ? "vibrancy-header-custom" : "bg-background"
              )} />
            </div>
            <div className="flex h-full">
              <button
                onClick={() => handleWindowControl('minimize')}
                className="h-full px-4 hover:bg-gray-200 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleWindowControl('maximize')}
                className="h-full px-4 hover:bg-gray-200 transition-colors"
              >
                {isMaximized ? <Square className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleWindowControl('close')}
                className="h-full px-4 hover:bg-red-500 hover:text-white transition-colors"
              >
                <Close className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          // <div className="h-header flex items-center justify-center border-b select-none app-region-drag w-screen vibrancy-header-custom">
          //   <span className='text-sm'>MCP Config</span>
          // </div>
          <div className={cn(
            "h-header border-b",
            isMac ? "pl-15" : "",
            isMac ? "vibrancy-header-custom" : "bg-background"
          )}>
            <TopBar className={cn(
              "h-full",
              "px-4 w-full",
            )} />
          </div>
        )}
        <div className={`flex-1 overflow-auto ${isMac ? cn(
          // 'vibrancy-content-custom',
          'bg-transparent',
          // 'bg-background'
        ) : 'bg-background'}`}>
          <MCPConfigEditor />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
