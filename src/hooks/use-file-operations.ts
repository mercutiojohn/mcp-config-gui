import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MCPConfig } from '@/types/mcp-config';
import { electronAPI } from '@/utils/electron-api';

// 本地存储的键名
const STORAGE_KEYS = {
  CONFIG: 'mcp-config',
  CURRENT_PATH: 'mcp-config-path',
  PATH_MAPPINGS: 'mcp-path-mappings', // 新增：路径映射存储
  PATH_HISTORY: 'mcp-path-history', // 新增：路径历史记录存储
};

// 为配置生成唯一ID
const generateConfigId = (config: MCPConfig): string => {
  // 使用配置中的服务器名称组合作为ID
  const serverNames = Object.keys(config.mcpServers || {}).sort().join('|');
  return serverNames || 'empty-config';
};

export const useFileOperations = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<MCPConfig | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathMappings, setPathMappings] = useState<Record<string, string>>({});
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importConfig, setImportConfig] = useState('');
  const [selectedServers, setSelectedServers] = useState<{ [key: string]: boolean }>({});

  // 初始化时从本地存储加载配置、路径和路径映射
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const savedPath = localStorage.getItem(STORAGE_KEYS.CURRENT_PATH);
      const savedPathMappings = localStorage.getItem(STORAGE_KEYS.PATH_MAPPINGS);
      const savedPathHistory = localStorage.getItem(STORAGE_KEYS.PATH_HISTORY);

      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);

        // 初始化选择状态，默认全选
        if (parsedConfig?.mcpServers) {
          const initialSelection = Object.keys(parsedConfig.mcpServers).reduce((acc, serverName) => {
            acc[serverName] = true;
            return acc;
          }, {} as { [key: string]: boolean });
          setSelectedServers(initialSelection);
        }
      }

      if (savedPath) {
        setCurrentPath(savedPath);
      }

      if (savedPathMappings) {
        setPathMappings(JSON.parse(savedPathMappings));
      }

      // 加载路径历史记录
      if (savedPathHistory) {
        setPathHistory(JSON.parse(savedPathHistory));
      } else if (savedPathMappings) {
        // 兼容旧版：如果没有保存过路径历史，从路径映射中提取
        const mappings = JSON.parse(savedPathMappings);
        const paths = Object.values(mappings).filter(Boolean) as string[];
        const uniquePaths = Array.from(new Set(paths));
        setPathHistory(uniquePaths);
        // 顺便保存一次
        localStorage.setItem(STORAGE_KEYS.PATH_HISTORY, JSON.stringify(uniquePaths));
      }
    } catch (err) {
      console.error('Failed to load config from localStorage:', err);
    }
  }, []);

  // 当配置变化时保存到本地存储
  useEffect(() => {
    if (config) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    }
  }, [config]);

  // 当路径变化时保存到本地存储
  useEffect(() => {
    if (currentPath) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PATH, currentPath);
    }
  }, [currentPath]);

  // 当路径映射变化时保存到本地存储
  useEffect(() => {
    if (Object.keys(pathMappings).length > 0) {
      localStorage.setItem(STORAGE_KEYS.PATH_MAPPINGS, JSON.stringify(pathMappings));
    }
  }, [pathMappings]);

  // 当路径历史变化时保存到本地存储
  useEffect(() => {
    if (pathHistory.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PATH_HISTORY, JSON.stringify(pathHistory));
    }
  }, [pathHistory]);

  // 更新路径映射
  const updatePathMapping = (newConfig: MCPConfig, path: string) => {
    const configId = generateConfigId(newConfig);
    setPathMappings(prev => ({
      ...prev,
      [configId]: path
    }));
  };

  // 更新路径历史记录
  const updatePathHistory = (path: string) => {
    if (!path) return;

    setPathHistory(prev => {
      // 如果路径已存在，不重复添加
      if (prev.includes(path)) return prev;
      return [...prev, path];
    });
  };

  // 删除路径历史中的特定项
  const removePathFromHistory = (pathToRemove: string) => {
    setPathHistory(prev => prev.filter(path => path !== pathToRemove));
  };

  // 清空路径历史
  const clearPathHistory = () => {
    setPathHistory([]);
    localStorage.removeItem(STORAGE_KEYS.PATH_HISTORY);
  };

  // 获取配置对应的保存路径
  const getPathForConfig = (configToCheck: MCPConfig): string => {
    const configId = generateConfigId(configToCheck);
    return pathMappings[configId] || '';
  };

  const handleOpenFile = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await electronAPI.openFile();
      if (result) {
        const parsedConfig = JSON.parse(result.content);

        // 合并配置而不是替换
        setConfig((prev) => {
          // 如果之前没有配置或用户希望完全替换，则直接使用新配置
          if (!prev || window.confirm(t('prompts.replaceConfig') || '是否替换当前配置？选择"否"将合并配置。')) {
            // 初始化选择状态，默认全选
            if (parsedConfig?.mcpServers) {
              const initialSelection = Object.keys(parsedConfig.mcpServers).reduce((acc, serverName) => {
                acc[serverName] = true;
                return acc;
              }, {} as { [key: string]: boolean });
              setSelectedServers(initialSelection);
            }

            // 直接返回新配置
            return parsedConfig;
          }

          // 合并配置
          const mergedConfig: MCPConfig = {
            ...(prev || {}),
            mcpServers: {
              ...(prev?.mcpServers || {}),
              ...(parsedConfig.mcpServers || {}),
            },
          };

          // 更新选择状态，将新导入的服务器也设为选中
          if (parsedConfig?.mcpServers) {
            const newServerNames = Object.keys(parsedConfig.mcpServers);
            if (newServerNames.length > 0) {
              setSelectedServers(prev => {
                const updatedSelection = { ...prev };
                newServerNames.forEach(name => {
                  updatedSelection[name] = true;
                });
                return updatedSelection;
              });
            }
          }

          return mergedConfig;
        });

        setCurrentPath(result.path);
        // 更新路径映射
        updatePathMapping(parsedConfig, result.path);
        // 更新路径历史
        updatePathHistory(result.path);
      }
    } catch (err) {
      setError(t('errors.openFileFailed', { message: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFile = async (customPath?: string) => {
    if (!config) return;

    try {
      setLoading(true);
      setError(null);

      // 根据选择过滤服务器配置
      const selectedConfig: MCPConfig = {
        mcpServers: {}
      };

      Object.entries(selectedServers)
        .filter(([_, isSelected]) => isSelected)
        .forEach(([serverName]) => {
          if (config.mcpServers[serverName]) {
            selectedConfig.mcpServers[serverName] = config.mcpServers[serverName];
          }
        });

      // 获取当前配置应该保存的路径
      const savePath = customPath || currentPath || getPathForConfig(config);

      const saveResult = await electronAPI.saveFile({
        content: selectedConfig,
        path: savePath,
      });

      // 如果保存到新路径，更新路径映射和历史
      if (saveResult && saveResult.path) {
        setCurrentPath(saveResult.path);
        updatePathMapping(selectedConfig, saveResult.path);
        updatePathHistory(saveResult.path);
      }
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
        setConfig((prev) => {
          // 创建一个新的配置对象，合并现有和导入的服务器配置
          const updatedConfig: MCPConfig = {
            ...(prev || {}),
            mcpServers: {
              ...(prev?.mcpServers || {}),
              ...parsedConfig.mcpServers,
            },
          };

          // 更新选择状态，将新导入的服务器也设为选中
          const newServerNames = Object.keys(parsedConfig.mcpServers);
          if (newServerNames.length > 0) {
            setSelectedServers(prev => {
              const updatedSelection = { ...prev };
              newServerNames.forEach(name => {
                updatedSelection[name] = true;
              });
              return updatedSelection;
            });
          }

          // 检查是否有已知路径映射
          const path = getPathForConfig(updatedConfig);
          if (path) {
            setCurrentPath(path);
          }

          return updatedConfig;
        });
      }
      // 如果是单个服务器配置
      else {
        const serverName = Object.keys(parsedConfig)[0];
        const serverConfig = parsedConfig[serverName];

        setConfig((prev) => {
          const updatedConfig: MCPConfig = {
            ...(prev || {}),
            mcpServers: {
              ...(prev?.mcpServers || {}),
              [serverName]: serverConfig,
            },
          };

          // 更新选择状态，将新导入的服务器设为选中
          setSelectedServers(prev => ({
            ...prev,
            [serverName]: true
          }));

          // 检查是否有已知路径映射
          const path = getPathForConfig(updatedConfig);
          if (path) {
            setCurrentPath(path);
          }

          return updatedConfig;
        });
      }
      setImportConfig('');
      setError(null);
    } catch (err) {
      setError(t('errors.importConfigFailed', { message: (err as Error).message }) ||
        '导入配置失败：' + (err as Error).message);
    }
  };

  const toggleServerSelection = (serverName: string) => {
    setSelectedServers(prev => ({
      ...prev,
      [serverName]: !prev[serverName]
    }));
  };

  const selectAllServers = (selected: boolean) => {
    if (!config?.mcpServers) return;

    const newSelection = Object.keys(config.mcpServers).reduce((acc, serverName) => {
      acc[serverName] = selected;
      return acc;
    }, {} as { [key: string]: boolean });

    setSelectedServers(newSelection);
  };

  // 清除本地存储的配置
  const clearStoredConfig = () => {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PATH);
    // 可以选择是否清除路径映射和历史
    // localStorage.removeItem(STORAGE_KEYS.PATH_MAPPINGS);
    // localStorage.removeItem(STORAGE_KEYS.PATH_HISTORY);
    setConfig(null);
    setCurrentPath('');
  };

  const createNewConfig = () => {
    const emptyConfig: MCPConfig = {
      mcpServers: {}
    };
    setConfig(emptyConfig);
    setCurrentPath('');
    setSelectedServers({});
  };

  // 选择保存路径
  const selectSavePath = (path: string) => {
    setCurrentPath(path);
  };

  return {
    config,
    setConfig,
    currentPath,
    setCurrentPath,
    pathMappings,
    pathHistory,
    updatePathHistory,
    removePathFromHistory, // 新增：删除特定历史路径
    clearPathHistory,      // 新增：清空历史路径
    loading,
    error,
    setError,
    importConfig,
    setImportConfig,
    selectedServers,
    toggleServerSelection,
    selectAllServers,
    handleOpenFile,
    handleSaveFile,
    handleImportConfig,
    clearStoredConfig,
    getPathForConfig,
    createNewConfig,
    selectSavePath,
  };
};