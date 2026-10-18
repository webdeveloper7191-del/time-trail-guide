export interface LocalCalendarEvent { id: string; title: string; startsAt: string; duration: number; attendee: string; meetingLink?: string }
const escape = (s: string) => s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
export function calendarFile(events: LocalCalendarEvent[], reminders: boolean) {
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//rostered.ai//Meetings//EN','CALSCALE:GREGORIAN',...events.flatMap(e=>{
    const start=new Date(e.startsAt);
    return ['BEGIN:VEVENT',`UID:${escape(e.id)}@rostered.ai`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(new Date(start.getTime()+e.duration*60000))}`,`SUMMARY:${escape(e.title)}`,`DESCRIPTION:${escape(`With ${e.attendee}${e.meetingLink?`\n${e.meetingLink}`:''}`)}`,...(reminders?['BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:-PT1H',`DESCRIPTION:${escape(e.title)}`,'END:VALARM']:[]),'END:VEVENT'];
  }),'END:VCALENDAR',''].join('\r\n');
}
export function downloadCalendar(events: LocalCalendarEvent[], reminders: boolean) {
  const url=URL.createObjectURL(new Blob([calendarFile(events,reminders)],{type:'text/calendar;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='rostered-meetings.ics';a.click();URL.revokeObjectURL(url);
}