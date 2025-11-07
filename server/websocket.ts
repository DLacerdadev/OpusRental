import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import type { Server } from 'http';

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<ExtendedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/notifications' });
    
    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();
    
    console.log('[WebSocket] Notification server initialized on /ws/notifications');
  }

  private handleConnection(ws: ExtendedWebSocket, req: IncomingMessage) {
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth' && message.userId) {
          this.registerClient(message.userId, ws);
          ws.send(JSON.stringify({ 
            type: 'auth_success', 
            message: 'WebSocket connected successfully',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('[WebSocket] Error handling message:', error);
      }
    });

    ws.on('close', () => {
      this.unregisterClient(ws);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.unregisterClient(ws);
    });
  }

  private registerClient(userId: string, ws: ExtendedWebSocket) {
    ws.userId = userId;
    
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    
    this.clients.get(userId)!.add(ws);
    console.log(`[WebSocket] Client registered: userId=${userId}, total clients=${this.clients.get(userId)!.size}`);
  }

  private unregisterClient(ws: ExtendedWebSocket) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
        console.log(`[WebSocket] Client unregistered: userId=${ws.userId}`);
      }
    }
  }

  private startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const extWs = ws as ExtendedWebSocket;
        
        if (extWs.isAlive === false) {
          this.unregisterClient(extWs);
          return extWs.terminate();
        }
        
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);
  }

  public sendToUser(userId: string, notification: any) {
    const userClients = this.clients.get(userId);
    
    if (!userClients || userClients.size === 0) {
      console.log(`[WebSocket] No active connections for user: ${userId}`);
      return false;
    }

    let sent = 0;
    userClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'notification',
          data: notification,
          timestamp: new Date().toISOString()
        }));
        sent++;
      }
    });

    console.log(`[WebSocket] Sent notification to ${sent} client(s) for user: ${userId}`);
    return sent > 0;
  }

  public broadcast(notification: any, userIds?: string[]) {
    const targetUsers = userIds || Array.from(this.clients.keys());
    
    let totalSent = 0;
    targetUsers.forEach((userId) => {
      if (this.sendToUser(userId, notification)) {
        totalSent++;
      }
    });

    return totalSent;
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  public getConnectionCount(userId?: string): number {
    if (userId) {
      return this.clients.get(userId)?.size || 0;
    }
    return Array.from(this.clients.values()).reduce((sum, set) => sum + set.size, 0);
  }
}

let wsServer: NotificationWebSocketServer | null = null;

export function initializeWebSocket(server: Server): NotificationWebSocketServer {
  if (!wsServer) {
    wsServer = new NotificationWebSocketServer(server);
  }
  return wsServer;
}

export function getWebSocketServer(): NotificationWebSocketServer {
  if (!wsServer) {
    throw new Error('WebSocket server not initialized');
  }
  return wsServer;
}
