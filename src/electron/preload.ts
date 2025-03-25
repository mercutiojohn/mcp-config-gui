import { contextBridge, ipcRenderer } from 'electron'

// 安全地暴露 ipcRenderer 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data: any) => ipcRenderer.invoke('save-file', data)
}) 