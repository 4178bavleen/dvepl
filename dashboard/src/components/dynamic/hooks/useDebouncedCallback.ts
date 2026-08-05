import { useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay = 700,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}