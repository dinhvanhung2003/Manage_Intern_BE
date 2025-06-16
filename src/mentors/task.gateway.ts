import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class TaskGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  handleJoin(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
    console.log(` Socket ${client.id} joined room ${room}`);
  }

  // Gửi task tới intern qua socket
  sendTaskAssigned(userId: number, task: any) {
    this.server.to(`user-${userId}`).emit('task_assigned', task);
  }
}
