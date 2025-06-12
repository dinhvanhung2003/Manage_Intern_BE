import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':assignmentId')
  getMessages(@Param('assignmentId') assignmentId: number) {
    return this.chatService.getMessagesByAssignment(+assignmentId);
  }
}
