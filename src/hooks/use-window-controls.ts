import { useState, useEffect } from 'react';

export type WindowControlAction = 'minimize' | 'maximize' | 'close';

export function useWindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = window.electronAPI.platform === 'darwin';

  useEffect(() => {
    // 初始化时检查窗口状态
    const checkMaximized = async () => {
      setIsMaximized(await window.electronAPI.windowControl.isMaximized());
    };

    checkMaximized();
  }, []);

  const handleWindowControl = async (action: WindowControlAction) => {
    await window.electronAPI.windowControl[action]();
    if (action === 'maximize') {
      setIsMaximized(await window.electronAPI.windowControl.isMaximized());
    }
  };

  return {
    isMac,
    isMaximized,
    handleWindowControl
  };
}