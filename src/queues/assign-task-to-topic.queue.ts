import { Queue } from 'bullmq';
import { connection } from './redis.config';

export const assignTaskToTopicQueue = new Queue('assign-task-to-topic', {
  connection,
});
