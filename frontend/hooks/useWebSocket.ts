import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'status' | 'dxf_output' | 'error';
  message?: string;
  data?: string;
}

export interface UseWebSocketReturn {
  connected: boolean;
  sendMessage: (message: { type: string; prompt: string }) => void;
  lastMessage: WebSocketMessage | null;
  error: string | null;
}

export function useWebSocket(
  projectId: number,
  onMessage?: (message: WebSocketMessage) => void
): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/api/v1/ws/chat/${projectId}?token=${token}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          if (onMessage) {
            onMessage(message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        setConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 1000 * reconnectAttempts.current); // Exponential backoff
        } else {
          setError('Failed to connect. Please refresh the page.');
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to establish WebSocket connection');
    }
  }, [projectId, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: { type: string; prompt: string }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      setError('WebSocket is not connected');
    }
  }, []);

  return {
    connected,
    sendMessage,
    lastMessage,
    error,
  };
}

