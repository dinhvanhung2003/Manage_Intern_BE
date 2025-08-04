import { Worker } from 'bullmq';
import { connection } from './redis.config';
import { DataSource } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { Topic } from '../tasks/entities/topic.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Hung12122003',
  database: 'manage_intern',
  entities: [Task, Topic],
  synchronize: false, 
});

dataSource.initialize().then(() => {
  console.log('Assign-Task Worker connected to DB');

  new Worker(
    'assign-task-to-topic',
    async (job) => {
      const { taskId, topicId } = job.data;

      const taskRepo = dataSource.getRepository(Task);
      const topicRepo = dataSource.getRepository(Topic);

      const task = await taskRepo.findOneBy({ id: taskId });
      const topic = await topicRepo.findOneBy({ id: topicId });

      if (!task || !topic) {
        console.warn(`Task ${taskId} or Topic ${topicId} not found`);
        return;
      }

      task.topic = topic;
      await taskRepo.save(task);

      console.log(`Assigned task ${taskId} to topic ${topicId}`);
    },
    { connection }
  );
});
