declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<any>
      saveFile: (data: any) => Promise<boolean>
      selectSavePath: () => Promise<string | null>
      windowControl: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
      };
      theme: {
        getNativeTheme: () => Promise<'dark' | 'light'>;
        onThemeUpdated: (callback: (theme: 'dark' | 'light') => void) => () => void;
      };
      platform: string
    }
    require?: any
  }
}

export { }