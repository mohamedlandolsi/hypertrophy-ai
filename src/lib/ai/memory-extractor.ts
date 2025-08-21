import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

interface ProfileExtraction {
  field: string;
  value: string;
  confidence: number;
  context: string;
}

interface MemoryItem {
  information: string;
  category: string;
  importance: number;
  context: string;
}

/**
 * Extract profile information from user message and AI response
 */
export async function extractProfileInformation(
  userMessage: string,
  aiResponse: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: string
): Promise<ProfileExtraction[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            extractions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  field: { type: SchemaType.STRING },
                  value: { type: SchemaType.STRING },
                  confidence: { type: SchemaType.NUMBER },
                  context: { type: SchemaType.STRING }
                },
                required: ["field", "value", "confidence", "context"]
              }
            }
          },
          required: ["extractions"]
        }
      }
    });

    const prompt = `
    Analyze the following conversation and extract any personal profile information that should be saved to the user's fitness profile.

    User Message: "${userMessage}"
    AI Response: "${aiResponse}"

    Extract information for these profile fields if mentioned:
    - name (user's name)
    - age (user's age in years)
    - gender (MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY)
    - height (in cm)
    - weight (in kg)
    - bodyFatPercentage (percentage)
    - trainingExperience (beginner, intermediate, advanced, or years)
    - weeklyTrainingDays (number of days per week)
    - preferredTrainingStyle (powerlifting, bodybuilding, general fitness, etc.)
    - primaryGoal (muscle gain, fat loss, strength, etc.)
    - secondaryGoals (array of additional goals)
    - targetWeight (goal weight in kg)
    - targetBodyFat (goal body fat percentage)
    - injuries (list of current or past injuries)
    - limitations (physical limitations or restrictions)
    - medications (medications that might affect training)
    - allergies (food or other allergies)
    - dietaryPreferences (vegetarian, vegan, etc.)
    - foodDislikes (foods the user dislikes)
    - supplementsUsed (supplements currently taking)
    - sleepHours (average hours of sleep per night)
    - equipmentAvailable (gym equipment available)
    - currentBench (current bench press max in kg)
    - currentSquat (current squat max in kg)
    - currentDeadlift (current deadlift max in kg)
    - currentOHP (current overhead press max in kg)

    Rules:
    - Only extract information that is explicitly mentioned or clearly implied
    - Confidence should be 0.7-1.0 for explicit mentions, 0.5-0.6 for implied information
    - Don't extract information from hypothetical scenarios or examples
    - Context should explain where in the conversation this information was found
    - For lists (injuries, limitations, etc.), extract individual items
    - Convert all measurements to metric (kg, cm)

    Return a JSON object with extractions array.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);
    return parsed.extractions || [];

  } catch (error) {
    console.error('❌ Error extracting profile information:', error);
    return [];
  }
}

/**
 * Extract important conversation memories
 */
export async function extractImportantMemory(
  userMessage: string,
  aiResponse: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId: string
): Promise<MemoryItem[]> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            memories: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  information: { type: SchemaType.STRING },
                  category: { type: SchemaType.STRING },
                  importance: { type: SchemaType.NUMBER },
                  context: { type: SchemaType.STRING }
                },
                required: ["information", "category", "importance", "context"]
              }
            }
          },
          required: ["memories"]
        }
      }
    });

    const prompt = `
    Analyze the following conversation and extract important information that should be remembered for future conversations.

    User Message: "${userMessage}"
    AI Response: "${aiResponse}"

    Extract important memories in these categories:
    - preferences (training preferences, food preferences, communication style)
    - achievements (PRs, milestones, progress made)
    - concerns (worries, fears, challenges mentioned)
    - goals (specific goals mentioned beyond basic profile)
    - context (important context about their situation)
    - feedback (their thoughts on programs, advice, or suggestions)
    - progress (updates on their training or results)
    - schedule (training schedule constraints or preferences)
    - equipment (specific equipment they have or want)
    - techniques (techniques they're working on or struggling with)

    Rules:
    - Only extract genuinely important information that would help in future coaching
    - Importance scale: 1-10 (10 being critical, 5 being moderately important, 1 being minor)
    - Don't extract generic fitness advice or common knowledge
    - Focus on user-specific information and preferences
    - Context should explain when/how this information was mentioned

    Return a JSON object with memories array.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);
    return parsed.memories || [];

  } catch (error) {
    console.error('❌ Error extracting memory information:', error);
    return [];
  }
}

/**
 * Save profile extractions to database
 */
export async function saveProfileExtractions(
  userId: string,
  extractions: ProfileExtraction[]
): Promise<void> {
  if (extractions.length === 0) return;

  try {
    // Get or create client memory
    let clientMemory = await prisma.clientMemory.findUnique({
      where: { userId }
    });

    if (!clientMemory) {
      clientMemory = await prisma.clientMemory.create({
        data: { userId }
      });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    
    for (const extraction of extractions) {
      if (extraction.confidence >= 0.5) { // Only save if confidence is reasonable
        const { field, value } = extraction;
        
        // Handle special cases for data types
        if (field === 'age' || field === 'weeklyTrainingDays' || field === 'sleepHours') {
          updateData[field] = parseInt(value);
        } else if (field === 'height' || field === 'weight' || field === 'bodyFatPercentage' || 
                   field === 'targetWeight' || field === 'targetBodyFat' ||
                   field === 'currentBench' || field === 'currentSquat' || 
                   field === 'currentDeadlift' || field === 'currentOHP') {
          updateData[field] = parseFloat(value);
        } else if (field.includes('goals') || field.includes('injuries') || 
                   field.includes('limitations') || field.includes('medications') ||
                   field.includes('allergies') || field.includes('dietaryPreferences') ||
                   field.includes('foodDislikes') || field.includes('supplementsUsed') ||
                   field.includes('equipmentAvailable')) {
          // Handle arrays - append to existing if present
          const currentValue = (clientMemory as Record<string, unknown>)[field] as string[];
          if (currentValue && Array.isArray(currentValue)) {
            updateData[field] = [...currentValue, value];
          } else {
            updateData[field] = [value];
          }
        } else {
          updateData[field] = value;
        }
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.clientMemory.update({
        where: { userId },
        data: updateData
      });

      console.log(`✅ Profile updated with ${Object.keys(updateData).length} new fields:`, Object.keys(updateData));
    }

  } catch (error) {
    console.error('❌ Error saving profile extractions:', error);
  }
}

/**
 * Save conversation memories to database
 */
export async function saveConversationMemories(
  userId: string,
  memories: MemoryItem[]
): Promise<void> {
  if (memories.length === 0) return;

  try {
    // Get or create client memory
    let clientMemory = await prisma.clientMemory.findUnique({
      where: { userId }
    });

    if (!clientMemory) {
      clientMemory = await prisma.clientMemory.create({
        data: { userId }
      });
    }

    // Get existing coaching notes
    const existingNotes = (clientMemory.coachingNotes as Record<string, unknown>) || {};
    const conversationMemories = (existingNotes.conversationMemories as MemoryItem[]) || [];

    // Add new memories
    const updatedMemories = [...conversationMemories, ...memories];

    // Keep only the most recent 50 memories to prevent bloat
    const recentMemories = updatedMemories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 50);

    // Update coaching notes
    const updatedNotes = {
      ...existingNotes,
      conversationMemories: recentMemories,
      lastMemoryUpdate: new Date().toISOString()
    };

    await prisma.clientMemory.update({
      where: { userId },
      data: {
        coachingNotes: updatedNotes as unknown as Prisma.InputJsonValue
      }
    });

    console.log(`✅ Saved ${memories.length} conversation memories`);

  } catch (error) {
    console.error('❌ Error saving conversation memories:', error);
  }
}

/**
 * Get complete user context including profile and memories
 */
export async function getCompleteUserContext(userId: string): Promise<{
  profile: Record<string, unknown>;
  memories: MemoryItem[];
}> {
  try {
    const clientMemory = await prisma.clientMemory.findUnique({
      where: { userId }
    });

    if (!clientMemory) {
      return { profile: {}, memories: [] };
    }

    const profile = {
      name: clientMemory.name,
      age: clientMemory.age,
      gender: clientMemory.gender,
      height: clientMemory.height,
      weight: clientMemory.weight,
      bodyFatPercentage: clientMemory.bodyFatPercentage,
      trainingExperience: clientMemory.trainingExperience,
      weeklyTrainingDays: clientMemory.weeklyTrainingDays,
      preferredTrainingStyle: clientMemory.preferredTrainingStyle,
      primaryGoal: clientMemory.primaryGoal,
      secondaryGoals: clientMemory.secondaryGoals,
      targetWeight: clientMemory.targetWeight,
      targetBodyFat: clientMemory.targetBodyFat,
      injuries: clientMemory.injuries,
      limitations: clientMemory.limitations,
      medications: clientMemory.medications,
      allergies: clientMemory.allergies,
      dietaryPreferences: clientMemory.dietaryPreferences,
      foodDislikes: clientMemory.foodDislikes,
      supplementsUsed: clientMemory.supplementsUsed,
      sleepHours: clientMemory.sleepHours,
      equipmentAvailable: clientMemory.equipmentAvailable,
      currentBench: clientMemory.currentBench,
      currentSquat: clientMemory.currentSquat,
      currentDeadlift: clientMemory.currentDeadlift,
      currentOHP: clientMemory.currentOHP,
    };

    const coachingNotes = (clientMemory.coachingNotes as Record<string, unknown>) || {};
    const memories = (coachingNotes.conversationMemories as MemoryItem[]) || [];

    return { profile, memories };

  } catch (error) {
    console.error('❌ Error getting complete user context:', error);
    return { profile: {}, memories: [] };
  }
}
