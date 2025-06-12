import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './message.service';
import { CreateMessageDto } from './dto/CreateMessageDto';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() assignmentId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `assignment-${assignmentId}`;
    client.join(room);
    console.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const savedMessage = await this.chatService.saveMessage(dto);
    const room = `assignment-${dto.assignmentId}`;

    console.log(`[GATEWAY] Sending to room: ${room}`, savedMessage);

    this.server.to(room).emit('receive_message', savedMessage);
    return savedMessage;
  }
}
