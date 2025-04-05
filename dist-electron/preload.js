"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// 安全地暴露 ipcRenderer 给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => electron_1.ipcRenderer.invoke('open-file'),
    saveFile: (data) => electron_1.ipcRenderer.invoke('save-file', data),
    windowControl: {
        minimize: () => electron_1.ipcRenderer.send('window-control', 'minimize'),
        maximize: () => electron_1.ipcRenderer.send('window-control', 'maximize'),
        close: () => electron_1.ipcRenderer.send('window-control', 'close'),
        isMaximized: () => electron_1.ipcRenderer.invoke('window-is-maximized')
    },
    platform: process.platform,
    // 添加主题相关 API
    theme: {
        // 获取当前系统主题
        getNativeTheme: () => electron_1.ipcRenderer.invoke('get-native-theme'),
        // 监听系统主题变化
        onThemeUpdated: (callback) => {
            const subscription = (_event, theme) => callback(theme);
            electron_1.ipcRenderer.on('native-theme-updated', subscription);
            // 返回清理函数
            return () => {
                electron_1.ipcRenderer.removeListener('native-theme-updated', subscription);
            };
        }
    }
});
