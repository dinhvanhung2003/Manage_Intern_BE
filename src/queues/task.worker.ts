import { Worker } from 'bullmq';
import { connection } from './redis.config';
import { DataSource } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { InternAssignment } from '../admin/entities/user.assign.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Hung12122003',
  database: 'manage_intern',
  entities: [Task, User, InternAssignment],
  synchronize: false,
});

dataSource.initialize().then(() => {
  const taskRepo = dataSource.getRepository(Task);
  const userRepo = dataSource.getRepository(User);
  const assignmentRepo = dataSource.getRepository(InternAssignment);

  console.log('Task worker started');

  new Worker(
    'create-task',
    async (job) => {
      const { index, title, description, assignedTo, assignedBy, dueDate } = job.data;

      const intern = await userRepo.findOneBy({ id: assignedTo });
      const mentor = await userRepo.findOneBy({ id: assignedBy });

      if (!intern || !mentor) {
        console.warn(` Job ${index}: Intern or Mentor not found`);
        return;
      }

      //  Kiểm tra intern & mentor có được gán với nhau trong intern_assignments
      const assignment = await assignmentRepo.findOneBy({
        internId: assignedTo,
        mentorId: assignedBy,
      });

      if (!assignment) {
        console.warn(
          ` Job ${index}: Sai quan hệ. Intern ${assignedTo} không được gán với mentor ${assignedBy}`
        );
        return;
      }

      const task = taskRepo.create({
        title,
        description,
        status: TaskStatus.ASSIGNED,
        assignedTo: intern,
        assignedBy: mentor,
        dueDate: new Date(dueDate),
      });

      await taskRepo.save(task);
      console.log(
        ` Job ${index}: Task '${title}' → intern ${intern.id}, mentor ${mentor.id} `
      );
    },
    {
      connection,
      concurrency: 20,
    },
  );
});
