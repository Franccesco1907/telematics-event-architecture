import { Rule } from '../entities';

export interface RuleRepository {
  findByVehicleId(vehicleId: number): Promise<Rule[]>;
  findById(id: string): Promise<Rule | null>;
  findByPriority(priority: number): Promise<Rule[]>;
  save(rule: Rule): Promise<Rule>;
  update(id: string, rule: Partial<Rule>): Promise<Rule>;
}

