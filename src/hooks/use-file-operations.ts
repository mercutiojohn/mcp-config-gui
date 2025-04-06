import { proxy, useSnapshot } from 'valtio';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { MCPConfig } from '@/types/mcp-config';
import { electronAPI } from '@/utils/electron-api';

// 本地存储的键名
const STORAGE_KEYS = {
  CONFIG: 'mcp-config',
  CURRENT_PATH: 'mcp-config-path',
  PATH_MAPPINGS: 'mcp-path-mappings',
  PATH_HISTORY: 'mcp-path-history',
};

// 为配置生成唯一ID
const generateConfigId = (config: MCPConfig): string => {
  // 使用配置中的服务器名 称组合作为ID
  const serverNames = Object.keys(config.mcpServers || {}).sort().join('|');
  return serverNames || 'empty-config';
};

// 全局状态存储 - 确保提供默认值避免null/undefined
export const fileState = proxy({
  // 提供默认空配置而不是null
  config: { mcpServers: {} } as MCPConfig,
  currentPath: '',
  pathMappings: {} as Record<string, string>,
  pathHistory: [] as string[],
  loading: false,
  error: null as string | null,
  importConfig: '',
  selectedServers: {} as { [key: string]: boolean },
});

// 初始化从localStorage加载数据
const initializeFromStorage = () => {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const savedPath = localStorage.getItem(STORAGE_KEYS.CURRENT_PATH);
    const savedPathMappings = localStorage.getItem(STORAGE_KEYS.PATH_MAPPINGS);
    const savedPathHistory = localStorage.getItem(STORAGE_KEYS.PATH_HISTORY);

    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      fileState.config = parsedConfig;

      // 初始化选择状态，默认全选
      if (parsedConfig?.mcpServers) {
        const initialSelection = Object.keys(parsedConfig.mcpServers).reduce((acc, serverName) => {
          acc[serverName] = true;
          return acc;
        }, {} as { [key: string]: boolean });
        fileState.selectedServers = initialSelection;
      }
    } else {
      // 如果没有保存的配置，确保有一个默认的空配置
      fileState.config = { mcpServers: {} };
    }

    if (savedPath) {
      fileState.currentPath = savedPath;
    }

    if (savedPathMappings) {
      fileState.pathMappings = JSON.parse(savedPathMappings);
    }

    // 加载路径历史记录
    if (savedPathHistory) {
      fileState.pathHistory = JSON.parse(savedPathHistory);
    } else if (savedPathMappings) {
      // 兼容旧版：如果没有保存过路径历史，从路径映射中提取
      const mappings = JSON.parse(savedPathMappings);
      const paths = Object.values(mappings).filter(Boolean) as string[];
      const uniquePaths = Array.from(new Set(paths));
      fileState.pathHistory = uniquePaths;
      // 顺便保存一次
      localStorage.setItem(STORAGE_KEYS.PATH_HISTORY, JSON.stringify(uniquePaths));
    }
  } catch (err) {
    console.error('Failed to load config from localStorage:', err);
    // 错误时确保有默认配置
    fileState.config = { mcpServers: {} };
  }
};

// 状态操作方法
export const fileOperations = {
  setConfig: (config: MCPConfig | null) => {
    fileState.config = config;
    if (config) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    }
  },

  setCurrentPath: (path: string) => {
    fileState.currentPath = path;
    if (path) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PATH, path);
    }
  },

  setError: (error: string | null) => {
    fileState.error = error;
  },

  setImportConfig: (config: string) => {
    fileState.importConfig = config;
  },

  // 更新路径映射
  updatePathMapping: (newConfig: MCPConfig, path: string) => {
    const configId = generateConfigId(newConfig);
    fileState.pathMappings = {
      ...fileState.pathMappings,
      [configId]: path
    };
    localStorage.setItem(STORAGE_KEYS.PATH_MAPPINGS, JSON.stringify(fileState.pathMappings));
  },

  // 更新路径历史记录
  updatePathHistory: (path: string) => {
    if (!path) return;

    if (!fileState.pathHistory.includes(path)) {
      fileState.pathHistory = [...fileState.pathHistory, path];
      localStorage.setItem(STORAGE_KEYS.PATH_HISTORY, JSON.stringify(fileState.pathHistory));
    }
  },

  // 删除路径历史中的特定项
  removePathFromHistory: (pathToRemove: string) => {
    fileState.pathHistory = fileState.pathHistory.filter(path => path !== pathToRemove);
    localStorage.setItem(STORAGE_KEYS.PATH_HISTORY, JSON.stringify(fileState.pathHistory));
  },

  // 清空路径历史
  clearPathHistory: () => {
    fileState.pathHistory = [];
    localStorage.removeItem(STORAGE_KEYS.PATH_HISTORY);
  },

  // 获取配置对应的保存路径
  getPathForConfig: (configToCheck: MCPConfig): string => {
    const configId = generateConfigId(configToCheck);
    return fileState.pathMappings[configId] || '';
  },

  toggleServerSelection: (serverName: string) => {
    fileState.selectedServers[serverName] = !fileState.selectedServers[serverName];
  },

  selectAllServers: (selected: boolean) => {
    if (!fileState.config?.mcpServers) return;

    const newSelection = Object.keys(fileState.config.mcpServers).reduce((acc, serverName) => {
      acc[serverName] = selected;
      return acc;
    }, {} as { [key: string]: boolean });

    fileState.selectedServers = newSelection;
  },

  // 清除本地存储的配置
  clearStoredConfig: () => {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PATH);
    fileState.config = { mcpServers: {} };
    fileState.currentPath = '';
    fileState.selectedServers = {};
  },

  createNewConfig: () => {
    const emptyConfig: MCPConfig = {
      mcpServers: {}
    };
    fileState.config = emptyConfig;
    fileState.currentPath = '';
    fileState.selectedServers = {};
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(emptyConfig));
  },

  // 选择保存路径
  selectSavePath: (path: string) => {
    fileState.currentPath = path;
    localStorage.setItem(STORAGE_KEYS.CURRENT_PATH, path);
  },

  handleOpenFile: async () => {
    try {
      fileState.loading = true;
      fileState.error = null;
      const result = await electronAPI.openFile();
      if (result) {
        const parsedConfig = JSON.parse(result.content);

        // 合并配置而不是替换
        if (!fileState.config || window.confirm('是否替换当前配置？选择"否"将合并配置。')) {
          // 初始化选择状态，默认全选
          if (parsedConfig?.mcpServers) {
            const initialSelection = Object.keys(parsedConfig.mcpServers).reduce((acc, serverName) => {
              acc[serverName] = true;
              return acc;
            }, {} as { [key: string]: boolean });
            fileState.selectedServers = initialSelection;
          }

          // 直接设置新配置
          fileState.config = parsedConfig;
        } else {
          // 合并配置
          fileState.config = {
            ...(fileState.config || {}),
            mcpServers: {
              ...(fileState.config?.mcpServers || {}),
              ...(parsedConfig.mcpServers || {}),
            },
          };

          // 更新选择状态，将新导入的服务器也设为选中
          if (parsedConfig?.mcpServers) {
            const newServerNames = Object.keys(parsedConfig.mcpServers);
            if (newServerNames.length > 0) {
              newServerNames.forEach(name => {
                fileState.selectedServers[name] = true;
              });
            }
          }
        }

        // 保存到本地存储
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(fileState.config));

        fileState.currentPath = result.path;
        localStorage.setItem(STORAGE_KEYS.CURRENT_PATH, result.path);

        // 更新路径映射
        fileOperations.updatePathMapping(parsedConfig, result.path);

        // 更新路径历史
        fileOperations.updatePathHistory(result.path);
      }
    } catch (err) {
      fileState.error = `打开文件失败：${(err as Error).message}`;
    } finally {
      fileState.loading = false;
    }
  },

  handleSaveFile: async (customPath?: string) => {
    if (!fileState.config) return;

    try {
      fileState.loading = true;
      fileState.error = null;

      // 根据选择过滤服务器配置
      const selectedConfig: MCPConfig = {
        mcpServers: {}
      };

      Object.entries(fileState.selectedServers)
        .filter(([_, isSelected]) => isSelected)
        .forEach(([serverName]) => {
          if (fileState.config?.mcpServers[serverName]) {
            selectedConfig.mcpServers[serverName] = fileState.config.mcpServers[serverName];
          }
        });

      // 获取当前配置应该保存的路径
      const savePath = customPath || fileState.currentPath || fileOperations.getPathForConfig(fileState.config);

      const saveResult = await electronAPI.saveFile({
        content: selectedConfig,
        path: savePath,
      });

      // 如果保存到新路径，更新路径映射和历史
      if (saveResult && saveResult.path) {
        fileState.currentPath = saveResult.path;
        localStorage.setItem(STORAGE_KEYS.CURRENT_PATH, saveResult.path);

        fileOperations.updatePathMapping(selectedConfig, saveResult.path);
        fileOperations.updatePathHistory(saveResult.path);
      }
    } catch (err) {
      fileState.error = `保存文件失败：${(err as Error).message}`;
    } finally {
      fileState.loading = false;
    }
  },

  handleImportConfig: () => {
    try {
      let parsedConfig = JSON.parse(fileState.importConfig);

      // 如果是完整的 MCP 配置格式
      if ('mcpServers' in parsedConfig) {
        // 创建一个新的配置对象，合并现有和导入的服务器配置
        fileState.config = {
          ...(fileState.config || {}),
          mcpServers: {
            ...(fileState.config?.mcpServers || {}),
            ...parsedConfig.mcpServers,
          },
        };

        // 更新选择状态，将新导入的服务器也设为选中
        const newServerNames = Object.keys(parsedConfig.mcpServers);
        if (newServerNames.length > 0) {
          newServerNames.forEach(name => {
            fileState.selectedServers[name] = true;
          });
        }
      }
      // 如果是单个服务器配置
      else {
        const serverName = Object.keys(parsedConfig)[0];
        const serverConfig = parsedConfig[serverName];

        fileState.config = {
          ...(fileState.config || {}),
          mcpServers: {
            ...(fileState.config?.mcpServers || {}),
            [serverName]: serverConfig,
          },
        };

        // 更新选择状态
        fileState.selectedServers[serverName] = true;
      }

      // 检查是否有已知路径映射
      if (fileState.config) {
        const path = fileOperations.getPathForConfig(fileState.config);
        if (path) {
          fileState.currentPath = path;
          localStorage.setItem(STORAGE_KEYS.CURRENT_PATH, path);
        }
      }

      // 保存到本地存储
      if (fileState.config) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(fileState.config));
      }

      fileState.importConfig = '';
      fileState.error = null;
    } catch (err) {
      fileState.error = `导入配置失败：${(err as Error).message}`;
    }
  }
};

// 初始化
initializeFromStorage();

// Hook 接口 - 保持与原有 useFileOperations 相同的返回值
export const useFileOperations = () => {
  const { t } = useTranslation();
  const state = useSnapshot(fileState);

  // 这里使用useState是为了兼容原接口中需要通过setState方式更新的场景
  const [loading] = useState(state.loading);

  return {
    config: state.config,
    setConfig: fileOperations.setConfig,
    currentPath: state.currentPath,
    setCurrentPath: fileOperations.setCurrentPath,
    pathMappings: state.pathMappings,
    pathHistory: state.pathHistory,
    updatePathHistory: fileOperations.updatePathHistory,
    removePathFromHistory: fileOperations.removePathFromHistory,
    clearPathHistory: fileOperations.clearPathHistory,
    loading,
    error: state.error,
    setError: fileOperations.setError,
    importConfig: state.importConfig,
    setImportConfig: fileOperations.setImportConfig,
    selectedServers: state.selectedServers,
    toggleServerSelection: fileOperations.toggleServerSelection,
    selectAllServers: fileOperations.selectAllServers,
    handleOpenFile: fileOperations.handleOpenFile,
    handleSaveFile: fileOperations.handleSaveFile,
    handleImportConfig: fileOperations.handleImportConfig,
    clearStoredConfig: fileOperations.clearStoredConfig,
    getPathForConfig: fileOperations.getPathForConfig,
    createNewConfig: fileOperations.createNewConfig,
    selectSavePath: fileOperations.selectSavePath,
  };
};