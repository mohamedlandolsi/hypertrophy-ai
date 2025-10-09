# Enhanced Information Extraction with LLM Function Calling

## Overview

This enhancement replaces the previous regex-based information extraction with a more robust LLM function calling approach. Instead of using brittle regex patterns to extract user information, the system now leverages the Gemini model's built-in function calling capabilities to intelligently extract and structure user data.

## Key Improvements

### 1. **Robust Natural Language Understanding**
- **Before**: Regex patterns like `/(?:my name is|i'm|i am|call me)\s+([a-z]+)/i`
- **After**: LLM understands context and intent naturally

### 2. **Complex Information Extraction**
- **Before**: Single-pattern matches for specific formats
- **After**: Handles multiple data points in complex, conversational messages

### 3. **Flexible Data Handling**
- **Before**: Fixed patterns for specific units/formats
- **After**: Intelligent parsing of various formats, units, and expressions

### 4. **Extensibility**
- **Before**: Adding new extraction required new regex patterns
- **After**: Simply update the function schema to add new fields

## Implementation Details

### Function Definition

The system defines a comprehensive `update_client_profile` function with parameters covering:

- **Personal Information**: Name, age, height, weight, body fat percentage
- **Training Information**: Experience level, training frequency, preferred styles
- **Goals & Motivation**: Primary goals, target metrics, motivation factors
- **Health & Limitations**: Injuries, limitations, medical considerations
- **Training Environment**: Gym access, available equipment, home setup
- **Progress Tracking**: Current lift numbers, measurements
- **Communication Preferences**: Language, interaction style

### Enhanced System Instructions

The AI is explicitly instructed to:
1. **Always call the function** when users provide personal information
2. **Extract comprehensively** from natural conversation
3. **Handle various formats** and units automatically
4. **Update incrementally** as new information is provided

### Error Handling & Fallback

The implementation includes robust error handling:
- **Primary**: LLM function calling for extraction
- **Fallback**: Legacy regex extraction if function calling fails
- **Graceful degradation**: System continues working even if extraction fails

## Usage Examples

### Complex Natural Language
```
Input: "Hi! I'm John, I'm 28 years old and weigh about 75 kilograms. I'm pretty new to lifting but I've been going to the gym for 3 times a week for the past month. My main goal is to build muscle mass."

Extracted:
- name: "John"
- age: 28
- weight: 75
- trainingExperience: "beginner"
- weeklyTrainingDays: 3
- primaryGoal: "muscle_gain"
```

### Mixed Units & Formats
```
Input: "I'm 5'10\" tall and trying to get from my current 165 lbs to maybe 180 lbs. I've got dumbbells at home up to 50 lbs each."

Extracted:
- height: 177.8 (converted from feet/inches)
- weight: 74.8 (converted from lbs)
- targetWeight: 81.6 (converted from lbs)
- homeGym: true
- equipmentAvailable: ["dumbbells"]
```

### Updates & Corrections
```
Input: "Actually, I need to correct something - I'm actually 29 now, just had my birthday! And my squat has improved - I can do 80kg now."

Extracted:
- age: 29 (updated)
- currentSquat: 80 (updated)
```

## Benefits Over Regex Approach

| Aspect | Regex Approach | LLM Function Calling |
|--------|---------------|---------------------|
| **Accuracy** | Pattern-dependent | Context-aware |
| **Flexibility** | Fixed formats only | Natural language |
| **Maintenance** | Manual pattern updates | Self-adapting |
| **Coverage** | Limited patterns | Comprehensive understanding |
| **User Experience** | Rigid input requirements | Natural conversation |
| **Multilingual** | Pattern per language | Native understanding |

## Testing

Run the test script to see the enhancement in action:

```bash
node test-enhanced-extraction.js
```

This demonstrates:
- Complex information extraction from natural language
- Handling of multiple data points in single messages
- Unit conversion and format normalization
- Comparison with legacy regex approach

## Integration

The enhancement is seamlessly integrated into the existing chat system:

1. **Chat API** (`/api/chat/route.ts`) remains unchanged
2. **Gemini Integration** (`/lib/gemini.ts`) now includes function calling
3. **Client Memory** (`/lib/client-memory.ts`) retains legacy extraction as fallback
4. **Database Schema** remains the same - only extraction method changed

## Configuration

The function calling is automatically enabled when:
- Gemini API key is configured
- Model supports function calling (gemini-2.0-flash-exp)
- User ID is provided for memory storage

If function calling fails, the system gracefully falls back to the regex approach, ensuring no loss of functionality.

## Future Enhancements

This foundation enables future improvements:
- **Multi-turn extraction** for complex information gathering
- **Validation functions** to verify extracted data
- **Conflict resolution** when users provide contradictory information
- **Smart updates** that understand context and intent
- **Proactive questioning** to fill information gaps

## Migration

Existing user data is preserved. The new extraction method:
- ✅ Works alongside existing data
- ✅ Provides fallback to regex extraction
- ✅ Maintains backward compatibility
- ✅ Requires no database changes
