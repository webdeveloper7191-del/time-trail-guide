import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ThumbnailUploaderProps {
  currentThumbnail?: string;
  onThumbnailChange: (url: string | undefined) => void;
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for thumbnails

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ThumbnailUploader({
  currentThumbnail,
  onThumbnailChange,
  aspectRatio = '16:9',
}: ThumbnailUploaderProps) {
  const [inputMode, setInputMode] = useState<'upload' | 'url'>(
    currentThumbnail?.startsWith('http') ? 'url' : 'upload'
  );
  const [urlInput, setUrlInput] = useState(currentThumbnail?.startsWith('http') ? currentThumbnail : '');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClass = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
  }[aspectRatio];

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Simulate slight delay for UX
      await new Promise(r => setTimeout(r, 300));

      onThumbnailChange(dataUrl);
      toast.success('Thumbnail uploaded');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to process image');
    } finally {
      setIsUploading(false);
    }
  }, [onThumbnailChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onThumbnailChange(urlInput.trim());
      toast.success('Thumbnail URL set');
    }
  };

  const handleRemove = () => {
    onThumbnailChange(undefined);
    setUrlInput('');
  };

  return (
    <div className="space-y-3">
      <Label>Course Thumbnail</Label>
      
      {currentThumbnail ? (
        <div className="relative group">
          <div className={cn("relative overflow-hidden rounded-lg border bg-muted", aspectRatioClass)}>
            <img
              src={currentThumbnail}
              alt="Course thumbnail"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Replace
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'upload' | 'url')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="upload" className="text-xs gap-1">
              <Upload className="h-3 w-3" /> Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs gap-1">
              <LinkIcon className="h-3 w-3" /> URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-3">
            {isUploading ? (
              <div className={cn("flex items-center justify-center border rounded-lg bg-muted/50", aspectRatioClass)}>
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Processing...</p>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors",
                  aspectRatioClass,
                  isDragging 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              >
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-center">
                  Drop image here or <span className="text-primary">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WebP • Max {formatFileSize(MAX_FILE_SIZE)}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="mt-3 space-y-2">
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/thumbnail.jpg"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleUrlSubmit}>
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: 1280×720 (16:9 aspect ratio)
            </p>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
