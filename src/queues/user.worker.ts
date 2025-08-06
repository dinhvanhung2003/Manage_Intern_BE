import { Worker } from 'bullmq';
import { connection } from './redis.config';
import { Intern } from '../users/user.intern';
import { Mentor } from '../users/user.mentor';
import * as bcrypt from 'bcrypt';
import { dataSource } from '../configs/data-source';

dataSource.initialize().then(() => {
  console.log('Worker started and connected to DB');

  new Worker(
    'create-user',
    async (job) => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        console.log('Job received:', job.data);

        const { name, email, type, mentorId } = job.data;
        const hashedPassword = await bcrypt.hash('123456', 10);
        let repo: any;
        let user: any;
        let finalEmail = email;

        if (type === 'intern') {
          repo = queryRunner.manager.getRepository(Intern);

          // Kiểm tra email trùng
          let emailExists = await repo.findOne({
            where: { email: finalEmail },
          });

          if (emailExists) {
            // Lấy intern mới nhất và lock row để tránh race condition
            const latestIntern = await repo
              .createQueryBuilder('intern')
              .where("intern.email ~ '^intern[0-9]+@mail\\.com$'")
              .orderBy(
                "CAST(SUBSTRING(intern.email from 'intern([0-9]+)') AS INT)",
                'DESC'
              )
              .setLock('pessimistic_write')
              .getOne();

            let nextNumber = 1000; // Bắt đầu từ 1000 nếu chưa có ai
            if (latestIntern) {
              const match = latestIntern.email.match(/intern(\d+)@/);
              if (match) {
                const currentNumber = parseInt(match[1], 10);
                nextNumber = currentNumber + 1;
              }
            }

            finalEmail = `intern${nextNumber}@mail.com`;
          }

          user = repo.create({
            name,
            email: finalEmail,
            password: hashedPassword,
            type,
            mentorId: 71,
          });
        } else {
          repo = queryRunner.manager.getRepository(Mentor);

          let emailExists = await repo.findOne({
            where: { email: finalEmail },
          });
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
        await queryRunner.commitTransaction();

        console.log(`Created ${type} - ${name} (${finalEmail})`);
      } catch (err) {
        await queryRunner.rollbackTransaction();
        console.error('Error in worker:', err);
      } finally {
        await queryRunner.release();
      }
    },
    { connection }
  );
});
