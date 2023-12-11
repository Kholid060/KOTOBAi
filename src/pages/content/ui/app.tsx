import { createContext, useState } from 'react';
import WordPopover from './WordPopover/WordPopover';
import { UiTooltipProvider } from '@root/src/components/ui/tooltip';
import { useEffectOnce } from 'usehooks-ts';
import { contentEventEmitter } from '../content-handler/ContentHandler';
import CommandContainer from './Command/CommandContainer';

export const AppContentContext = createContext<{
  isDisabled?: boolean;
  shadowRoot: ShadowRoot | null;
}>({
  shadowRoot: null,
  isDisabled: false,
});

export default function App({ shadowRoot }: { shadowRoot: ShadowRoot }) {
  const [isDisabled, setIsDisabled] = useState(false);

  useEffectOnce(() => {
    contentEventEmitter.addListener('disable-state-change', setIsDisabled);
  });

  return (
    <UiTooltipProvider>
      <AppContentContext.Provider value={{ shadowRoot, isDisabled }}>
        <WordPopover />
        <CommandContainer />
      </AppContentContext.Provider>
    </UiTooltipProvider>
  );
}
