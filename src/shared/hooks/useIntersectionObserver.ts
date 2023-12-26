import { DependencyList, RefObject, useEffect } from 'react';

interface UseIntersectionObserverOpts extends IntersectionObserverInit {
  target: RefObject<HTMLElement>;
  callback?: IntersectionObserverCallback;
}

export function useIntersectionObserver(
  { callback, target, ...opts }: UseIntersectionObserverOpts,
  deps?: DependencyList,
) {
  useEffect(() => {
    if (!callback) return;

    const intersectinObserver = new IntersectionObserver(callback, opts);
    if (target.current) intersectinObserver.observe(target.current);

    return () => {
      intersectinObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
