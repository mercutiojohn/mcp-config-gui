/**
 * 安全地获取 Electron API
 * 在非 Electron 环境中提供降级方案
 */

// 定义一个默认的空实现
const defaultElectronAPI = {
  // 文件操作
  openFile: async () => {
    console.warn('electron.openFile 不可用');
    return null;
  },
  saveFile: async () => {
    console.warn('electron.saveFile 不可用');
    return false;
  },
  selectSavePath: async () => {
    console.warn('electron.selectSavePath 不可用');
    return null;
  },
  // 窗口控制
  windowControl: {
    minimize: async () => console.warn('electron.windowControl.minimize 不可用'),
    maximize: async () => console.warn('electron.windowControl.maximize 不可用'),
    close: async () => console.warn('electron.windowControl.close 不可用'),
    isMaximized: async () => false
  },
  // 平台信息
  platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
  // 主题
  theme: {
    getNativeTheme: async () => 'light' as 'dark' | 'light',
    onThemeUpdated: () => () => { }
  }
};

const { } = window.require ? window.require('electron') : {}

// 尝试获取真实 Electron API，如果不存在则使用默认空实现
export const electronAPI = (() => {
  // try {
  //   // 检查是否在 Electron 环境中
  //   if (window.require) {
  //     return window.electronAPI || defaultElectronAPI;
  //   }
  //   return defaultElectronAPI;
  // } catch (error) {
  //   console.warn('获取 Electron API 失败:', error);
  //   return defaultElectronAPI;
  // }
  return window.electronAPI || defaultElectronAPI;
})();
