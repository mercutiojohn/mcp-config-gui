import { ServerConfig, MCPConfig } from '@/types/mcp-config';

export function useServerOperations(
  config: MCPConfig | null,
  setConfig: (config: MCPConfig | null) => void
) {
  const addNewServer = (serverName: string) => {
    if (!config || !serverName.trim()) return;

    // 创建新的配置对象，而不是使用setState回调函数
    const updatedConfig = {
      ...config,
      mcpServers: {
        ...config.mcpServers,
        [serverName]: {
          command: 'npx',
          args: [],
          autoApprove: [],
          env: {}
        }
      }
    };

    // 直接调用setConfig更新整个配置
    setConfig(updatedConfig);
  };

  const deleteServer = (serverName: string) => {
    if (!config || !config.mcpServers) return;

    // 创建mcpServers的副本
    const updatedMcpServers = { ...config.mcpServers };
    // 删除指定服务器
    delete updatedMcpServers[serverName];

    // 创建并更新整个配置
    const updatedConfig = {
      ...config,
      mcpServers: updatedMcpServers
    };

    setConfig(updatedConfig);
  };

  const updateServerConfig = (serverName: string, newConfig: ServerConfig) => {
    if (!config || !config.mcpServers) return;

    // 直接创建新的配置对象
    const updatedConfig = {
      ...config,
      mcpServers: {
        ...config.mcpServers,
        [serverName]: newConfig
      }
    };

    // 更新整个配置
    setConfig(updatedConfig);
  };

  return {
    addNewServer,
    deleteServer,
    updateServerConfig
  };
}