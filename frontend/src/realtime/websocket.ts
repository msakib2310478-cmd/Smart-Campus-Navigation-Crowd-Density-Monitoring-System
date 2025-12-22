import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Zone } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export class CrowdWebSocketClient {
  private client: Client | null = null;
  private onCrowdUpdateCallback: ((zones: Zone[]) => void) | null = null;

  connect(onCrowdUpdate: (zones: Zone[]) => void) {
    this.onCrowdUpdateCallback = onCrowdUpdate;

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');
        this.client?.subscribe('/topic/crowd', (message) => {
          try {
            const zones: Zone[] = JSON.parse(message.body);
            if (this.onCrowdUpdateCallback) {
              this.onCrowdUpdateCallback(zones);
            }
          } catch (error) {
            console.error('Error parsing crowd update:', error);
          }
        });
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame.headers['message']);
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export const crowdWebSocket = new CrowdWebSocketClient();
