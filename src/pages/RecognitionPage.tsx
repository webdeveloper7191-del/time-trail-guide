import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { PraiseWall } from '@/components/recognition/PraiseWall';
import { SurveysPanel } from '@/components/recognition/SurveysPanel';
import { recognitionApi } from '@/lib/api/recognitionApi';
import { mockStaff } from '@/data/mockStaffData';
import { PraisePost, Survey } from '@/types/recognition';
import { Sparkles, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_USER_ID = 'staff-2';

export default function RecognitionPage() {
  const [posts, setPosts] = useState<PraisePost[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activeTab, setActiveTab] = useState('praise');

  useEffect(() => {
    recognitionApi.fetchPraisePosts().then(r => r.data && setPosts(r.data));
    recognitionApi.fetchSurveys().then(r => r.data && setSurveys(r.data));
  }, []);

  const handleCreatePost = async (data: Omit<PraisePost, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    const res = await recognitionApi.createPraisePost(data);
    if (res.data) { setPosts([res.data, ...posts]); toast.success('Praise posted! 🎉'); }
  };

  const handleLike = async (postId: string) => {
    const res = await recognitionApi.likePraisePost(postId, CURRENT_USER_ID);
    if (res.data) setPosts(posts.map(p => p.id === postId ? res.data! : p));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Recognition & Engagement</h1>
            <p className="text-muted-foreground">Celebrate achievements and gather feedback</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="praise" className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Praise Wall</TabsTrigger>
              <TabsTrigger value="surveys" className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Surveys</TabsTrigger>
            </TabsList>
            <TabsContent value="praise" className="mt-6">
              <PraiseWall posts={posts} staff={mockStaff} currentUserId={CURRENT_USER_ID} onCreatePost={handleCreatePost} onLike={handleLike} onComment={(id, c) => toast.info('Comment added')} />
            </TabsContent>
            <TabsContent value="surveys" className="mt-6">
              <SurveysPanel surveys={surveys} onCreateSurvey={() => toast.info('Survey builder - coming soon')} onViewSurvey={(s) => toast.info(`Viewing: ${s.title}`)} onTakeSurvey={(s) => toast.info(`Taking: ${s.title}`)} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
