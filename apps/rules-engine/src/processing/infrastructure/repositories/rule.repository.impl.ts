import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuleEntity } from '@common/database/orm/entities';
import { RuleRepository } from '../../domain/repositories';
import { Rule } from '../../domain/entities';

@Injectable()
export class RuleRepositoryImpl implements RuleRepository {
  constructor(
    @InjectRepository(RuleEntity)
    private readonly ruleRepository: Repository<RuleEntity>,
  ) { }

  async findByVehicleId(vehicleId: number): Promise<Rule[]> {
    const entities = await this.ruleRepository.find({
      where: {
        vehicleId,
        isActive: true,
      },
      order: {
        priority: 'DESC', // Mayor prioridad primero
      },
    });

    return entities.map((entity) => this.mapEntityToDomain(entity));
  }

  async findById(id: string): Promise<Rule | null> {
    const entity = await this.ruleRepository.findOne({
      where: { id: parseInt(id) },
    });

    return entity ? this.mapEntityToDomain(entity) : null;
  }

  async findByPriority(priority: number): Promise<Rule[]> {
    const entities = await this.ruleRepository.find({
      where: {
        priority,
        isActive: true,
      },
    });

    return entities.map((entity) => this.mapEntityToDomain(entity));
  }

  async findCriticalRules(): Promise<Rule[]> {
    // Reglas críticas tienen prioridad >= 8
    const entities = await this.ruleRepository
      .createQueryBuilder('rule')
      .where('rule.priority >= :minPriority', { minPriority: 8 })
      .andWhere('rule.isActive = :isActive', { isActive: true })
      .orderBy('rule.priority', 'DESC')
      .getMany();

    return entities.map((entity) => this.mapEntityToDomain(entity));
  }

  async save(rule: Rule): Promise<Rule> {
    const entity = this.ruleRepository.create({
      vehicleId: rule.vehicleId,
      name: rule.metadata?.name || 'Unnamed Rule',
      eventType: this.mapActionToEventType(rule.action),
      conditionValue: { threshold: rule.threshold, condition: rule.condition },
      actionType: this.mapRuleActionToActionType(rule.action),
      priority: rule.priority,
      isActive: rule.enabled,
    });

    const saved = await this.ruleRepository.save(entity);
    return this.mapEntityToDomain(saved);
  }

  async update(id: string, rule: Partial<Rule>): Promise<Rule> {
    const entity = await this.ruleRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!entity) {
      throw new Error(`Rule with id ${id} not found`);
    }

    if (rule.enabled !== undefined) {
      entity.isActive = rule.enabled;
    }

    if (rule.priority !== undefined) {
      entity.priority = rule.priority;
    }

    if (rule.threshold !== undefined || rule.condition !== undefined) {
      entity.conditionValue = {
        ...entity.conditionValue,
        threshold: rule.threshold,
        condition: rule.condition,
      };
    }

    const updated = await this.ruleRepository.save(entity);
    return this.mapEntityToDomain(updated);
  }

  private mapEntityToDomain(entity: RuleEntity): Rule {
    return {
      id: entity.id.toString(),
      vehicleId: entity.vehicleId,
      signalType: entity.eventType,
      condition: entity.conditionValue?.condition || 'GREATER_THAN',
      threshold: entity.conditionValue?.threshold || 0,
      action: this.mapActionTypeToRuleAction(entity.actionType),
      priority: entity.priority,
      enabled: entity.isActive,
      metadata: {
        name: entity.name,
        eventType: entity.eventType,
        conditionValue: entity.conditionValue,
      },
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt || entity.createdAt,
    };
  }

  private mapRuleActionToActionType(action: any): any {
    const mapping: Record<string, string> = {
      send_email: 'EMAIL_OWNER',
      send_sms: 'SMS_OWNER',
      send_push_notification: 'PUSH_NOTIFICATION',
      trigger_alarm: 'WEBHOOK',
      call_emergency: 'CALL_EMERGENCY',
    };

    return mapping[action] || 'SMS_OWNER';
  }

  private mapActionTypeToRuleAction(actionType: any): any {
    const mapping: Record<string, string> = {
      EMAIL_OWNER: 'send_email',
      SMS_OWNER: 'send_sms',
      EMAIL_POLICE: 'send_email',
      CALL_EMERGENCY: 'call_emergency',
      PUSH_NOTIFICATION: 'send_push_notification',
      WEBHOOK: 'trigger_alarm',
    };

    return mapping[actionType] || 'send_sms';
  }

  private mapActionToEventType(action: any): any {
    const mapping: Record<string, string> = {
      send_email: 'SPEED_LIMIT',
      send_sms: 'SPEED_LIMIT',
      call_emergency: 'PANIC',
      send_push_notification: 'SPEED_LIMIT',
      trigger_alarm: 'PANIC',
    };

    return mapping[action] || 'SPEED_LIMIT';
  }
}

