export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number,
) {
  let timeoutId: NodeJS.Timeout;

  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export type ThrottledFunction<T extends unknown[]> = (...args: T) => void;
export function throttle<T extends unknown[]>(
  func: (...args: T) => void,
  limit = 1000,
): ThrottledFunction<T> {
  let lastExecutionTime = 0;
  let timeout: NodeJS.Timeout | null = null;

  return function throttledFunc(...args: T): void {
    const now = Date.now();

    if (now - lastExecutionTime < limit) {
      if (timeout) {
        return;
      }

      timeout = setTimeout(
        () => {
          func(...args);
          lastExecutionTime = now;
          timeout = null;
        },
        limit - (now - lastExecutionTime),
      );
    } else {
      func(...args);
      lastExecutionTime = now;
    }
  };
}

export function parseJSON<T = unknown, K = null>(
  input: string,
  def: K = null,
): T | K {
  try {
    return JSON.parse(input) as T;
  } catch (_error) {
    return def;
  }
}

export function isObject<T>(input: T) {
  return typeof input === 'object' && !Array.isArray(input);
}

export function sleep(ms = 1000) {
  return new Promise((r) => setTimeout(r, ms));
}
