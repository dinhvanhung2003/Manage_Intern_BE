import Redis from 'ioredis';
import { Provider } from '@nestjs/common';

export const RedisClientProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    return new Redis({
      host: 'localhost',
      port: 6379,
    });
  },
};
