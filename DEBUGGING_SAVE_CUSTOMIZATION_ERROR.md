# Debugging Guide - Save Customization Error

## Issue
Getting 400 Bad Request error when saving customization, even without selecting exercises.

## Enhanced Error Logging

I've added comprehensive logging to help identify the exact cause:

### Backend Logging (Server Terminal)
The API now logs detailed information when validation fails:

```typescript
// What's being received
console.log('Received customization:', JSON.stringify(customization, null, 2));

// Structure validation errors
console.error('Invalid structure ID:', customization.structureId);
console.error('Valid structure IDs:', program.programStructures.map(s => s.id));

// Workout configuration validation errors
console.error('Invalid workout IDs:', invalidWorkoutIds);
console.error('Valid workout IDs:', validWorkoutIds);
console.error('Configured workout IDs:', configuredWorkoutIds);
```

### Frontend Logging (Browser Console)
The frontend now logs and displays actual error messages:

```typescript
// What's being sent
console.log('Saving customization:', customization);
console.log('Auto-saving customization:', config);

// API errors with details
console.error('API Error:', errorData);
console.error('Save customization error:', error);
console.error('Auto-save API error:', errorData);
```

## How to Debug

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try saving customization
4. Look for these logs:

**What you should see:**
```javascript
Saving customization: {
  structureId: "clxxx...",
  categoryType: "ESSENTIALIST",
  workoutConfiguration: {},  // Empty on first save
  weeklyScheduleMapping: {},
  workoutPattern: 1
}
```

**If error occurs:**
```javascript
API Error: {
  error: "Invalid structure",
  message: "The specified program structure does not exist."
}
```

### Step 2: Check Server Terminal
1. Look at terminal running `npm run dev`
2. Find these logs:

**What you should see:**
```
Received customization: {
  "structureId": "clxxx...",
  "categoryType": "ESSENTIALIST",
  "workoutConfiguration": {},
  "weeklyScheduleMapping": {},
  "workoutPattern": 1
}
```

**If structure validation fails:**
```
Invalid structure ID: clxxx...
Valid structure IDs: [ 'clyyy...', 'clzzz...' ]
```

**If workout validation fails:**
```
Invalid workout IDs: [ 'upper-body-X' ]
Valid workout IDs: [ 'upper-body', 'lower-body' ]
Configured workout IDs: [ 'upper-body-X' ]
```

## Common Issues and Solutions

### Issue 1: Invalid Structure ID
**Symptom**: "The specified program structure does not exist"

**Cause**: The `structureId` being sent doesn't match any structure in the database

**Debug Steps**:
1. Check browser console for `structureId` value
2. Check server logs for "Valid structure IDs"
3. Compare the values

**Solution**:
- If `structureId` is empty/null: Frontend state initialization issue
- If `structureId` doesn't match: Database sync issue or stale data

### Issue 2: Invalid Workout Template IDs
**Symptom**: "Invalid workout template IDs: [list of IDs]"

**Cause**: Workout IDs in configuration don't match actual workout templates

**Debug Steps**:
1. Check which IDs are invalid (server logs)
2. Check what valid IDs exist (server logs)
3. Look for pattern in invalid IDs

**Common Patterns**:
- `upper-body-X` instead of `upper-body-A/B/C` → Typo in pattern suffix
- Old IDs from previous program → Stale cached data
- Malformed IDs → Frontend ID generation bug

**Solution**:
- Clear browser cache/localStorage
- Refresh page to reload program data
- Check pattern-aware ID generation logic

### Issue 3: Empty Configuration Causes Error
**Symptom**: Error even without selecting exercises

**Cause**: Validation rejects empty objects or missing fields

**Solution**: Already fixed - validation now skips empty `workoutConfiguration`

```typescript
// Now handles empty configuration
if (configuredWorkoutIds.length > 0) {
  // Only validate if there are configured workouts
}
```

## Testing Checklist

### Test 1: Fresh State (No Customization)
1. Navigate to program guide
2. Go to Customize tab
3. Don't change anything
4. Click Save
5. **Expected**: Should save successfully with defaults

### Test 2: Structure Only
1. Select a different structure
2. Don't customize exercises
3. Wait for auto-save OR click Save
4. **Expected**: Should save successfully

### Test 3: Pattern Only
1. Select a different workout pattern (2 or 3)
2. Don't customize exercises
3. Click Save
4. **Expected**: Should save successfully

### Test 4: Full Customization
1. Select structure
2. Select pattern
3. Customize exercises for workouts
4. Click Save
5. **Expected**: Should save successfully

### Test 5: Refresh and Verify
1. After successful save
2. Refresh page (F5)
3. Go back to Customize tab
4. **Expected**: All selections should persist

## API Response Reference

### Success Response (200)
```json
{
  "success": true,
  "userProgram": {
    "id": "...",
    "userId": "...",
    "trainingProgramId": "...",
    "categoryType": "ESSENTIALIST",
    "configuration": {
      "structureId": "...",
      "workoutConfiguration": {},
      "weeklyScheduleMapping": {},
      "workoutPattern": 1,
      "customizedAt": "2025-10-03T..."
    }
  },
  "message": "Program customization saved successfully."
}
```

### Error Response (400)
```json
{
  "error": "Invalid structure",
  "message": "The specified program structure does not exist."
}
```

OR

```json
{
  "error": "Invalid workout configuration",
  "message": "Invalid workout template IDs: upper-body-X, lower-body-Y"
}
```

### Error Response (401)
```json
{
  "error": "Authentication required",
  "message": "Please log in to customize your program."
}
```

### Error Response (403)
```json
{
  "error": "Access denied",
  "message": "You must purchase this program to customize it."
}
```

### Error Response (404)
```json
{
  "error": "Program not found",
  "message": "The specified training program does not exist."
}
```

## Next Steps

1. **Run the app**: `npm run dev`
2. **Try saving**: Select a structure and save
3. **Check console**: Look for the logs mentioned above
4. **Copy error details**: Share the exact error message and logs

This will help identify exactly where the validation is failing!
