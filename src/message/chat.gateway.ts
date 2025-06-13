import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Inject, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  @SubscribeMessage('join_room')
  async handleJoinRoom(@MessageBody() assignmentId: number, @ConnectedSocket() client: Socket) {
    const room = `assignment-${assignmentId}`;
    client.join(room);

    const raw = await this.redis.lrange(`chat:${room}`, 0, -1);
    const messages = raw.map((m) => JSON.parse(m));

    // client.emit('receive_message_history', messages);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(@MessageBody() msg: any, @ConnectedSocket() client: Socket) {
    const room = `assignment-${msg.assignmentId}`;
    const message = {
      senderId: msg.senderId,
      message: msg.message,
      sentAt: new Date().toISOString(),
    };

    await this.redis.rpush(`chat:${room}`, JSON.stringify(message));
    await this.redis.expire(`chat:${room}`, 86400);

    this.server.to(room).emit('receive_message', message);
  }
}
