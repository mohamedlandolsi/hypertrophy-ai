# Supabase Edge Function for Knowledge Base Processing

## Overview

This Supabase Edge Function provides serverless document processing capabilities for your hypertrophy AI application. It processes uploaded files by:

1. Downloading files from Supabase Storage
2. Extracting text content from various file formats
3. Breaking documents into semantic chunks
4. Generating embeddings using transformers.js
5. Storing processed chunks in the database

## Architecture

```
Frontend Upload → Supabase Storage → Edge Function → Process & Embed → Database
```

## Features

- **Serverless Processing**: Runs on Supabase Edge Runtime (Deno)
- **Local Embeddings**: Uses transformers.js with all-MiniLM-L6-v2 model
- **File Format Support**: Text, PDF, JSON files
- **Semantic Chunking**: Intelligent text splitting with overlap
- **Batch Processing**: Efficient embedding generation in batches
- **Error Handling**: Graceful error handling with status updates

## Files Created

### 1. Edge Function (`supabase/functions/file-processor/index.ts`)
- Main Edge Function implementation
- Handles file download, processing, and embedding generation
- Uses transformers.js for local embedding generation
- Implements semantic chunking strategy

### 2. API Route (`src/app/api/knowledge/process-with-edge/route.ts`)
- API endpoint to trigger Edge Function processing
- Handles authentication and validation
- Provides status checking capabilities
- Updates knowledge item status

### 3. React Component (`src/components/knowledge/EdgeProcessingComponent.tsx`)
- UI component for triggering Edge Function processing
- Real-time progress tracking
- Status display and error handling
- Responsive design with progress indicators

### 4. Configuration (`supabase/config.toml`)
- Supabase project configuration
- Edge Functions settings
- Development environment setup

## Setup Instructions

### 1. Install Supabase CLI

```bash
# Using npm (if available)
npm install -g supabase

# Or using PowerShell (Windows)
iwr https://get.supabase.com | iex

# Or using winget
winget install Supabase.CLI
```

### 2. Initialize Supabase (if not already done)

```bash
# In your project root
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Deploy the Edge Function

```bash
# Deploy the file-processor function
supabase functions deploy file-processor

# Or deploy all functions
supabase functions deploy
```

### 4. Set Environment Variables

In your Supabase dashboard, set these environment variables for the Edge Function:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage

### Using the API Endpoint

```typescript
// Trigger Edge Function processing
const response = await fetch('/api/knowledge/process-with-edge', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filePath: 'path/to/file/in/storage',
    fileName: 'document.pdf',
    mimeType: 'application/pdf',
    knowledgeItemId: 'knowledge-item-uuid',
  }),
});

// Check processing status
const statusResponse = await fetch('/api/knowledge/process-with-edge?id=knowledge-item-uuid');
```

### Using the React Component

```tsx
import { EdgeProcessingComponent } from '@/components/knowledge/EdgeProcessingComponent';

function YourComponent() {
  return (
    <EdgeProcessingComponent
      knowledgeItemId="knowledge-item-uuid"
      fileName="document.pdf"
      filePath="path/to/file/in/storage"
      mimeType="application/pdf"
      onProcessingComplete={(result) => {
        console.log('Processing completed:', result);
      }}
    />
  );
}
```

## Integration with Existing System

### 1. Optional Processing Method

The Edge Function provides an alternative to your existing local processing:

- **Local Processing**: Uses your existing Node.js-based system
- **Edge Processing**: Uses the new Supabase Edge Function

### 2. Adding Edge Function Option to Upload Flow

You can modify your upload interface to offer both processing options:

```typescript
// In your upload component
const [processingMethod, setProcessingMethod] = useState<'local' | 'edge'>('local');

// Show Edge Function component conditionally
{processingMethod === 'edge' && (
  <EdgeProcessingComponent
    knowledgeItemId={knowledgeItem.id}
    fileName={fileName}
    filePath={filePath}
    mimeType={mimeType}
  />
)}
```

## Technical Details

### Embedding Model
- **Model**: all-MiniLM-L6-v2 (384 dimensions)
- **Library**: Hugging Face transformers.js
- **Pooling**: Mean pooling with normalization

### Chunking Strategy
- **Method**: Semantic sentence-based chunking
- **Max Size**: 512 characters per chunk
- **Overlap**: ~100 characters between chunks
- **Minimum Size**: 50 characters (filters out tiny chunks)

### File Format Support
- **Text Files**: Direct text extraction
- **PDF Files**: Basic text extraction (can be enhanced with proper PDF parser)
- **JSON Files**: Pretty-printed JSON content

## Testing

### 1. Run the Test Script

```bash
node test-edge-function.js
```

### 2. Manual Testing

1. Upload a file through your regular upload flow
2. Note the `knowledgeItemId`, `filePath`, and other details
3. Use the Edge Processing component to process the file
4. Check the database for created chunks and embeddings

### 3. Monitor Logs

```bash
# View Edge Function logs
supabase functions logs file-processor

# Or monitor in real-time
supabase functions logs file-processor --follow
```

## Advantages of Edge Function Processing

1. **Serverless**: No server maintenance required
2. **Scalable**: Automatically scales with demand
3. **Cost-Effective**: Pay only for processing time
4. **Isolated**: Each processing run is isolated
5. **Global**: Runs close to your users globally
6. **Local Embeddings**: No external API calls for embeddings

## Considerations

1. **Cold Starts**: First execution may be slower due to model loading
2. **Memory Limits**: Edge Functions have memory constraints
3. **Timeout Limits**: Long-running processes may timeout
4. **Model Size**: Larger embedding models may not fit in memory

## Future Enhancements

1. **Enhanced PDF Processing**: Use proper PDF parsing library
2. **More File Formats**: Support for Word docs, PowerPoint, etc.
3. **Larger Models**: Support for larger, more capable embedding models
4. **Preprocessing**: Text cleaning and normalization
5. **Metadata Extraction**: Extract document metadata and structure

## Troubleshooting

### Common Issues

1. **Function Not Found**: Ensure function is deployed correctly
2. **Authentication Errors**: Check service role key configuration
3. **Memory Errors**: Reduce batch size or chunk size
4. **Timeout Errors**: Process smaller files or optimize chunking

### Debug Steps

1. Check Edge Function logs in Supabase dashboard
2. Verify environment variables are set
3. Test with smaller files first
4. Monitor database for partial results

## Security Considerations

1. **Authentication**: API routes verify user authentication
2. **Authorization**: Users can only process their own files
3. **Validation**: Input validation for all parameters
4. **Error Handling**: Sensitive information not exposed in errors

This Edge Function implementation provides a robust, serverless alternative for document processing while maintaining the same quality of results as your existing system.
