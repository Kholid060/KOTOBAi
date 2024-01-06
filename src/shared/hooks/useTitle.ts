import { useEffect } from 'react';

const defaultTitle = document.title;

export function useTitle(title = defaultTitle) {
  useEffect(() => {
    const suffix = title === defaultTitle ? '' : ' | KOTOBAi';
    document.title = title.trim() + suffix;

    return () => {
      document.title = defaultTitle;
    };
  }, [title]);
}
