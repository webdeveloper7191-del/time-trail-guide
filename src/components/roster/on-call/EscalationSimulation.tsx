import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  PhoneCall,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  Clock,
  Zap,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { mockEscalation } from './mockData';
import type { EscalationContact } from './types';

type SimStep = 
  | { type: 'trigger'; message: string }
  | { type: 'contacting'; contact: EscalationContact }
  | { type: 'waiting'; contact: EscalationContact; elapsed: number }
  | { type: 'no_response'; contact: EscalationContact }
  | { type: 'responded'; contact: EscalationContact }
  | { type: 'escalating'; from: EscalationContact; to: EscalationContact }
  | { type: 'resolved'; contact: EscalationContact }
  | { type: 'failed' };

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

export function EscalationSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<SimStep[]>([]);
  const [currentContactIdx, setCurrentContactIdx] = useState(-1);
  const [waitProgress, setWaitProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => () => cleanup(), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [steps]);

  const addStep = (step: SimStep) => setSteps(prev => [...prev, step]);

  const simulateEscalation = async () => {
    cleanup();
    setIsRunning(true);
    setSteps([]);
    setCurrentContactIdx(-1);
    setWaitProgress(0);

    // Step 1: Trigger
    await delay(500);
    const triggerStep: SimStep = { type: 'trigger', message: 'Callback triggered — Child illness reported by night staff' };
    setSteps([triggerStep]);
    
    toast('🔔 On-Call Callback Triggered', {
      description: 'Child illness reported by night staff',
      duration: 4000,
    });

    await delay(1500);

    // Simulate contacting each person in the chain
    for (let i = 0; i < mockEscalation.length; i++) {
      const contact = mockEscalation[i];
      setCurrentContactIdx(i);

      // Contacting
      addStep({ type: 'contacting', contact });
      toast(`📞 Contacting ${contact.staffName}...`, {
        description: `${contact.staffRole} — ${contact.phone}`,
        duration: 3000,
      });

      await delay(1000);

      // Waiting with progress
      const waitDuration = 2000; // Compressed time
      const willRespond = contact.isAvailable && i >= 1; // 2nd available person responds

      setWaitProgress(0);
      await new Promise<void>(resolve => {
        let elapsed = 0;
        const interval = 50;
        timerRef.current = setInterval(() => {
          elapsed += interval;
          setWaitProgress(Math.min((elapsed / waitDuration) * 100, 100));
          if (elapsed >= waitDuration) {
            if (timerRef.current) clearInterval(timerRef.current);
            resolve();
          }
        }, interval);
      });

      addStep({ type: 'waiting', contact, elapsed: contact.responseTimeMinutes });

      if (willRespond) {
        // Responded!
        addStep({ type: 'responded', contact });
        toast.success(`✅ ${contact.staffName} responded!`, {
          description: 'Callback accepted — proceeding to resolution',
          duration: 4000,
        });

        await delay(1500);
        addStep({ type: 'resolved', contact });
        toast.success('🎉 Callback Resolved', {
          description: `${contact.staffName} handled the situation successfully`,
          duration: 5000,
        });

        setIsRunning(false);
        return;
      }

      // No response
      if (!contact.isAvailable) {
        addStep({ type: 'no_response', contact });
        toast.warning(`⚠️ ${contact.staffName} unavailable`, {
          description: 'Marked as unavailable — skipping',
          duration: 3000,
        });
      } else {
        addStep({ type: 'no_response', contact });
        toast.warning(`⏱️ No response from ${contact.staffName}`, {
          description: `Waited ${contact.responseTimeMinutes} minutes — escalating`,
          duration: 3000,
        });
      }

      await delay(1000);

      // Escalating
      if (i < mockEscalation.length - 1) {
        addStep({ type: 'escalating', from: contact, to: mockEscalation[i + 1] });
        toast('⬆️ Escalating to next contact', {
          description: `${mockEscalation[i + 1].staffName} (${mockEscalation[i + 1].staffRole})`,
          duration: 3000,
        });
        await delay(1000);
      }
    }

    // All failed
    addStep({ type: 'failed' });
    toast.error('🚨 All escalation contacts exhausted', {
      description: 'Notifying Centre Manager and Area Manager via SMS and email',
      duration: 6000,
    });
    setIsRunning(false);
  };

  return (
    <Card className="border-dashed border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Escalation Simulation
            </CardTitle>
            <CardDescription className="mt-1">
              Test the escalation chain with a simulated callback event
            </CardDescription>
          </div>
          <Button
            onClick={simulateEscalation}
            disabled={isRunning}
            variant={isRunning ? 'outline' : 'default'}
            size="sm"
            className="gap-1.5"
          >
            {isRunning ? (
              <>
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                Running...
              </>
            ) : (
              <>
                <Bell className="h-3.5 w-3.5" />
                Trigger Callback
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Escalation chain overview */}
        <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-muted/50">
          {mockEscalation.map((c, i) => (
            <div key={c.staffId} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                currentContactIdx === i && isRunning
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 animate-pulse'
                  : currentContactIdx > i
                    ? steps.some(s => s.type === 'responded' && 'contact' in s && s.contact.staffId === c.staffId)
                      ? 'bg-green-500/10 text-green-700'
                      : 'bg-red-500/10 text-red-700 line-through'
                    : 'bg-muted text-muted-foreground'
              }`}>
                <span>#{c.order}</span>
                <span>{c.staffName.split(' ')[0]}</span>
              </div>
              {i < mockEscalation.length - 1 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Wait progress */}
        {isRunning && waitProgress > 0 && waitProgress < 100 && (
          <div className="mb-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Waiting for response...
              </span>
              <span>{Math.round(waitProgress)}%</span>
            </div>
            <Progress value={waitProgress} className="h-1.5" />
          </div>
        )}

        {/* Event log */}
        <div ref={scrollRef} className="max-h-64 overflow-y-auto space-y-2">
          {steps.map((step, i) => (
            <SimStepRow key={i} step={step} />
          ))}
          {steps.length === 0 && !isRunning && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Click "Trigger Callback" to simulate the escalation chain
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SimStepRow({ step }: { step: SimStep }) {
  switch (step.type) {
    case 'trigger':
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-amber-800">{step.message}</span>
        </div>
      );
    case 'contacting':
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-200/50">
          <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span className="text-sm text-blue-800">Contacting <strong>{step.contact.staffName}</strong> ({step.contact.staffRole})</span>
        </div>
      );
    case 'waiting':
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Waited {step.elapsed} min for {step.contact.staffName}</span>
        </div>
      );
    case 'no_response':
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-200/50">
          <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
          <span className="text-sm text-red-700">
            {step.contact.isAvailable ? 'No response' : 'Unavailable'} — <strong>{step.contact.staffName}</strong>
          </span>
        </div>
      );
    case 'responded':
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-sm font-medium text-green-800"><strong>{step.contact.staffName}</strong> responded and accepted</span>
        </div>
      );
    case 'escalating':
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/5 border border-orange-200/50">
          <ArrowUpDown className="h-3.5 w-3.5 text-orange-600 shrink-0" />
          <span className="text-sm text-orange-700">Escalating from {step.from.staffName} → <strong>{step.to.staffName}</strong></span>
        </div>
      );
    case 'resolved':
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-300">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <span className="text-sm font-semibold text-green-800">Callback Resolved</span>
            <p className="text-xs text-green-700">{step.contact.staffName} handled the situation</p>
          </div>
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-300">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <span className="text-sm font-semibold text-red-800">Escalation Failed</span>
            <p className="text-xs text-red-700">All contacts exhausted — notifying management</p>
          </div>
        </div>
      );
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
