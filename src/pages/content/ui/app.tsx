import { createContext } from 'react';
import WordContainer from './WordContainer';
import { UiTooltipProvider } from '@root/src/components/ui/tooltip';

export const AppContentContext = createContext<{
  shadowRoot: ShadowRoot | null;
}>({
  shadowRoot: null,
});

export default function App({ shadowRoot }: { shadowRoot: ShadowRoot }) {
  return (
    <UiTooltipProvider>
      <AppContentContext.Provider value={{ shadowRoot }}>
        <div className="font-sans text-foreground">
          <WordContainer />
        </div>
      </AppContentContext.Provider>
    </UiTooltipProvider>
  );
}
