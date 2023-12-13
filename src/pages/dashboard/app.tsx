import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useEffectOnce } from 'usehooks-ts';
import themeStorage from '@root/src/shared/storages/themeStorage';

function App() {
  useEffectOnce(() => {
    const updateTheme = async () => {
      const theme = await themeStorage.get();
      document.documentElement.classList.toggle('dark', theme === 'dark');
    };
    updateTheme();

    themeStorage.subscribe(updateTheme);
  });

  return <RouterProvider router={router} />;
}

export default App;
