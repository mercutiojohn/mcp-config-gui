import { ServerConfig } from '@/types/mcp-config';

export const useEnvOperations = (
  updateServerConfig: (serverName: string, newConfig: ServerConfig) => void
) => {
  const handleEnvChange = (
    serverName: string,
    serverConfig: ServerConfig,
    key: string,
    value: string
  ) => {
    if (!('env' in serverConfig)) return;
    updateServerConfig(serverName, {
      ...serverConfig,
      env: {
        ...serverConfig.env,
        [key]: value
      }
    } as ServerConfig);
  };

  const handleEnvDelete = (
    serverName: string,
    serverConfig: ServerConfig,
    key: string
  ) => {
    if (!('env' in serverConfig)) return;
    const newEnv = { ...serverConfig.env };
    delete newEnv[key];
    updateServerConfig(serverName, {
      ...serverConfig,
      env: newEnv
    } as ServerConfig);
  };

  const handleEnvAdd = (
    serverName: string,
    serverConfig: ServerConfig
  ) => {
    if (!('env' in serverConfig)) return;
    updateServerConfig(serverName, {
      ...serverConfig,
      env: {
        ...serverConfig.env,
        'NEW_KEY': ''
      }
    } as ServerConfig);
  };

  const handleEnvKeyChange = (
    serverName: string,
    serverConfig: ServerConfig,
    oldKey: string,
    newKey: string,
    value: string
  ) => {
    if (!('env' in serverConfig)) return;
    const newEnv = { ...serverConfig.env };
    delete newEnv[oldKey];
    updateServerConfig(serverName, {
      ...serverConfig,
      env: {
        ...newEnv,
        [newKey]: value
      }
    } as ServerConfig);
  };

  return {
    handleEnvChange,
    handleEnvDelete,
    handleEnvAdd,
    handleEnvKeyChange
  };
};