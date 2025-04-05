import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { enable } from '@electron/remote/main'

const PORT = 5173

// 开发环境判断
const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

// 平台相关的窗口配置
const getPlatformWindowConfig = () => {
  // macOS 配置
  if (process.platform === 'darwin') {
    return {
      titleBarStyle: 'hiddenInset' as const, // 隐藏标题栏
      trafficLightPosition: { x: 10, y: 10 }, // 可以调整红绿灯位置
      transparent: true, // 启用透明
      backgroundColor: '#00ffffff', // 设置透明背景
      vibrancy: 'under-window' as const  // 添加 as const 类型断言
    }
  }

  // Windows 配置
  if (process.platform === 'win32') {
    const isWin11 = parseInt(os.release().split('.')[0]) >= 10 &&
      parseInt(os.release().split('.')[2]) >= 22000;
    return {
      frame: false, // Windows 使用自定义框架
      ...(isWin11 ? {
        backgroundColor: '#00000000', // 设置透明背景
        transparent: true // 启用透明
      } : {
        backgroundColor: '#ffffff', // 非 Win11 使用白色背景
      })
    }
  }

  // Linux 或其他平台配置
  return {
    frame: false
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    ...getPlatformWindowConfig(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 在这里启用 remote
  enable(win.webContents)

  // 为 Windows 11 添加 Mica 效果
  if (process.platform === 'win32') {
    try {
      // const { systemPreferences } = require('electron')
      const { windowsStore } = require('electron-util')

      // 检查是否为 Windows 11
      const isWin11 = windowsStore || parseInt(os.release().split('.')[0]) >= 10 &&
        parseInt(os.release().split('.')[2]) >= 22000

      if (isWin11) {
        // 设置窗口背景材质为 Mica
        win.once('ready-to-show', () => {
          try {
            const { WindowsControl } = require('windows-control')
            const hwnd = win.getNativeWindowHandle()

            // 启用 Mica 效果
            WindowsControl.setWindowAttribute(hwnd, 'DWMWA_SYSTEMBACKDROP_TYPE', 2)

            // 如果要使用 Acrylic 效果，可以设置为 3
            // WindowsControl.setWindowAttribute(hwnd, 'DWMWA_SYSTEMBACKDROP_TYPE', 3)

            // 如果要使用 Tabbed 效果，可以设置为 4
            // WindowsControl.setWindowAttribute(hwnd, 'DWMWA_SYSTEMBACKDROP_TYPE', 4)
          } catch (e) {
            console.error('应用 Mica 效果失败:', e)
          }
        })
      }
    } catch (error) {
      console.error('无法应用 Mica 效果:', error)
    }
  }

  // 开发环境下打开开发者工具
  if (isDev) {
    win.webContents.openDevTools()
    // 使用 Vite 开发服务器的 URL
    win.loadURL(`http://localhost:${PORT}`)
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

    win.webContents.on('did-finish-load', () => {
      win.webContents.send('ready')
      // 初始化时发送当前系统主题
      console.log('原生主题变化', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
      win.webContents.send('native-theme-updated', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
    })

    // 监听原生主题变化
    nativeTheme.on('updated', () => {
      console.log('原生主题变化', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
      win.webContents.send('native-theme-updated', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
    })

    // 添加主题相关的 IPC 处理器
    ipcMain.handle('get-native-theme', () => {
      return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    })

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

    // 添加窗口控制处理
    ipcMain.on('window-control', (_, command) => {
      switch (command) {
        case 'minimize':
          win.minimize()
          break
        case 'maximize':
          if (win.isMaximized()) {
            win.unmaximize()
          } else {
            win.maximize()
          }
          break
        case 'close':
          win.close()
          break
      }
    })

    ipcMain.handle('window-is-maximized', () => {
      return win.isMaximized()
    })

    // 处理打开文件
    ipcMain.handle('open-file', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'showHiddenFiles'],  // 添加显示隐藏文件选项
        filters: [{ name: 'JSON', extensions: ['json'] }],
        securityScopedBookmarks: true,  // 添加安全作用域书签支持
      })

      if (!result.canceled && result.filePaths.length > 0) {
        try {
          const content = fs.readFileSync(result.filePaths[0], 'utf-8')
          return { path: result.filePaths[0], content }
        } catch (error) {
          console.error('读取文件失败:', error)
          throw new Error('无法读取选中的文件')
        }
      }
      return null
    })

    // 处理保存文件
    ipcMain.handle('save-file', async (_, { content, path: filePath }) => {
      if (!filePath) {
        const result = await dialog.showSaveDialog({
          filters: [{ name: 'JSON', extensions: ['json'] }],
          securityScopedBookmarks: true,  // 添加安全作用域书签支持
        })
        if (result.canceled) return false
        filePath = result.filePath
      }

      try {
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2))
        return true
      } catch (error) {
        console.error('保存文件失败:', error)
        throw new Error('无法保存文件')
      }
    })
  })
}