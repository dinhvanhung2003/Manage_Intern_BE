import { Worker } from 'bullmq';
import { connection } from './redis.config';
import { DataSource } from 'typeorm';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { User } from '../users/user.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Hung12122003',
    database: 'manage_intern',
    entities: [Task, User],
    synchronize: false,
});

dataSource.initialize().then(() => {
    const taskRepo = dataSource.getRepository(Task);
    const userRepo = dataSource.getRepository(User);

    console.log('Task worker started');

    new Worker(
        'create-task',
        async (job) => {
            const { title, description, assignedTo, assignedBy, dueDate } = job.data;

            const intern = await userRepo.findOneBy({ id: assignedTo });
            const mentor = await userRepo.findOneBy({ id: assignedBy });
            if (!intern || !mentor) return;

            const task = taskRepo.create({
                title,
                description,
                status: TaskStatus.ASSIGNED,
                assignedTo: intern,
                assignedBy: mentor,
                dueDate: new Date(dueDate),
            });

            await taskRepo.save(task);
            console.log(`Created task for intern ${intern.id}`);
        },
        {
            connection,
            concurrency: 20,
        }
    );

});
