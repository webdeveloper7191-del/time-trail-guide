import { createBrowserState } from '@/lib/browserState';
export interface DevelopmentJourney { id:string;staffId:string;reviewId:string;skillId:string;planId:string;courseId:string;enrollmentId:string;followUpReviewId:string;followUpDate:string;createdAt:string;goalId?:string;status?:'pending'|'complete' }
export const developmentJourneys=createBrowserState<DevelopmentJourney[]>('rostered.performance.development-journeys.v1',[]);
