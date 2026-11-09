import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { Payload } from '@nestjs/microservices';
import {
  eventsNotifications,
  LeadAssignedEvent,
  LeadClosedEvent,
  LeadStatusChangedEvent,
  messagesNotifications,
  NotificationListDto,
  NotificationsMarkAsReadPayload,
  NotificationsUserPayload,
  TaskCreatedEvent,
  TaskDeletedEvent,
} from '@crm/shared';
@Controller()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @MessagePattern(messagesNotifications.notificationList)
  listForUser(
    @Payload() payload: NotificationsUserPayload,
  ): Promise<NotificationListDto> {
    return this.service.listForUser(payload.userId);
  }
  @MessagePattern(messagesNotifications.notificationsMarkAsRead)
  markAsRead(@Payload() payload: NotificationsMarkAsReadPayload) {
    return this.service.markAsRead(payload.userId, payload.id);
  }
  @MessagePattern(messagesNotifications.notificationsMarkAllAsRead)
  markAllAsRead(@Payload() payload: NotificationsUserPayload) {
    return this.service.markAllAsRead(payload.userId);
  }
  @MessagePattern(messagesNotifications.notificationsDeleteAll)
  markAllDelete(@Payload() payload: NotificationsUserPayload) {
    return this.service.markAllDelete(payload.userId);
  }
  @EventPattern(eventsNotifications.leadAssigned)
  notifyLeadAssigned(@Payload() event: LeadAssignedEvent): Promise<void> {
    return this.service.notifyLeadAssigned(event);
  }
  @EventPattern(eventsNotifications.leadClosed)
  notifyLeadClosed(@Payload() event: LeadClosedEvent): Promise<void> {
    return this.service.notifyLeadClosed(event);
  }
  @EventPattern(eventsNotifications.leadStatusChanged)
  notifyLeadStatusChanged(
    @Payload() event: LeadStatusChangedEvent,
  ): Promise<void> {
    return this.service.notifyLeadStatusChanged(event);
  }
  @EventPattern(eventsNotifications.taskCreated)
  notifyTaskCreated(@Payload() event: TaskCreatedEvent): Promise<void> {
    return this.service.notifyTaskCreated(event);
  }
  @EventPattern(eventsNotifications.taskDeleted)
  notifyTaskDeleted(@Payload() event: TaskDeletedEvent): Promise<void> {
    return this.service.notifyTaskDeleted(event);
  }
}
