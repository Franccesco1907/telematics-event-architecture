import { Injectable, Logger, Inject } from '@nestjs/common';
import { Rule, RuleCondition } from '../../domain/entities';
import { RuleRepository } from '../../domain/repositories';
import { RedisCacheService } from '@common/cache';
import { KafkaProducerService } from '@common/kafka';

interface EvaluationResult {
  triggered: boolean;
  rules: Rule[];
  evaluations: Array<{
    ruleId: string;
    ruleName: string;
    triggered: boolean;
    actualValue: any;
    threshold: any;
    priority: number;
  }>;
}

@Injectable()
export class EvaluateRuleUseCase {
  private readonly logger = new Logger(EvaluateRuleUseCase.name);

  constructor(
    @Inject('RuleRepository')
    private readonly ruleRepository: RuleRepository,
    private readonly cacheService: RedisCacheService,
    private readonly kafkaProducer: KafkaProducerService,
  ) { }

  async execute(
    vehicleId: number,
    signalType: string,
    signalValue: any,
  ): Promise<EvaluationResult> {
    const startTime = Date.now();

    try {
      // 1. Obtener reglas del vehículo (primero desde Redis, luego DB)
      const rules = await this.getRulesForVehicle(vehicleId);

      if (rules.length === 0) {
        this.logger.debug(`No rules found for vehicle ${vehicleId}`);
        return { triggered: false, rules: [], evaluations: [] };
      }

      // 2. Filtrar reglas relevantes para este tipo de señal
      const relevantRules = rules.filter(
        (rule) => rule.enabled && rule.signalType === signalType,
      );

      // 3. Evaluar cada regla
      const evaluations = [];
      const triggeredRules: Rule[] = [];

      for (const rule of relevantRules) {
        const isTriggered = this.evaluateCondition(
          rule.condition,
          signalValue,
          rule.threshold,
        );

        evaluations.push({
          ruleId: rule.id,
          ruleName: rule.metadata?.name || `Rule ${rule.id}`,
          triggered: isTriggered,
          actualValue: signalValue,
          threshold: rule.threshold,
          priority: rule.priority,
        });

        if (isTriggered) {
          triggeredRules.push(rule);
          this.logger.warn(
            `Rule ${rule.id} triggered for vehicle ${vehicleId} - Priority: ${rule.priority}`,
          );
        }
      }

      // 4. Si hay reglas activadas, publicar eventos
      if (triggeredRules.length > 0) {
        await this.publishTriggeredEvents(vehicleId, triggeredRules, signalValue);
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Evaluated ${relevantRules.length} rules for vehicle ${vehicleId} in ${duration}ms`,
      );

      return {
        triggered: triggeredRules.length > 0,
        rules: triggeredRules,
        evaluations,
      };
    } catch (error) {
      this.logger.error(`Error evaluating rules for vehicle ${vehicleId}:`, error);
      throw error;
    }
  }

  async evaluateSignal(signal: {
    vehicleId: number;
    signalType: string;
    value: any;
    timestamp: Date;
    metadata?: any;
  }): Promise<EvaluationResult> {
    return this.execute(signal.vehicleId, signal.signalType, signal.value);
  }

  private async getRulesForVehicle(vehicleId: number): Promise<Rule[]> {
    // Estrategia: Consulta en Redis primero (< 1ms), si no hay, consultar DB
    const cacheKey = `rules:vehicle:${vehicleId}`;

    try {
      const cachedRules = await this.cacheService.getRulesByVehicleId<Rule[]>(vehicleId);

      if (cachedRules && cachedRules.length > 0) {
        this.logger.debug(`Rules loaded from cache for vehicle ${vehicleId}`);
        return cachedRules;
      }
    } catch (error) {
      this.logger.warn(`Cache miss for vehicle ${vehicleId}, querying DB`);
    }

    // Si no está en cache, consultar DB
    const rules = await this.ruleRepository.findByVehicleId(vehicleId);

    // Guardar en cache para próximas evaluaciones (TTL: 5 minutos)
    if (rules.length > 0) {
      await this.cacheService.setRulesByVehicleId(vehicleId, rules, 300);
    }

    return rules;
  }

  private evaluateCondition(
    condition: RuleCondition,
    value: any,
    threshold: any,
  ): boolean {
    // Extraer valor numérico si es objeto
    const numericValue = typeof value === 'object' ? value?.speed || value?.value : value;
    const numericThreshold = typeof threshold === 'object' ? threshold?.value : threshold;

    switch (condition) {
      case RuleCondition.GREATER_THAN:
        return numericValue > numericThreshold;

      case RuleCondition.LESS_THAN:
        return numericValue < numericThreshold;

      case RuleCondition.EQUALS:
        return numericValue === numericThreshold;

      case RuleCondition.IN_RANGE:
        return (
          numericValue >= threshold.min && numericValue <= threshold.max
        );

      case RuleCondition.OUT_OF_RANGE:
        return (
          numericValue < threshold.min || numericValue > threshold.max
        );

      default:
        this.logger.warn(`Unknown condition type: ${condition}`);
        return false;
    }
  }

  private async publishTriggeredEvents(
    vehicleId: number,
    rules: Rule[],
    signalValue: any,
  ): Promise<void> {
    // Ordenar por prioridad (mayor prioridad primero)
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);

    // Publicar cada regla activada como evento
    const events = sortedRules.map((rule) => ({
      vehicleId,
      ruleId: rule.id,
      action: rule.action,
      priority: rule.priority,
      signalValue,
      timestamp: new Date(),
      metadata: rule.metadata,
    }));

    // Si hay reglas críticas (prioridad >= 8), usar topic prioritario
    const criticalEvents = events.filter((e) => e.priority >= 8);
    const normalEvents = events.filter((e) => e.priority < 8);

    if (criticalEvents.length > 0) {
      for (const event of criticalEvents) {
        await this.kafkaProducer.sendToPriorityTopic(event, vehicleId);
      }
      this.logger.warn(
        `${criticalEvents.length} critical events published for vehicle ${vehicleId}`,
      );
    }

    if (normalEvents.length > 0) {
      for (const event of normalEvents) {
        await this.kafkaProducer.sendToEventsStream(event, vehicleId);
      }
    }
  }

  // Método adicional para precalentar cache con reglas críticas
  async warmupCache(vehicleIds: number[]): Promise<void> {
    this.logger.log(`Warming up cache for ${vehicleIds.length} vehicles...`);

    await this.cacheService.warmupCriticalRules(vehicleIds, async (vehicleId) => {
      return await this.ruleRepository.findByVehicleId(vehicleId);
    });
  }

  // Invalidar cache cuando una regla es modificada
  async invalidateVehicleCache(vehicleId: number): Promise<void> {
    await this.cacheService.deleteVehicleCache(vehicleId);
    this.logger.log(`Cache invalidated for vehicle ${vehicleId}`);
  }
}

