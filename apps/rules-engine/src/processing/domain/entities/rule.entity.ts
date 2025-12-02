export enum RuleCondition {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUALS = 'equals',
  IN_RANGE = 'in_range',
  OUT_OF_RANGE = 'out_of_range',
}

export enum RuleAction {
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  SEND_PUSH_NOTIFICATION = 'send_push_notification',
  TRIGGER_ALARM = 'trigger_alarm',
  CALL_EMERGENCY = 'call_emergency',
}

export interface Rule {
  id: string;
  vehicleId: number;
  signalType: string;
  condition: RuleCondition;
  threshold: any;
  action: RuleAction;
  priority: number; // 1 = highest (emergency), 5 = lowest
  enabled: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

