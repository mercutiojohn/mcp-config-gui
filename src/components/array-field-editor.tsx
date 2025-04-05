import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { ServerConfig } from '@/types/mcp-config';

interface ArrayFieldEditorProps {
  serverName: string;
  serverConfig: ServerConfig;
  fieldKey: string;
  array: string[];
  onArrayItemChange: (serverName: string, serverConfig: ServerConfig, fieldKey: keyof ServerConfig, index: number, newValue: string) => void;
  onArrayItemMove: (serverName: string, serverConfig: ServerConfig, fieldKey: keyof ServerConfig, index: number, direction: 'up' | 'down') => void;
  onArrayItemDelete: (serverName: string, serverConfig: ServerConfig, fieldKey: keyof ServerConfig, index: number) => void;
  onArrayItemAdd: (serverName: string, serverConfig: ServerConfig, fieldKey: keyof ServerConfig) => void;
}

export const ArrayFieldEditor: React.FC<ArrayFieldEditorProps> = ({
  serverName,
  serverConfig,
  fieldKey,
  array,
  onArrayItemChange,
  onArrayItemMove,
  onArrayItemDelete,
  onArrayItemAdd
}) => {
  return (
    <div className="space-y-2">
      {array.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            title={item}
            onChange={(e) => onArrayItemChange(serverName, serverConfig, fieldKey as keyof ServerConfig, index, e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onArrayItemMove(serverName, serverConfig, fieldKey as keyof ServerConfig, index, 'up')}
            disabled={index === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onArrayItemMove(serverName, serverConfig, fieldKey as keyof ServerConfig, index, 'down')}
            disabled={index === array.length - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onArrayItemDelete(serverName, serverConfig, fieldKey as keyof ServerConfig, index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onArrayItemAdd(serverName, serverConfig, fieldKey as keyof ServerConfig)}
      >
        <Plus className="h-4 w-4 mr-2" />
        添加项目
      </Button>
    </div>
  );
};