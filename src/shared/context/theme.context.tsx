import { createContext, useEffect, useState } from 'react';
import themeStorage, { ThemeList } from '../storages/themeStorage';
import useStorage from '../hooks/useStorage';
import { useEffectOnce } from 'usehooks-ts';

interface ThemeContext {
  theme: ThemeList;
  setTheme: (theme: ThemeList) => void;
}

export const ThemeContext = createContext<ThemeContext>({
  theme: 'light',
  setTheme() {},
});

const isSystemDarkTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export function ThemeProvider({
  children,
  container = document.documentElement,
}: {
  children?: React.ReactNode;
  container?: HTMLElement;
}) {
  const currTheme = useStorage(themeStorage);
  const [theme, setTheme] = useState<ThemeList>(() => currTheme);

  function setCurrentTheme(theme: ThemeList) {
    setTheme(theme);
    themeStorage.set(theme);
  }

  useEffectOnce(() => {
    const themeListener = themeStorage.subscribe(() => {
      themeStorage.get().then(setTheme);
    });

    return themeListener;
  });
  useEffect(() => {
    const isDarkTheme =
      theme === 'system' ? isSystemDarkTheme() : theme === 'dark';

    container.classList.toggle('dark', isDarkTheme);
    container.style.setProperty('color-scheme', isDarkTheme ? 'dark' : 'light');
  }, [container, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
