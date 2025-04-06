import React from 'react'
import { cn } from '@/lib/utils'
import { useSnapshot } from 'valtio'
import { fileState, useFileOperations } from '@/hooks/use-file-operations'
import { TopBar } from './top-bar'
import { ServerList } from './server-list'
import { Button } from './ui/button'
import { File, Import, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ImportConfigDialog } from './dialogs/import-config-dialog'
import { useWindowControls } from '@/hooks/use-window-controls'

export const MCPConfigEditor: React.FC = () => {
  const { t } = useTranslation()
  const state = useSnapshot(fileState)
  const {
    handleOpenFile,
    createNewConfig,
    importConfig,
    setImportConfig,
    handleImportConfig,
    isPrepared
  } = useFileOperations();

  const { isMac } = useWindowControls();

  if (!isPrepared) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={handleOpenFile}
          >
            <File className="mr-2 h-4 w-4" />
            {t('buttons.openFile')}
          </Button>

          <Button
            variant="outline"
            onClick={createNewConfig}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('buttons.newConfig')}
          </Button>

          <ImportConfigDialog
            importConfig={importConfig}
            setImportConfig={setImportConfig}
            handleImportConfig={handleImportConfig}
          >
            <Button variant="outline">
              <Import className="mr-2 h-4 w-4" />
              {t('buttons.pasteConfig')}
            </Button>
          </ImportConfigDialog>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className={cn(
        "mx-auto relative flex flex-col h-[calc(100vh-theme(height.header))]",
      )}>
        <ServerList className={cn(
          "flex-1",
          isMac ? "vibrancy-content-custom" : "bg-background",
        )} />
      </div>
    </div>
  )
}