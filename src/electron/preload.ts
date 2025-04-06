import { contextBridge, ipcRenderer } from 'electron'

// 安全地暴露 ipcRenderer 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data: any) => ipcRenderer.invoke('save-file', data),
  selectSavePath: () => ipcRenderer.invoke('select-save-path'),
  windowControl: {
    minimize: () => ipcRenderer.send('window-control', 'minimize'),
    maximize: () => ipcRenderer.send('window-control', 'maximize'),
    close: () => ipcRenderer.send('window-control', 'close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized')
  },
  platform: process.platform,
  // 添加主题相关 API
  theme: {
    // 获取当前系统主题
    getNativeTheme: () => ipcRenderer.invoke('get-native-theme'),
    // 监听系统主题变化
    onThemeUpdated: (callback: (theme: 'dark' | 'light') => void) => {
      const subscription = (_event: any, theme: 'dark' | 'light') => callback(theme)
      ipcRenderer.on('native-theme-updated', subscription)

      // 返回清理函数
      return () => {
        ipcRenderer.removeListener('native-theme-updated', subscription)
      }
    }
  }
})