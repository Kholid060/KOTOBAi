import { ThemeProvider } from '@root/src/shared/context/theme.context';
import Popup from './Popup';
import { UiTooltipProvider } from '@root/src/components/ui/tooltip';

function App() {
  return (
    <UiTooltipProvider>
      <ThemeProvider>
        <Popup />
      </ThemeProvider>
    </UiTooltipProvider>
  );
}

export default App;
