export interface RuleEvaluation {
  id: string;
  ruleId: string;
  signalId: string;
  vehicleId: string;
  triggered: boolean;
  evaluatedAt: Date;
  result?: any;
}

