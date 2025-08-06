import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Intern } from '../users/user.intern';
import { Mentor } from '../users/user.mentor';
import { Task } from '../tasks/entities/task.entity';
import { Topic } from '../tasks/entities/topic.entity';
import { User } from '../users/entities/user.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Hung12122003',
  database: 'manage_intern',
  entities: [Intern, Mentor, Task, Topic, User],
  synchronize: false,
});

async function seedInternsAndTasks() {
  await dataSource.initialize();
  console.log('Connected to DB');

  const internRepo = dataSource.getRepository(Intern);
  const taskRepo = dataSource.getRepository(Task);
  const topicRepo = dataSource.getRepository(Topic);
  const mentorRepo = dataSource.getRepository(Mentor);

  const mentorId = 71;
  const mentor = await mentorRepo.findOneBy({ id: mentorId });
  if (!mentor) throw new Error(`Mentor with ID ${mentorId} not found`);

  const latestIntern = await internRepo
    .createQueryBuilder('intern')
    .where("intern.email ~ '^intern[0-9]+@mail\\.com$'")
    .orderBy(
      "CAST(SUBSTRING(intern.email from 'intern([0-9]+)') AS INT)",
      'DESC'
    )
    .getOne();

  let startNumber = latestIntern
    ? parseInt(latestIntern.email.match(/intern(\d+)@/)![1], 10) + 1
    : 1000;

  console.log(`Starting intern emails from intern${startNumber}@mail.com`);

  const hashedPassword = await bcrypt.hash('123456', 10);

  const interns: Intern[] = [];
  for (let i = 0; i < 3000; i++) {
    interns.push(
      internRepo.create({
        name: `Intern ${startNumber + i}`,
        email: `intern${startNumber + i}@mail.com`,
        password: hashedPassword,
        type: 'intern',
        mentorId,
      })
    );
  }
  await internRepo.save(interns);
  console.log(`Created ${interns.length} interns`);

  const topicId = 14;
  const topic = await topicRepo.findOneBy({ id: topicId });
  if (!topic) throw new Error(`Topic with ID ${topicId} not found`);

  const tasks: Task[] = interns.map((intern, idx) =>
    taskRepo.create({
      title: `Task for ${intern.name}`,
      description: `Auto generated task #${idx + 1}`,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      assignedBy: mentor,
      assignedTo: intern,
      topic: topic,
    })
  );

  await taskRepo.save(tasks);
  console.log(`Created ${tasks.length} tasks for topic ${topicId}`);

  await dataSource.destroy();
  console.log('Seeding completed!');
}

seedInternsAndTasks().catch((err) => {
  console.error('Error seeding data:', err);
  process.exit(1);
});
