import { UiButton } from '@root/src/components/ui/button';
import UiDropdownMenu from '@root/src/components/ui/dropdown-menu';
import UiTooltip from '@root/src/components/ui/tooltip';
import { IS_FIREFOX } from '@root/src/shared/constant/constant';
import { cn } from '@root/src/shared/lib/shadcn-utils';
import disableExtStorage from '@root/src/shared/storages/disableExtStorage';
import RuntimeMessage, {
  DisableExtPayload,
} from '@root/src/utils/RuntimeMessage';
import disableExtBadge from '@root/src/utils/disableExtBadge';
import { ChevronDown, PowerIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEffectOnce } from 'usehooks-ts';
import Browser from 'webextension-polyfill';

type DisablExtType = DisableExtPayload['type'];

async function getCurrTabHost() {
  try {
    const [activeTab] = await Browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!activeTab?.url) return null;

    return new URL(activeTab.url).hostname;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function PopupDisableBtn({
  onValueChanged,
}: {
  onValueChanged?: (val: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [extDisabled, setExtDisabled] = useState<{
    currHost: string;
    disabled: boolean;
    type: DisablExtType;
  }>({
    type: 'all',
    currHost: '',
    disabled: false,
  });

  async function toggleExtDisable(type: DisablExtType) {
    try {
      const currHost = type === 'host' && (await getCurrTabHost());
      if (type === 'host' && !currHost) {
        throw new Error('Host not found');
      }

      const newValue = !extDisabled.disabled;
      let tabs: Browser.Tabs.Tab[] = [];

      if (type === 'all') {
        await disableExtStorage.toggleDisable(newValue);
        tabs = await Browser.tabs.query({});

        if (newValue) await disableExtBadge.set();
        else await disableExtBadge.remove();
      } else if (type === 'host') {
        if (newValue) await disableExtStorage.addHost(currHost);
        else await disableExtStorage.removeHost(currHost);

        tabs = await Browser.tabs.query({ url: `*://${currHost}/*` });
      }

      const res = await Promise.allSettled(
        tabs.map(async ({ id, windowId }) => {
          if (type === 'host') {
            const payload: { tabId: number; windowId?: number } = { tabId: id };
            if (IS_FIREFOX) payload.windowId = windowId;

            if (newValue) await disableExtBadge.set(payload);
            else await disableExtBadge.remove(payload);
          }

          await RuntimeMessage.sendMessageToTab(
            {
              tabId: id,
              name: 'content:disable-ext-state',
            },
            newValue,
          );
        }),
      );

      console.log(res);

      setExtDisabled({
        type,
        currHost,
        disabled: newValue,
      });
      onValueChanged?.(newValue);
    } catch (error) {
      console.error(error);
    }
  }

  useEffectOnce(() => {
    (async () => {
      try {
        const disableState = await disableExtStorage.get();
        if (disableState.disabled) {
          setExtDisabled({
            type: 'all',
            currHost: '',
            disabled: true,
          });
          return;
        }

        const activeTabHost = await getCurrTabHost();
        const isHostDisabled = disableState.hostList.includes(activeTabHost);
        if (!isHostDisabled) return;

        setExtDisabled({
          type: 'host',
          disabled: true,
          currHost: activeTabHost,
        });
      } catch (error) {
        console.error(error);
      }
    })();
  });
  useEffect(() => {
    onValueChanged?.(extDisabled.disabled);
  }, [extDisabled, onValueChanged]);

  return (
    <div className="flex items-center border rounded-lg">
      <UiTooltip
        label={extDisabled.disabled ? 'Enable extension' : 'Disable extension'}
        align="end"
      >
        <UiButton
          size="icon"
          onClick={() =>
            toggleExtDisable(extDisabled.disabled ? extDisabled.type : 'all')
          }
          variant="outline"
          className={cn(
            'rounded-lg border-0 border-r z-10 relative',
            !extDisabled.disabled && 'text-destructive dark:text-red-500',
          )}
        >
          <PowerIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
      {!extDisabled.disabled && (
        <UiDropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <UiDropdownMenu.Trigger asChild>
            <UiButton
              variant="ghost"
              className="rounded-l-none pl-2 -ml-2 pr-1"
            >
              <ChevronDown className="h-5 w-5" />
            </UiButton>
          </UiDropdownMenu.Trigger>
          <UiDropdownMenu.Content align="end">
            <UiDropdownMenu.Item onClick={() => toggleExtDisable('host')}>
              Disable only on this site
            </UiDropdownMenu.Item>
          </UiDropdownMenu.Content>
        </UiDropdownMenu>
      )}
    </div>
  );
}

export default PopupDisableBtn;
