import { DataSource } from 'typeorm';
import * as path from 'path';
import { User } from '../users/entities/user.entity';
import { Intern } from '../users/user.intern';
import { Mentor } from '../users/user.mentor';
import { InternAssignment } from '../admin/entities/user.assign.entity';
import { TaskStatusLog } from '../tasks/entities/task.log.enity';
import { Task } from '../tasks/entities/task.entity';
import { ChatGroup } from '../message/entities/chat-group.entity';
import { Message } from '../message/entities/message.entity';
import { Document } from '../tasks/entities/document.entity';
import { Topic } from '../tasks/entities/topic.entity';
import { DocumentFile } from '../tasks/entities/document-file.entity';
import { TopicDeadline } from '../tasks/entities/topic-deadline.entity';
import {TaskImage} from '../tasks/entities/task.image.entity';
import {Notification} from '../notifications/entities/user.notification';
export const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Hung12122003',
  database: 'manage_intern',
   entities: [User, Intern, Mentor, InternAssignment, TaskStatusLog, Task, ChatGroup, Message, Document, Topic, DocumentFile, TopicDeadline, TaskImage,Notification],
  synchronize: true,
  logging:false
});
