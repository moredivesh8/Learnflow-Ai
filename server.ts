import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Error Classification & Retry Timing Helpers
// ---------------------------------------------------------------------------

function extractHttpStatus(error: any): number | null {
  if (!error) return null;
  if (typeof error.status === 'number') return error.status;
  if (typeof error.code === 'number') return error.code;
  if (typeof error.statusCode === 'number') return error.statusCode;
  if (typeof error.httpStatus === 'number') return error.httpStatus;

  const msg = error.message || String(error);
  const codeMatch = msg.match(/"code"\s*:\s*(\d{3})/);
  if (codeMatch) return parseInt(codeMatch[1], 10);

  const statusMatch = msg.match(/\b(408|429|500|502|503|504)\b/);
  if (statusMatch) return parseInt(statusMatch[1], 10);

  if (/RESOURCE_EXHAUSTED/i.test(msg) || /rate\s*limit/i.test(msg) || /quota/i.test(msg)) return 429;
  if (/UNAVAILABLE/i.test(msg) || /high\s*demand/i.test(msg)) return 503;
  if (/DEADLINE_EXCEEDED/i.test(msg) || /timeout/i.test(msg)) return 504;

  return null;
}

function isTransientError(error: any): boolean {
  const status = extractHttpStatus(error);
  if (status && [408, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }
  const msg = (error?.message || String(error)).toLowerCase();
  return (
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('timeout') ||
    msg.includes('overloaded') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

function extractRetryDelayMs(error: any): number | null {
  if (!error) return null;
  const msg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));

  const delayMatch = msg.match(/"retryDelay"\s*:\s*"([\d.]+)s?"/i);
  if (delayMatch && delayMatch[1]) {
    const sec = parseFloat(delayMatch[1]);
    if (!isNaN(sec) && sec > 0) {
      return Math.round(sec * 1000);
    }
  }

  const msMatch = msg.match(/"retryDelay"\s*:\s*"([\d.]+)ms"/i);
  if (msMatch && msMatch[1]) {
    const ms = parseFloat(msMatch[1]);
    if (!isNaN(ms) && ms > 0) return Math.round(ms);
  }

  if (error.retryAfter && typeof error.retryAfter === 'number') {
    return error.retryAfter * 1000;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Production Resilience Wrapper: generateGeminiContent
// ---------------------------------------------------------------------------

export interface GeminiRequestOptions {
  contents: string | any;
  config?: any;
  models?: string[];
  maxRetriesPerModel?: number;
}

// Supported Gemini Flash models hierarchy (gemini-2.5-flash primary, gemini-3.7-flash backup)
const DEFAULT_MODEL_HIERARCHY = ['gemini-2.5-flash', 'gemini-3.7-flash'];

export async function generateGeminiContent(
  ai: GoogleGenAI,
  options: GeminiRequestOptions
) {
  const models = options.models && options.models.length > 0 ? options.models : DEFAULT_MODEL_HIERARCHY;
  const maxRetries = options.maxRetriesPerModel ?? 1; // Default to 1 attempt per model to prevent quota drain
  let lastError: any = null;

  for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
    const currentModel = models[modelIdx];
    const isLastModel = modelIdx === models.length - 1;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Requesting model "${currentModel}" (attempt ${attempt}/${maxRetries})...`);

        // SINGLE direct SDK call in the entire codebase
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: options.contents,
          config: options.config,
        });

        if (response && response.text) {
          console.log(`[Gemini API] Success with model "${currentModel}".`);
          return response;
        }

        throw new Error(`Empty text response received from model "${currentModel}".`);
      } catch (err: any) {
        lastError = err;
        const status = extractHttpStatus(err);
        const statusLabel = status ? `HTTP ${status}` : 'Unknown Status';

        console.warn(
          `[Gemini API] Error on model "${currentModel}" (attempt ${attempt}/${maxRetries}, ${statusLabel}): ${err?.message || 'Unknown error'}`
        );

        // Fail fast on HTTP 429 / quota errors: DO NOT launch retries or cascades that exhaust quota
        if (status === 429) {
          console.warn(`[Gemini API] HTTP 429 Quota Exceeded on model "${currentModel}". Failing fast to preserve quota.`);
          throw err;
        }

        const transient = isTransientError(err);

        // For non-transient errors (e.g. 400 Bad Request, model not found, invalid syntax), do not retry the same model
        if (!transient) {
          console.warn(`[Gemini API] Non-transient error detected. Halting retries on model "${currentModel}".`);
          break;
        }

        // If another retry is available on this model (e.g., transient network 503/504), wait with backoff
        if (attempt < maxRetries) {
          const explicitDelay = extractRetryDelayMs(err);
          const baseBackoff = Math.min(6000, 1000 * Math.pow(2, attempt - 1));
          const jitter = Math.floor(Math.random() * 300);
          const waitTimeMs = explicitDelay ? Math.min(10000, explicitDelay + jitter) : (baseBackoff + jitter);

          console.log(`[Gemini API] Retrying model "${currentModel}" in ${waitTimeMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
        }
      }
    }

    if (!isLastModel) {
      const fallbackModel = models[modelIdx + 1];
      console.warn(`[Gemini API] Cascading from "${currentModel}" to fallback model "${fallbackModel}"...`);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  console.error(`[Gemini API] Exhausted all model fallbacks (${models.join(' -> ')}).`);
  throw lastError || new Error(`Gemini API failed across all fallback models (${models.join(', ')})`);
}

// ---------------------------------------------------------------------------
// Express Server & API Endpoints
// ---------------------------------------------------------------------------

// Helper: Programmatic strict grounding validation for extracted topics
function validateTopicGrounding(
  topic: any,
  sourceText: string
): { isValid: boolean; reason?: string; enrichedEvidence?: any[] } {
  const name = (topic.name || '').trim();
  if (!name || name.length < 3) {
    return { isValid: false, reason: 'Topic name is empty or too short' };
  }

  const lowerName = name.toLowerCase();

  // 1. Filter out OCR artifacts, corrupted text segments, meta-descriptions, and generic placeholders
  const artifactKeywords = [
    'unreadable document',
    'unreadable',
    'unintelligible',
    'corrupted text',
    'corrupted',
    'stream artifact',
    'stream artifacts',
    'text segment',
    'document excerpt',
    'document portion',
    'ocr error',
    'ocr artifact',
    'binary stream',
    'hex dump',
    'raw text',
    'general topic',
    'chapter summary',
    'course overview',
    'table of contents',
    'appendix',
    'references',
    'bibliography',
    'preface',
    'acknowledgments',
    'index',
  ];

  if (artifactKeywords.some(kw => lowerName.includes(kw))) {
    return { isValid: false, reason: 'Extraction artifact or generic placeholder' };
  }

  const lowerSource = (sourceText || '').toLowerCase();
  if (lowerSource.length < 30) {
    return { isValid: true };
  }

  const normalizedSource = lowerSource.replace(/\s+/g, ' ');

  // 2. Strict Evidence Validation: Must be verbatim contiguous substring or normalized-whitespace contiguous substring
  const rawEvidenceList = Array.isArray(topic.sourceEvidence) ? topic.sourceEvidence : [];
  const validEvidenceList: any[] = [];

  for (const item of rawEvidenceList) {
    const quote = (typeof item === 'string' ? item : item?.text || '').trim();
    if (!quote || quote.length < 8) continue;

    const lowerQuote = quote.toLowerCase();
    // A. Direct contiguous substring match
    if (lowerSource.includes(lowerQuote)) {
      validEvidenceList.push({ text: quote, page: item.page });
      continue;
    }

    // B. Normalized-whitespace contiguous substring match
    const normalizedQuote = lowerQuote.replace(/\s+/g, ' ');
    if (normalizedSource.includes(normalizedQuote)) {
      validEvidenceList.push({ text: quote, page: item.page });
      continue;
    }
  }

  // 3. Fallback: If model omitted evidence but topic name exists in source text, extract verbatim excerpt from source text
  const nameTokens = lowerName
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w: string) => w.length > 2 && !['and', 'the', 'for', 'with', 'from', 'into', 'unit', 'chapter', 'part', 'section'].includes(w));

  const directNameMatch = lowerSource.includes(lowerName);
  const matchingNameTokens = nameTokens.filter((w: string) => lowerSource.includes(w));
  const nameOverlap = nameTokens.length > 0 ? matchingNameTokens.length / nameTokens.length : 0;

  if (validEvidenceList.length === 0) {
    if (directNameMatch || nameOverlap >= 0.5) {
      const searchToken = directNameMatch ? lowerName : matchingNameTokens[0];
      const pos = lowerSource.indexOf(searchToken);
      if (pos !== -1) {
        const start = Math.max(0, pos - 20);
        const end = Math.min(sourceText.length, pos + 250);
        const excerpt = sourceText.slice(start, end).replace(/\s+/g, ' ').trim();
        if (excerpt.length > 15) {
          validEvidenceList.push({ text: excerpt });
        }
      }
    }
  }

  if (validEvidenceList.length === 0) {
    return { isValid: false, reason: 'No verbatim evidence quotes found in source text' };
  }

  // 4. Verify topic concept support in source text
  if (!directNameMatch && nameOverlap < 0.3) {
    const desc = (topic.description || '').toLowerCase();
    const descWords = desc.replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w: string) => w.length > 4);
    const matchingDesc = descWords.filter((w: string) => lowerSource.includes(w));
    const descOverlap = descWords.length > 0 ? matchingDesc.length / descWords.length : 0;
    if (descOverlap < 0.25) {
      return { isValid: false, reason: `Topic "${name}" concepts not supported in document content` };
    }
  }

  return { isValid: true, enrichedEvidence: validEvidenceList };
}

// Helper: Split large document text into coherent chunks
function chunkDocumentText(text: string, targetChunkSize = 35000): string[] {
  const clean = (text || '').trim();
  if (clean.length <= targetChunkSize + 5000) {
    return [clean];
  }

  const chunks: string[] = [];
  const pageRegex = /\n--- Page \d+ ---\n/g;
  const pageSplits = clean.split(pageRegex).filter(p => p.trim().length > 0);

  if (pageSplits.length > 1) {
    let currentChunk = '';
    for (let i = 0; i < pageSplits.length; i++) {
      const pageText = `\n--- Page ${i + 1} ---\n` + pageSplits[i];
      if ((currentChunk + pageText).length > targetChunkSize && currentChunk.length > 15000) {
        chunks.push(currentChunk.trim());
        currentChunk = pageText;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + pageText;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
  }

  // Fallback split on paragraphs if no page markers
  if (chunks.length <= 1 && clean.length > targetChunkSize + 5000) {
    const paragraphs = clean.split(/\n\n+/);
    let currentChunk = '';
    for (const para of paragraphs) {
      if ((currentChunk + para).length > targetChunkSize && currentChunk.length > 15000) {
        chunks.push(currentChunk.trim());
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
  }

  // Limit to at most 6 representative chunks for responsive latency while covering up to >200k chars
  if (chunks.length > 6) {
    const step = (chunks.length - 1) / 5;
    const sampled: string[] = [];
    for (let i = 0; i < 6; i++) {
      const idx = Math.min(chunks.length - 1, Math.round(i * step));
      if (!sampled.includes(chunks[idx])) {
        sampled.push(chunks[idx]);
      }
    }
    return sampled.length > 0 ? sampled : chunks.slice(0, 6);
  }

  return chunks.length > 0 ? chunks : [clean.slice(0, targetChunkSize)];
}

// Helper: Programmatic strict grounding validation for quiz questions
function validateQuizQuestionGrounding(
  q: any,
  sourceText: string,
  allowedTopics: string[],
  targetTopicsDetail?: any[]
): { isValid: boolean; reason?: string; canonicalTopicName?: string } {
  // 1. Structure check: Question text must be substantive
  if (!q.question || typeof q.question !== 'string' || q.question.trim().length < 10) {
    return { isValid: false, reason: 'Malformed or missing question text' };
  }

  // 2. Exactly 4 options required
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return { isValid: false, reason: `Question must contain exactly 4 options (found ${Array.isArray(q.options) ? q.options.length : 0})` };
  }

  // 3. All 4 options must be non-empty and distinct
  const cleanedOptions = q.options.map((opt: any) => (typeof opt === 'string' ? opt.trim() : ''));
  const uniqueOptions = new Set(cleanedOptions);
  if (uniqueOptions.size !== 4 || uniqueOptions.has('')) {
    return { isValid: false, reason: 'Options must contain 4 distinct, non-empty choices' };
  }

  // 4. Correct answer must match exactly one option string
  if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
    return { isValid: false, reason: 'Missing correctAnswer' };
  }
  const matchingOptions = cleanedOptions.filter((opt: string) => opt.toLowerCase() === q.correctAnswer.trim().toLowerCase());
  if (matchingOptions.length !== 1) {
    return { isValid: false, reason: `Correct answer ("${q.correctAnswer}") does not match exactly one option` };
  }

  // 5. Strict Topic Matching against canonical source curriculum topics (NO loose substring matching)
  const candidateTopic = (q.topicName || '').trim();
  const canonicalTopic = allowedTopics.find(
    t => t.trim().toLowerCase() === candidateTopic.toLowerCase()
  );
  if (!canonicalTopic && allowedTopics.length > 0) {
    return { isValid: false, reason: `Topic "${candidateTopic}" is not in canonical source curriculum: [${allowedTopics.join(', ')}]` };
  }

  // 6. Source Evidence existence & substance
  const evidenceList = Array.isArray(q.sourceEvidence) ? q.sourceEvidence : [];
  if (evidenceList.length === 0) {
    return { isValid: false, reason: 'Missing sourceEvidence supporting quote' };
  }

  const evidenceText = (evidenceList[0]?.text || '').trim();
  if (evidenceText.length < 10) {
    return { isValid: false, reason: 'Source evidence is too brief or empty' };
  }

  // 7. Grounding verification against source text & topic evidence
  let aggregatedSource = (sourceText || '').toLowerCase();
  if (targetTopicsDetail && Array.isArray(targetTopicsDetail)) {
    const topicDetails = targetTopicsDetail.flatMap(t => [
      t.name,
      t.description || '',
      ...(t.concepts || t.keyConcepts || []),
      ...(t.keyFacts || []),
      ...(t.subtopics || []),
      ...(t.definitions || []).map((d: any) => `${d.term} ${d.definition}`),
      ...(t.sourceEvidence || []).map((e: any) => e.text),
    ]).join(' ').toLowerCase();
    aggregatedSource += ' ' + topicDetails;
  }

  if (aggregatedSource.length > 30) {
    const lowerEvidence = evidenceText.toLowerCase();
    const normalizedEvidence = lowerEvidence.replace(/\s+/g, ' ');
    const normalizedAggregated = aggregatedSource.replace(/\s+/g, ' ');

    // Check verbatim direct inclusion or normalized-whitespace contiguous substring match ONLY
    const isDirectMatch = aggregatedSource.includes(lowerEvidence);
    const isNormalizedMatch = normalizedAggregated.includes(normalizedEvidence);

    if (!isDirectMatch && !isNormalizedMatch) {
      return { isValid: false, reason: 'Evidence quote not found verbatim in source text' };
    }

    // Check question & concept semantic relevance against source text
    const questionTokens = (q.question + ' ' + (q.conceptKey || '') + ' ' + q.correctAnswer)
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !['what', 'which', 'following', 'statement', 'about', 'when', 'with', 'from', 'this', 'that', 'they', 'have', 'been', 'correct', 'true', 'false', 'best', 'most', 'describe'].includes(w));

    if (questionTokens.length > 0) {
      const matchingTokens = questionTokens.filter((w: string) => aggregatedSource.includes(w));
      const tokenRatio = matchingTokens.length / questionTokens.length;
      if (tokenRatio < 0.35) {
        return { isValid: false, reason: 'Question concepts are not supported by the supplied source text' };
      }
    }
  }

  return { isValid: true, canonicalTopicName: canonicalTopic || candidateTopic };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      app: 'LearnFlow AI',
    });
  });

  // 1. Analyze study material and extract canonical source curriculum
  app.post('/api/analyze-material', async (req, res) => {
    const { subjectName, materialText, examDate, dailyHours, learningGoal } = req.body;
    try {
      const text = (materialText || '').trim();
      console.log(`[Source] Document uploaded/analyzed: "${subjectName || 'Study Material'}"`);
      console.log(`[Source] Extracted characters: ${text.length}`);

      if (text.length < 30) {
        return res.status(422).json({
          success: false,
          error: "LearnFlow couldn't extract enough content from this document to build a study plan.",
          retryable: false,
        });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          success: false,
          error: 'AI service is not configured with an API key.',
          retryable: false,
        });
      }

      // Gemini 2.5 Flash / 3.7 Flash easily supports 1M+ tokens context window.
      // For documents up to ~250,000 characters (~50k tokens), execute a SINGLE comprehensive request.
      const useSingleRequest = text.length <= 250000;
      const processingStrategy = useSingleRequest ? 'SINGLE_REQUEST' : '2_CHUNKS';
      console.log(`[Source] Processing strategy: ${processingStrategy}`);

      const chunks = useSingleRequest ? [text] : chunkDocumentText(text, 120000).slice(0, 2);
      console.log(`[Source] Gemini topic-analysis requests: ${chunks.length}`);

      const topicExtractionSchema = {
        type: Type.OBJECT,
        properties: {
          documentTitle: { type: Type.STRING },
          documentSummary: { type: Type.STRING },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                unit: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                prerequisites: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                description: { type: Type.STRING },
                subtopics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                concepts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                definitions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: { type: Type.STRING },
                      definition: { type: Type.STRING },
                    },
                  },
                },
                keyFacts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                examples: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                sourceEvidence: {
  type: Type.ARRAY,
  minItems: 1,
  items: {
    type: Type.OBJECT,
    properties: {
      page: { type: Type.INTEGER },
      text: { type: Type.STRING },
    },
    required: ['text'],
  },
},
                initialMasteryEstimate: { type: Type.NUMBER },
              },
              required: ['name', 'description', 'sourceEvidence'],
            },
          },
        },
        required: ['topics'],
      };

      const rawExtractedTopics: any[] = [];
      let discoveredDocTitle = '';
      let discoveredDocSummary = '';

      // Execute sequential requests if >1 chunk, or single request
      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const prompt = `You are LearnFlow AI's academic curriculum extraction specialist.
Analyze the following student's uploaded educational material and extract the structured curriculum (topics, chapters, sections, techniques, ciphers, algorithms, and key concepts) that are explicitly taught in this text.

Document Subject / Title: "${subjectName || 'Academic Material'}"
${chunks.length > 1 ? `Section ${i + 1} of ${chunks.length}` : 'Complete Document'}

DOCUMENT TEXT:
${chunkText}

CRITICAL EXTRACTION & EVIDENCE RULES:
1. Extract the actual educational topics, concepts, ciphers, algorithms, theories, and mechanics explicitly explained in the text.
2. Every evidence quote must be an exact contiguous quotation copied from the provided source text. Do not paraphrase. Do not invent, reconstruct, summarize, or modify evidence.
3. Preserve original terminology from the document (for example, if the document covers "Historical Ciphers", "Caesar Cipher", "Monoalphabetic Cipher", "Playfair Cipher", "Hill Cipher", "Vigenère Cipher", "Symmetric Encryption", extract those exact topic names).
4. Do NOT inject generic outside topics (e.g. do not add GDPR or AI Ethics unless they are explicitly in this text).
5. Do NOT create topics for OCR artifacts, corruptions, or document descriptions (e.g., do NOT output topics like "Unreadable Document Excerpt", "Corrupted Text Segment", "Stream Artifacts", "Document Overview", "Table of Contents"). Only output legitimate educational topics.
6. For each topic:
   - "name": Meaningful topic name representing a concept, technique, algorithm, or chapter from the text
   - "unit": Unit or Module label (e.g. "Unit 1: Introduction to Cryptography")
   - "difficulty": "easy", "medium", or "hard"
   - "description": 1-2 sentence summary of what the document teaches about this topic
   - "concepts": Array of key concepts, sub-principles, or algorithms in this section
   - "definitions": Array of { term, definition } explicitly defined in the text
   - "keyFacts": Array of factual statements or properties stated in the text
   - "examples": Any specific examples, case studies, or named techniques mentioned
   - "sourceEvidence": Array of { page?: number, text: "exact contiguous quote copied verbatim from the document text" }
7. Extract a comprehensive set of distinct topics (typically 5 to 20 topics for full documents/chapters).`;

        try {
          const resp = await generateGeminiContent(ai, {
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: topicExtractionSchema,
            },
          });
          const parsed = JSON.parse(resp.text || '{}');
          if (parsed.documentTitle && !discoveredDocTitle) discoveredDocTitle = parsed.documentTitle;
          if (parsed.documentSummary && !discoveredDocSummary) discoveredDocSummary = parsed.documentSummary;
          if (Array.isArray(parsed.topics)) {
            rawExtractedTopics.push(...parsed.topics);
          }
        } catch (err: any) {
          console.warn(`[Source] Error extracting topics from section ${i + 1}:`, err?.message || err);
          if (chunks.length === 1) throw err;
        }
      }

      console.log(`[Source] Raw candidate topics: ${rawExtractedTopics.length}`);

      // Deduplicate candidate topics across chunks by normalized name
      const candidateMap = new Map<string, any>();
      for (const rawTopic of rawExtractedTopics) {
        const name = (rawTopic.name || '').trim();
        if (!name || name.length < 2) continue;

        const normKey = name
          .toLowerCase()
          .replace(/^unit\s*\d+[\s:.-]*/i, '')
          .replace(/^chapter\s*\d+[\s:.-]*/i, '')
          .replace(/^section\s*\d+[\s:.-]*/i, '')
          .replace(/[^\w\s]/g, '')
          .trim();

        if (!normKey) continue;

        if (candidateMap.has(normKey)) {
          const existing = candidateMap.get(normKey);
          existing.concepts = Array.from(new Set([...(existing.concepts || []), ...(rawTopic.concepts || [])]));
          existing.subtopics = Array.from(new Set([...(existing.subtopics || []), ...(rawTopic.subtopics || [])]));
          existing.keyFacts = Array.from(new Set([...(existing.keyFacts || []), ...(rawTopic.keyFacts || [])]));
          existing.examples = Array.from(new Set([...(existing.examples || []), ...(rawTopic.examples || [])]));
          existing.definitions = [...(existing.definitions || []), ...(rawTopic.definitions || [])];
          existing.sourceEvidence = [...(existing.sourceEvidence || []), ...(rawTopic.sourceEvidence || [])];
          if (!existing.description && rawTopic.description) {
            existing.description = rawTopic.description;
          }
        } else {
          candidateMap.set(normKey, { ...rawTopic });
        }
      }

      const candidateList = Array.from(candidateMap.values());

      // Programmatic Source-Grounding Validation
      const acceptedTopics: any[] = [];
      let artifactRejectedCount = 0;
      const rejectedTopics: { name: string; reason: string }[] = [];

      for (const cand of candidateList) {
        const val = validateTopicGrounding(cand, text);
        if (val.isValid) {
          acceptedTopics.push({
            ...cand,
            id: `topic-${acceptedTopics.length + 1}`,
            sourceEvidence: val.enrichedEvidence || cand.sourceEvidence || [],
            unit: cand.unit || 'Core Unit',
            difficulty: ['easy', 'medium', 'hard'].includes((cand.difficulty || '').toLowerCase()) ? cand.difficulty.toLowerCase() : 'medium',
            prerequisites: Array.isArray(cand.prerequisites) ? cand.prerequisites : [],
            concepts: Array.isArray(cand.concepts) ? cand.concepts : [],
            subtopics: Array.isArray(cand.subtopics) ? cand.subtopics : [],
            keyFacts: Array.isArray(cand.keyFacts) ? cand.keyFacts : [],
            definitions: Array.isArray(cand.definitions) ? cand.definitions : [],
            examples: Array.isArray(cand.examples) ? cand.examples : [],
            initialMasteryEstimate: typeof cand.initialMasteryEstimate === 'number' && cand.initialMasteryEstimate >= 35 && cand.initialMasteryEstimate <= 85
              ? cand.initialMasteryEstimate
              : 65,
          });
        } else {
          if (val.reason?.includes('artifact') || val.reason?.includes('placeholder')) {
            artifactRejectedCount++;
          }
          rejectedTopics.push({
            name: cand.name || 'Unnamed',
            reason: val.reason || 'Failed grounding check',
          });
        }
      }

      console.log(`[Source] Artifact candidates rejected: ${artifactRejectedCount}`);
      console.log(`[Source] Grounded candidates: ${acceptedTopics.length}`);
      console.log(`[Source] Final canonical topics: ${acceptedTopics.length}`);

      for (const rej of rejectedTopics) {
        console.log(`[Source] Rejected topic "${rej.name}": ${rej.reason}`);
      }

      if (acceptedTopics.length === 0) {
        console.error('[Source] No topics passed canonical source validation.');
        return res.status(422).json({
          success: false,
          error: "LearnFlow couldn't extract enough structured content from this PDF to generate a grounded quiz. Please upload a readable educational PDF or paste study notes.",
          retryable: true,
        });
      }

      const finalTitle = discoveredDocTitle || subjectName || 'Study Curriculum';
      const finalSummary = discoveredDocSummary || `Extracted ${acceptedTopics.length} grounded topics from uploaded material.`;

      console.log(`[Source] Final Canonical Curriculum: ${acceptedTopics.length} topics under "${finalTitle}"`);

      return res.json({
        success: true,
        data: {
          subjectIdentified: finalTitle,
          materialSummary: finalSummary,
          sourceCurriculum: {
            title: finalTitle,
            documentSummary: finalSummary,
            totalTopics: acceptedTopics.length,
            topics: acceptedTopics,
          },
          topics: acceptedTopics.map((t: any) => ({
            ...t,
            summary: t.description || t.summary,
            keyConcepts: t.concepts || t.keyConcepts || [],
          })),
        },
      });
    } catch (error: any) {
      console.error('Error in /api/analyze-material:', error?.message || error);
      const httpStatus = extractHttpStatus(error) || 503;
      return res.status(httpStatus >= 400 && httpStatus < 600 ? httpStatus : 503).json({
        success: false,
        error: 'AI service temporarily unavailable. Please try again in a moment.',
        retryable: true,
      });
    }
  });

  // 2. Generate personalized initial study roadmap strictly from source curriculum
  app.post('/api/generate-roadmap', async (req, res) => {
    const { subjectName, topics, examDate, dailyHours, learningGoal, materialText } = req.body;
    try {
      console.log(`[Roadmap] Using source curriculum with ${topics?.length || 0} topics`);

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          success: false,
          error: 'AI service is not configured with an API key.',
          retryable: false,
        });
      }

      const prompt = `You are LearnFlow AI's Adaptive Study Plan Planner.
You are generating a study roadmap from the user's uploaded study material.

Subject / Document: "${subjectName}"
Available Study Time: ${dailyHours || 3} hours per day.
Exam Target Date: ${examDate || 'In 4 days'}.
Goal: ${learningGoal || 'Master the uploaded study material'}

CANONICAL SOURCE CURRICULUM & EVIDENCE:
${JSON.stringify(topics, null, 2)}

SOURCE MATERIAL EXCERPT:
${(materialText || '').slice(0, 20000)}

MANDATORY GROUNDING RULES:
1. Use ONLY the supplied source curriculum, topics, and source evidence.
2. Do NOT introduce topics, concepts, examples, laws, definitions, or terminology that are not supported by the source material.
3. You may reorganize and pedagogically sequence the material (scheduling prerequisites first), but you must not expand the curriculum using general knowledge.
4. Every roadmap topic and activity must correspond to one or more source curriculum topics.
5. Schedule topics into distinct Days (Day 1, Day 2, etc.) up to the exam date (typically 3-7 days).
6. For each day, include:
   - dayNumber: integer (1, 2, 3...)
   - dateLabel: e.g. "Day 1 (Today)", "Day 2"
   - focusUnit: the main theme of that day from the source curriculum
   - allocatedHours: number of hours (matches or is close to ${dailyHours})
   - topicNames: array of exact topic names covered on this day
   - notes: tactical advice for today based on source material
   - activities: array of concrete learning activities grounded in source topics.
     Each activity has { description, topicName, type: ("study"|"quiz"|"review"|"flashcard"), estimatedMinutes, priority: ("urgent"|"high"|"normal") }
7. Reserve the final day for comprehensive review of the source topics.`;

      const response = await generateGeminiContent(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roadmapTitle: { type: Type.STRING },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    dateLabel: { type: Type.STRING },
                    focusUnit: { type: Type.STRING },
                    allocatedHours: { type: Type.NUMBER },
                    topicNames: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    notes: { type: Type.STRING },
                    activities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          topicName: { type: Type.STRING },
                          type: { type: Type.STRING },
                          estimatedMinutes: { type: Type.INTEGER },
                          priority: { type: Type.STRING },
                        },
                        required: ['description', 'topicName', 'type', 'estimatedMinutes', 'priority'],
                      },
                    },
                  },
                  required: ['dayNumber', 'dateLabel', 'focusUnit', 'allocatedHours', 'topicNames', 'notes', 'activities'],
                },
              },
            },
            required: ['days'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error in /api/generate-roadmap:', error?.message || error);
      const httpStatus = extractHttpStatus(error) || 503;
      return res.status(httpStatus >= 400 && httpStatus < 600 ? httpStatus : 503).json({
        success: false,
        error: 'AI service temporarily unavailable. Please try again in a moment.',
        retryable: true,
      });
    }
  });

  // 3. Generate targeted quiz questions with strict source grounding & validation
  app.post('/api/generate-quiz', async (req, res) => {
    const { subjectName, topics, targetTopicNames, count, isWeakFocus, materialContext, topicSourceEvidence } = req.body;
    try {
      const activeTopicNames: string[] = targetTopicNames && targetTopicNames.length > 0
        ? targetTopicNames
        : (topics || []).map((t: any) => t.name);

      const targetTopicsDetail = (topics || []).filter((t: any) => 
        activeTopicNames.some(name => name.trim().toLowerCase() === (t.name || '').trim().toLowerCase())
      );

      console.log(`[Quiz] Generating grounded questions for topics: [${activeTopicNames.join(', ')}]`);
      const evidenceCount = (topicSourceEvidence || []).length || targetTopicsDetail.flatMap((t: any) => t.sourceEvidence || []).length;
      console.log(`[Quiz] Source evidence supplied: ${evidenceCount} chunks`);

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          success: false,
          error: 'AI service is not configured with an API key.',
          retryable: false,
        });
      }

      // Format rich structured dossier for each target topic
      const topicDossiers = (targetTopicsDetail.length > 0 ? targetTopicsDetail : activeTopicNames.map(name => ({ name }))).map((t: any) => ({
        topicName: t.name,
        unit: t.unit || 'Core Unit',
        description: t.description || t.summary || '',
        concepts: t.concepts || t.keyConcepts || [],
        definitions: t.definitions || [],
        keyFacts: t.keyFacts || [],
        examples: t.examples || [],
        sourceEvidence: t.sourceEvidence || [],
      }));

      const prompt = `You are the Assessment Specialist for LearnFlow AI.
Generate ${count || 5} multiple-choice questions grounded STRICTLY and EXCLUSIVELY in the user's uploaded study material and provided topic evidence.

TARGET TOPICS & SOURCE EVIDENCE DOSSIER:
${JSON.stringify(topicDossiers, null, 2)}

ADDITIONAL TOPIC SOURCE EVIDENCE CHUNKS:
${JSON.stringify(topicSourceEvidence || [], null, 2)}

RAW SOURCE MATERIAL EXCERPT:
${(materialContext || '').slice(0, 35000)}

Focus mode: ${isWeakFocus ? 'REMEDIATION ON WEAK TOPICS: Focus on common student misunderstandings, edge cases, and practical mechanics present in the source' : 'BALANCED MASTERY ASSESSMENT'}

MANDATORY GROUNDING RULES:
1. Generate questions ONLY from the supplied source material, topic dossiers, and source evidence.
2. ABSOLUTELY DO NOT use outside or general knowledge.
3. Do NOT generate a question unless the correct answer can be directly and unequivocally verified from the supplied source material.
4. Do NOT introduce concepts merely because they are commonly associated with this subject (for example, if Cyber Ethics material is provided and only discusses Vulnerability Disclosure and Cyber Warfare, do NOT ask about GDPR, Fair Use, Digital Divide, or AI Ethics).
5. Every single question must have "sourceEvidence" containing the exact supporting quote from the text and page number (if page markers exist).
6. Each question must have EXACTLY 4 distinct, non-empty options, with "correctAnswer" matching one option string exactly.
7. "explanation" must explain why the correct answer is right and why other options are wrong based strictly on the source text.
8. "difficulty": "easy", "medium", or "hard".
9. "conceptKey": Specific concept from source (e.g. "Responsible Disclosure Timeline", "Dual-Use Research").
10. "topicName": MUST match one of the exact target source topic names: [${activeTopicNames.join(', ')}].`;

      const response = await generateGeminiContent(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quizTitle: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topicName: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    conceptKey: { type: Type.STRING },
                    sourceEvidence: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          page: { type: Type.INTEGER },
                          text: { type: Type.STRING },
                        },
                        required: ['text'],
                      },
                    },
                  },
                  required: ['topicName', 'question', 'options', 'correctAnswer', 'explanation', 'difficulty', 'conceptKey', 'sourceEvidence'],
                },
              },
            },
            required: ['questions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const rawQuestions = parsed.questions || [];

      // Grounding Validation Step
      const validQuestions: any[] = [];
      for (const q of rawQuestions) {
        const validation = validateQuizQuestionGrounding(q, materialContext || '', activeTopicNames, targetTopicsDetail);
        if (validation.isValid) {
          // Normalize topicName to canonical casing
          validQuestions.push({
            ...q,
            topicName: validation.canonicalTopicName || q.topicName,
          });
        } else {
          console.warn(`[Quiz Grounding Validation] Question filtered out: "${q.question?.slice(0, 60)}..." (Reason: ${validation.reason})`);
        }
      }

      const passStatus = validQuestions.length >= rawQuestions.length ? 'PASS' : `PARTIAL PASS (${validQuestions.length}/${rawQuestions.length})`;
      console.log(`[Quiz] Grounding validation: ${passStatus} (${validQuestions.length}/${rawQuestions.length} verified against source)`);

      // STRICT GROUNDING ENFORCEMENT:
      // Never fall back to unvalidated raw questions.
      if (validQuestions.length === 0) {
        console.error('[Quiz Grounding Validation] All generated questions failed strict grounding validation.');
        return res.status(422).json({
          success: false,
          error: "LearnFlow couldn't generate enough questions directly from this PDF. Please try again.",
          retryable: true,
        });
      }

      // Return ONLY validated questions (no hallucinated backfill)
      return res.json({
        success: true,
        data: {
          quizTitle: parsed.quizTitle || 'Source-Grounded Practice Quiz',
          questions: validQuestions,
        },
      });
    } catch (error: any) {
      console.error('Error in /api/generate-quiz:', error?.message || error);
      const httpStatus = extractHttpStatus(error) || 503;
      return res.status(httpStatus >= 400 && httpStatus < 600 ? httpStatus : 503).json({
        success: false,
        error: error.message?.includes("couldn't generate enough questions") 
          ? error.message 
          : "LearnFlow couldn't generate enough questions directly from this PDF. Please try again.",
        retryable: true,
      });
    }
  });

  // 4. Evaluate answer with source-grounded AI tutor feedback & memory aids
  app.post('/api/evaluate-answer', async (req, res) => {
    const { question, options, selectedAnswer, correctAnswer, topicName, subjectName, sourceEvidence, materialContext } = req.body;
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          success: false,
          error: 'AI service is not configured with an API key.',
          retryable: false,
        });
      }

      const prompt = `You are a supportive, high-clarity academic AI tutor in LearnFlow AI.
Evaluate the student's answer grounded STRICTLY in the supplied source material and evidence:

Subject / Document: ${subjectName}
Topic: ${topicName}
Question: ${question}
Options: ${JSON.stringify(options)}
Student's Chosen Answer: ${selectedAnswer}
Correct Answer: ${correctAnswer}

SUPPORTING SOURCE EVIDENCE & EXCERPT:
${JSON.stringify(sourceEvidence || '')}
${(materialContext || '').slice(0, 10000)}

STRICT GROUNDING INSTRUCTIONS:
1. Base your explanation, feedback, and memory aid ONLY on the concepts, definitions, and mechanics in the provided source material and evidence.
2. Do NOT introduce outside facts, unrelated regulations (e.g. GDPR, Fair Use), or theories not present in the user's material.
3. If the student was incorrect, explain the precise misconception according to the source material.
4. "memoryAid": A clear, simple mnemonic, mental model, or rule of thumb derived directly from the source concepts.
5. "recommendedAction": 1-sentence next action recommendation for studying this specific source topic.`;

      const response = await generateGeminiContent(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              summaryFeedback: { type: Type.STRING },
              detailedExplanation: { type: Type.STRING },
              misconceptionAnalysis: { type: Type.STRING },
              memoryAid: { type: Type.STRING },
              recommendedAction: { type: Type.STRING },
            },
            required: ['isCorrect', 'summaryFeedback', 'detailedExplanation', 'memoryAid', 'recommendedAction'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error in /api/evaluate-answer:', error?.message || error);
      const httpStatus = extractHttpStatus(error) || 503;
      return res.status(httpStatus >= 400 && httpStatus < 600 ? httpStatus : 503).json({
        success: false,
        error: 'AI service temporarily unavailable. Please try again in a moment.',
        retryable: true,
      });
    }
  });

  // 5. Adaptive Roadmap Engine (Operates strictly on SOURCE CURRICULUM topics)
  app.post('/api/adapt-roadmap', async (req, res) => {
    const { subjectName, currentRoadmap, topics, quizResults, weakTopicNames, examDate, dailyHours, materialContext } = req.body;
    try {
      console.log(`[Adaptive] Re-planning roadmap for weak topics: [${(weakTopicNames || []).join(', ')}] using source curriculum only`);

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          success: false,
          error: 'AI service is not configured with an API key.',
          retryable: false,
        });
      }

      const prompt = `You are LearnFlow AI's Adaptive Learning Engine.
The student has just completed a quiz session.

Subject / Document: ${subjectName}
Current Topics & Mastery Status from Source Curriculum:
${JSON.stringify((topics || []).map((t: any) => ({ name: t.name, mastery: t.masteryScore, status: t.status, summary: t.summary })), null, 2)}

Identified Weak Topics requiring immediate remediation:
${JSON.stringify(weakTopicNames || [], null, 2)}

Recent Quiz Performance summary:
${JSON.stringify(quizResults || 'Score dropped on weak topics', null, 2)}

Current Study Roadmap:
${JSON.stringify(currentRoadmap || [], null, 2)}

SOURCE MATERIAL EXCERPT:
${(materialContext || '').slice(0, 10000)}

MANDATORY ADAPTIVE RULES:
1. Re-structure and adapt the roadmap to immediately prioritize the detected weak topics from the SOURCE CURRICULUM.
2. Do NOT introduce new, unstudied topics from general knowledge. Focus on reinforcing the specific source topics where the student struggled (e.g. if weak topic is 'Vulnerability Disclosure', reinforce 'Vulnerability Disclosure', do NOT add unrelated topics like GDPR or AI ethics).
3. For days with weak topics (especially Day 1 and Day 2), inject targeted high-priority review & practice activities for those source topics.
4. Reduce repetitive study time for topics where the student already has high mastery (>=80%).
5. Explain clearly the reason for adaptation in "adaptationSummary" and "adaptationReason" for each adapted day.
6. Keep the total daily hours realistic (${dailyHours || 3}h/day).`;

      const response = await generateGeminiContent(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              adaptationSummary: { type: Type.STRING },
              primaryFocusChanged: { type: Type.STRING },
              adaptedDays: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    dateLabel: { type: Type.STRING },
                    focusUnit: { type: Type.STRING },
                    allocatedHours: { type: Type.NUMBER },
                    topicNames: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    isAdapted: { type: Type.BOOLEAN },
                    adaptationReason: { type: Type.STRING },
                    notes: { type: Type.STRING },
                    activities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          description: { type: Type.STRING },
                          topicName: { type: Type.STRING },
                          type: { type: Type.STRING },
                          estimatedMinutes: { type: Type.INTEGER },
                          priority: { type: Type.STRING },
                        },
                        required: ['description', 'topicName', 'type', 'estimatedMinutes', 'priority'],
                      },
                    },
                  },
                  required: ['dayNumber', 'dateLabel', 'focusUnit', 'allocatedHours', 'topicNames', 'isAdapted', 'notes', 'activities'],
                },
              },
            },
            required: ['adaptationSummary', 'adaptedDays'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error in /api/adapt-roadmap:', error?.message || error);
      const httpStatus = extractHttpStatus(error) || 503;
      return res.status(httpStatus >= 400 && httpStatus < 600 ? httpStatus : 503).json({
        success: false,
        error: 'AI service temporarily unavailable. Please try again in a moment.',
        retryable: true,
      });
    }
  });

  // 6. Explain concept in-depth strictly grounded in source material
  app.post('/api/explain-concept', async (req, res) => {
    const { conceptName, topicName, subjectName, materialContext, sourceEvidence } = req.body;
    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          success: false,
          error: 'AI service is not configured with an API key.',
          retryable: false,
        });
      }

      const prompt = `You are an exceptional, friendly AI tutor on LearnFlow AI.
A student requested: "Explain this concept to me!"

Subject / Document: ${subjectName}
Topic: ${topicName}
Concept: ${conceptName}

REFERENCE SOURCE MATERIAL & TOPIC EVIDENCE:
${JSON.stringify(sourceEvidence || '')}
${(materialContext || '').slice(0, 15000)}

MANDATORY GROUNDING RULES:
1. Provide an explanation grounded STRICTLY in the provided source material and topic evidence.
2. Use the definitions, mechanics, examples, and terminology from the source text.
3. Do NOT introduce outside facts or unrelated theories not present in the user's material.
4. "simpleExplanation": Plain English intuition of what the source material describes.
5. "technicalDeepDive": Technical mechanics, definitions, or steps directly from the source text.
6. "realWorldAnalogy": An intuitive everyday analogy explaining this source concept.
7. "commonPitfalls": 2-3 common traps or misunderstandings about this concept from the source text.
8. "quickCheckQuestion": A rapid 1-question check with 4 options and correct answer to test immediate understanding of this source concept.`;

      const response = await generateGeminiContent(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              conceptName: { type: Type.STRING },
              simpleExplanation: { type: Type.STRING },
              technicalDeepDive: { type: Type.STRING },
              realWorldAnalogy: { type: Type.STRING },
              commonPitfalls: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              quickCheckQuestion: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctAnswer', 'explanation'],
              },
            },
            required: ['conceptName', 'simpleExplanation', 'technicalDeepDive', 'realWorldAnalogy', 'commonPitfalls', 'quickCheckQuestion'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error in /api/explain-concept:', error?.message || error);
      const httpStatus = extractHttpStatus(error) || 503;
      return res.status(httpStatus >= 400 && httpStatus < 600 ? httpStatus : 503).json({
        success: false,
        error: 'AI service temporarily unavailable. Please try again in a moment.',
        retryable: true,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LearnFlow AI server running on http://localhost:${PORT}`);
  });
}

startServer();
