'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  Upload, 
  FileText, 
  File, 
  X, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';

interface KnowledgeItem {
  id: string;
  title: string;
  type: 'file' | 'text';
  content?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'error';
}

export default function KnowledgePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'file' | 'text'>('all');

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    fetchUser();
    
    // Mock data for demonstration
    setKnowledgeItems([
      {
        id: '1',
        title: 'Nutrition Guidelines',
        type: 'file',
        fileName: 'nutrition-guide.pdf',
        fileSize: 2048576,
        uploadedAt: '2025-06-10T10:30:00Z',
        status: 'ready'
      },
      {
        id: '2',
        title: 'Workout Principles',
        type: 'text',
        content: 'Progressive overload is the key to muscle growth...',
        uploadedAt: '2025-06-09T15:20:00Z',
        status: 'ready'
      },
      {
        id: '3',
        title: 'Recovery Protocols',
        type: 'file',
        fileName: 'recovery-methods.docx',
        fileSize: 1024000,
        uploadedAt: '2025-06-08T09:15:00Z',
        status: 'processing'
      }
    ]);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    // TODO: Implement actual file upload logic
    setTimeout(() => {
      setIsUploading(false);
      setSelectedFiles([]);
    }, 2000);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim() || !textTitle.trim()) return;
    
    setIsUploading(true);
    // TODO: Implement actual text submission logic
    setTimeout(() => {
      setIsUploading(false);
      setTextInput('');
      setTextTitle('');
    }, 1000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background text-foreground">
      <div className="container max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Upload files or add text content to enhance your AI fitness coach&apos;s knowledge
          </p>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* File Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Upload PDFs, documents, or text files to add to the knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or
                </p>
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    Choose Files
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.md"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported: PDF, DOC, DOCX, TXT, MD (Max 10MB each)
                </p>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Files:</Label>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <File className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSelectedFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    onClick={handleFileUpload} 
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Text Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Add Text Content
              </CardTitle>
              <CardDescription>
                Directly input text content to add to the knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-title">Title</Label>
                <Input
                  id="text-title"
                  placeholder="Enter a title for this content..."
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text-content">Content</Label>
                <textarea
                  id="text-content"
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Enter your fitness knowledge, guidelines, protocols, or any relevant information..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleTextSubmit}
                disabled={isUploading || !textInput.trim() || !textTitle.trim()}
                className="w-full"
              >
                {isUploading ? 'Adding...' : 'Add to Knowledge Base'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Items Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Knowledge Items</CardTitle>
                <CardDescription>
                  Manage your uploaded content and text entries
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search knowledge items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter: {filterType === 'all' ? 'All' : filterType === 'file' ? 'Files' : 'Text'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType('all')}>
                    All Items
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('file')}>
                    Files Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('text')}>
                    Text Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Knowledge Items List */}
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || filterType !== 'all' 
                      ? 'No items match your search criteria' 
                      : 'No knowledge items yet. Start by uploading files or adding text content.'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {item.type === 'file' ? (
                          <File className="h-5 w-5 text-primary" />
                        ) : (
                          <FileText className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{item.title}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {item.type === 'file' && item.fileName && (
                            <span className="text-sm text-muted-foreground">
                              {item.fileName}
                            </span>
                          )}
                          {item.fileSize && (
                            <span className="text-sm text-muted-foreground">
                              {formatFileSize(item.fileSize)}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.uploadedAt).toLocaleDateString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'ready' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : item.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {item.type === 'file' && (
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>    </div>
  );
}
