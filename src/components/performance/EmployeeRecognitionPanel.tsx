import { StaffRecognitionWorkspace } from '@/components/recognition/StaffRecognitionWorkspace';

export function EmployeeRecognitionPanel({ currentUserId }: { currentUserId: string }) {
  return <StaffRecognitionWorkspace currentUserId={currentUserId} />;
}
