import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NotificationsService } from './notifications.service';
import { NotificationsServiceModule } from './notifications-service.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    NotificationsServiceModule,
  );
  const notificationsService = app.get(NotificationsService);

  await app.close();
}

bootstrap();
