import { useState, useEffect, useRef, useCallback } from "react";

/**
 * High-performance debounce hook with cancellation support
 * Optimized for search inputs and API calls
 */
export const useDebounce = <T>(
  value: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
) => {
  const { leading = false, trailing = true, maxWait } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const maxTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const leadingRef = useRef<boolean>(false);

  // Cancel all pending timeouts
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = undefined;
    }
    leadingRef.current = false;
  }, []);

  // Execute the debounced function
  const invokeFunc = useCallback((newValue: T) => {
    lastInvokeTimeRef.current = Date.now();
    setDebouncedValue(newValue);
  }, []);

  // Check if we should invoke on leading edge
  const shouldInvokeLeading = useCallback(() => {
    const timeSinceLastCall = Date.now() - lastCallTimeRef.current;
    return leading && (!leadingRef.current || timeSinceLastCall >= delay);
  }, [leading, delay]);

  // Check if we should invoke on trailing edge
  const shouldInvokeTrailing = useCallback(() => {
    const timeSinceLastCall = Date.now() - lastCallTimeRef.current;
    return trailing && timeSinceLastCall >= delay;
  }, [trailing, delay]);

  // Main debounce effect
  useEffect(() => {
    const currentTime = Date.now();
    lastCallTimeRef.current = currentTime;

    // Handle leading edge
    if (shouldInvokeLeading()) {
      leadingRef.current = true;
      invokeFunc(value);

      // Set up maxWait timeout if specified
      if (maxWait && maxWait > delay) {
        maxTimeoutRef.current = setTimeout(() => {
          invokeFunc(value);
        }, maxWait);
      }

      return;
    }

    // Cancel existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up trailing timeout
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        if (shouldInvokeTrailing()) {
          invokeFunc(value);
        }
        leadingRef.current = false;
      }, delay);
    }

    // Set up maxWait timeout
    if (maxWait && !maxTimeoutRef.current) {
      const timeSinceLastInvoke = currentTime - lastInvokeTimeRef.current;
      const remainingMaxWait = maxWait - timeSinceLastInvoke;

      if (remainingMaxWait > 0) {
        maxTimeoutRef.current = setTimeout(() => {
          invokeFunc(value);
          leadingRef.current = false;
        }, remainingMaxWait);
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    value,
    delay,
    invokeFunc,
    shouldInvokeLeading,
    shouldInvokeTrailing,
    trailing,
    maxWait,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    debouncedValue,
    cancel,
    isPending:
      timeoutRef.current !== undefined || maxTimeoutRef.current !== undefined,
  };
};

/**
 * Specialized debounce hook for search functionality
 */
export const useSearchDebounce = (
  searchTerm: string,
  delay = 300,
  minLength = 2
) => {
  const { debouncedValue, cancel, isPending } = useDebounce(
    searchTerm.trim(),
    delay,
    { trailing: true, maxWait: 1000 }
  );

  const shouldSearch = debouncedValue.length >= minLength;

  return {
    debouncedSearchTerm: shouldSearch ? debouncedValue : "",
    cancel,
    isPending,
    shouldSearch,
  };
};

/**
 * Advanced debounce hook with callback support
 */
export const useCallbackDebounce = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number,
  deps: React.DependencyList = []
) => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const argsRef = useRef<T>(undefined);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const debouncedCallback = useCallback(
    (...args: T) => {
      argsRef.current = args;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current && argsRef.current) {
      clearTimeout(timeoutRef.current);
      callbackRef.current(...argsRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    debouncedCallback,
    cancel,
    flush,
    isPending: timeoutRef.current !== undefined,
  };
};
