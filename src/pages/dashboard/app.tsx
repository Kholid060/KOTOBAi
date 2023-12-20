import { RouterProvider } from 'react-router-dom';
import router from './router';
import { UiTooltipProvider } from '@root/src/components/ui/tooltip';
import { ThemeProvider } from '@root/src/shared/context/theme.context';

function App() {
  return (
    <UiTooltipProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </UiTooltipProvider>
  );
}

export default App;
