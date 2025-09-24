import { NextRequest, NextResponse } from 'next/server';
import { ApiErrorHandler } from '@/lib/error-handler';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variables
function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

// Gemini-based translation service
class GeminiTranslationService {
  private static languageNames: Record<string, string> = {
    en: 'English',
    ar: 'Arabic',
    fr: 'French'
  };

  static async translateText(
    text: string,
    targetLang: 'ar' | 'fr',
    apiKey: string
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const targetLanguageName = this.languageNames[targetLang];
    
    const prompt = `Translate the following fitness/training program text to ${targetLanguageName}. 
Keep fitness terminology accurate and maintain the professional tone. 
Only return the translation, nothing else.

Text to translate: "${text}"`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini translation error:', error);
      throw new Error('Translation failed');
    }
  }
}

interface TranslationRequest {
  text: string;
  targetLang: 'ar' | 'fr';
}

export async function POST(request: NextRequest) {
  const context = ApiErrorHandler.createContext(request);

  try {
    // Parse request body
    const body: TranslationRequest = await request.json();
    const { text, targetLang } = body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and must be non-empty' },
        { status: 400 }
      );
    }

    if (!targetLang || !['ar', 'fr'].includes(targetLang)) {
      return NextResponse.json(
        { error: 'Target language must be "ar" or "fr"' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Translation service not configured' },
        { status: 503 }
      );
    }

    // Perform translation
    const translatedText = await GeminiTranslationService.translateText(
      text.trim(),
      targetLang,
      apiKey
    );

    return NextResponse.json({
      translatedText,
      originalText: text,
      targetLang,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return ApiErrorHandler.handleError(error, context);
  }
}

// Health check endpoint
export async function GET() {
  try {
    const apiKey = getGeminiApiKey();
    const isConfigured = !!apiKey;
    
    return NextResponse.json({
      status: 'ok',
      service: 'Gemini Translation API',
      configured: isConfigured,
      supportedLanguages: ['ar', 'fr'],
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Translation service unavailable',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}