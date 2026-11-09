import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { Notifications } from './notifications.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GATEWAY_EVENTS, GatewayEventsClient } from './gateway-events.client';
import { GATEWAY_EVENTS_QUEUE } from '@crm/shared';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([Notifications]),
    ClientsModule.register([
      {
        name: GATEWAY_EVENTS,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBIT_URL ?? 'amqp://localhost:5672'],
          queue: GATEWAY_EVENTS_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [GatewayEventsClient, NotificationsService],
})
export class NotificationsServiceModule {}
