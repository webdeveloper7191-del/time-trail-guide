import { StaffRecognitionWorkspace } from '@/components/recognition/StaffRecognitionWorkspace';
import type { StaffMember } from '@/types/staff';

export function UnifiedRecognitionPanel({ currentUserId }: { staff: StaffMember[]; currentUserId: string }) {
  return <StaffRecognitionWorkspace currentUserId={currentUserId} />;
}
