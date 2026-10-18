import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { PraiseWall } from '@/components/recognition/PraiseWall';
import { SurveyWorkspace } from '@/components/recognition/SurveyWorkspace';
import { recognitionStore, useRecognitionState } from '@/lib/recognitionStore';
import { recognitionApi } from '@/lib/api/recognitionApi';
import { mockStaff } from '@/data/mockStaffData';
import { PraisePost, Survey } from '@/types/recognition';
import { Sparkles, ClipboardList, Cake, Award } from 'lucide-react';
import { CelebrationsPanel } from '@/components/recognition/CelebrationsPanel';
import { BadgeManagerPanel } from '@/components/recognition/BadgeManagerPanel';
import { toast } from 'sonner';
import { buildCelebrations, useCelebrationSettings } from '@/lib/celebrationsStore';

const CURRENT_USER_ID = 'staff-2';

export default function RecognitionPage() {
  const { posts, surveys, responses, submitted } = useRecognitionState();
  const [activeTab, setActiveTab] = useState('praise');
  const { settings } = useCelebrationSettings();
  useEffect(() => {
    if(!settings.autoPost)return;
    for(const c of buildCelebrations(mockStaff,settings).filter(c=>c.daysAway===0 && c.visibility==='public')) {
      const id=`celebration:${c.id}:${c.date}`;
      if(recognitionStore.get().posts.some(p=>p.id===id))continue;
      const post:PraisePost={id,fromStaffId:'people-culture',toStaffId:c.staffId,category:'teamwork',message:c.type==='birthday'?`Happy birthday, ${c.staffName}!`:`Congratulations on ${c.years} years, ${c.staffName}!`,badges:[],likes:[],comments:[],publishedAs:'People & Culture',createdAt:new Date().toISOString()};
      recognitionStore.set(s=>({...s,posts:[post,...s.posts]}));
    }
  },[settings]);
  const handleCreatePost = async (data: Omit<PraisePost, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    try { recognitionStore.createPost(data); toast.success('Praise posted'); }
    catch(e) { toast.error(e instanceof Error ? e.message : 'Unable to save praise'); throw e; }
  };
  const handleLike = (id: string) => { try { recognitionStore.like(id, CURRENT_USER_ID); } catch(e) { toast.error(String(e)); } };
  const handleComment = async (id: string, content: string) => { recognitionStore.comment(id, CURRENT_USER_ID, content); };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Recognition &amp; Engagement</h1>
            <p className="text-muted-foreground">Celebrate achievements and gather feedback</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="praise" className="flex items-center gap-2"><Sparkles className="h-4 w-4" />Praise Wall</TabsTrigger>
              <TabsTrigger value="celebrations" className="flex items-center gap-2"><Cake className="h-4 w-4" />Celebrations</TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2"><Award className="h-4 w-4" />Badges</TabsTrigger>
              <TabsTrigger value="surveys" className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Surveys</TabsTrigger>
            </TabsList>
            <TabsContent value="praise" className="mt-6">
              <PraiseWall posts={posts} staff={mockStaff} currentUserId={CURRENT_USER_ID} onCreatePost={handleCreatePost} onLike={handleLike} onComment={handleComment} />
            </TabsContent>
            <TabsContent value="celebrations" className="mt-6">
              <CelebrationsPanel
                staff={mockStaff}
                onCelebrate={(staffId, message) =>
                  handleCreatePost({
                    fromStaffId: CURRENT_USER_ID,
                    toStaffId: staffId,
                    category: 'teamwork',
                    message,
                    badges: [],
                    publishedAs: 'People & Culture',
                  })
                }
              />
            </TabsContent>
            <TabsContent value="badges" className="mt-6">
              <BadgeManagerPanel />
            </TabsContent>
            <TabsContent value="surveys" className="mt-6">
              <SurveyWorkspace surveys={surveys} responses={responses} currentUserId={CURRENT_USER_ID} save={recognitionStore.saveSurvey} submit={(survey, answers) => { recognitionStore.submit(survey, CURRENT_USER_ID, answers); }} hasSubmitted={id => submitted.includes(`${id}:${CURRENT_USER_ID}`)} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
