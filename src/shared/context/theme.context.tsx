import { createContext, useEffect, useState } from 'react';
import themeStorage, { ThemeList } from '../storages/themeStorage';

interface ThemeContext {
  theme: ThemeList;
  setTheme: (theme: ThemeList) => void;
}

export const ThemeContext = createContext<ThemeContext>({
  theme: 'light',
  setTheme() {},
});

export function ThemeProvider({
  children,
  container = document.documentElement,
}: {
  children?: React.ReactNode;
  container?: HTMLElement;
}) {
  const [theme, setTheme] = useState<ThemeList>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );

  function setCurrentTheme(theme: ThemeList) {
    setTheme(theme);
    themeStorage.set(theme);
  }

  useEffect(() => {
    container.classList.toggle('dark', theme === 'dark');
  }, [container, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
