import React, { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

interface SelectWithCreateProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  onCreateNew?: (label: string) => void;
  placeholder?: string;
  createLabel?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function SelectWithCreate({
  value,
  onValueChange,
  options,
  onCreateNew,
  placeholder = 'Select option',
  createLabel = 'Create new',
  disabled = false,
  className,
  error = false,
}: SelectWithCreateProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [localOptions, setLocalOptions] = useState<SelectOption[]>(options);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreate = () => {
    if (newValue.trim()) {
      const newOption: SelectOption = {
        value: newValue.trim().toLowerCase().replace(/\s+/g, '_'),
        label: newValue.trim(),
      };
      
      // Add to local options
      setLocalOptions(prev => [...prev, newOption]);
      
      // Select the new value
      onValueChange(newOption.value);
      
      // Callback for parent
      onCreateNew?.(newValue.trim());
      
      // Reset
      setNewValue('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewValue('');
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn(error && 'border-destructive', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {localOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.color && (
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: option.color }} 
                />
              )}
              {option.icon}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
        
        {onCreateNew && (
          <>
            <Separator className="my-1" />
            {isCreating ? (
              <div className="p-2 space-y-2">
                <Input
                  ref={inputRef}
                  placeholder="Enter name..."
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-sm"
                />
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="default"
                    className="h-7 flex-1"
                    onClick={handleCreate}
                    disabled={!newValue.trim()}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7"
                    onClick={() => {
                      setIsCreating(false);
                      setNewValue('');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCreating(true);
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-primary hover:bg-muted rounded-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                {createLabel}
              </button>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
