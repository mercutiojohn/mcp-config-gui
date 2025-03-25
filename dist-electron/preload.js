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
    platform: process.platform
});
