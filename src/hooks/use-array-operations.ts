import { ServerConfig } from '@/types/mcp-config';

export const useArrayOperations = (
  updateServerConfig: (serverName: string, newConfig: ServerConfig) => void
) => {
  const handleArrayItemChange = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: keyof ServerConfig,
    index: number,
    newValue: string
  ) => {
    const newArray = [...((serverConfig[fieldKey] || []) as string[])];
    newArray[index] = newValue;
    updateServerConfig(serverName, {
      ...serverConfig,
      [fieldKey]: newArray
    } as ServerConfig);
  };

  const handleArrayItemDelete = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: keyof ServerConfig,
    index: number
  ) => {
    const newArray = [...((serverConfig[fieldKey] || []) as string[])];
    newArray.splice(index, 1);
    updateServerConfig(serverName, {
      ...serverConfig,
      [fieldKey]: newArray
    } as ServerConfig);
  };

  const handleArrayItemAdd = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: keyof ServerConfig
  ) => {
    const newArray = [...((serverConfig[fieldKey] || []) as string[]), ''];
    updateServerConfig(serverName, {
      ...serverConfig,
      [fieldKey]: newArray
    } as ServerConfig);
  };

  const handleArrayItemMove = (
    serverName: string,
    serverConfig: ServerConfig,
    fieldKey: keyof ServerConfig,
    index: number,
    direction: 'up' | 'down'
  ) => {
    const newArray = [...((serverConfig[fieldKey] || []) as string[])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newArray.length) return;
    [newArray[index], newArray[newIndex]] = [newArray[newIndex], newArray[index]];
    updateServerConfig(serverName, {
      ...serverConfig,
      [fieldKey]: newArray
    } as ServerConfig);
  };

  return {
    handleArrayItemChange,
    handleArrayItemDelete,
    handleArrayItemAdd,
    handleArrayItemMove
  };
};