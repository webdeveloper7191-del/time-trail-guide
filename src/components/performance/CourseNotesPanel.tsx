import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bookmark, 
  BookmarkCheck,
  StickyNote, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Clock,
  BookOpen,
  Search,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { CourseNote, ContentBookmark } from '@/types/lmsEngagement';
import { mockCourseNotes, mockContentBookmarks } from '@/data/mockLmsEngagementData';
import { mockCourses } from '@/data/mockLmsData';
import { toast } from 'sonner';

interface CourseNotesPanelProps {
  currentUserId: string;
}

export function CourseNotesPanel({ currentUserId }: CourseNotesPanelProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks'>('notes');
  const [notes, setNotes] = useState<CourseNote[]>(mockCourseNotes);
  const [bookmarks, setBookmarks] = useState<ContentBookmark[]>(mockContentBookmarks);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedNote, setEditedNote] = useState('');

  const userNotes = useMemo(() => 
    notes.filter(n => n.staffId === currentUserId && 
      (searchQuery === '' || n.note.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [notes, currentUserId, searchQuery]
  );

  const userBookmarks = useMemo(() => 
    bookmarks.filter(b => b.staffId === currentUserId &&
      (searchQuery === '' || (b.label?.toLowerCase().includes(searchQuery.toLowerCase()) || false))
    ),
    [bookmarks, currentUserId, searchQuery]
  );

  const getCourseTitle = (courseId: string) => 
    mockCourses.find(c => c.id === courseId)?.title || 'Unknown Course';

  const getModuleTitle = (courseId: string, moduleId: string) => {
    const course = mockCourses.find(c => c.id === courseId);
    return course?.modules.find(m => m.id === moduleId)?.title || 'Unknown Module';
  };

  const getContentTitle = (courseId: string, moduleId: string, contentId: string) => {
    const course = mockCourses.find(c => c.id === courseId);
    const module = course?.modules.find(m => m.id === moduleId);
    return module?.content.find(c => c.id === contentId)?.title || 'Unknown Content';
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditNote = (note: CourseNote) => {
    setEditingNoteId(note.id);
    setEditedNote(note.note);
  };

  const handleSaveNote = (noteId: string) => {
    setNotes(prev => prev.map(n => 
      n.id === noteId ? { ...n, note: editedNote, updatedAt: new Date().toISOString() } : n
    ));
    setEditingNoteId(null);
    setEditedNote('');
    toast.success('Note updated');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success('Note deleted');
  };

  const handleRemoveBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    toast.success('Bookmark removed');
  };

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
            activeTab === 'notes' ? "bg-background shadow-sm" : "hover:bg-background/50"
          )}
          onClick={() => setActiveTab('notes')}
        >
          <StickyNote className="h-4 w-4" />
          Notes ({userNotes.length})
        </button>
        <button
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
            activeTab === 'bookmarks' ? "bg-background shadow-sm" : "hover:bg-background/50"
          )}
          onClick={() => setActiveTab('bookmarks')}
        >
          <Bookmark className="h-4 w-4" />
          Bookmarks ({userBookmarks.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="space-y-3">
          {userNotes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No notes yet</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Take notes while learning to capture key insights
                </p>
              </CardContent>
            </Card>
          ) : (
            userNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getCourseTitle(note.courseId)}
                        </Badge>
                        {note.timestamp && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(note.timestamp)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getModuleTitle(note.courseId, note.moduleId)} → {getContentTitle(note.courseId, note.moduleId, note.contentId)}
                      </p>
                      
                      {editingNoteId === note.id ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={editedNote}
                            onChange={(e) => setEditedNote(e.target.value)}
                            rows={3}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveNote(note.id)}>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-relaxed">{note.note}</p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(parseISO(note.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    
                    {editingNoteId !== note.id && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditNote(note)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteNote(note.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Bookmarks Tab */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-3">
          {userBookmarks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No bookmarks yet</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Bookmark lessons to quickly access them later
                </p>
              </CardContent>
            </Card>
          ) : (
            userBookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="hover:shadow-sm transition-shadow group cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                          {bookmark.label || getContentTitle(bookmark.courseId, bookmark.moduleId, bookmark.contentId)}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getCourseTitle(bookmark.courseId)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {getModuleTitle(bookmark.courseId, bookmark.moduleId)}
                          </Badge>
                          {bookmark.timestamp && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimestamp(bookmark.timestamp)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Saved {format(parseISO(bookmark.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBookmark(bookmark.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
