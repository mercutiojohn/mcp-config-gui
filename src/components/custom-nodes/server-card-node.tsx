import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ServerConfig, getServerType, serverTypeMap, fieldNameMap } from '@/types/mcp-config';
import { ConfigFieldRenderer } from '../config-field-renderer';
import { ServerSettingsDialog } from '../dialogs/server-settings-dialog';

interface ServerCardNodeProps extends NodeProps {
  data: {
    label: string;
    serverConfig: ServerConfig;
    updateServerConfig: (serverName: string, newConfig: ServerConfig) => void;
    deleteServer: (serverName: string) => void;
    handleArrayItemChange: (serverName: string, key: string, index: number, value: string) => void;
    handleArrayItemMove: (serverName: string, key: string, index: number, direction: 'up' | 'down') => void;
    handleArrayItemDelete: (serverName: string, key: string, index: number) => void;
    handleArrayItemAdd: (serverName: string, key: string, value: string) => void;
    handleEnvChange: (serverName: string, key: string, value: string) => void;
    handleEnvDelete: (serverName: string, key: string) => void;
    handleEnvAdd: (serverName: string, key: string, value: string) => void;
    handleEnvKeyChange: (serverName: string, oldKey: string, newKey: string) => void;
  };
}

export const ServerCardNode: React.FC<ServerCardNodeProps> = ({ data, id }) => {
  const {
    label,
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
    handleEnvKeyChange,
  } = data;

  return (
    <div className="min-w-[350px]">
      {/* 节点连接句柄 */}
      <Handle type="target" position={Position.Top} />

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2 !pt-1">
          <CardTitle className="text-lg font-bold truncate">
            {label}
            <span className="ml-2 text-sm text-muted-foreground">
              {serverTypeMap[getServerType(serverConfig)]}
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={!Boolean(serverConfig.disabled)}
                onCheckedChange={(checked) => {
                  updateServerConfig(label, {
                    ...serverConfig,
                    disabled: !checked
                  });
                }}
              />
            </div>
            <div>
              <ServerSettingsDialog
                serverName={label}
                serverConfig={serverConfig}
                updateServerConfig={updateServerConfig}
                deleteServer={deleteServer}
                handleArrayItemChange={handleArrayItemChange}
                handleArrayItemMove={handleArrayItemMove}
                handleArrayItemDelete={handleArrayItemDelete}
                handleArrayItemAdd={handleArrayItemAdd}
                handleEnvChange={handleEnvChange}
                handleEnvDelete={handleEnvDelete}
                handleEnvAdd={handleEnvAdd}
                handleEnvKeyChange={handleEnvKeyChange}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[200px] overflow-y-auto">
          <div className="flex flex-col gap-2">
            {Object.entries(serverConfig).map(([key, value]) => {
              if (key === 'disabled') return null;
              // 在关系图视图中只显示关键字段
              if (!['command', 'args', 'autoApprove', 'readyWhen'].includes(key)) return null;

              return (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {fieldNameMap[key] || key}
                  </label>
                  <ConfigFieldRenderer
                    serverName={label}
                    serverConfig={serverConfig}
                    fieldKey={key}
                    value={value}
                    isEditing={false}
                    onUpdateServerConfig={updateServerConfig}
                    onArrayItemChange={handleArrayItemChange}
                    onArrayItemMove={handleArrayItemMove}
                    onArrayItemDelete={handleArrayItemDelete}
                    onArrayItemAdd={handleArrayItemAdd}
                    onEnvChange={handleEnvChange}
                    onEnvDelete={handleEnvDelete}
                    onEnvAdd={handleEnvAdd}
                    onEnvKeyChange={handleEnvKeyChange}
                    renderDisabled={false}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};