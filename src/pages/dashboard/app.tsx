import { RouterProvider } from 'react-router-dom';
import router from './router';
import { UiTooltipProvider } from '@root/src/components/ui/tooltip';
import { ThemeProvider } from '@root/src/shared/context/theme.context';
import { UiToaster } from '@root/src/components/ui/toaster';

function App() {
  return (
    <UiTooltipProvider>
      <UiToaster />
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </UiTooltipProvider>
  );
}

export default App;
