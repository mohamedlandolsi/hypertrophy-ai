'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import KnowledgeProcessingMonitor from '@/components/knowledge-processing-monitor';
import { showToast } from '@/lib/toast';
import { KnowledgeLoading } from '@/components/ui/loading';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  Upload, 
  FileText, 
  File, 
  X, 
  Plus, 
  Search,  Filter,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  FileImage,
  FileSpreadsheet,
  RefreshCw,
  Edit,
  ExternalLink,
  Tags
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/ui/rich-text-editor';
import SafeHtmlRenderer from '@/components/ui/safe-html-renderer';
import CategoryManagement from '@/components/admin/category-management';
import ItemCategoryManager from '@/components/admin/item-category-manager';

// Helper function to check if HTML content is empty
const isHtmlContentEmpty = (html: string): boolean => {
  // Remove HTML tags and check if there's any meaningful content
  const textContent = html.replace(/<[^>]*>/g, '').trim();
  return textContent === '';
};

interface KnowledgeItem {
  id: string;
  title: string;
  type: 'FILE' | 'TEXT';
  content?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  status: 'PROCESSING' | 'READY' | 'ERROR';
  KnowledgeItemCategory?: {
    KnowledgeCategory: {
      id: string;
      name: string;
    };
  }[];
}

export default function KnowledgePage() {
  const tToasts = useTranslations('toasts');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'file' | 'text'>('all');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminAccessError, setAdminAccessError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const checkAdminAccess = useCallback(async () => {
    try {
      console.log('🔐 Checking admin access...');
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.log('❌ No authenticated user found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('👤 Authenticated user:', currentUser.id);
      setUser(currentUser);

      // Verify admin access using dedicated check-status endpoint
      console.log('🔍 Verifying admin access via /api/admin/check-status...');
      const response = await fetch('/api/admin/check-status');
      console.log('📡 Admin check response status:', response.status);
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          console.log('❌ Unauthorized, redirecting to login');
          router.push('/login');
          return;
        } else {
          console.log('❌ Admin access denied');
          const errorMessage = data.error || 'Access denied. Admin privileges required to access knowledge management.';
          setAdminAccessError(errorMessage);
          setIsLoading(false);
          return;
        }
      }
      
      const data = await response.json();
      
      if (!data.isAdmin) {
        console.log('❌ User is not admin');
        const errorMessage = data.error || 'Access denied. Admin privileges required to access knowledge management.';
        setAdminAccessError(errorMessage);
        setIsLoading(false);
        return;
      }

      console.log('✅ Admin access verified, fetching knowledge items...');
      // Admin access verified, fetch knowledge items
      await fetchKnowledgeItems();
    } catch (error) {
      console.error('💥 Admin access check failed:', error);
      setAdminAccessError('Access denied. Admin privileges required to access knowledge management.');
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAdminAccess();
  }, [checkAdminAccess]);
  const fetchKnowledgeItems = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching knowledge items...');
      const response = await fetch('/api/knowledge');
      console.log('📡 Knowledge API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Knowledge API response data:', data);
        console.log(`✅ Setting ${data.knowledgeItems?.length || 0} knowledge items`);
        setKnowledgeItems(data.knowledgeItems || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch knowledge items:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        setKnowledgeItems([]);
      }
    } catch (error) {
      console.error('💥 Error fetching knowledge items:', error);
      setKnowledgeItems([]);
    } finally {
      setIsLoading(false);
      console.log('🏁 Finished fetching knowledge items');
    }
  };

  // Optimized update handler that updates only the specific item
  const handleKnowledgeItemUpdate = useCallback((updatedItem: KnowledgeItem) => {
    setKnowledgeItems(prevItems => 
      prevItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    );
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
    
    const results = [];
    const errors = [];
    
    try {
      // Process each file individually
      for (const file of selectedFiles) {
        const uploadToast = showToast.uploadProgress(file.name);
        
        try {
          console.log(`🚀 Starting upload for: ${file.name}`);
          
          // Step 1: Request signed upload URL
          const startResponse = await fetch('/api/knowledge/upload/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
            }),
          });

          if (!startResponse.ok) {
            const errorData = await startResponse.json();
            throw new Error(errorData.error || 'Failed to get upload URL');
          }

          const { uploadUrl, filePath } = await startResponse.json();
          console.log(`✅ Upload URL obtained for: ${file.name}`);

          // Step 2: Upload file directly to Supabase Storage
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file to storage: ${uploadResponse.statusText}`);
          }

          console.log(`📤 File uploaded to storage: ${file.name}`);
          
          // Update toast to show processing state
          showToast.dismiss(uploadToast);
          const processingToast = showToast.processing(
            'Processing Document', 
            `Using Edge Function to process ${file.name}...`
          );

          // Step 3: Process the file using Edge Function
          const processResponse = await fetch('/api/knowledge/process-with-edge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filePath: filePath,
              fileName: file.name,
              mimeType: file.type,
            }),
          });

          showToast.dismiss(processingToast);

          if (processResponse.ok) {
            const data = await processResponse.json();
            console.log(`✅ File processed successfully with Edge Function: ${file.name}`, data);
            
            // Show enhanced success toast with Edge Function details
            if (data.result) {
              showToast.success(
                '🚀 Edge Function Processing Complete',
                `${file.name}: ${data.result.chunksCreated} chunks, ${data.result.embeddingsGenerated} embeddings in ${data.result.processingTime}ms`
              );
            } else {
              showToast.success('File Processed Successfully', `${file.name} has been processed using Edge Function`);
            }
            
            results.push(data.knowledgeItem || { fileName: file.name });
          } else {
            const errorData = await processResponse.json();
            console.error(`❌ Edge Function processing failed for ${file.name}:`, errorData.error);
            throw new Error(errorData.error || 'Edge Function processing failed');
          }
        } catch (fileError) {
          console.error(`❌ Error processing ${file.name}:`, fileError);
          showToast.dismiss(uploadToast);
          showToast.uploadError(file.name, (fileError as Error).message);
          errors.push({ fileName: file.name, error: (fileError as Error).message });
        }
      }

      // Refresh knowledge items if any files were processed successfully
      if (results.length > 0) {
        await fetchKnowledgeItems();
      }
      
      // Clear selected files
      setSelectedFiles([]);
      
      // Show summary with Edge Function details
      if (results.length > 0 && errors.length === 0) {
        showToast.success(
          '🎉 All Files Processed', 
          `Successfully processed ${results.length} file(s) using Supabase Edge Functions`
        );
      } else if (results.length > 0 && errors.length > 0) {
        showToast.warning(
          'Partial Success', 
          `Processed ${results.length} file(s), failed ${errors.length} file(s)`
        );
      }
      
    } catch (error) {
      console.error('❌ Upload process error:', error);
      showToast.networkError('process files with Edge Function');
    } finally {
      setIsUploading(false);
    }
  };
  const handleTextSubmit = async () => {
    if (isHtmlContentEmpty(textInput) || !textTitle.trim()) return;
    
    setIsUploading(true);
    const loadingToast = showToast.processing(tToasts('addingTextContentTitle'), tToasts('addingTextContentText'));
    
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: textTitle,
          content: textInput,
          type: 'TEXT'
        }),
      });

      showToast.dismiss(loadingToast);

      if (response.ok) {
        const data = await response.json();
        console.log('Text content added successfully:', data);
        
        showToast.success(tToasts('textContentAddedTitle'), tToasts('textContentAddedText', { title: textTitle }));
        
        // Refresh knowledge items
        await fetchKnowledgeItems();
        
        // Clear form
        setTextInput('');
        setTextTitle('');
      } else {
        const errorData = await response.json();
        console.error('Text submission failed:', errorData.error);
        showToast.error(tToasts('textContentAddErrorTitle'), errorData.error);
      }
    } catch (error) {
      console.error('Text submission error:', error);
      showToast.dismiss(loadingToast);
      showToast.networkError('add text content');
    } finally {
      setIsUploading(false);
    }
  };
  const handleDeleteKnowledgeItem = async (id: string) => {
    const item = knowledgeItems.find(item => item.id === id);
    if (!item) return;
    
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDeleteKnowledgeItem = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    const loadingToast = showToast.processing(tToasts('deletingKnowledgeItemTitle'), tToasts('deletingKnowledgeItemText'));

    try {
      const response = await fetch(`/api/knowledge/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      showToast.dismiss(loadingToast);

      if (response.ok) {
        showToast.success(tToasts('knowledgeItemDeletedTitle'), tToasts('knowledgeItemDeletedText'));
        // Refresh knowledge items
        await fetchKnowledgeItems();
        // Close modal and reset state
        setDeleteModalOpen(false);
        setItemToDelete(null);
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData.error);
        showToast.error(tToasts('knowledgeItemDeleteErrorTitle'), errorData.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast.dismiss(loadingToast);
      showToast.networkError('delete knowledge item');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteKnowledgeItem = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleViewKnowledgeItem = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const handleDownloadKnowledgeItem = async (item: KnowledgeItem) => {
    if (item.type !== 'FILE' || !item.fileName) {
      showToast.warning(tToasts('downloadNotAvailableTitle'), tToasts('downloadNotAvailableText'));
      return;
    }

    const loadingToast = showToast.processing(tToasts('downloadingFileTitle'), tToasts('downloadingFileText', { fileName: item.fileName }));

    try {
      const response = await fetch(`/api/knowledge/${item.id}/download`);
      
      showToast.dismiss(loadingToast);
      
      if (response.ok) {
        // Create a blob from the response
        const blob = await response.blob();
        
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary anchor element and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = item.fileName;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showToast.success(tToasts('downloadCompletedTitle'), tToasts('downloadCompletedText', { fileName: item.fileName }));
      } else {
        const errorData = await response.json();
        console.error('Download failed:', errorData.error);
        showToast.error(tToasts('downloadFailedTitle'), errorData.error);
      }
    } catch (error) {
      console.error('Download error:', error);
      showToast.dismiss(loadingToast);
      showToast.networkError('download file');
    }
  };

  const handleEditKnowledgeItem = (item: KnowledgeItem) => {
    if (item.type !== 'TEXT') {
      showToast.warning(tToasts('editNotAvailableTitle'), tToasts('editNotAvailableText'));
      return;
    }
    
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditContent(item.content || '');
    setEditModalOpen(true);
  };

  const handleUpdateKnowledgeItem = async () => {
    if (!selectedItem || isHtmlContentEmpty(editContent) || !editTitle.trim()) {
      showToast.warning(tToasts('validationErrorTitle'), tToasts('validationErrorText'));
      return;
    }

    setIsUpdating(true);
    const loadingToast = showToast.processing(tToasts('updatingContentTitle'), tToasts('updatingContentText'));

    try {
      const response = await fetch(`/api/knowledge/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent,
        }),
      });

      showToast.dismiss(loadingToast);

      if (response.ok) {
        await response.json();
        
        // Update the knowledge items list
        setKnowledgeItems(prev => 
          prev.map(item => 
            item.id === selectedItem.id 
              ? { ...item, title: editTitle.trim(), content: editContent }
              : item
          )
        );

        // Update selected item if view modal is open
        if (viewModalOpen && selectedItem) {
          setSelectedItem({ ...selectedItem, title: editTitle.trim(), content: editContent });
        }

        setEditModalOpen(false);
        setEditTitle('');
        setEditContent('');
        
        showToast.success(tToasts('contentUpdatedTitle'), tToasts('contentUpdatedText'));
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData.error);
        showToast.error(tToasts('contentUpdateErrorTitle'), errorData.error);
      }
    } catch (error) {
      console.error('Update error:', error);
      showToast.dismiss(loadingToast);
      showToast.networkError('update content');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditTitle('');
    setEditContent('');
    setSelectedItem(null);
  };

  const getFileTypeInfo = (mimeType?: string) => {
    if (!mimeType) return { type: 'Unknown', icon: File, color: 'text-muted-foreground' };
      switch (mimeType) {
      case 'application/pdf':
        return { type: 'PDF Document', icon: FileText, color: 'text-red-600' };
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return { type: 'Word Document', icon: FileText, color: 'text-blue-600' };
      case 'text/plain':
        return { type: 'Text File', icon: FileText, color: 'text-gray-600' };
      case 'text/markdown':
        return { type: 'Markdown File', icon: FileText, color: 'text-purple-600' };
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return { type: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-green-600' };
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image/webp':
        return { type: 'Image', icon: FileImage, color: 'text-orange-600' };
      default:
        return { type: 'Document', icon: File, color: 'text-muted-foreground' };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };  const filteredItems = knowledgeItems.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
                         item.title.toLowerCase().includes(searchLower) ||
                         (item.fileName && item.fileName.toLowerCase().includes(searchLower)) ||
                         (item.content && item.content.toLowerCase().includes(searchLower)) ||
                         (item.mimeType && getFileTypeInfo(item.mimeType).type.toLowerCase().includes(searchLower));
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'file' && item.type === 'FILE') ||
                         (filterType === 'text' && item.type === 'TEXT');
    return matchesSearch && matchesFilter;
  });

  if (!user || isLoading) {
    return (
      <AdminLayout>
        <KnowledgeLoading />
      </AdminLayout>
    );
  }

  if (adminAccessError) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-4">
              <X className="h-12 w-12 text-destructive mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Access Denied</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              {adminAccessError}
            </p>
            <Button 
              onClick={() => router.push('/admin')}
              variant="outline"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 min-h-0">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
            <p className="text-muted-foreground">
              Upload files or add text content to enhance your AI fitness coach&apos;s knowledge
            </p>
          </div>

        {/* Upload Section */}
        <div className="mb-8">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Add Text Content
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Categories
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
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
                          accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports: PDF, Word, Text, Markdown, Excel files
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported: PDF, DOC, DOCX, TXT, MD (Max 10MB each)
                    </p>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selected Files:</Label>
                      {isUploading && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-700">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="text-sm font-medium">Processing files with Supabase Edge Function...</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            Files are being uploaded, chunked, and embedded. This may take a few moments.
                          </p>
                        </div>
                      )}
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
                        {isUploading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Processing with Edge Function...
                          </div>
                        ) : (
                          `Upload ${selectedFiles.length} File(s)`
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text">
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
                    <RichTextEditor
                      content={textInput}
                      onChange={setTextInput}
                      placeholder="Enter your fitness knowledge, guidelines, protocols, or any relevant information..."
                      className="min-h-[250px]"
                    />
                  </div>
                  <Button 
                    onClick={handleTextSubmit}
                    disabled={isUploading || isHtmlContentEmpty(textInput) || !textTitle.trim()}
                    className="w-full"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Adding...
                      </div>
                    ) : (
                      'Add to Knowledge Base'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="categories">
              <CategoryManagement />
            </TabsContent>
          </Tabs>
        </div>

        {/* Processing Monitor */}
        <div className="mb-8">
          <KnowledgeProcessingMonitor />
        </div>

        {/* Knowledge Items Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">              <div>
                <CardTitle>Knowledge Items</CardTitle>
                <CardDescription>
                  Manage your uploaded content and text entries
                </CardDescription>
                {/* Status Summary */}
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">
                    Total: <span className="font-medium text-foreground">{knowledgeItems.length}</span>
                  </span>
                  <span className="text-green-600">
                    Ready: <span className="font-medium">{knowledgeItems.filter(item => item.status === 'READY').length}</span>
                  </span>
                  {knowledgeItems.filter(item => item.status === 'PROCESSING').length > 0 && (
                    <span className="text-yellow-600">
                      Processing: <span className="font-medium">{knowledgeItems.filter(item => item.status === 'PROCESSING').length}</span>
                    </span>
                  )}
                  {knowledgeItems.filter(item => item.status === 'ERROR').length > 0 && (
                    <span className="text-red-600">
                      Errors: <span className="font-medium">{knowledgeItems.filter(item => item.status === 'ERROR').length}</span>
                    </span>
                  )}
                </div>              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchKnowledgeItems}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              </div>
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
            </div>            {/* Knowledge Items List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-4" />
                  <p className="text-muted-foreground">Loading knowledge items...</p>
                </div>
              ) : filteredItems.length === 0 ? (
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
                    <div className="flex items-center space-x-4">                      <div className="p-2 rounded-lg bg-primary/10">
                        {item.type === 'FILE' ? (
                          <File className="h-5 w-5 text-primary" />
                        ) : (
                          <FileText className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Link 
                          href={`/knowledge/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1 group"
                        >
                          <h3 className="hover:underline">{item.title}</h3>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>                        <div className="flex items-center space-x-4 mt-1">
                          {item.type === 'FILE' && item.fileName && (
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
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'READY' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : item.status === 'PROCESSING'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {item.status.toLowerCase()}
                          </span>
                        </div>
                        {/* Categories Display */}
                        {item.KnowledgeItemCategory && item.KnowledgeItemCategory.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.KnowledgeItemCategory.map((kic) => (
                              <Badge key={kic.KnowledgeCategory.id} variant="outline" className="text-xs">
                                {kic.KnowledgeCategory.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ItemCategoryManager 
                        item={item} 
                        onUpdate={handleKnowledgeItemUpdate}
                      />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">                        <DropdownMenuItem onClick={() => handleViewKnowledgeItem(item)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {item.type === 'TEXT' && (
                          <DropdownMenuItem onClick={() => handleEditKnowledgeItem(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {item.type === 'FILE' && (
                          <DropdownMenuItem onClick={() => handleDownloadKnowledgeItem(item)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        )}                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteKnowledgeItem(item.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold mb-2 flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            💡 Tips for Better Knowledge Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="mb-2"><strong>Supported Files:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>PDF documents (text will be extracted)</li>
                <li>Word documents (.doc, .docx)</li>
                <li>Text files (.txt, .md)</li>
                <li>Excel spreadsheets</li>
              </ul>
            </div>
            <div>
              <p className="mb-2"><strong>Best Practices:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Use descriptive titles for better searchability</li>
                <li>Organize content by topic or category</li>
                <li>Check the status indicator after uploading</li>
                <li>Use the search function to find specific content</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] w-[95vw] overflow-auto">          <DialogHeader>            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.type === 'FILE' ? (
                (() => {
                  const fileInfo = getFileTypeInfo(selectedItem.mimeType);
                  const IconComponent = fileInfo.icon;
                  return <IconComponent className={`h-5 w-5 ${fileInfo.color}`} />;
                })()
              ) : (
                <FileText className="h-5 w-5 text-blue-600" />
              )}
              {selectedItem?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedItem?.type === 'FILE' ? (
                selectedItem.fileName && selectedItem.fileSize
                  ? `${getFileTypeInfo(selectedItem.mimeType).type} • ${selectedItem.fileName} • Size: ${formatFileSize(selectedItem.fileSize)} • Created: ${new Date(selectedItem.createdAt).toLocaleDateString()}`
                  : `${getFileTypeInfo(selectedItem.mimeType).type} • ${selectedItem.fileName || 'Unknown'} • Created: ${new Date(selectedItem.createdAt).toLocaleDateString()}`
              ) : (
                `Text content • Created: ${selectedItem && new Date(selectedItem.createdAt).toLocaleDateString()}`
              )}
            </DialogDescription>
          </DialogHeader>
            {selectedItem && (
            <div className="mt-4">
              {selectedItem.status === 'PROCESSING' ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Processing content...</div>
                </div>
              ) : selectedItem.status === 'ERROR' ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-destructive">Error processing content</div>
                </div>
              ) : selectedItem.type === 'FILE' && selectedItem.mimeType === 'application/pdf' ? (
                // PDF Viewer
                <div className="space-y-4">                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                    <FileText className="h-4 w-4 text-red-600" />
                    <span>PDF Document Viewer</span>
                    <div className="ml-auto flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/api/knowledge/${selectedItem.id}/download?inline=true`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Open in New Tab
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadKnowledgeItem(selectedItem)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                    {/* PDF Embed */}
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <iframe
                      src={`/api/knowledge/${selectedItem.id}/download?inline=true`}
                      className="w-full h-[70vh]"
                      title={`PDF: ${selectedItem.fileName}`}
                      style={{ border: 'none' }}
                    />
                  </div>
                    <div className="text-xs text-muted-foreground text-center">                    <p>💡 <strong>Tip:</strong> If the PDF doesn&apos;t display properly above, try opening it in a new tab or downloading it.</p>
                    <p>You can also zoom, scroll, and navigate through the PDF using your browser&apos;s built-in controls.</p>
                  </div>
                </div>
              ) : selectedItem.content ? (
                <div className="space-y-4">
                  {/* File type indicator */}
                  {selectedItem.type === 'FILE' && selectedItem.mimeType && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                      <File className="h-4 w-4" />
                      <span>Extracted content from {getFileTypeInfo(selectedItem.mimeType).type}</span>
                    </div>
                  )}
                    {/* Content display */}
                  <div className={`
                    whitespace-pre-wrap bg-muted/50 p-4 rounded-lg max-h-96 overflow-auto text-sm
                    ${selectedItem.mimeType === 'text/markdown' ? 'font-mono' : ''}
                  `}>                    {/* Special handling for different message types */}
                    {selectedItem.content.includes('[PDF file uploaded successfully. This PDF is displayed directly in the viewer') ? (
                      <div className="space-y-3">
                        <div className="text-green-600 flex items-center gap-2">
                          <span className="text-lg">✅</span>
                          <span className="font-medium">PDF Ready for Viewing</span>
                        </div>
                        <p className="text-muted-foreground">
                          This PDF has been uploaded successfully and is available for direct viewing.
                        </p>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-green-400">
                          <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                            📖 How to view this PDF:
                          </p>
                          <ul className="list-disc pl-4 text-sm text-green-700 dark:text-green-300 space-y-1">
                            <li>The PDF is displayed above using a built-in viewer</li>
                            <li>Use &quot;Open in New Tab&quot; for a larger view</li>
                            <li>Download the file to save it locally</li>
                            <li>Use browser zoom controls for better readability</li>
                          </ul>
                        </div>
                      </div>
                    ) : selectedItem.content.includes('[PDF uploaded successfully but no text content was found') ? (
                      <div className="space-y-3">
                        <div className="text-amber-600 flex items-center gap-2">
                          <span className="text-lg">📄</span>
                          <span className="font-medium">PDF Uploaded Successfully</span>
                        </div>
                        <p className="text-muted-foreground">
                          This PDF was uploaded successfully but appears to contain no extractable text content.
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border-l-4 border-amber-400">
                          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                            This could be because:
                          </p>
                          <ul className="list-disc pl-4 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                            <li>The PDF contains only images or scanned content</li>
                            <li>The PDF uses non-standard fonts or encoding</li>
                            <li>The content is primarily visual (charts, diagrams, etc.)</li>
                          </ul>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          💡 <strong>Tip:</strong> If this PDF contains important text, consider copying the text manually 
                          and adding it as a text entry to make it searchable by the AI.
                        </p>
                      </div>
                    ) : selectedItem.content.includes('[PDF file uploaded successfully but text extraction failed') ? (
                      <div className="space-y-3">
                        <div className="text-destructive flex items-center gap-2">
                          <span className="text-lg">⚠️</span>
                          <span className="font-medium">PDF Text Extraction Failed</span>
                        </div>
                        <p className="text-muted-foreground">
                          The PDF file was uploaded successfully but text extraction encountered an error.
                        </p>
                        <div className="bg-destructive/10 p-3 rounded border-l-4 border-destructive">
                          <p className="text-sm text-destructive font-medium mb-2">
                            Common reasons for extraction failure:
                          </p>
                          <ul className="list-disc pl-4 text-sm text-destructive/80 space-y-1">
                            <li>Image-based or scanned PDF</li>
                            <li>Password-protected or encrypted PDF</li>
                            <li>Corrupted PDF file</li>
                            <li>PDF parsing library issues</li>
                          </ul>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                            💡 Solutions:
                          </p>
                          <ul className="list-disc pl-4 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <li>Convert the PDF to a text file (.txt)</li>
                            <li>Copy and paste the text content manually</li>
                            <li>Use a different PDF with selectable text</li>
                            <li>Try re-uploading the file</li>
                          </ul>
                        </div>
                      </div>
                    ) : selectedItem.content.includes('[Unable to extract text from PDF') ? (
                      <div className="space-y-2">
                        <div className="text-destructive flex items-center gap-2">
                          <span className="text-lg">❌</span>
                          <span className="font-medium">PDF Processing Error</span>
                        </div>
                        <p className="text-muted-foreground">
                          There was an error processing this PDF file.
                        </p>
                        <div className="bg-destructive/10 p-3 rounded text-sm">
                          {selectedItem.content}
                        </div>
                      </div>
                    ) : selectedItem.content.includes('[Error extracting text from') ? (
                      <div className="space-y-2">
                        <div className="text-destructive flex items-center gap-2">
                          <span className="text-lg">⚠️</span>
                          <span className="font-medium">Content Extraction Error</span>
                        </div>
                        <p className="text-muted-foreground">
                          There was an error extracting text from this file. 
                          The file format might not be fully supported or the file might be corrupted.
                        </p>
                        <div className="bg-destructive/10 p-3 rounded text-sm">
                          {selectedItem.content}
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Regular content display */}
                        {selectedItem.mimeType === 'text/markdown' ? (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                              📝 Markdown content
                            </div>
                            <div className="font-mono text-sm">
                              {selectedItem.content}
                            </div>
                          </div>
                        ) : selectedItem.type === 'TEXT' ? (
                          // Rich text content from the editor
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                              📝 Rich text content
                            </div>
                            <SafeHtmlRenderer 
                              content={selectedItem.content} 
                              className="bg-muted/50 rounded-lg max-h-96 overflow-auto text-sm"
                            />
                          </div>
                        ) : (
                          // Regular file content
                          <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg max-h-96 overflow-auto text-sm">
                            {selectedItem.content}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Content statistics */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                    <span>Characters: {selectedItem.content.length.toLocaleString()}</span>
                    <span>Words: {selectedItem.content.split(/\s+/).filter(word => word.length > 0).length.toLocaleString()}</span>
                    <span>Lines: {selectedItem.content.split('\n').length.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">No content available</div>
                </div>
              )}
            </div>
          )}        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Knowledge Item
            </DialogTitle>
            <DialogDescription>
              Modify the title and content of this knowledge item. Changes will update the AI&apos;s knowledge base.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter a title for this content..."
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            
            {/* Content Editor */}
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
                placeholder="Enter your fitness knowledge, guidelines, protocols, or any relevant information..."
                className="min-h-[300px]"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateKnowledgeItem}
                disabled={isUpdating || isHtmlContentEmpty(editContent) || !editTitle.trim()}
              >
                {isUpdating ? 'Updating...' : 'Update Knowledge Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Knowledge Item
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this knowledge item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {itemToDelete && (
            <div className="space-y-4 mt-4">
              {/* Item Preview */}
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {itemToDelete.type === 'FILE' ? (
                      <File className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{itemToDelete.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {itemToDelete.type === 'FILE' ? (
                        itemToDelete.fileName
                      ) : (
                        'Text Content'
                      )} • {new Date(itemToDelete.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Warning Message */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-destructive text-lg">⚠️</span>
                  <div className="text-sm">
                    <p className="font-medium text-destructive mb-1">This action is permanent</p>
                    <ul className="text-destructive/80 text-xs space-y-1">
                      <li>• The knowledge item will be completely removed</li>
                      <li>• Associated embeddings and search data will be deleted</li>
                      <li>• This cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={cancelDeleteKnowledgeItem}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={confirmDeleteKnowledgeItem}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      </div>
    </AdminLayout>
  );
}
