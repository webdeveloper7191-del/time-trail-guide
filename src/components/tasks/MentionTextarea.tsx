import React, { useMemo, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { mockStaff } from '@/data/mockStaffData';
import { CURRENT_USER_NAME } from '@/lib/taskBoardStore';
import { cn } from '@/lib/utils';

/** Everyone who can be @mentioned in a comment thread. */
export function useMentionableNames(): string[] {
  return useMemo(
    () => [CURRENT_USER_NAME, ...mockStaff.map(s => `${s.firstName} ${s.lastName}`)],
    [],
  );
}

/** Names referenced with @ in the body, resolved against the mentionable list. */
export function extractMentions(text: string, names: string[]): string[] {
  const found = names.filter(n => new RegExp(`@${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
  return Array.from(new Set(found));
}

/** Highlight @mentions when rendering a posted comment. */
export const MentionText: React.FC<{ text: string; names: string[] }> = ({ text, names }) => {
  const sorted = [...names].sort((a, b) => b.length - a.length);
  const pattern = sorted.length
    ? new RegExp(`(@(?:${sorted.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`, 'gi')
    : null;
  if (!pattern) return <>{text}</>;
  return (
    <>
      {text.split(pattern).map((part, i) =>
        part.startsWith('@') && sorted.some(n => `@${n}`.toLowerCase() === part.toLowerCase()) ? (
          <span key={i} className="rounded bg-primary/10 px-1 font-medium text-primary">{part}</span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
};

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  /** Render a single-line input instead of a textarea (used for quick replies). */
  singleLine?: boolean;
  className?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  'aria-label'?: string;
}

/**
 * Comment composer with @mention autocomplete. Typing `@` opens a name picker
 * filtered on the partial word under the caret.
 */
export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value, onChange, placeholder, rows = 3, singleLine, className, onSubmit, autoFocus,
  'aria-label': ariaLabel,
}) => {
  const names = useMentionableNames();
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return names.filter(n => n.toLowerCase().includes(q)).slice(0, 6);
  }, [query, names]);

  const syncQuery = (text: string, caret: number) => {
    const before = text.slice(0, caret);
    const match = before.match(/@([\w' -]{0,30})$/);
    setQuery(match ? match[1] : null);
    setHighlight(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    onChange(e.target.value);
    syncQuery(e.target.value, e.target.selectionStart ?? e.target.value.length);
  };

  const applyMention = (name: string) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@([\w' -]{0,30})$/, `@${name} `);
    const next = before + value.slice(caret);
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(before.length, before.length);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (query !== null && suggestions.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => (h + 1) % suggestions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => (h - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applyMention(suggestions[highlight]); return; }
      if (e.key === 'Escape') { setQuery(null); return; }
    }
    if (onSubmit && e.key === 'Enter' && (singleLine ? !e.shiftKey : e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  const shared = {
    ref,
    value,
    placeholder,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur: () => window.setTimeout(() => setQuery(null), 120),
    autoFocus,
    'aria-label': ariaLabel,
  } as const;

  return (
    <div className={cn('relative', className)}>
      {singleLine
        ? <Input {...shared} className="h-8 text-xs" />
        : <Textarea {...shared} rows={rows} />}

      {query !== null && suggestions.length > 0 && (
        <div className="absolute bottom-full z-50 mb-1 w-64 overflow-hidden rounded-md border bg-popover shadow-md">
          {suggestions.map((name, i) => (
            <button
              key={name}
              type="button"
              onMouseDown={e => { e.preventDefault(); applyMention(name); }}
              className={cn(
                'block w-full px-3 py-1.5 text-left text-xs',
                i === highlight ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
              )}
            >
              @{name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
