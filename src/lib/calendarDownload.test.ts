import { describe,it,expect } from 'vitest';
import {calendarFile} from './calendarDownload';
describe('Local calendar export',()=>{
  it('exports the selected start, duration and reminder',()=>{
    const text=calendarFile([{id:'meeting-1',title:'Career discussion',startsAt:'2026-10-19T10:00:00Z',duration:30,attendee:'Alex'}],true);
    expect(text).toContain('DTSTART:20261019T100000Z');expect(text).toContain('DTEND:20261019T103000Z');expect(text).toContain('TRIGGER:-PT1H');
  });
  it('escapes line breaks so titles cannot inject events',()=>{
    const text=calendarFile([{id:'1',title:'Title\nEND:VEVENT',startsAt:'2026-10-19T10:00:00Z',duration:30,attendee:'Alex'}],false);
    expect(text).toContain('SUMMARY:Title\\nEND:VEVENT');expect(text.match(/\r\nEND:VEVENT/g)?.length).toBe(1);
  });
});