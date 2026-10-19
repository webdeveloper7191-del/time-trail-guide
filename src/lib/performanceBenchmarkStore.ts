import { createBrowserState } from '@/lib/browserState';
export interface BenchmarkObservation { id:string; metricId:string; value:number; source:string; start:string; end:string; sampleSize:number; industry:string; region:string; companySize:string; lower?:number; upper?:number }
export const benchmarkObservations=createBrowserState<BenchmarkObservation[]>('rostered.performance.benchmark-observations.v1',[]);
export function validBenchmark(o:BenchmarkObservation) { return Number.isFinite(o.value) && o.sampleSize>0 && !!o.source.trim() && !!o.start && !!o.end && o.start<=o.end; }
