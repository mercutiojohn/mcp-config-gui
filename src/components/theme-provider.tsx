import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [systemThemeValue, setSystemThemeValue] = useState<'dark' | 'light'>('light');

  // 初始化并监听主题变化
  useEffect(() => {
    console.log("是否在 Electron 环境:", !!window.electronAPI?.theme);
    // 检测是否在 Electron 环境中
    if (window.electronAPI?.theme) {
      // 获取初始主题
      window.electronAPI.theme.getNativeTheme().then(nativeTheme => {
        console.log("初始系统主题:", nativeTheme);
        setSystemThemeValue(nativeTheme);
      });

      // 监听主题变化
      const removeListener = window.electronAPI.theme.onThemeUpdated((nativeTheme) => {
        console.log("系统主题变化:", nativeTheme);
        setSystemThemeValue(nativeTheme);
      });

      return () => {
        // 清理监听器
        removeListener();
      };
    } else {
      // 在非 Electron 环境中回退到 matchMedia API
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemThemeValue(e.matches ? 'dark' : 'light');
      };

      setSystemThemeValue(mediaQuery.matches ? 'dark' : 'light');

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      } else {
        // 兼容性处理
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, []);

  // 应用主题到 DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      root.classList.add(systemThemeValue);
    } else {
      root.classList.add(theme);
    }
  }, [theme, systemThemeValue]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
