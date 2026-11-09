import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationsEvents, ServiceClient } from '@crm/shared';

export const GATEWAY_EVENTS = 'GATEWAY_EVENTS';

@Injectable()
export class GatewayEventsClient extends ServiceClient<
  Record<never, never>,
  NotificationsEvents
> {
  constructor(@Inject(GATEWAY_EVENTS) client: ClientProxy) {
    super(client, 'gateway');
  }
}
