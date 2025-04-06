import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { electronAPI } from '@/utils/electron-api';
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
      <DialogContent className="overflow-hidden flex flex-col !max-w-screen-lg">
        <DialogHeader>
          <DialogTitle>{t('dialog.selectConfigToExport')}</DialogTitle>
        </DialogHeader>
        <div className="py-4 overflow-y-auto">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="select-all"
              checked={Object.values(selectedServers).every(v => v)}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="text-sm font-medium">
              {t('dialog.selectAll')}
            </Label>
          </div>
          <div className="space-y-2 max-h-[30vh] overflow-y-auto">
            {serverNames.map(serverName => (
              <div key={serverName} className="flex items-center space-x-2">
                <Checkbox
                  id={`server-${serverName}`}
                  checked={selectedServers[serverName] || false}
                  onCheckedChange={() => toggleServerSelection(serverName)}
                />
                <Label htmlFor={`server-${serverName}`} className="text-sm">
                  {serverName}
                </Label>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-sm">{t('dialog.savePath')}</h4>
            <RadioGroup value={customPath} onValueChange={(value) => setCustomPath(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="current-path" checked={!customPath} />
                <Label htmlFor="current-path" className="text-sm truncate">
                  {currentPath || t('dialog.defaultPath')}
                </Label>
              </div>

              {pathHistory.length > 0 && (
                <div className="space-y-2 max-h-[20vh] overflow-y-auto border rounded p-2">
                  <p className="text-xs text-muted-foreground mb-1">{t('dialog.recentPaths')}</p>
                  {pathHistory.map((path, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={path}
                        id={`path-${index}`}
                        checked={customPath === path}
                      />
                      <Label htmlFor={`path-${index}`} className="text-sm truncate">
                        {path}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </RadioGroup>

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