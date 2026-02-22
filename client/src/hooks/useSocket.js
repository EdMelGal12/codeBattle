import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    // In dev, Vite proxies /socket.io → localhost:3001 so no URL is needed.
    // In production, VITE_SERVER_URL must point to the deployed backend.
    const serverUrl = import.meta.env.VITE_SERVER_URL || undefined;
    socket = io(serverUrl, { autoConnect: false });
  }
  return socket;
}

export function useSocket(eventHandlers) {
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    const s = getSocket();

    if (!s.connected) {
      s.connect();
    }

    // Store references to bound handlers so cleanup removes only these listeners
    const boundHandlers = {};
    Object.keys(handlersRef.current).forEach((event) => {
      const handler = (...args) => handlersRef.current[event]?.(...args);
      boundHandlers[event] = handler;
      s.on(event, handler);
    });

    return () => {
      Object.entries(boundHandlers).forEach(([event, handler]) => {
        s.off(event, handler);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
