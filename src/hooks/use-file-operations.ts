import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MCPConfig } from '@/types/mcp-config';
import { electronAPI } from '@/utils/electron-api';

export const useFileOperations = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<MCPConfig | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importConfig, setImportConfig] = useState('');

  const handleOpenFile = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await electronAPI.openFile();
      if (result) {
        setConfig(JSON.parse(result.content));
        setCurrentPath(result.path);
      }
    } catch (err) {
      setError(t('errors.openFileFailed', { message: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!config) return;
    try {
      setLoading(true);
      setError(null);
      await electronAPI.saveFile({
        content: config,
        path: currentPath,
      });
    } catch (err) {
      setError(t('errors.saveFileFailed', { message: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  const handleImportConfig = () => {
    try {
      let parsedConfig = JSON.parse(importConfig);

      // 如果是完整的 MCP 配置格式
      if ('mcpServers' in parsedConfig) {
        setConfig((prev) => ({
          ...prev,
          mcpServers: {
            ...prev?.mcpServers,
            ...parsedConfig.mcpServers,
          },
        }));
      }
      // 如果是单个服务器配置
      else {
        const serverName = Object.keys(parsedConfig)[0];
        const serverConfig = parsedConfig[serverName];
        setConfig((prev) => ({
          ...prev,
          mcpServers: {
            ...prev?.mcpServers,
            [serverName]: serverConfig,
          },
        }));
      }
      setImportConfig('');
      setError(null);
    } catch (err) {
      setError('导入配置失败：' + (err as Error).message);
    }
  };

  return {
    config,
    setConfig,
    currentPath,
    loading,
    error,
    setError,
    importConfig,
    setImportConfig,
    handleOpenFile,
    handleSaveFile,
    handleImportConfig,
  };
};