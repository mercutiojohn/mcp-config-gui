import { proxy, snapshot, useSnapshot } from 'valtio';
import { useTranslation } from 'react-i18next';
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
  const serverNames = Object.keys(config.mcpServers || {}).sort().join('|');
  return serverNames || 'empty-config';
};

// 创建状态存储
interface FileOperationsState {
  config: MCPConfig | null;
  currentPath: string;
  pathMappings: Record<string, string>;
  pathHistory: string[];
  loading: boolean;
  error: string | null;
  importConfig: string;
  selectedServers: { [key: string]: boolean };
}

// 创建状态代理对象
const state = proxy<FileOperationsState>({
  config: null,
  currentPath: '',
  pathMappings: {},
  pathHistory: [],
  loading: false,
  error: null,
  importConfig: '',
  selectedServers: {},
});

// 初始化函数
const initializeState = () => {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const savedPath = localStorage.getItem(STORAGE_KEYS.CURRENT_PATH);
    const savedPathMappings = localStorage.getItem(STORAGE_KEYS.PATH_MAPPINGS);
    const savedPathHistory = localStorage.getItem(STORAGE_KEYS.PATH_HISTORY);

    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      state.config = parsedConfig;

      // 初始化选择状态，默认全选
      if (parsedConfig?.mcpServers) {
        const initialSelection = Object.keys(parsedConfig.mcpServers).reduce((acc, serverName) => {
          acc[serverName] = true;
          return acc;
        }, {} as { [key: string]: boolean });
        state.selectedServers = initialSelection;
      }
    }

    if (savedPath) {
      state.currentPath = savedPath;
    }

    if (savedPathMappings) {
      state.pathMappings = JSON.parse(savedPathMappings);
    }

    // 加载路径历史记录
    if (savedPathHistory) {
      state.pathHistory = JSON.parse(savedPathHistory);
    } else if (savedPathMappings) {
      // 兼容旧版：如果没有保存过路径历史，从路径映射中提取
      const mappings = JSON.parse(savedPathMappings);
      const paths = Object.values(mappings).filter(Boolean) as string[];
      const uniquePaths = Array.from(new Set(paths));
      state.pathHistory = uniquePaths;
      // 顺便保存一次
      localStorage.setItem(STORAGE_KEYS.PATH_HISTORY, JSON.stringify(uniquePaths));
    }
  } catch (err) {
    console.error('Failed to load config from localStorage:', err);
  }
};

// 状态更改函数
const actions = {
  // 设置配置
  setConfig: (newConfig: MCPConfig | null) => {
    state.config = newConfig;
    if (newConfig) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
    }
  },

  // 设置当前路径
  setCurrentPath: (path: string) => {
    state.currentPath = path;
    if (path) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PATH, path);
    }
  },

  // 更新路径映射
  updatePathMapping: (newConfig: MCPConfig, path: string) => {
    const configId = generateConfigId(newConfig);
    state.pathMappings[configId] = path;
    localStorage.setItem(STORAGE_KEYS.PATH_MAPPINGS, JSON.stringify(state.pathMappings));
  },

  // 更新路径历史记录
  updatePathHistory: (path: string) => {
    if (!path) return;

    if (!state.pathHistory.includes(path)) {
      state.pathHistory.push(path);
      localStorage.setItem(STORAGE_KEYS.PATH_HISTORY, JSON.stringify(state.pathHistory));
    }
  },

  // 删除路径历史中的特定项
  removePathFromHistory: (pathToRemove: string) => {
    state.pathHistory = state.pathHistory.filter(path => path !== pathToRemove);
    localStorage.setItem(STORAGE_KEYS.PATH_HISTORY, JSON.stringify(state.pathHistory));
  },

  // 清空路径历史
  clearPathHistory: () => {
    state.pathHistory = [];
    localStorage.removeItem(STORAGE_KEYS.PATH_HISTORY);
  },

  // 获取配置对应的保存路径
  getPathForConfig: (configToCheck: MCPConfig): string => {
    const configId = generateConfigId(configToCheck);
    return state.pathMappings[configId] || '';
  },

  // 打开文件
  handleOpenFile: async () => {
    try {
      state.loading = true;
      state.error = null;
      const result = await electronAPI.openFile();
      if (result) {
        const parsedConfig = JSON.parse(result.content);

        // 合并配置而不是替换
        if (!state.config || window.confirm('是否替换当前配置？选择"否"将合并配置。')) {
          // 初始化选择状态，默认全选
          if (parsedConfig?.mcpServers) {
            const initialSelection = Object.keys(parsedConfig.mcpServers).reduce((acc, serverName) => {
              acc[serverName] = true;
              return acc;
            }, {} as { [key: string]: boolean });
            state.selectedServers = initialSelection;
          }

          // 直接设置新配置
          state.config = parsedConfig;
        } else {
          // 合并配置
          if (!state.config) state.config = { mcpServers: {} };

          // 合并服务器配置
          if (parsedConfig.mcpServers) {
            state.config = {
              ...state.config,
              mcpServers: {
                ...state.config.mcpServers,
                ...parsedConfig.mcpServers,
              }
            };

            // 更新选择状态
            const newServerNames = Object.keys(parsedConfig.mcpServers);
            for (const name of newServerNames) {
              state.selectedServers[name] = true;
            }
          }
        }

        state.currentPath = result.path;
        // 更新路径映射和历史
        actions.updatePathMapping(parsedConfig, result.path);
        actions.updatePathHistory(result.path);

        // 保存到本地存储
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(state.config));
        localStorage.setItem(STORAGE_KEYS.CURRENT_PATH, result.path);
      }
    } catch (err) {
      state.error = `打开文件失败: ${(err as Error).message}`;
    } finally {
      state.loading = false;
    }
  },

  // 保存文件
  handleSaveFile: async (customPath?: string) => {
    if (!state.config) return;

    try {
      state.loading = true;
      state.error = null;

      // 根据选择过滤服务器配置
      const selectedConfig: MCPConfig = {
        mcpServers: {}
      };

      Object.entries(state.selectedServers)
        .filter(([_, isSelected]) => isSelected)
        .forEach(([serverName]) => {
          if (state.config?.mcpServers[serverName]) {
            selectedConfig.mcpServers[serverName] = state.config.mcpServers[serverName];
          }
        });

      // 获取当前配置应该保存的路径
      const savePath = customPath || state.currentPath || actions.getPathForConfig(state.config);

      const saveResult = await electronAPI.saveFile({
        content: selectedConfig,
        path: savePath,
      });

      // 如果保存到新路径，更新路径映射和历史
      if (saveResult && saveResult.path) {
        state.currentPath = saveResult.path;
        actions.updatePathMapping(selectedConfig, saveResult.path);
        actions.updatePathHistory(saveResult.path);
      }
    } catch (err) {
      state.error = `保存文件失败: ${(err as Error).message}`;
    } finally {
      state.loading = false;
    }
  },

  // 导入配置
  handleImportConfig: () => {
    try {
      let parsedConfig = JSON.parse(state.importConfig);

      // 如果是完整的 MCP 配置格式
      if ('mcpServers' in parsedConfig) {
        if (!state.config) state.config = { mcpServers: {} };

        // 合并服务器配置
        state.config = {
          ...state.config,
          mcpServers: {
            ...state.config.mcpServers,
            ...parsedConfig.mcpServers,
          }
        };

        // 更新选择状态
        const newServerNames = Object.keys(parsedConfig.mcpServers);
        for (const name of newServerNames) {
          state.selectedServers[name] = true;
        }

        // 检查是否有已知路径映射
        const path = actions.getPathForConfig(state.config);
        if (path) {
          state.currentPath = path;
        }
      }
      // 如果是单个服务器配置
      else {
        const serverName = Object.keys(parsedConfig)[0];
        const serverConfig = parsedConfig[serverName];

        if (!state.config) state.config = { mcpServers: {} };

        // 添加服务器配置
        state.config = {
          ...state.config,
          mcpServers: {
            ...state.config.mcpServers,
            [serverName]: serverConfig,
          }
        };

        // 更新选择状态
        state.selectedServers[serverName] = true;

        // 检查是否有已知路径映射
        const path = actions.getPathForConfig(state.config);
        if (path) {
          state.currentPath = path;
        }
      }

      // 清空导入文本并保存配置
      state.importConfig = '';
      state.error = null;
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(state.config));
    } catch (err) {
      state.error = `导入配置失败: ${(err as Error).message}`;
    }
  },

  // 切换服务器选择状态
  toggleServerSelection: (serverName: string) => {
    state.selectedServers[serverName] = !state.selectedServers[serverName];
  },

  // 全选/全不选服务器
  selectAllServers: (selected: boolean) => {
    if (!state.config?.mcpServers) return;

    Object.keys(state.config.mcpServers).forEach(serverName => {
      state.selectedServers[serverName] = selected;
    });
  },

  // 清除本地存储的配置
  clearStoredConfig: () => {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PATH);
    // 可以选择是否清除路径映射和历史
    // localStorage.removeItem(STORAGE_KEYS.PATH_MAPPINGS);
    // localStorage.removeItem(STORAGE_KEYS.PATH_HISTORY);
    state.config = null;
    state.currentPath = '';
  },

  // 创建新配置
  createNewConfig: () => {
    state.config = { mcpServers: {} };
    state.currentPath = '';
    state.selectedServers = {};
  },

  // 选择保存路径
  selectSavePath: (path: string) => {
    state.currentPath = path;
    localStorage.setItem(STORAGE_KEYS.CURRENT_PATH, path);
  },

  // 设置导入配置文本
  setImportConfig: (text: string) => {
    state.importConfig = text;
  },

  // 设置错误信息
  setError: (error: string | null) => {
    state.error = error;
  }
};

// 初始化状态
initializeState();

// 创建一个钩子以获取状态及更新方法
export const useFileOperations = () => {
  const { t } = useTranslation();
  const snap = useSnapshot(state);

  return {
    // 状态
    config: snap.config,
    currentPath: snap.currentPath,
    pathMappings: snap.pathMappings,
    pathHistory: snap.pathHistory,
    loading: snap.loading,
    error: snap.error,
    importConfig: snap.importConfig,
    selectedServers: snap.selectedServers,

    // 方法
    setConfig: actions.setConfig,
    setCurrentPath: actions.setCurrentPath,
    updatePathHistory: actions.updatePathHistory,
    removePathFromHistory: actions.removePathFromHistory,
    clearPathHistory: actions.clearPathHistory,
    setError: actions.setError,
    setImportConfig: actions.setImportConfig,
    toggleServerSelection: actions.toggleServerSelection,
    selectAllServers: actions.selectAllServers,
    handleOpenFile: actions.handleOpenFile,
    handleSaveFile: actions.handleSaveFile,
    handleImportConfig: actions.handleImportConfig,
    clearStoredConfig: actions.clearStoredConfig,
    getPathForConfig: actions.getPathForConfig,
    createNewConfig: actions.createNewConfig,
    selectSavePath: actions.selectSavePath,
  };
};

// 直接导出状态和动作，以便在非React环境中使用
export const fileOperationsState = {
  get: () => snapshot(state),
  ...actions
};