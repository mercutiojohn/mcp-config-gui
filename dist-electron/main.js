"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const main_1 = require("@electron/remote/main");
const PORT = 5173;
// 开发环境判断
const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        // 根据平台设置不同的窗口样式
        ...(process.platform === 'darwin'
            ? {
                titleBarStyle: 'hiddenInset', // Mac 使用原生按钮但隐藏标题栏
                trafficLightPosition: { x: 10, y: 10 }, // 可以调整红绿灯位置
                transparent: true, // 启用透明
                backgroundColor: '#00ffffff', // 设置透明背景
                vibrancy: 'under-window' // 添加毛玻璃效果
            }
            : {
                frame: false // Windows 使用自定义框架
            }),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    // 在这里启用 remote
    (0, main_1.enable)(win.webContents);
    // 开发环境下打开开发者工具
    if (isDev) {
        win.webContents.openDevTools();
        // 使用 Vite 开发服务器的 URL
        win.loadURL(`http://localhost:${PORT}`);
    }
    else {
        // 修改生产环境加载路径
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    return win;
}
// 防止程序多开
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.whenReady().then(() => {
        const win = createWindow();
        win.webContents.on('did-finish-load', () => {
            win.webContents.send('ready');
        });
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
        // 添加窗口控制处理
        electron_1.ipcMain.on('window-control', (_, command) => {
            switch (command) {
                case 'minimize':
                    win.minimize();
                    break;
                case 'maximize':
                    if (win.isMaximized()) {
                        win.unmaximize();
                    }
                    else {
                        win.maximize();
                    }
                    break;
                case 'close':
                    win.close();
                    break;
            }
        });
        electron_1.ipcMain.handle('window-is-maximized', () => {
            return win.isMaximized();
        });
        // 处理打开文件
        electron_1.ipcMain.handle('open-file', async () => {
            const result = await electron_1.dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [{ name: 'JSON', extensions: ['json'] }]
            });
            if (!result.canceled && result.filePaths.length > 0) {
                const content = fs.readFileSync(result.filePaths[0], 'utf-8');
                return { path: result.filePaths[0], content };
            }
            return null;
        });
        // 处理保存文件
        electron_1.ipcMain.handle('save-file', async (_, { content, path: filePath }) => {
            if (!filePath) {
                const result = await electron_1.dialog.showSaveDialog({
                    filters: [{ name: 'JSON', extensions: ['json'] }]
                });
                if (result.canceled)
                    return false;
                filePath = result.filePath;
            }
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
            return true;
        });
    });
}
