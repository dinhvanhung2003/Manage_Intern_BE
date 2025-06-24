import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {User} from '../users/user.entity';
import { Repository } from 'typeorm';
import { Raw } from 'typeorm';
import { InternAssignment } from './entities/user.assign';
import { CreateAssignmentDto } from './dto/CreateAssignmentDto';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { assignQueue } from '../queues/user.queue'; 
import { Task } from '../tasks/entities/task.entity';
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Task)
    private readonly TaskRepo: Repository<Task>,
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
    const mentor = await this.userRepo.findOneBy({ id: dto.mentorId });
    if (!mentor || mentor.type !== 'mentor') {
      throw new NotFoundException('Mentor không hợp lệ');
    }

    const interns = await this.userRepo.findByIds(dto.internIds);

    const assignmentsToCreate: InternAssignment[] = [];

    for (const intern of interns) {
      if (intern.type !== 'intern') continue;

      const alreadyAssigned = await this.assignmentRepo.findOne({
        where: { internId: intern.id },
      });

      if (!alreadyAssigned) {
        const assignment = this.assignmentRepo.create({
          internId: intern.id,
          mentorId: mentor.id,
          startDate: dto.startDate,
          endDate: dto.endDate,
        });

        assignmentsToCreate.push(assignment);
      }
    }

    if (assignmentsToCreate.length === 0) {
      throw new Error('Tất cả intern đã được gán rồi.');
    }

    return this.assignmentRepo.save(assignmentsToCreate);
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
    const existingAssignment = await this.assignmentRepo.findOne({
      where: { intern: { id: intern.id } },
    });

    if (existingAssignment) continue; // Skip nếu intern đã được gán

    const randomMentor = mentors[Math.floor(Math.random() * mentors.length)];
    await assignQueue.add('assign', {
      internId: intern.id,
      mentorId: randomMentor.id,
    });
  }

  return { message: `Đã đẩy các job gán vào hàng đợi.` };
}
async searchAllTasks(keyword?: string) {
  const query = this.TaskRepo
    .createQueryBuilder('task')
    .leftJoinAndSelect('task.assignedTo', 'intern')
    .leftJoinAndSelect('task.assignedBy', 'mentor');

  if (keyword) {
    const lowerKeyword = `%${keyword.toLowerCase()}%`;

    query.where(`
      LOWER(task.title) LIKE :kw OR
      LOWER(task.description) LIKE :kw OR
      LOWER(intern.name) LIKE :kw OR
      LOWER(mentor.name) LIKE :kw OR
      CAST(task.id AS TEXT) = :exactId
    `, { kw: lowerKeyword, exactId: keyword.trim() });
  }

  return query.orderBy('task.dueDate', 'ASC').getMany();
}


}
