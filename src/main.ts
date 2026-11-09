import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NotificationsService } from './notifications.service';
import { NotificationsServiceModule } from './notifications-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  HttpToRpcExceptionFilter,
  NOTIFICATIONS_QUEUE,
  RABBIT_URL,
} from '@crm/shared';
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_URL ?? 'amqp://localhost:5672'],
        queue: NOTIFICATIONS_QUEUE,
        queueOptions: {
          durable: true,
        },
      },
    },
  );
  app.useGlobalFilters(new HttpToRpcExceptionFilter());
  await app.listen();
  console.log('app is listening');
}

bootstrap();
