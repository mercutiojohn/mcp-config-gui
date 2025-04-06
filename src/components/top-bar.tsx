import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Loader2, Plus, File, Import, Trash2, History } from "lucide-react"
import { cn } from '@/lib/utils'
import { useFileOperations, fileState } from '@/hooks/use-file-operations'
import { useServerOperations } from '@/hooks/use-server-operations'
import { useSnapshot } from 'valtio'
import { ImportConfigDialog } from './dialogs/import-config-dialog'
import { SaveConfigDialog } from './dialogs/save-config-dialog'
import { PathHistoryDialog } from './path-history-dialog'
import { AddServerDialog } from './dialogs/add-server-dialog'
import { useWindowControls } from '@/hooks/use-window-controls'

export const TopBar: React.FC = () => {
  const { t } = useTranslation()
  // const state = useSnapshot(fileState)
  // const { loading } = state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [customPath, setCustomPath] = useState('');

  const {
    config,
    setConfig,
    loading,
    selectedServers,
    pathHistory,
    currentPath,
    setCurrentPath,
    handleOpenFile,
    handleSaveFile,
    handleImportConfig,
    setImportConfig,
    importConfig,
    toggleServerSelection,
    selectAllServers,
    createNewConfig,
    selectSavePath,
    removePathFromHistory,
    clearPathHistory,
  } = useFileOperations();

  const { isMac } = useWindowControls();

  const { addNewServer } = useServerOperations(config, setConfig);

  // 检查配置是否为空
  const isConfigEmpty = !config || Object.keys(config.mcpServers || {}).length === 0;

  const handleConfirmSave = async () => {
    await handleSaveFile(customPath);
    setSaveDialogOpen(false);
    setCustomPath(''); // 清空自定义路径
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectAllServers(e.target.checked);
  };

  const handleCreateNew = () => {
    if (!isConfigEmpty) {
      if (window.confirm(t('prompts.createNewConfig') || '确定要创建新的配置吗？现有配置将被清除。')) {
        createNewConfig();
      }
    } else {
      createNewConfig();
    }
  }

  return (
    <div className={cn(
      "border-b py-4 w-full",
      isMac ? "vibrancy-header-custom" : "bg-background",
    )}>
      <div className={cn(
        "px-4",
        "flex justify-between"
      )}>
        <div className="flex gap-2 app-region-no-drag">
          {/* 打开文件对话框 */}
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
            ) : (
              <>
                <File className="mr-2 h-4 w-4" />
                {t('buttons.importConfigJson')}
              </>
            )}
          </Button>

          {/* 导入配置对话框 */}
          <ImportConfigDialog
            importConfig={importConfig}
            setImportConfig={setImportConfig}
            handleImportConfig={handleImportConfig}
          >
            <Button variant="outline">
              <Import className="h-4 w-4" />
              {t('buttons.pasteConfig')}
            </Button>
          </ImportConfigDialog>

          <Button
            variant="destructive"
            onClick={handleCreateNew}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('buttons.processing')}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('buttons.clearConfig')}
              </>
            )}
          </Button>

          <Button
            variant="default"
            disabled={loading || isConfigEmpty}
            onClick={() => setSaveDialogOpen(true)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('buttons.processing')}
              </>
            ) : t('buttons.export')}
          </Button>

          {/* 保存配置对话框 */}
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
            serverNames={config && config.mcpServers ? Object.keys(config.mcpServers) : []}
            onConfirm={handleConfirmSave}
          />

          {/* 路径历史记录管理对话框 */}
          <PathHistoryDialog
            pathHistory={pathHistory}
            currentPath={currentPath}
            onSelectPath={selectSavePath}
            onRemovePath={removePathFromHistory}
            onClearHistory={clearPathHistory}
          >
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              {t('buttons.pathHistory')}
            </Button>
          </PathHistoryDialog>
        </div>

        <div className="flex items-center gap-2 app-region-no-drag">
          {/* 添加 MCP 服务器对话框 */}
          <AddServerDialog onAddServer={addNewServer}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('buttons.add')}
            </Button>
          </AddServerDialog>
        </div>
      </div>
    </div>
  )
}