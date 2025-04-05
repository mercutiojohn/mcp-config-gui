import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { ServerConfig } from '@/types/mcp-config';

interface EnvFieldEditorProps {
  serverName: string;
  serverConfig: ServerConfig;
  env: Record<string, string>;
  onEnvChange: (serverName: string, serverConfig: ServerConfig, key: string, value: string) => void;
  onEnvDelete: (serverName: string, serverConfig: ServerConfig, key: string) => void;
  onEnvAdd: (serverName: string, serverConfig: ServerConfig) => void;
  onEnvKeyChange: (serverName: string, serverConfig: ServerConfig, oldKey: string, newKey: string, value: string) => void;
}

export const EnvFieldEditor: React.FC<EnvFieldEditorProps> = ({
  serverName,
  serverConfig,
  env,
  onEnvChange,
  onEnvDelete,
  onEnvAdd,
  onEnvKeyChange
}) => {
  return (
    <div className="space-y-2">
      {Object.entries(env).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <Input
            value={key}
            onChange={(e) => onEnvKeyChange(serverName, serverConfig, key, e.target.value, value)}
          />
          <Input
            value={value}
            onChange={(e) => onEnvChange(serverName, serverConfig, key, e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEnvDelete(serverName, serverConfig, key)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEnvAdd(serverName, serverConfig)}
      >
        <Plus className="h-4 w-4 mr-2" />
        添加环境变量
      </Button>
    </div>
  );
};