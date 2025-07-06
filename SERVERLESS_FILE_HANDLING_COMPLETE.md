# Serverless File Handling Implementation

This document describes the implementation of serverless file handling using Supabase Storage for the Hypertrophy AI knowledge base system.

## Overview

The new serverless file handling system replaces the previous in-memory file processing approach with a scalable, robust solution that uses Supabase Storage for file persistence and signed URLs for secure direct uploads.

## Architecture

### Previous Flow (In-Memory)
```
Client → Upload API → Process in Memory → Database
```

### New Flow (Serverless with Storage)
```
Client → Request Upload URL → Upload to Storage → Process from Storage → Database
```

## Components

### 1. Upload Start API (`/api/knowledge/upload/start`)

**Purpose**: Generates signed upload URLs for direct client-to-storage uploads.

**Endpoint**: `POST /api/knowledge/upload/start`

**Request Body**:
```json
{
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf"
}
```

**Response**:
```json
{
  "uploadUrl": "https://supabase-storage-url...",
  "token": "signed-token",
  "filePath": "knowledge/user-id/timestamp_document.pdf",
  "expiresIn": 3600
}
```

**Features**:
- File validation (size, type)
- Unique file path generation
- 1-hour URL expiration
- User authentication

### 2. Upload Processing API (`/api/knowledge/upload`)

**Purpose**: Processes uploaded files from Supabase Storage.

**Endpoint**: `POST /api/knowledge/upload`

**Request Body**:
```json
{
  "filePath": "knowledge/user-id/timestamp_document.pdf",
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf"
}
```

**Response**:
```json
{
  "message": "Successfully processed document.pdf",
  "knowledgeItem": {
    "id": "knowledge-item-id",
    "title": "document.pdf",
    "status": "READY",
    "processingResult": {
      "chunksCreated": 15,
      "embeddingsGenerated": 15,
      "processingTime": 2500,
      "warnings": []
    }
  }
}
```

**Process**:
1. Downloads file from Supabase Storage
2. Creates knowledge item with PROCESSING status
3. Extracts text and generates embeddings
4. Updates status to READY or ERROR

### 3. Download API (`/api/knowledge/[id]/download`)

**Purpose**: Downloads files from Supabase Storage.

**Endpoint**: `GET /api/knowledge/{id}/download`

**Features**:
- User authentication and authorization
- Direct streaming from Supabase Storage
- Proper content headers
- Error handling

### 4. Frontend Upload Flow

**Location**: `src/app/admin/knowledge/page.tsx`

**New Process**:
1. For each selected file:
   - Request signed upload URL
   - Upload directly to Supabase Storage
   - Request processing from storage
   - Show progress and results

**Benefits**:
- Individual file processing
- Better error handling per file
- Progress tracking
- Parallel uploads (future enhancement)

## File Storage Structure

Files are stored in Supabase Storage with the following structure:
```
bucket: files
└── knowledge/
    └── {user-id}/
        └── {timestamp}_{sanitized-filename}
```

**Example**: `knowledge/user-123/1704067200000_my_document.pdf`

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase Storage Setup

1. **Create Storage Bucket**:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('files', 'files', false);
   ```

2. **Set RLS Policies**:
   ```sql
   -- Allow users to upload their own files
   CREATE POLICY "Users can upload own files" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'files' AND 
     auth.uid()::text = (storage.foldername(name))[2]
   );

   -- Allow users to read their own files
   CREATE POLICY "Users can read own files" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'files' AND 
     auth.uid()::text = (storage.foldername(name))[2]
   );

   -- Allow users to delete their own files
   CREATE POLICY "Users can delete own files" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'files' AND 
     auth.uid()::text = (storage.foldername(name))[2]
   );
   ```

## Benefits

### Scalability
- **No memory limits**: Files stored in Supabase Storage, not server memory
- **Concurrent processing**: Multiple files can be processed simultaneously
- **Horizontal scaling**: API routes are stateless

### Reliability
- **Persistent storage**: Files remain available after processing
- **Error recovery**: Failed processing can be retried
- **Backup**: Supabase provides built-in backup

### Performance
- **Direct uploads**: Files uploaded directly to storage, reducing server load
- **Streaming downloads**: Files streamed directly from storage
- **CDN benefits**: Supabase Storage includes CDN capabilities

### Security
- **Signed URLs**: Temporary, secure upload URLs
- **Row Level Security**: User isolation at storage level
- **Authentication**: All operations require user authentication

## Error Handling

### Upload Start Errors
- File size validation
- File type validation
- Authentication errors
- Storage quota limits

### Upload Processing Errors
- File download failures
- Text extraction failures
- Embedding generation failures
- Database transaction failures

### Download Errors
- File not found
- User authorization
- Storage access errors

## Monitoring and Logging

All operations include comprehensive logging:
- Upload URL generation
- File uploads to storage
- Processing progress
- Error details
- Performance metrics

## Testing

Use the provided test script:
```bash
# Set your session cookie
export TEST_COOKIE="your-session-cookie"

# Run the test
node test-serverless-file-handling.js
```

The test covers:
- Signed URL generation
- Direct storage upload
- File processing
- Download functionality
- Error scenarios

## Migration from Previous System

### Database Changes
- `filePath` field now stores Supabase Storage path
- No changes to existing data structure
- Backward compatibility maintained

### API Changes
- Upload API now requires individual file processing
- New `/start` endpoint for signed URLs
- Download API updated for storage access

### Frontend Changes
- File upload flow redesigned
- Better progress indication
- Individual file error handling

## Future Enhancements

### Parallel Processing
- Process multiple files simultaneously
- Queue management for large uploads
- Progress aggregation

### File Management
- File versioning
- Bulk operations
- Storage optimization

### Advanced Features
- Image thumbnails
- File previews
- Metadata extraction

## Troubleshooting

### Common Issues

1. **Upload URL Generation Fails**
   - Check Supabase configuration
   - Verify storage bucket exists
   - Check RLS policies

2. **Direct Upload Fails**
   - Verify signed URL hasn't expired
   - Check file size limits
   - Validate CORS settings

3. **Processing Fails**
   - Check file accessibility in storage
   - Verify text extraction capabilities
   - Check embedding service availability

4. **Download Fails**
   - Verify file exists in storage
   - Check user permissions
   - Validate file path format

### Debug Steps

1. **Check Server Logs**: Look for detailed error messages
2. **Verify Storage**: Check Supabase Storage dashboard
3. **Test Authentication**: Ensure user is properly authenticated
4. **Validate File Path**: Check file path format and existence

## Security Considerations

### File Upload Security
- File type validation
- File size limits
- Content scanning (future)
- User quotas

### Storage Security
- Row Level Security policies
- Signed URL expiration
- User isolation
- Access logging

### Data Protection
- Encryption at rest
- Secure transmission
- User data isolation
- Compliance features

This implementation provides a robust, scalable foundation for file handling in the Hypertrophy AI knowledge base system.
