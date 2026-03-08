/**
 * JSON Extractor - Parse JSON from AI responses
 * 
 * Handles mixed prose + JSON responses from AI models
 * Provides fallback extraction for when AI includes explanatory text
 * Uses JSON5 to handle JavaScript object notation (unquoted/single-quoted properties)
 */

import JSON5 from 'json5';

/**
 * Extract JSON from AI response
 * Handles both pure JSON and prose + JSON mixed responses
 * Falls back to JSON5 for JavaScript object notation (unquoted properties, single quotes, etc.)
 * 
 * @param aiResponse - Raw response from AI (may include prose)
 * @returns Parsed JSON object
 * @throws Error if no valid JSON found
 */
export function extractJSON<T = any>(aiResponse: string): T {
  // Try direct parse first (fast path - strict JSON)
  try {
    return JSON.parse(aiResponse);
  } catch {
    // JSON not at root level, try extraction
  }

  // Step 1: Remove markdown code blocks if present
  let cleanedResponse = aiResponse;
  
  // Remove ```json ... ``` or ``` ... ``` wrapping
  const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleanedResponse = codeBlockMatch[1].trim();
    // Try parsing the extracted code block content directly
    try {
      return JSON.parse(cleanedResponse);
    } catch {
      // Continue to other extraction methods
    }
  }

  // Step 2: Find first complete JSON object (handles text after closing brace)
  // Look for { ... } with balanced braces
  const firstBraceIndex = cleanedResponse.indexOf('{');
  if (firstBraceIndex !== -1) {
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    let jsonEndIndex = -1;

    for (let i = firstBraceIndex; i < cleanedResponse.length; i++) {
      const char = cleanedResponse[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEndIndex = i;
            break;
          }
        }
      }
    }

    if (jsonEndIndex !== -1) {
      const jsonText = cleanedResponse.substring(firstBraceIndex, jsonEndIndex + 1);
      
      try {
        // Try strict JSON first
        return JSON.parse(jsonText);
      } catch (parseError1) {
        // Fall back to JSON5 (handles JavaScript object notation)
        try {
          console.log('[extractJSON] Standard JSON parse failed, trying JSON5...');
          return JSON5.parse(jsonText);
        } catch (parseError2) {
          // Log the actual JSON that failed for debugging
          console.error('[extractJSON] Failed JSON:', jsonText.substring(0, 500));
          throw new Error(
            `Found JSON-like content but failed to parse: ${parseError2 instanceof Error ? parseError2.message : 'Unknown error'}`
          );
        }
      }
    }
  }

  // Fallback: Legacy greedy regex extraction (kept for compatibility)
  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  
  if (jsonMatch) {
    const jsonText = jsonMatch[0];
    
    try {
      // Try strict JSON first
      return JSON.parse(jsonText);
    } catch (parseError1) {
      // Fall back to JSON5 (handles JavaScript object notation)
      try {
        console.log('[extractJSON] Standard JSON parse failed, trying JSON5...');
        return JSON5.parse(jsonText);
      } catch (parseError2) {
        // Log the actual JSON that failed for debugging
        console.error('[extractJSON] Failed JSON:', jsonText.substring(0, 500));
        throw new Error(
          `Found JSON-like content but failed to parse: ${parseError2 instanceof Error ? parseError2.message : 'Unknown error'}`
        );
      }
    }
  }

  // No JSON found at all
  throw new Error(
    'No valid JSON found in AI response. Response may be pure prose without JSON structure.'
  );
}

/**
 * Validate that extracted JSON has expected structure
 * 
 * @param json - Extracted JSON to validate
 * @param requiredFields - Array of required field names
 * @returns true if valid, false otherwise
 */
export function validateJSONStructure(
  json: any,
  requiredFields: string[]
): boolean {
  if (typeof json !== 'object' || json === null) {
    return false;
  }

  return requiredFields.every(field => field in json);
}

/**
 * Extract and validate Stage 2 plan JSON
 * Ensures the response has the expected structure
 */
export function extractStage2Plan(aiResponse: string): {
  understanding: string;
  widgets: any[];
  layout: any;
} {
  const json = extractJSON(aiResponse);

  // Validate required fields
  if (!validateJSONStructure(json, ['widgets', 'layout'])) {
    throw new Error(
      'Invalid Stage 2 plan structure. Expected fields: widgets, layout'
    );
  }

  if (!Array.isArray(json.widgets)) {
    throw new Error('Stage 2 plan widgets field must be an array');
  }

  return json;
}

/**
 * Extract and validate Stage 4 validation JSON
 * Ensures the response has the expected validation structure
 */
export function extractStage4Validation(aiResponse: string): {
  satisfied: boolean;
  score: number;
  issues: Array<{
    severity: 'critical' | 'warning' | 'minor';
    message: string;
    fix?: string;
  }>;
} {
  const json = extractJSON(aiResponse);

  // Validate required fields
  if (!validateJSONStructure(json, ['satisfied', 'score', 'issues'])) {
    throw new Error(
      'Invalid Stage 4 validation structure. Expected fields: satisfied, score, issues'
    );
  }

  if (typeof json.satisfied !== 'boolean') {
    throw new Error('Stage 4 validation satisfied field must be boolean');
  }

  if (typeof json.score !== 'number' || json.score < 0 || json.score > 100) {
    throw new Error('Stage 4 validation score must be a number between 0-100');
  }

  if (!Array.isArray(json.issues)) {
    throw new Error('Stage 4 validation issues field must be an array');
  }

  return json;
}
