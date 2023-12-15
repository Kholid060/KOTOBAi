import { RouterProvider } from 'react-router-dom';
import router from './router';
import { useEffectOnce } from 'usehooks-ts';
import themeStorage from '@root/src/shared/storages/themeStorage';
import dictDB from '@root/src/shared/db/dict.db';

function App() {
  useEffectOnce(() => {
    const updateTheme = async () => {
      const theme = await themeStorage.get();
      document.documentElement.classList.toggle('dark', theme === 'dark');
    };
    updateTheme();

    themeStorage.subscribe(updateTheme);
  });

  console.log(dictDB);

  return <RouterProvider router={router} />;
}

export default App;
