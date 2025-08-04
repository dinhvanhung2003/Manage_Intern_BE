import { Worker } from 'bullmq';
import { connection } from './redis.config';
import { Intern } from '../users/user.intern';
import { Mentor } from '../users/user.mentor';
import * as bcrypt from 'bcrypt';
import { dataSource } from '../configs/data-source';

dataSource.initialize().then(() => {
  console.log('Worker started and connected to DB');

  new Worker('create-user', async (job) => {
    try {
      console.log('Job received:', job.data);

      const { name, email, type, mentorId } = job.data;
      const hashedPassword = await bcrypt.hash('123456', 10);
      let repo: any;
      let user: any;
      let finalEmail = email;

      if (type === 'intern') {
        repo = dataSource.getRepository(Intern);

        //  Nếu email bị trùng thì tạo email mới dạng internX@mail.com
        let emailExists = await repo.findOne({ where: { email: finalEmail } });

        if (emailExists) {
          // Lấy số lớn nhất hiện có
          const result = await repo
            .createQueryBuilder('intern')
            .select("MAX(CAST(SUBSTRING(intern.email from 'intern([0-9]+)') AS INT))", 'maxNum')
            .getRawOne();

          const nextNumber = (result.maxnum || 0) + 1;
          finalEmail = `intern${nextNumber}@mail.com`;
        }

        user = repo.create({
          name,
          email: finalEmail,
          password: hashedPassword,
          type,
          mentorId: mentorId || null,
        });
      } else {
        repo = dataSource.getRepository(Mentor);
        // Kiểm tra trùng email với mentor
        let emailExists = await repo.findOne({ where: { email: finalEmail } });
        if (emailExists) {
          finalEmail = `${Date.now()}_${email}`; 
        }

        user = repo.create({
          name,
          email: finalEmail,
          password: hashedPassword,
          type,
        });
      }

      await repo.save(user);
      console.log(`Created ${type} - ${name} (${finalEmail})`);

    } catch (err) {
      console.error('Error in worker:', err);
    }
  }, { connection });
});
