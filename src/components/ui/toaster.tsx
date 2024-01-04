import { useToast } from '@src/components/ui/use-toast';
import UiToast from './toast';

export function UiToaster() {
  const { toasts } = useToast();

  return (
    <UiToast.Provider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <UiToast key={id} {...props}>
            <div className="grid gap-1">
              {title && <UiToast.Title>{title}</UiToast.Title>}
              {description && (
                <UiToast.Description>{description}</UiToast.Description>
              )}
            </div>
            {action}
            <UiToast.Close />
          </UiToast>
        );
      })}
      <UiToast.Viewport />
    </UiToast.Provider>
  );
}
