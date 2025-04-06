import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Check, Trash } from "lucide-react";
import { ServerConfig, getServerType, ServerType, serverTypeMap, fieldNameMap } from '@/types/mcp-config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { ConfigFieldRenderer } from '../config-field-renderer';

interface ServerSettingsDialogProps {
  serverName: string;
  serverConfig: ServerConfig;
  updateServerConfig: (serverName: string, newConfig: ServerConfig) => void;
  deleteServer: (serverName: string) => void;
  handleArrayItemChange: (serverName: string, fieldKey: string, index: number, value: string) => void;
  handleArrayItemMove: (serverName: string, fieldKey: string, index: number, direction: 'up' | 'down') => void;
  handleArrayItemDelete: (serverName: string, fieldKey: string, index: number) => void;
  handleArrayItemAdd: (serverName: string, fieldKey: string) => void;
  handleEnvChange: (serverName: string, key: string, value: string) => void;
  handleEnvDelete: (serverName: string, key: string) => void;
  handleEnvAdd: (serverName: string) => void;
  handleEnvKeyChange: (serverName: string, oldKey: string, newKey: string) => void;
}

export const ServerSettingsDialog: React.FC<ServerSettingsDialogProps> = ({
  serverName,
  serverConfig,
  updateServerConfig,
  deleteServer,
  handleArrayItemChange,
  handleArrayItemMove,
  handleArrayItemDelete,
  handleArrayItemAdd,
  handleEnvChange,
  handleEnvDelete,
  handleEnvAdd,
  handleEnvKeyChange
}) => {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Settings className="h-3 w-3 mr-1" />
          {t('buttons.editDetails')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('dialog.serverSettings')} - {serverName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            <h4 className="font-medium">{t('dialog.serverType')}</h4>
            <Select
              value={getServerType(serverConfig)}
              onValueChange={(newType: ServerType) => {
                let newConfig: ServerConfig;
                if (newType === ServerType.SSE) {
                  newConfig = {
                    url: '',
                    autoApprove: serverConfig.autoApprove || []
                  };
                } else {
                  newConfig = {
                    command: newType as 'npx' | 'uvx' | 'node',
                    args: [],
                    env: {},
                    autoApprove: serverConfig.autoApprove || []
                  };
                }
                updateServerConfig(serverName, newConfig);
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
                      <ConfigFieldRenderer
                        serverName={serverName}
                        serverConfig={serverConfig}
                        fieldKey={key}
                        value={value}
                        isEditing={true}
                        onUpdateServerConfig={updateServerConfig}
                        onArrayItemChange={handleArrayItemChange}
                        onArrayItemMove={handleArrayItemMove}
                        onArrayItemDelete={handleArrayItemDelete}
                        onArrayItemAdd={handleArrayItemAdd}
                        onEnvChange={handleEnvChange}
                        onEnvDelete={handleEnvDelete}
                        onEnvAdd={handleEnvAdd}
                        onEnvKeyChange={handleEnvKeyChange}
                      />
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
  );
};