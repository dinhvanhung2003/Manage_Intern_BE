import { Queue } from 'bullmq';
import { connection } from './redis.config';
// tạo hàng đợi cho việc tạo người dùng
export const userQueue = new Queue('create-user', { connection });
// tạo hàng đợi cho việc gán intern
export const assignQueue = new Queue('assign-intern', { connection });
// tạo hàng đợi tạo task 
export const taskQueue = new Queue('create-task', { connection });