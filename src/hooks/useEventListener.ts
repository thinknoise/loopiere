// src/hooks/useEventListener.ts

import { useEffect, useRef } from "react";

/**
 * useEventListener hook
 * @template K - Key of the EventTarget's event map
 * @param eventName - Name of the event to listen for
 * @param handler - Callback when the event fires
 * @param element - Element to attach listener to (defaults to window)
 */
export default function useEventListener<
  K extends keyof GlobalEventHandlersEventMap = keyof GlobalEventHandlersEventMap
>(
  eventName: K,
  handler: (event: GlobalEventHandlersEventMap[K]) => void,
  element: EventTarget = window
): void {
  // Create a ref that stores handler
  // Initialize with the handler to avoid `undefined` and eliminate `any`.
  const savedHandler =
    useRef<(event: GlobalEventHandlersEventMap[K]) => void>(handler);

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Make sure element supports addEventListener
    if (!element || typeof element.addEventListener !== "function") return;

    // Create event listener that calls handler stored in ref
    const eventListener = (event: Event): void => {
      savedHandler.current(event as GlobalEventHandlersEventMap[K]);
    };

    element.addEventListener(eventName, eventListener as EventListener);

    // Remove event listener on cleanup
    return () => {
      element.removeEventListener(eventName, eventListener as EventListener);
    };
  }, [eventName, element]);
}
