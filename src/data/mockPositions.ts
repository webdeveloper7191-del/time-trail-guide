export interface PositionOption {
  id: string;
  title: string;
  category?: string;
}

export const mockPositions: PositionOption[] = [
  { id: 'pos-ece', title: 'Early Childhood Educator', category: 'Education' },
  { id: 'pos-ect', title: 'Early Childhood Teacher', category: 'Education' },
  { id: 'pos-lead', title: 'Lead Educator', category: 'Education' },
  { id: 'pos-room', title: 'Room Leader', category: 'Education' },
  { id: 'pos-dir', title: 'Centre Director', category: 'Management' },
  { id: 'pos-2ic', title: 'Assistant Director / 2IC', category: 'Management' },
  { id: 'pos-cook', title: 'Cook', category: 'Support' },
  { id: 'pos-clean', title: 'Cleaner', category: 'Support' },
  { id: 'pos-admin', title: 'Administrator', category: 'Support' },
  { id: 'pos-trainee', title: 'Trainee Educator', category: 'Education' },
  { id: 'pos-casual', title: 'Casual Relief Educator', category: 'Education' },
];
