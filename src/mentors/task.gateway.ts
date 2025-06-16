import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationsService } from '../notifications/notifications.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class TaskGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap: Map<number, string> = new Map();

  constructor(private readonly notificationsService: NotificationsService) {}

  // Khi intern join socket
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

  // Gửi task mới
 async sendTaskAssigned(userId: number, task: any): Promise<boolean> {
  const socketId = this.userSocketMap.get(userId);
  const message = `Bạn vừa được giao task: ${task.title}`;

  if (socketId) {
    this.server.to(socketId).emit('task_assigned', task);
    console.log(`Gửi task cho user ${userId} qua socket`);
    return true;
  } else {
    console.log(`User ${userId} offline - socketId không tồn tại`);
    return false;
  }
}

}
