import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {User} from '../users/user.entity';
import { Repository } from 'typeorm';
import { Raw } from 'typeorm';
import { InternAssignment } from './entities/user.assign';
import { CreateAssignmentDto } from './dto/CreateAssignmentDto';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { assignQueue } from '../queues/user.queue'; 
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
     @InjectRepository(InternAssignment)
    private assignmentRepo: Repository<InternAssignment>,
  ) {}

async findAllInternsAndMentors(): Promise<User[]> {
  return this.userRepo
    .createQueryBuilder('user')
    .where(`user.type IN (:...types)`, { types: ['intern', 'mentor'] })
    .orderBy('user.id', 'ASC')
    .getMany();
}
 async assignIntern(dto: CreateAssignmentDto) {
    const intern = await this.userRepo.findOneBy({ id: dto.internId });
    const mentor = await this.userRepo.findOneBy({ id: dto.mentorId });

    if (!intern || !mentor) throw new NotFoundException('Intern or Mentor not found');
    if (intern.type !== 'intern') throw new Error('User is not intern');
    if (mentor.type !== 'mentor') throw new Error('User is not mentor');

    const assignment = this.assignmentRepo.create({
      intern,
      mentor,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    return this.assignmentRepo.save(assignment);
  }

  findAllAssignments() {
    return this.assignmentRepo.find();
  }

  removeAssignment(id: number) {
    return this.assignmentRepo.delete(id);
  }


  // message queue 
  async enqueueRandomAssignments() {
  const interns = await this.userRepo.find({ where: { type: 'intern' } });
  const mentors = await this.userRepo.find({ where: { type: 'mentor' } });

  for (const intern of interns) {
    const randomMentor = mentors[Math.floor(Math.random() * mentors.length)];

    await assignQueue.add('assign', {
      internId: intern.id,
      mentorId: randomMentor.id,
    });
  }

  return { message: ` Đã đẩy ${interns.length} job vào hàng đợi assign-intern` };
}

}
