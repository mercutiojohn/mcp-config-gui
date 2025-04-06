import { useState } from 'react';
import { ServerConfig } from '@/types/mcp-config';

export function useServerOperations(
  config: any,
  setConfig: React.Dispatch<React.SetStateAction<any>>
) {
  const addNewServer = (serverName: string) => {
    if (!config || !serverName.trim()) return;
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        mcpServers: {
          ...prev.mcpServers,
          [serverName]: {
            command: 'npx',
            args: [],
            autoApprove: [],
            env: {}
          }
        }
      };
    });
  };

  const deleteServer = (serverName: string) => {
    setConfig(prev => {
      if (!prev) return prev;
      const newConfig = { ...prev };
      delete newConfig.mcpServers[serverName];
      return newConfig;
    });
  };

  const updateServerConfig = (serverName: string, newConfig: ServerConfig) => {
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        mcpServers: {
          ...prev.mcpServers,
          [serverName]: newConfig
        }
      };
    });
  };

  return {
    addNewServer,
    deleteServer,
    updateServerConfig
  };
}