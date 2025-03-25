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
// 开发环境判断
const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: !isDev // 开发环境下关闭 web 安全限制
        }
    });
    // 在这里启用 remote
    (0, main_1.enable)(win.webContents);
    // 开发环境下打开开发者工具
    if (isDev) {
        win.webContents.openDevTools();
        // 使用 Vite 开发服务器的 URL
        win.loadURL('http://localhost:5175');
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
