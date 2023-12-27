import { ExtensionSettingsPopup } from '../storages/extSettingsStorage';

type PopupFontSize = ExtensionSettingsPopup['fontSize'];

export const EXT_POPUP_FONT_SIZE: Record<
  PopupFontSize,
  { id: PopupFontSize; name: string; className: string }
> = {
  small: { id: 'small', name: 'Small', className: 'text-xs' },
  normal: { id: 'normal', name: 'Normal', className: 'text-sm' },
  large: { id: 'large', name: 'Large', className: 'text-base' },
} as const;

export const EXT_SCAN_KEY_MOD = {
  none: { name: 'None', id: 'none' },
  alt: { name: 'Alt key', id: 'alt' },
  ctrl: { name: 'Ctrl key', id: 'ctrl' },
  shift: { name: 'Shift key', id: 'shift' },
} as const;
