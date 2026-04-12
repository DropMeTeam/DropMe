import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function analyzeReviewText(text) {
  const input = String(text || "").trim();

  if (!input) {
    return {
      flagged: false,
      profanityLevel: "none",
      confidence: 1,
      reason: "Empty review",
      sanitizedText: "",
      suggestedStatus: "approved",
      strikeRecommended: false,
    };
  }

  const prompt = `
You are a strict review moderation classifier for a ride-sharing app.

Classify the review for:
- profanity
- harassment
- hate
- threats
- bullying

Return ONLY valid JSON with this exact shape:
{
  "flagged": true,
  "profanityLevel": "none|mild|moderate|severe",
  "confidence": 0.0,
  "reason": "short explanation",
  "sanitizedText": "cleaned text for display",
  "suggestedStatus": "approved|pending|rejected",
  "strikeRecommended": false
}

Rules:
- mild profanity without abuse -> approved, sanitize with stars
- moderate uncertainty -> pending
- severe abuse, hate, or threats -> rejected
- preserve the core meaning when sanitizing
- output JSON only

Review:
"""${input}"""
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const raw = response.text?.trim() || "{}";
  const parsed = safeJsonParse(raw);

  if (!parsed) {
    return {
      flagged: true,
      profanityLevel: "moderate",
      confidence: 0.3,
      reason: "Gemini response parse fallback",
      sanitizedText: input,
      suggestedStatus: "pending",
      strikeRecommended: false,
    };
  }

  return {
    flagged: Boolean(parsed.flagged),
    profanityLevel: parsed.profanityLevel || "moderate",
    confidence: Number(parsed.confidence || 0),
    reason: String(parsed.reason || ""),
    sanitizedText: String(parsed.sanitizedText || input),
    suggestedStatus: parsed.suggestedStatus || "pending",
    strikeRecommended: Boolean(parsed.strikeRecommended),
  };
}