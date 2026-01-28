import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Link as LinkIcon,
  X,
  FileVideo,
  FileText,
  FileImage,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UploadedAsset {
  name: string;
  type: string;
  size: number;
  url: string; // base64 data URL or object URL
  thumbnailUrl?: string;
}

interface ContentUploaderProps {
  contentType: string;
  currentUrl?: string;
  onAssetChange: (url: string | undefined, file?: File) => void;
  onUploadStatusChange?: (status: 'pending' | 'uploading' | 'complete' | 'error', progress?: number) => void;
}

const ACCEPTED_TYPES: Record<string, string> = {
  video: 'video/*,.mp4,.webm,.mov,.avi',
  document: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf',
  image: 'image/*,.jpg,.jpeg,.png,.gif,.webp,.svg',
  scorm: '.zip',
  interactive: '.html,.htm,.zip',
  external_link: '',
  quiz: '',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit for client-side

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('image/')) return FileImage;
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
  return File;
};

export function ContentUploader({
  contentType,
  currentUrl,
  onAssetChange,
  onUploadStatusChange,
}: ContentUploaderProps) {
  const [inputMode, setInputMode] = useState<'upload' | 'url'>(currentUrl?.startsWith('http') ? 'url' : 'upload');
  const [urlInput, setUrlInput] = useState(currentUrl?.startsWith('http') ? currentUrl : '');
  const [uploadedAsset, setUploadedAsset] = useState<UploadedAsset | null>(
    currentUrl && !currentUrl.startsWith('http') ? { name: 'Uploaded file', type: '', size: 0, url: currentUrl } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ACCEPTED_TYPES[contentType] || '*';

  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    onUploadStatusChange?.('uploading', 0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = Math.min(prev + Math.random() * 30, 90);
          onUploadStatusChange?.('uploading', next);
          return next;
        });
      }, 200);

      // Convert file to base64 for smaller files, or use object URL for larger ones
      let assetUrl: string;
      
      if (file.size < 5 * 1024 * 1024) {
        // For files under 5MB, use base64
        assetUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        // For larger files, use object URL (session-only)
        assetUrl = URL.createObjectURL(file);
      }

      // Generate thumbnail for videos and images
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        thumbnailUrl = assetUrl;
      } else if (file.type.startsWith('video/')) {
        thumbnailUrl = await generateVideoThumbnail(file);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      onUploadStatusChange?.('complete', 100);

      const asset: UploadedAsset = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: assetUrl,
        thumbnailUrl,
      };

      setUploadedAsset(asset);
      onAssetChange(assetUrl, file);
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error('Upload failed:', error);
      onUploadStatusChange?.('error');
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
    }
  }, [onAssetChange, onUploadStatusChange]);

  const generateVideoThumbnail = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadeddata = () => {
        video.currentTime = 1; // Seek to 1 second
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(undefined);
        }
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve(undefined);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onAssetChange(urlInput.trim());
      toast.success('URL linked successfully');
    }
  };

  const handleRemoveAsset = () => {
    if (uploadedAsset?.url.startsWith('blob:')) {
      URL.revokeObjectURL(uploadedAsset.url);
    }
    setUploadedAsset(null);
    setUrlInput('');
    onAssetChange(undefined);
  };

  // For quiz and external_link types, show simplified UI
  if (contentType === 'quiz') {
    return (
      <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
        Quiz content is configured in the Assessment section below.
      </div>
    );
  }

  if (contentType === 'external_link') {
    return (
      <div className="space-y-2">
        <Label className="text-xs">External URL</Label>
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/resource"
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleUrlSubmit}>
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'upload' | 'url')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="upload" className="text-xs gap-1">
            <Upload className="h-3 w-3" /> Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs gap-1">
            <LinkIcon className="h-3 w-3" /> URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-3 space-y-3">
          {uploadedAsset ? (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              {uploadedAsset.thumbnailUrl ? (
                <img 
                  src={uploadedAsset.thumbnailUrl} 
                  alt="Thumbnail" 
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
                  {React.createElement(getFileIcon(uploadedAsset.type), { className: 'h-6 w-6 text-muted-foreground' })}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadedAsset.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(uploadedAsset.size)}</span>
                  <Badge variant="outline" className="text-xs h-5">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Uploaded
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleRemoveAsset}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : isUploading ? (
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing file...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
            </div>
          ) : (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                Drop file here or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {formatFileSize(MAX_FILE_SIZE)} • {contentType === 'video' ? 'MP4, WebM, MOV' : 
                  contentType === 'document' ? 'PDF, DOC, PPT, XLS' : 
                  contentType === 'image' ? 'JPG, PNG, GIF, WebP' :
                  contentType === 'scorm' ? 'ZIP package' : 'Any file'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="mt-3 space-y-2">
          <Label className="text-xs">Resource URL</Label>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={`https://example.com/${contentType}.mp4`}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleUrlSubmit}>
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
          {urlInput && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              URL will be used as content source
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
