import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Custom React hook for robust, resilient WebSocket communication with KisanSetu backend.
 * Provides automatic reconnect with exponential backoff and live message dispatching.
 */
export function useRealtime({ onEvent } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  // Derive WebSocket URL based on HTTP backend URL or current host
  const getWsUrl = useCallback(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    if (backendUrl.startsWith("https://")) {
      return backendUrl.replace("https://", "wss://");
    }
    if (backendUrl.startsWith("http://")) {
      return backendUrl.replace("http://", "ws://");
    }
    const loc = window.location;
    const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${loc.hostname}:5000`;
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = getWsUrl();
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        console.log("[KisanSetu WebSocket] Connected to real-time gateway at", url);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);
          if (onEvent && typeof onEvent === "function") {
            onEvent(data);
          }
        } catch (err) {
          console.warn("[KisanSetu WebSocket] Failed to parse message:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Exponential backoff reconnect: 1s, 2s, 4s, max 10s
        const timeout = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 10000);
        reconnectAttempts.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, timeout);
      };

      ws.onerror = (err) => {
        console.warn("[KisanSetu WebSocket] Connection notice:", err.message || "reconnecting");
        ws.close();
      };
    } catch (err) {
      console.warn("[KisanSetu WebSocket] Init error:", err);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [getWsUrl, onEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((type, payload = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
    }
  }, []);

  return { isConnected, lastEvent, send };
}
