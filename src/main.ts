import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RABBIT_URL, NOTIFICATIONS_QUEUE } from '@crm/shared';
import { HttpToRpcExceptionFilter } from '@crm/shared';

