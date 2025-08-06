
import { Worker } from 'bullmq';
import { connection } from './redis.config';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Intern } from '../users/user.intern';
import { Mentor } from '../users/user.mentor';
import { InternAssignment } from '../admin/entities/user.assign.entity';
const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Hung12122003',
  database: 'manage_intern',
  entities: [User, Intern, Mentor, InternAssignment],
  synchronize: true,
});
dataSource.initialize().then(() => {
  const userRepo = dataSource.getRepository(User);
  const assignRepo = dataSource.getRepository(InternAssignment);

  new Worker(
    'assign-intern',
    async (job) => {
      const { internId, mentorId } = job.data;

      const intern = await userRepo.findOneBy({ id: internId });
      const mentor = await userRepo.findOneBy({ id: mentorId });

      if (!intern || !mentor) return;

      const exist = await assignRepo.findOneBy({ intern: { id: internId } });
      if (exist) return;

      const assignment = assignRepo.create({
        intern,
        mentor,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      });

      await assignRepo.save(assignment);
      console.log(`Assigned intern ${intern.name} to mentor ${mentor.name}`);
    },
    { connection }
  );
});