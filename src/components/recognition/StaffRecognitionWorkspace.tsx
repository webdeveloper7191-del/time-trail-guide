import { useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PraiseWall } from './PraiseWall';
import { RewardsWallet } from './RewardsWallet';
import { RecognitionManagement } from './RecognitionManagement';
import { recognitionStore, useRecognitionState } from '@/lib/recognitionStore';
import { processMilestoneRewards } from '@/lib/recognitionWorkflowStore';
import { mockStaff } from '@/data/mockStaffData';
import { toast } from 'sonner';
import { useSyncExternalStore } from 'react';
import { rewardsStore, topEarners } from '@/lib/rewardsStore';

export function StaffRecognitionWorkspace({ currentUserId }: { currentUserId: string }) {
  const { posts } = useRecognitionState();
  const rewards = useSyncExternalStore(rewardsStore.subscribe, rewardsStore.get, rewardsStore.get);
  useEffect(() => { try { processMilestoneRewards(mockStaff); } catch { toast.error('Unable to save milestone points'); } }, []);
  return <Tabs defaultValue="praise"><TabsList className="flex flex-wrap h-auto justify-start"><TabsTrigger value="praise">Praise Wall</TabsTrigger><TabsTrigger value="recognition">My recognitions</TabsTrigger><TabsTrigger value="rewards">My rewards</TabsTrigger><TabsTrigger value="leaderboard">Leaderboard</TabsTrigger></TabsList>
    <TabsContent value="praise"><PraiseWall posts={posts} staff={mockStaff} currentUserId={currentUserId} onCreatePost={async data => { try { recognitionStore.createPost(data); toast.success('Praise saved'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Unable to save'); } }} onLike={id => recognitionStore.like(id, currentUserId)} onComment={async (id, text) => { recognitionStore.comment(id, currentUserId, text); }} /></TabsContent>
    <TabsContent value="recognition"><RecognitionManagement currentUserId={currentUserId} staff={mockStaff} /></TabsContent>
    <TabsContent value="rewards"><RewardsWallet currentUserId={currentUserId} staff={mockStaff} /></TabsContent>
    <TabsContent value="leaderboard"><h2 className="text-xl font-semibold my-4">Top earners this month</h2>{topEarners(rewards).map((entry, index) => { const person = mockStaff.find(s => s.id === entry.staffId); return <div key={entry.staffId} className="flex justify-between gap-3 border-b border-border py-3"><p>{index + 1}. {person ? `${person.firstName} ${person.lastName}` : entry.staffId}</p><span className="font-medium">{entry.earnedThisMonth} pts</span></div>; })}</TabsContent>
  </Tabs>;
}