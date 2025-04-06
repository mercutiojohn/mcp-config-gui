import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { electronAPI } from '@/utils/electron-api';

interface SaveConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedServers: Record<string, boolean>;
  toggleServerSelection: (serverName: string) => void;
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customPath: string;
  setCustomPath: (path: string) => void;
  currentPath: string;
  selectSavePath: (path: string) => void;
  pathHistory: string[];
  serverNames: string[];
  onConfirm: () => Promise<void>;
}

export const SaveConfigDialog: React.FC<SaveConfigDialogProps> = ({
  open,
  onOpenChange,
  selectedServers,
  toggleServerSelection,
  handleSelectAll,
  customPath,
  setCustomPath,
  currentPath,
  selectSavePath,
  pathHistory,
  serverNames,
  onConfirm
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {serverNames.map(serverName => (
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
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-sm">{t('dialog.savePath')}</h4>
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
                      selectSavePath(result);
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
          <Button onClick={onConfirm}>
            {t('buttons.confirmExport')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};