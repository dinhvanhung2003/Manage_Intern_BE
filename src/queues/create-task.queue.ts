// dành riêng chon gán vào topic 
import { Worker } from 'bullmq';
import { connection } from './redis.config';
import { DataSource } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';
import { Topic } from '../tasks/entities/topic.entity';
import { User } from '../users/user.entity';
import { TopicDeadline } from '../tasks/entities/topic-deadline';
import { Document } from '../tasks/entities/document.entity';
import { DocumentFile } from '../tasks/entities/document-file';
import { TaskStatusLog } from '../tasks/entities/task.log';
import { ChatGroup } from '../message/entities/chat-group.entity';
import { Message } from '../message/entities/message.entity';
const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Hung12122003',
  database: 'manage_intern',
entities: [Task, Topic, User, TopicDeadline, Document, DocumentFile, TaskStatusLog, ChatGroup,Message],



  synchronize: false,
});

dataSource.initialize().then(() => {
  console.log('Task Worker started');

 // queue-worker/create-task.worker.ts
new Worker('create-task', async (job) => {
  const { title, description, createdById, assignedToId, topicId, dueDate } = job.data;

  const taskRepo = dataSource.getRepository(Task);
  const userRepo = dataSource.getRepository(User);
  const topicRepo = dataSource.getRepository(Topic);

  const createdBy = await userRepo.findOneBy({ id: createdById });
  if (!createdBy) return;

  const task = taskRepo.create({
    title,
    description,
    dueDate,
    assignedBy: createdBy,
  });

  if (assignedToId) {
    const intern = await userRepo.findOneBy({ id: assignedToId });
    if (intern) task.assignedTo = intern;
  }

  if (topicId) {
    const topic = await topicRepo.findOneBy({ id: topicId });
    if (topic) task.topic = topic;
  }

  await taskRepo.save(task);
  console.log(` Created task "${title}" for intern ${assignedToId} under topic ${topicId}`);
});

});
