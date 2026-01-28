import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Image as ImageIcon,
  Upload,
  Eye,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  showPreviewToggle?: boolean;
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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight = '200px',
  className,
  showPreviewToggle = true,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showImagePopover, setShowImagePopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
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

  const insertImageFromUrl = () => {
    if (imageUrl) {
      const imgHtml = `<img src="${imageUrl}" alt="${imageAlt || 'Image'}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;" />`;
      execCommand('insertHTML', imgHtml);
      setImageUrl('');
      setImageAlt('');
      setShowImagePopover(false);
      toast.success('Image inserted');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imgHtml = `<img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;" />`;
      execCommand('insertHTML', imgHtml);
      toast.success('Image inserted');
    } catch (error) {
      toast.error('Failed to upload image');
    }

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    setShowImagePopover(false);
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

  const proseStyles = cn(
    "prose prose-sm max-w-none",
    "prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold",
    "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
    "prose-p:my-2 prose-ul:my-2 prose-ol:my-2",
    "prose-blockquote:border-l-4 prose-blockquote:border-muted-foreground/30 prose-blockquote:pl-4 prose-blockquote:italic",
    "prose-pre:bg-muted prose-pre:p-3 prose-pre:rounded",
    "prose-a:text-primary prose-a:underline",
    "prose-img:rounded-lg prose-img:shadow-sm",
    "dark:prose-invert"
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        {mode === 'edit' ? (
          <div className="flex flex-wrap items-center gap-0.5">
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

            {/* Image */}
            <Popover open={showImagePopover} onOpenChange={setShowImagePopover}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Insert Image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Upload Image</Label>
                    <div
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload (max 5MB)
                      </p>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-2 text-xs text-muted-foreground">
                      or
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Image URL</Label>
                    <div className="space-y-2">
                      <Input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="h-8"
                      />
                      <Input
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                        placeholder="Alt text (optional)"
                        className="h-8"
                      />
                      <Button size="sm" onClick={insertImageFromUrl} className="w-full" disabled={!imageUrl}>
                        Insert from URL
                      </Button>
                    </div>
                  </div>
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
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Eye className="h-3 w-3" />
              Preview Mode
            </Badge>
            <span className="text-xs text-muted-foreground">
              See how learners will view this content
            </span>
          </div>
        )}

        {/* Mode Toggle */}
        {showPreviewToggle && (
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'edit' | 'preview')} className="ml-auto">
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs gap-1 h-7 px-3">
                <Pencil className="h-3 w-3" /> Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs gap-1 h-7 px-3">
                <Eye className="h-3 w-3" /> Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Content Area */}
      {mode === 'edit' ? (
        <div
          ref={editorRef}
          contentEditable
          className={cn(
            "p-4 outline-none overflow-auto",
            proseStyles,
            "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground"
          )}
          style={{ minHeight }}
          data-placeholder={placeholder}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          dangerouslySetInnerHTML={{ __html: value }}
          suppressContentEditableWarning
        />
      ) : (
        <div 
          className={cn("p-6 overflow-auto bg-card", proseStyles)}
          style={{ minHeight }}
        >
          {value ? (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Eye className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No content to preview</p>
              <p className="text-xs">Switch to Edit mode to add content</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
