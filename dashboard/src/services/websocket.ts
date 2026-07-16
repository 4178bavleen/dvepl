export class WebSocketService {
  connect() {
    console.log('Mock WebSocket connected');
  }
  disconnect() {
    console.log('Mock WebSocket disconnected');
  }
}

export const wsService = new WebSocketService();
