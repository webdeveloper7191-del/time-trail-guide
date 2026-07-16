import { useMemo, useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Mail } from 'lucide-react';
import { mockStaff } from '@/data/mockStaffData';
import { cn } from '@/lib/utils';

interface Props {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * CC recipients selector: type to search internal users by name/email,
 * or type any email address and press Enter/, to add it as a chip.
 */
export function CcRecipientsField({ values, onChange, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return mockStaff
      .filter(s => {
        const name = `${s.firstName} ${s.lastName}`.toLowerCase();
        return (name.includes(q) || (s.email || '').toLowerCase().includes(q)) && !values.includes(s.email);
      })
      .slice(0, 6);
  }, [query, values]);

  const add = (email: string) => {
    const v = email.trim();
    if (!v || !EMAIL_RE.test(v) || values.includes(v)) return;
    onChange([...values, v]);
    setQuery('');
  };

  const remove = (email: string) => onChange(values.filter(v => v !== email));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === 'Tab') && query.trim()) {
      e.preventDefault();
      add(query);
    } else if (e.key === 'Backspace' && !query && values.length) {
      remove(values[values.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className={cn(
        'flex flex-wrap items-center gap-1.5 min-h-9 rounded-md border bg-background px-2 py-1.5 text-sm',
        focused && 'ring-2 ring-ring ring-offset-0'
      )}>
        {values.map(v => (
          <Badge key={v} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 text-xs">
            <Mail className="h-3 w-3" />
            {v}
            <button type="button" onClick={() => remove(v)} className="hover:bg-muted rounded p-0.5">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => { setTimeout(() => setFocused(false), 150); if (query.trim()) add(query); }}
          placeholder={values.length ? '' : (placeholder || 'Search user or type email, press Enter')}
          className="flex-1 min-w-[140px] h-6 border-0 shadow-none focus-visible:ring-0 px-1 py-0"
        />
      </div>

      {focused && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          {suggestions.map(s => (
            <button
              key={s.id}
              type="button"
              onMouseDown={e => { e.preventDefault(); add(s.email); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
            >
              <span>
                <span className="font-medium">{s.firstName} {s.lastName}</span>
                <span className="text-muted-foreground ml-2 text-xs">{s.position}</span>
              </span>
              <span className="text-xs text-muted-foreground">{s.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
