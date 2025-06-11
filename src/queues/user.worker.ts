import { Worker } from 'bullmq';
import { connection } from './redis.config';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Intern } from '../users/user.intern';
import { Mentor } from '../users/user.mentor';
import { InternAssignment } from '../admin/entities/user.assign';
import * as bcrypt from 'bcrypt';
const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Hung12122003',
  database: 'manage_intern',
  entities: [User, Intern, Mentor],
  synchronize: true,
});

dataSource.initialize().then(() => {
  console.log('Worker started and connected to DB');
  new Worker('create-user', async (job) => {
    try {
      console.log('Job received:', job.data);

      const { name, email, type, mentorId } = job.data;
      const hashedPassword = await bcrypt.hash('123456', 10);
      let repo: any;
      let user: any;

      if (type === 'intern') {
        repo = dataSource.getRepository(Intern);
        user = repo.create({
          name,
          email,
          password: hashedPassword,
          type,
          mentorId: mentorId || null,
        });
      } else {
        repo = dataSource.getRepository(Mentor);
        user = repo.create({
          name,
          email,
          password: hashedPassword,
          type,
        });
      }

      await repo.save(user);
      console.log(` Created ${type} - ${name}`);


    } catch (err) {
      console.error('Error in worker:', err);
    }
  }, { connection });
});



