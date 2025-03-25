import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { enable } from '@electron/remote/main'

// 开发环境判断
const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

enable()

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: !isDev  // 开发环境下关闭 web 安全限制
    }
  })

  // 开发环境下打开开发者工具
  if (isDev) {
    win.webContents.openDevTools()
    win.loadURL('http://localhost:5173')
  } else {
    // 修改生产环境加载路径
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return win
}

// 防止程序多开
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.whenReady().then(() => {
    const win = createWindow()

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })

    // 处理打开文件
    ipcMain.handle('open-file', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })
      
      if (!result.canceled && result.filePaths.length > 0) {
        const content = fs.readFileSync(result.filePaths[0], 'utf-8')
        return { path: result.filePaths[0], content }
      }
      return null
    })

    // 处理保存文件
    ipcMain.handle('save-file', async (_, { content, path: filePath }) => {
      if (!filePath) {
        const result = await dialog.showSaveDialog({
          filters: [{ name: 'JSON', extensions: ['json'] }]
        })
        if (result.canceled) return false
        filePath = result.filePath
      }
      
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2))
      return true
    })
  })
} 