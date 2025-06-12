import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { InternAssignment } from '../admin/entities/user.assign';
import { CreateMessageDto } from './dto/CreateMessageDto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(InternAssignment)
    private assignmentRepo: Repository<InternAssignment>,
  ) {}

  async saveMessage(dto: CreateMessageDto): Promise<Message> {
    const assignment = await this.assignmentRepo.findOneBy({ id: dto.assignmentId });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const message = this.messageRepo.create({
      assignment,
      senderId: dto.senderId,
      message: dto.message,
    });

    return this.messageRepo.save(message);
  }

  async getMessagesByAssignment(assignmentId: number) {
    return this.messageRepo.find({
      where: { assignment: { id: assignmentId } },
      order: { sentAt: 'ASC' },
    });
  }
}
