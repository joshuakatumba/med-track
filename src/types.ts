export interface Visit {
  id: string;
  name: string;
  service: string;
  status: 'waiting' | 'seen';
  createdAt: Date;
  createdBy: string;
  seenAt?: any;
}

export interface Stats {
  totalToday: number;
  waitingToday: number;
  seenToday: number;
  byService: Record<string, number>;
  todayVisits: Visit[];
}

export const SERVICES = [
  "General Consultation",
  "Laboratory",
  "Pharmacy",
  "Dental",
  "Maternity",
  "Emergency",
  "Triage"
];
