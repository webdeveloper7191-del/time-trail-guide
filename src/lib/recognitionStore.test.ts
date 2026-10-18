import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Survey } from '@/types/recognition';
const survey:Survey={id:'s1',title:'Team survey',description:'',status:'active',anonymous:true,questions:[{id:'q1',text:'Score',type:'rating',required:true}],startDate:'2026-10-01',endDate:'2026-10-31',responseCount:0,targetAudience:'all',createdBy:'staff-1',createdAt:'2026-10-01',updatedAt:'2026-10-01'};
beforeEach(()=>{localStorage.clear();vi.resetModules();vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-18T12:00:00Z'));});
describe('Browser recognition',()=>{
  it('saves posts and comments through a refresh',async()=>{
    const {recognitionStore:s}=await import('./recognitionStore');
    const post=s.createPost({fromStaffId:'staff-1',toStaffId:'staff-2',category:'teamwork',message:'Thank you',badges:[]});
    s.comment(post.id,'staff-2','Thanks');s.like(post.id,'staff-2');
    vi.resetModules();const {recognitionStore:loaded}=await import('./recognitionStore');
    expect(loaded.get().posts.find(p=>p.id===post.id)?.comments[0].content).toBe('Thanks');
    expect(loaded.get().posts.find(p=>p.id===post.id)?.likes).toEqual(['staff-2']);
  });
  it('omits identity from anonymous answers and prevents duplicate submissions',async()=>{
    const {recognitionStore:s}=await import('./recognitionStore');s.saveSurvey(survey);
    expect(s.submit(survey,'staff-2',[{questionId:'q1',value:5}]).staffId).toBeUndefined();
    expect(()=>s.submit(survey,'staff-2',[{questionId:'q1',value:5}])).toThrow('already answered');
    expect(s.get().surveys.find(i=>i.id==='s1')?.responseCount).toBe(1);
  });
  it('rejects responses after a saved survey closes',async()=>{
    const {recognitionStore:s}=await import('./recognitionStore');s.saveSurvey({...survey,status:'closed'});
    expect(()=>s.submit(survey,'staff-2',[{questionId:'q1',value:5}])).toThrow('not accepting');
  });
});