// topic.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class TopicGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap: Map<number, string> = new Map();

  // Khi intern connect socket
  @SubscribeMessage('join')
  handleJoin(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
    const room = `user-${userId}`;
    client.join(room);
    this.userSocketMap.set(userId, client.id);
    console.log(`Socket ${client.id} joined room ${room}`);
  }

  // Khi intern disconnect socket
  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.userSocketMap.entries()) {
      if (socketId === client.id) {
        this.userSocketMap.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  // Gửi thông báo khi có deadline mới
  async sendDeadlineAssigned(userId: number, payload: any): Promise<boolean> {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('deadline_assigned', payload);
      console.log(`Đã gửi deadline tới user ${userId}`);
      return true;
    } else {
      console.log(`User ${userId} offline (socketId không có)`);
      return false;
    }
  }
}
