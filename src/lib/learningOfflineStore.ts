import { createBrowserState } from '@/lib/browserState';
import { lmsStore } from '@/lib/lmsStore';
import type { Course } from '@/types/lms';

export interface CachedCourse { course: Course; bytes: number; downloadedAt: string; expiresAt: string }
export const learningDownloads = createBrowserState<Record<string, CachedCourse>>('rostered.lms.downloads.v1', {});
export const learningOfflineSettings = createBrowserState('rostered.lms.offline-settings.v1', { storageLimitMb: 100, expiryDays: 30 });
const cacheName = 'rostered-learning-media-v1';
export function cachedCourseAvailable(row: CachedCourse | undefined, now = Date.now()) { return !!row && Date.parse(row.expiresAt) > now; }
export async function downloadLearningCourse(course: Course) {
  const cache = await caches.open(cacheName);
  const settings = learningOfflineSettings.get();
  const urls = [...new Set(course.modules.flatMap(module => module.content.flatMap(content => content.url ? [content.url] : [])))];
  if(!urls.length) throw new Error('No downloadable files are attached to this course. Add learning material first.');
  const staged: [string, Response][] = [];
  let bytes = new Blob([JSON.stringify(course)]).size;
  for (const url of urls) {
    const parsed = new URL(url, window.location.origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('This course contains an unsupported media address');
    const response = await fetch(parsed.href, { credentials: 'omit' });
    if (!response.ok || response.type === 'opaque') throw new Error('A course file cannot be downloaded. Check its address and download permissions.');
    const blob = await response.blob(); bytes += blob.size;
    staged.push([parsed.href, new Response(blob, { headers: { 'Content-Type': blob.type || 'application/octet-stream' } })]);
  }
  const used = Object.entries(learningDownloads.get()).filter(([id]) => id !== course.id).reduce((sum, [, row]) => sum + row.bytes, 0);
  if (used + bytes > settings.storageLimitMb * 1024 * 1024) throw new Error('Offline storage limit exceeded. Remove a download first.');
  for (const [url, response] of staged) await cache.put(url, response);
  const timestamp = new Date();
  learningDownloads.set(previous => ({ ...previous, [course.id]: {
    course: structuredClone(course), bytes, downloadedAt: timestamp.toISOString(),
    expiresAt: new Date(timestamp.getTime() + settings.expiryDays * 86400000).toISOString(),
  } }));
}
export async function removeLearningDownload(id: string) {
  const removed = learningDownloads.get()[id];
  const remaining = { ...learningDownloads.get() }; delete remaining[id];
  learningDownloads.set(remaining);
  const retained = new Set(Object.values(remaining).flatMap(row => row.course.modules.flatMap(m => m.content.map(c => c.url).filter(Boolean))));
  const cache = await caches.open(cacheName);
  for (const module of removed?.course.modules ?? []) for (const content of module.content) {
    if (content.url && !retained.has(content.url)) await cache.delete(new URL(content.url, window.location.origin).href);
  }
}
export async function learningMediaUrl(url: string, offline: boolean) {
  const parsed = new URL(url, window.location.origin);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported content address');
  const permitted=Object.values(learningDownloads.get()).some(row=>cachedCourseAvailable(row)&&row.course.modules.some(m=>m.content.some(c=>c.url&&new URL(c.url,window.location.origin).href===parsed.href)));
  const response = permitted ? await (await caches.open(cacheName)).match(parsed.href) : undefined;
  if (response) return URL.createObjectURL(await response.blob());
  if (offline) throw new Error('Download this course before viewing this file offline');
  return parsed.href;
}
export function verifyLearningProgress(enrollmentId: string) {
  const row = lmsStore.getSnapshot().enrollments.find(e => e.id === enrollmentId);
  const saved = JSON.parse(localStorage.getItem('rostered.lms.v1') ?? '{}');
  if (!row || !saved.enrollments?.some((e: {id: string; updatedAt: string}) => e.id === row.id && e.updatedAt === row.updatedAt)) throw new Error('Learning progress has not been saved in this browser');
  return row.progress;
}