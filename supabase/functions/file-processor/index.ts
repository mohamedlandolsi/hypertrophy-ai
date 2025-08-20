/// <reference path="../types.d.ts" />

// @ts-ignore - Deno runtime imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno runtime imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface FileProcessingRequest {
  filePath: string
  fileName: string
  mimeType: string
  userId: string
  knowledgeItemId: string
}

interface ProcessingResult {
  success: boolean
  chunksCreated: number
  embeddingsGenerated: number
  processingTime: number
  errors: string[]
}

interface ProcessRequest {
  knowledgeItemId: string
}

// Generate embeddings using Gemini API
async function generateEmbedding(text: string): Promise<number[]> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text }]
        }
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.embedding.values
}

// Extract text from different file types
async function extractTextFromFile(data: Uint8Array, mimeType: string): Promise<string> {
  try {
    if (mimeType.startsWith('text/')) {
      // Plain text files
      return new TextDecoder().decode(data)
    } else if (mimeType === 'application/pdf') {
      // For PDFs, we'll return the raw text for now
      // In production, you might want to use a PDF parsing library
      const text = new TextDecoder().decode(data)
      return text
    } else if (mimeType.includes('json')) {
      // JSON files
      const text = new TextDecoder().decode(data)
      const jsonData = JSON.parse(text)
      return JSON.stringify(jsonData, null, 2)
    } else {
      // Try to decode as text anyway
      return new TextDecoder().decode(data)
    }
  } catch (error) {
    console.error('Error extracting text from file:', error)
    throw new Error(`Failed to extract text from ${mimeType} file`)
  }
}

// Create chunks from text
function createChunks(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end).trim()
    
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    
    start = end - overlap
    if (start >= text.length) break
  }

  return chunks.filter(chunk => chunk.length > 50) // Filter out very short chunks
}

// Main processing function
async function processFileContents(
  requestData: FileProcessingRequest,
  supabase: any
): Promise<ProcessingResult> {
  const startTime = Date.now()
  const errors: string[] = []

  try {
    console.log(`📄 Processing file: ${requestData.fileName}`)

    // Download file from Supabase Storage
    console.log('⬇️ Downloading file from storage...')
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge_files')
      .download(requestData.filePath)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    if (!fileData) {
      throw new Error('File data is null')
    }

    // Convert blob to Uint8Array
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    console.log(`📊 File size: ${uint8Array.length} bytes`)

    // Extract text from file
    console.log('🔍 Extracting text...')
    const extractedText = await extractTextFromFile(uint8Array, requestData.mimeType)

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content extracted from file')
    }

    console.log(`📝 Extracted ${extractedText.length} characters`)

    // Create chunks
    console.log('✂️ Creating chunks...')
    const chunks = createChunks(extractedText, 500, 100)

    if (chunks.length === 0) {
      throw new Error('No valid chunks created from text')
    }

    console.log(`📦 Created ${chunks.length} chunks`)

    // Process chunks in batches and generate embeddings
    console.log('🔄 Generating embeddings for chunks...')
    let embeddingsGenerated = 0
    const batchSize = 5

    // Process chunks in batches
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`)

      // Generate embeddings for batch
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        try {
          // Generate embedding using Gemini API
          const embeddingArray = await generateEmbedding(chunk)

          // Save chunk to database
          const chunkIndex = i + batchIndex
          const { error: insertError } = await supabase
            .from('KnowledgeChunk')
            .insert({
              knowledgeItemId: requestData.knowledgeItemId,
              content: chunk,
              chunkIndex: chunkIndex,
              embeddingData: JSON.stringify(embeddingArray),
            })

          if (insertError) {
            console.error(`❌ Database error for chunk ${chunkIndex}:`, insertError)
            return false
          }

          console.log(`✅ Saved chunk ${chunkIndex + 1}/${chunks.length}`)
          return true
        } catch (error) {
          console.error(`❌ Error processing chunk ${i + batchIndex}:`, error)
          errors.push(`Chunk ${i + batchIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          return false
        }
      })

      const results = await Promise.all(batchPromises)
      embeddingsGenerated += results.filter(Boolean).length

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Update knowledge item status to COMPLETED
    const { error: updateError } = await supabase
      .from('KnowledgeItem')
      .update({
        status: 'COMPLETED',
        content: extractedText.substring(0, 10000), // Store first 10k chars as preview
      })
      .eq('id', requestData.knowledgeItemId)

    if (updateError) {
      console.error('❌ Error updating knowledge item:', updateError)
      errors.push(`Update error: ${updateError.message}`)
    }

    const processingTime = Date.now() - startTime

    console.log(`✅ Processing complete in ${processingTime}ms`)
    console.log(`📊 Summary: ${chunks.length} chunks created, ${embeddingsGenerated} embeddings generated`)

    return {
      success: true,
      chunksCreated: chunks.length,
      embeddingsGenerated,
      processingTime,
      errors
    }

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('❌ Processing failed:', errorMessage)
    
    // Update knowledge item status to ERROR
    try {
      await supabase
        .from('KnowledgeItem')
        .update({ status: 'ERROR' })
        .eq('id', requestData.knowledgeItemId)
    } catch (updateError) {
      console.error('❌ Error updating knowledge item status to ERROR:', updateError)
    }

    return {
      success: false,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      processingTime,
      errors: [errorMessage, ...errors]
    }
  }
}

// Main handler
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
    })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const requestBody = await req.json()
    console.log('📨 Received request:', requestBody)

    const { knowledgeItemId } = requestBody as ProcessRequest

    if (!knowledgeItemId) {
      return new Response(
        JSON.stringify({ error: 'knowledgeItemId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get knowledge item details
    const { data: knowledgeItem, error: fetchError } = await supabase
      .from('KnowledgeItem')
      .select('*')
      .eq('id', knowledgeItemId)
      .single()

    if (fetchError || !knowledgeItem) {
      return new Response(
        JSON.stringify({ error: 'Knowledge item not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update status to PROCESSING
    await supabase
      .from('KnowledgeItem')
      .update({ status: 'PROCESSING' })
      .eq('id', knowledgeItemId)

    // Prepare processing request
    const processingRequest: FileProcessingRequest = {
      filePath: knowledgeItem.filePath,
      fileName: knowledgeItem.title,
      mimeType: knowledgeItem.mimeType || 'text/plain',
      userId: knowledgeItem.userId,
      knowledgeItemId: knowledgeItem.id,
    }

    // Process the file
    const result = await processFileContents(processingRequest, supabase)

    // Return result
    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Handler error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        processingTime: 0,
        errors: [errorMessage]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
