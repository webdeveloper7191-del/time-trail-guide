import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  RemoveFormatting,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

interface ToolbarButton {
  icon: React.ElementType;
  command: string;
  value?: string;
  title: string;
}

const formatButtons: ToolbarButton[] = [
  { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
  { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
  { icon: Underline, command: 'underline', title: 'Underline (Ctrl+U)' },
  { icon: Strikethrough, command: 'strikeThrough', title: 'Strikethrough' },
];

const headingButtons: ToolbarButton[] = [
  { icon: Heading1, command: 'formatBlock', value: 'h1', title: 'Heading 1' },
  { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
  { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
  { icon: Type, command: 'formatBlock', value: 'p', title: 'Paragraph' },
];

const listButtons: ToolbarButton[] = [
  { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
  { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
  { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
  { icon: Code, command: 'formatBlock', value: 'pre', title: 'Code Block' },
];

const alignButtons: ToolbarButton[] = [
  { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
  { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
  { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight = '200px',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Trigger onChange after command
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            execCommand('redo');
          } else {
            execCommand('undo');
          }
          break;
        case 'y':
          e.preventDefault();
          execCommand('redo');
          break;
      }
    }
  }, [execCommand]);

  const insertLink = () => {
    if (linkUrl) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const selectedText = selection.toString();
        if (selectedText || linkText) {
          execCommand('insertHTML', `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText || selectedText || linkUrl}</a>`);
        } else {
          execCommand('createLink', linkUrl);
        }
      }
      setLinkUrl('');
      setLinkText('');
      setShowLinkPopover(false);
    }
  };

  const removeFormatting = () => {
    execCommand('removeFormat');
    execCommand('formatBlock', 'p');
  };

  const ToolbarButtonComponent = ({ btn }: { btn: ToolbarButton }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => execCommand(btn.command, btn.value)}
      title={btn.title}
    >
      <btn.icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('undo')}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => execCommand('redo')}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        {headingButtons.map((btn) => (
          <ToolbarButtonComponent key={btn.command + btn.value} btn={btn} />
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Format */}
        {formatButtons.map((btn) => (
          <ToolbarButtonComponent key={btn.command} btn={btn} />
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists & Blocks */}
        {listButtons.map((btn) => (
          <ToolbarButtonComponent key={btn.command + btn.value} btn={btn} />
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        {alignButtons.map((btn) => (
          <ToolbarButtonComponent key={btn.command} btn={btn} />
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="link-text" className="text-xs">Link Text (optional)</Label>
                <Input
                  id="link-text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Display text"
                  className="h-8"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="link-url" className="text-xs">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="h-8"
                />
              </div>
              <Button size="sm" onClick={insertLink} className="w-full">
                Insert Link
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Remove Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={removeFormatting}
          title="Remove Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          "p-4 outline-none overflow-auto prose prose-sm max-w-none",
          "prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-p:my-2 prose-ul:my-2 prose-ol:my-2",
          "prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground/30 prose-blockquote:pl-4 prose-blockquote:italic",
          "prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded",
          "prose-a:text-primary prose-a:underline",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground",
          "dark:prose-invert"
        )}
        style={{ minHeight }}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: value }}
        suppressContentEditableWarning
      />
    </div>
  );
}
