import { Injectable, NotFoundException } from '@nestjs/common';
import type { Actor } from '@crm/shared';
import { notificationTypes, type NotificationType } from '@crm/shared';
import type { NotificationDto, NotificationListDto } from '@crm/shared';
import { permissions, type Permission } from '@crm/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Notifications } from './notifications.entity';
import { Repository } from 'typeorm';
import {
  LeadAssignedEvent,
  LeadClosedEvent,
  LeadStatusChangedEvent,
  TaskCreatedEvent,
  TaskDeletedEvent,
} from '@crm/shared';

const notificationsLimit = 20;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notifications)
    private readonly repo: Repository<Notifications>,
  ) {}

  private toDto(row: Notifications): NotificationDto {
    return {
      id: row.id,
      type: row.type,
      message: row.message,
      leadId: row.leadId,
      actorName: row.actorName,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    };
  }
  async listForUser(
    userId: string,
    take: number = notificationsLimit,
  ): Promise<NotificationListDto> {
    const where = { userId };
    const [rows, unreadCount] = await Promise.all([
      this.repo.find({
        where,
        order: { createdAt: 'DESC' },
        take,
      }),
      this.repo.countBy({
        userId,
        isRead: false,
      }),
    ]);

    return { items: rows.map((row) => this.toDto(row)), unreadCount };
  }
  async markAsRead(userId: string, id: string): Promise<NotificationListDto> {
    const result = await this.repo.update({ id, userId }, { isRead: true });

    if (!result.affected) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return this.listForUser(userId);
  }
  async markAllAsRead(userId: string): Promise<NotificationListDto> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return this.listForUser(userId);
  }
  async markAllDelete(userId: string): Promise<NotificationListDto> {
    await this.repo.delete({
      userId,
    });
    return this.listForUser(userId);
  }
  private async createForUser(input: {
    userId: string;
    type: NotificationType;
    message: string;
    leadId?: string | null;
    actor: Actor;
  }): Promise<NotificationDto | null> {
    if (input.userId === input.actor.id) return null;

    const row = this.repo.create({
      userId: input.userId,
      type: input.type,
      message: input.message,
      leadId: input.leadId ?? null,
      actorId: input.actor.id,
      actorName: input.actor.name,
    });
    const savedRow = await this.repo.save(row);

    return this.toDto(savedRow);
  }
  private async createForLeaders(input: {
    type: NotificationType;
    message: string;
    leadId?: string | null;
    leaderIds: string[];
    actor: Actor;
  }): Promise<void> {
    const { leaderIds, ...rest } = input;
    const targetLeadersIds = leaderIds.filter(
      (leaderId) => leaderId !== input.actor.id,
    );

    await Promise.all(
      targetLeadersIds.map((userId) => this.createForUser({ ...rest, userId })),
    );
  }
  async notifyLeadAssigned(event: LeadAssignedEvent): Promise<void> {
    const { actor, assignedId, assignedName, leadId, leadName, leaderIds } =
      event;
    const has = (permission: Permission) =>
      actor.permissions.includes(permission);

    await this.createForUser({
      userId: assignedId,
      type: notificationTypes.leadAssigned,
      message: `${actor.name} assigned you a lead ${leadName}`,
      leadId,
      actor,
    });
    if (!has(permissions.leadAssign)) {
      await this.createForLeaders({
        type: notificationTypes.leadAssignedByMember,
        message: `${actor.name} assigned ${assignedName} to the lead ${leadName}`,
        leadId,
        actor,
        leaderIds,
      });
    }
  }
  async notifyLeadClosed(event: LeadClosedEvent): Promise<void> {
    const { actor, leadId, leadName, status, leaderIds } = event;

    await this.createForLeaders({
      type: notificationTypes.leadClosed,
      message: `${actor.name} marked the lead ${leadName} as ${status}`,
      leadId,
      actor,
      leaderIds,
    });
  }
  async notifyTaskCreated(event: TaskCreatedEvent): Promise<void> {
    const { actor, leadId, leadName, taskTitle, leaderIds } = event;

    await this.createForLeaders({
      type: notificationTypes.taskCreated,
      message: `${actor.name} added the task ${taskTitle} for ${leadName}`,
      leadId,
      actor,
      leaderIds,
    });
  }
  async notifyTaskDeleted(event: TaskDeletedEvent): Promise<void> {
    const { actor, leadId, leadName, assignTask, leaderIds } = event;

    await this.createForLeaders({
      type: notificationTypes.taskDeleted,
      message: `${actor.name} deleted ${assignTask} on ${leadName}`,
      leadId,
      actor,
      leaderIds,
    });
  }

  async notifyLeadStatusChanged(event: LeadStatusChangedEvent): Promise<void> {
    const { actor, leadId, leadName, status, leaderIds } = event;
    await this.createForLeaders({
      type: notificationTypes.leadStatusChanged,
      message: `${actor.name} moved ${leadName} in ${status}`,
      leadId,
      actor,
      leaderIds,
    });
  }
}
