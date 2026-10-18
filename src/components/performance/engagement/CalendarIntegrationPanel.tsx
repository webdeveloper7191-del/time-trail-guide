import React, { useState } from 'react';
import { Box, Stack, Typography, TextField, Switch, FormControlLabel } from '@mui/material';
import { Button } from '@/components/mui/Button';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Calendar, Download, Plus, Trash2 } from 'lucide-react';
import { useBrowserState } from '@/lib/browserState';
import { downloadCalendar, type LocalCalendarEvent } from '@/lib/calendarDownload';
import { performanceLocalState } from '@/lib/api/performanceApi';
import { mockStaff } from '@/data/mockStaffData';
import { toast } from 'sonner';

export function CalendarIntegrationPanel({ embedded=false }: {embedded?:boolean}) {
  const [events,setEvents]=useBrowserState<LocalCalendarEvent[]>('rostered.engagement.calendar.v1',[]);
  const [reminders,setReminders]=useBrowserState('rostered.engagement.calendar.reminders.v1',true);
  const [open,setOpen]=useState(false);
  const [title,setTitle]=useState(''); const [attendee,setAttendee]=useState(''); const [startsAt,setStartsAt]=useState(''); const [duration,setDuration]=useState(30); const [meetingLink,setMeetingLink]=useState('');
  const conversations=performanceLocalState.conversations().filter(c=>c.status==='scheduled').map(c=>({id:c.id,title:c.title,startsAt:c.scheduledDate,duration:c.duration,attendee:mockStaff.find(s=>s.id===c.staffId)?.firstName??'Staff member'})).filter(c=>!isNaN(new Date(c.startsAt).getTime()));
  const all=[...events,...conversations.filter(c=>!events.some(e=>e.id===c.id))].sort((a,b)=>a.startsAt.localeCompare(b.startsAt));
  const save=()=>{if(!title.trim()||!attendee.trim()||!startsAt||!Number.isFinite(duration)||duration<1)return; if(meetingLink && !/^https:\/\//i.test(meetingLink)){toast.error('Enter an HTTPS meeting link');return;} setEvents([...events,{id:crypto.randomUUID(),title:title.trim(),attendee:attendee.trim(),startsAt:new Date(startsAt).toISOString(),duration,meetingLink}]);setOpen(false);setTitle('');setAttendee('');setStartsAt('');setMeetingLink('');toast.success('Meeting saved');};
  return <Box sx={{display:'flex',flexDirection:'column',gap:3}}>
    <Stack direction="row" spacing={2} justifyContent="space-between" flexWrap="wrap" useFlexGap>
      {!embedded && <Typography variant="h6">Calendar meetings</Typography>}
      <Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<Download size={16}/>} disabled={!all.length} onClick={()=>downloadCalendar(all,reminders)}>Download calendar</Button><Button startIcon={<Plus size={16}/>} onClick={()=>setOpen(true)}>Add meeting</Button></Stack>
    </Stack>
    <Typography variant="body2" color="text.secondary">Local calendar files · Google Calendar, Outlook and Apple Calendar · No connected accounts</Typography>
    <FormControlLabel control={<Switch checked={reminders} onChange={e=>setReminders(e.target.checked)}/>} label="Include one-hour calendar reminder"/>
    {!all.length && <Typography color="text.secondary">No meetings scheduled</Typography>}
    {all.map(e=><Stack key={e.id} direction={{xs:'column',sm:'row'}} justifyContent="space-between" spacing={2} sx={{borderBottom:1,borderColor:'divider',pb:2}}><Box><Typography fontWeight={600}>{e.title}</Typography><Typography variant="body2" color="text.secondary">{e.attendee} · {new Date(e.startsAt).toLocaleString('en-AU',{dateStyle:'medium',timeStyle:'short',hour12:true})} · {e.duration} min</Typography></Box><Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<Download size={16}/>} onClick={()=>downloadCalendar([e],reminders)}>Download invite</Button>{events.some(x=>x.id===e.id)&&<Button variant="text" aria-label="Delete meeting" onClick={()=>setEvents(events.filter(x=>x.id!==e.id))}><Trash2 size={16}/></Button>}</Stack></Stack>)}
    <PrimaryOffCanvas open={open} onClose={()=>setOpen(false)} title="Schedule meeting" icon={Calendar} footer={<Button disabled={!title.trim()||!attendee.trim()||!startsAt||duration<1} onClick={save}>Save meeting</Button>}>
      <Stack spacing={3}><TextField label="Meeting title" value={title} onChange={e=>setTitle(e.target.value)}/><TextField label="Attendee" value={attendee} onChange={e=>setAttendee(e.target.value)}/><TextField label="Date and time" type="datetime-local" InputLabelProps={{shrink:true}} value={startsAt} onChange={e=>setStartsAt(e.target.value)}/><TextField label="Duration (minutes)" type="number" inputProps={{min:1}} value={duration} onChange={e=>setDuration(Number(e.target.value))}/><TextField label="Meeting link (optional)" value={meetingLink} onChange={e=>setMeetingLink(e.target.value)}/></Stack>
    </PrimaryOffCanvas>
  </Box>;
}
export default CalendarIntegrationPanel;
