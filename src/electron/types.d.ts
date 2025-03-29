declare module 'mica-electron' {
  import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

  export const PARAMS: any;
  export const VALUE: any;
  export const IS_WINDOWS_11: boolean;
  export const WIN10: any;

  export class MicaBrowserWindow extends BrowserWindow {
    constructor(options?: BrowserWindowConstructorOptions);
    
    /**
     * 设置深色主题
     */
    setDarkTheme(): void;
    
    /**
     * 设置 Mica 效果
     */
    setMicaEffect(): void;
    
    /**
     * 允许窗口在失去焦点时保持 Mica 效果
     * @param enabled 是否启用
     */
    alwaysFocused(enabled: boolean): void;
  }
}
