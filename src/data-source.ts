import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Notifications } from './notifications.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.NOTIFICATIONS_DATABASE_URL,
  entities: [Notifications],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
