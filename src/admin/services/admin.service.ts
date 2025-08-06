import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';
import { Raw } from 'typeorm';
import { InternAssignment } from '../entities/user.assign.entity';
import { CreateAssignmentDto } from '../dto/CreateAssignmentDto';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { assignQueue } from '../../queues/user.queue';
import { Task } from '../../tasks/entities/task.entity';
import { In,Not } from 'typeorm';
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Task)
    private readonly TaskRepo: Repository<Task>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(InternAssignment)
    private assignmentRepo: Repository<InternAssignment>,
  ) { }

  async findAllInternsAndMentors(params: {
  page: number;
  limit: number;
  type?: string;
  search?: string;
}) {
  const { page, limit, type, search } = params;

  const query = this.userRepo
    .createQueryBuilder('user')
    .where('user.type IN (:...types)', {
      types: type ? [type] : ['intern', 'mentor'],
    });

  if (search) {
    const keyword = `%${search.toLowerCase()}%`;
    query.andWhere(
      `(LOWER(user.name) LIKE :kw OR LOWER(user.email) LIKE :kw)`,
      { kw: keyword }
    );
  }

  const [data, total] = await query
    .orderBy('user.id', 'ASC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return { data, total };
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



  async searchAssignments(params: {
  page: number;
  limit: number;
  search?: string;
}) {
  const { page, limit, search } = params;
  const query = this.assignmentRepo
    .createQueryBuilder('assignment')
    .leftJoinAndSelect('assignment.intern', 'intern')
    .leftJoinAndSelect('assignment.mentor', 'mentor');

  if (search) {
    const keyword = `%${search.toLowerCase()}%`;
    query.where(`
      LOWER(intern.name) LIKE :kw OR
      LOWER(mentor.name) LIKE :kw OR
      LOWER(intern.email) LIKE :kw OR
      LOWER(mentor.email) LIKE :kw
    `, { kw: keyword });
  }

  const [data, total] = await query
    .orderBy('assignment.id', 'DESC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return { data, total };
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
  async searchAllTasks(keyword?: string, page: number = 1, limit: number = 10) {
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

  const [data, total] = await query
    .orderBy('task.dueDate', 'ASC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    total,
    nextPage: page * limit >= total ? null : page + 1
  };
}

// intern chua duoc phan cong 
async findUnassignedInterns() {
  const assignedInterns = await this.assignmentRepo
    .createQueryBuilder('a')
    .select('a.internId')
    .getMany();

  const assignedIds = assignedInterns.map(a => a.internId);

  const unassigned = await this.userRepo.find({
    where: {
      type: 'intern',
      id: assignedIds.length > 0 ? Not(In(assignedIds)) : undefined,
    },
    order: { id: 'ASC' },
  });

  return unassigned;
}


}
