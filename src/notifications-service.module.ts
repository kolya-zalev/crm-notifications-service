import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { Notifications } from './notifications.entity';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([Notifications]),
  ],
  providers: [NotificationsService],
})
export class NotificationsServiceModule {}
