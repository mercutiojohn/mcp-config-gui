import { Minus, Square, Maximize2, X as Close } from 'lucide-react'
import { ThemeProvider } from "@/components/theme-provider"
import { useWindowControls } from './hooks/use-window-controls'
import { AppSidebar } from "@/components/app-sidebar"
import { NavActions } from "@/components/nav-actions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { TopBar } from './components/top-bar.tsx'
import { cn } from './lib/utils.ts'

function App() {
  const { isMac, isMaximized, handleWindowControl } = useWindowControls();

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
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
          <header className="flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      Project Management & Task Tracking
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-3">
              <NavActions />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 px-4 py-10">
            <div className="mx-auto h-24 w-full max-w-3xl rounded-xl bg-muted/50" />
            <div className="mx-auto h-full w-full max-w-3xl rounded-xl bg-muted/50" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
