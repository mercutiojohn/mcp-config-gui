import React from 'react';
import { ServerConfig, ServerType, serverTypeMap } from '@/types/mcp-config';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrayFieldEditor } from './array-field-editor';
import { EnvFieldEditor } from './env-field-editor';

interface ConfigFieldRendererProps {
  serverName: string;
  serverConfig: ServerConfig;
  fieldKey: string;
  value: unknown;
  isEditing: boolean;
  onUpdateServerConfig: (serverName: string, newConfig: ServerConfig) => void;
  // 数组操作处理函数
  onArrayItemChange: (serverName: string, serverConfig: ServerConfig, fieldKey: keyof ServerConfig, index: number, newValue: string) => void;
  onArrayItemMove: (serverName: string, serverConfig: ServerConfig, fieldKey: keyof ServerConfig, index: number, direction: 'up' | 'down') => void;
  onArrayItemDelete: (serverName: string, serverConfig: ServerConfig, fieldKey: keyof ServerConfig, index: number) => void;
  onArrayItemAdd: (serverName: string, serverConfig: ServerConfig, fieldKey: keyof ServerConfig) => void;
  // 环境变量操作处理函数
  onEnvChange: (serverName: string, serverConfig: ServerConfig, key: string, value: string) => void;
  onEnvDelete: (serverName: string, serverConfig: ServerConfig, key: string) => void;
  onEnvAdd: (serverName: string, serverConfig: ServerConfig) => void;
  onEnvKeyChange: (serverName: string, serverConfig: ServerConfig, oldKey: string, newKey: string, value: string) => void;
  // 是否渲染 disabled 字段（设置页面需要，卡片列表不需要）
  renderDisabled?: boolean;
}

export const ConfigFieldRenderer: React.FC<ConfigFieldRendererProps> = ({
  serverName,
  serverConfig,
  fieldKey,
  value,
  isEditing,
  onUpdateServerConfig,
  onArrayItemChange,
  onArrayItemMove,
  onArrayItemDelete,
  onArrayItemAdd,
  onEnvChange,
  onEnvDelete,
  onEnvAdd,
  onEnvKeyChange,
  renderDisabled = true
}) => {
  // 如果是 disabled 字段且不需要渲染，则跳过
  if (fieldKey === 'disabled' && !renderDisabled && !isEditing) {
    return null;
  }

  if (!isEditing) {
    // 只读模式的渲染
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.map((item, index) => (
            <div key={index} className="text-sm text-muted-foreground truncate hover:text-clip" title={String(item)}>
              {String(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return <div className="text-sm text-muted-foreground">{value ? '是' : '否'}</div>;
    }

    if (typeof value === 'object' && value !== null) {
      if (fieldKey === 'env' && typeof value === 'object') {
        const envVars = value as Record<string, string>;
        return (
          <div className="space-y-1">
            {Object.entries(envVars).map(([key, val]) => (
              <div key={key} className="text-sm text-muted-foreground truncate hover:text-clip" title={`${key}: ${val}`}>
                {`${key}: ${val}`}
              </div>
            ))}
          </div>
        );
      }
      const stringified = JSON.stringify(value, null, 2);
      return <div className="text-sm text-muted-foreground truncate hover:text-clip" title={stringified}>{stringified}</div>;
    }

    return <div className="text-sm text-muted-foreground truncate hover:text-clip" title={String(value)}>{String(value)}</div>;
  }

  // 编辑模式
  if (fieldKey === 'command' && typeof value === 'string') {
    return (
      <Select
        value={value}
        onValueChange={(newValue: ServerType) => {
          onUpdateServerConfig(serverName, {
            ...serverConfig,
            command: newValue
          } as ServerConfig);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="选择命令类型" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(ServerType).filter(type =>
            type !== ServerType.SSE && type !== ServerType.Other
          ).map((type) => (
            <SelectItem key={type} value={type}>
              {serverTypeMap[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ArrayFieldEditor
        serverName={serverName}
        serverConfig={serverConfig}
        fieldKey={fieldKey}
        array={value}
        onArrayItemChange={onArrayItemChange}
        onArrayItemMove={onArrayItemMove}
        onArrayItemDelete={onArrayItemDelete}
        onArrayItemAdd={onArrayItemAdd}
      />
    );
  }

  if (typeof value === 'boolean') {
    return (
      <Checkbox
        checked={value}
        onCheckedChange={(checked) => {
          onUpdateServerConfig(serverName, {
            ...serverConfig,
            [fieldKey]: checked
          } as ServerConfig);
        }}
      />
    );
  }

  if (typeof value === 'object' && value !== null) {
    if (fieldKey === 'env') {
      return (
        <EnvFieldEditor
          serverName={serverName}
          serverConfig={serverConfig}
          env={value as Record<string, string>}
          onEnvChange={onEnvChange}
          onEnvDelete={onEnvDelete}
          onEnvAdd={onEnvAdd}
          onEnvKeyChange={onEnvKeyChange}
        />
      );
    }
    return (
      <Textarea
        value={JSON.stringify(value, null, 2)}
        onChange={e => {
          try {
            const newValue = JSON.parse(e.target.value);
            onUpdateServerConfig(serverName, {
              ...serverConfig,
              [fieldKey]: newValue
            } as ServerConfig);
          } catch (err) {
            // 处理JSON解析错误
          }
        }}
      />
    );
  }

  return (
    <Input
      type="text"
      value={value as string}
      onChange={e => {
        onUpdateServerConfig(serverName, {
          ...serverConfig,
          [fieldKey]: e.target.value
        } as ServerConfig);
      }}
    />
  );
};