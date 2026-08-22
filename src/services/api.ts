import { Topic, RoadmapDay, QuizQuestion, StudyPlan, RoadmapActivity, SourceCurriculum, SourceEvidence } from '../types';

export interface AnalyzeMaterialPayload {
  subjectName: string;
  materialText: string;
  examDate: string;
  dailyHours: number;
  learningGoal?: string;
}

export interface ExplainConceptResponse {
  conceptName: string;
  simpleExplanation: string;
  technicalDeepDive: string;
  realWorldAnalogy: string;
  commonPitfalls: string[];
  quickCheckQuestion: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

export async function checkServerHealth(): Promise<{ status: string; hasApiKey: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (e) {
    console.warn('API health check error:', e);
    return { status: 'fallback', hasApiKey: false };
  }
}

export async function analyzeStudyMaterial(payload: AnalyzeMaterialPayload): Promise<{
  topics: Topic[];
  subjectIdentified: string;
  materialSummary: string;
  sourceCurriculum?: SourceCurriculum;
}> {
  const res = await fetch('/api/analyze-material', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `AI analysis failed (Status ${res.status}). Please try again in a moment.`);
  }

  const json = await res.json();
  const data = json.data;

  if (!data || !Array.isArray(data.topics) || data.topics.length === 0) {
    throw new Error('No structured topics could be extracted from your material. Please ensure your document has readable text.');
  }

  // Transform topics into our Topic model with IDs & baseline tracking
  const topics: Topic[] = data.topics.map((t: any, index: number) => {
    const rawDifficulty = (t.difficulty || 'medium').toLowerCase();
    const difficulty = ['easy', 'medium', 'hard'].includes(rawDifficulty) ? rawDifficulty : 'medium';
    const initialScore = Number(t.initialMasteryEstimate) || 70;
    
    let status: Topic['status'] = 'developing';
    if (initialScore < 40) status = 'needs_attention';
    else if (initialScore < 60) status = 'weak';
    else if (initialScore < 80) status = 'developing';
    else status = 'strong';

    return {
      id: `topic-${Date.now()}-${index}`,
      name: t.name,
      unit: t.unit || `Unit ${Math.floor(index / 2) + 1}`,
      difficulty,
      prerequisites: Array.isArray(t.prerequisites) ? t.prerequisites : [],
      summary: t.description || t.summary || `Core study module for ${t.name}`,
      keyConcepts: Array.isArray(t.concepts) ? t.concepts : (Array.isArray(t.keyConcepts) ? t.keyConcepts : [t.name]),
      subtopics: Array.isArray(t.subtopics) ? t.subtopics : [],
      definitions: Array.isArray(t.definitions) ? t.definitions : [],
      keyFacts: Array.isArray(t.keyFacts) ? t.keyFacts : [],
      examples: Array.isArray(t.examples) ? t.examples : [],
      sourceEvidence: Array.isArray(t.sourceEvidence) ? t.sourceEvidence : [],
      masteryScore: initialScore,
      quizAttempts: 0,
      correctAnswers: 0,
      status,
      trend: 'neutral',
    };
  });

  return {
    topics,
    subjectIdentified: data.subjectIdentified || payload.subjectName,
    materialSummary: data.materialSummary || 'Canonical source curriculum extracted successfully',
    sourceCurriculum: data.sourceCurriculum,
  };
}

export async function generateStudyRoadmap(payload: {
  subjectName: string;
  topics: Topic[];
  examDate: string;
  dailyHours: number;
  learningGoal?: string;
  materialText?: string;
}): Promise<RoadmapDay[]> {
  const res = await fetch('/api/generate-roadmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Roadmap generation failed (Status ${res.status}). Please try again.`);
  }

  const json = await res.json();
  const daysData = json.data?.days || [];

  if (!daysData || daysData.length === 0) {
    throw new Error('AI could not generate a study schedule. Please try again.');
  }

  const days: RoadmapDay[] = daysData.map((d: any, idx: number) => {
    const matchedTopicIds: string[] = [];
    const validTopicNames: string[] = [];
    const rawTopicNames: string[] = Array.isArray(d.topicNames) ? d.topicNames : [];

    rawTopicNames.forEach(tName => {
      if (typeof tName !== 'string') return;
      const targetName = tName.trim().toLowerCase();
      // Strict case-insensitive canonical equality ONLY
      const found = payload.topics.find(top => top.name.trim().toLowerCase() === targetName);
      if (found && !matchedTopicIds.includes(found.id)) {
        matchedTopicIds.push(found.id);
        validTopicNames.push(found.name);
      }
    });

    const activities: RoadmapActivity[] = [];
    (d.activities || []).forEach((act: any, actIdx: number) => {
      const actTopicName = (act.topicName || '').trim().toLowerCase();
      // Strict case-insensitive canonical equality ONLY
      const matchedTopic = payload.topics.find(t => t.name.trim().toLowerCase() === actTopicName);
      
      // If Gemini returns an unknown topic name, discard that activity rather than guessing
      if (matchedTopic) {
        activities.push({
          id: `act-${idx}-${actIdx}`,
          type: act.type || 'study',
          description: act.description || `Study and master ${matchedTopic.name}`,
          topicId: matchedTopic.id,
          topicName: matchedTopic.name,
          estimatedMinutes: Number(act.estimatedMinutes) || 45,
          priority: act.priority || 'normal',
        });
      }
    });

    // If day activities were filtered out but matched canonical topics exist, construct activities strictly from canonical topics
    if (activities.length === 0 && matchedTopicIds.length > 0) {
      matchedTopicIds.forEach((tId, actIdx) => {
        const top = payload.topics.find(t => t.id === tId);
        if (top) {
          activities.push({
            id: `act-${idx}-${actIdx}`,
            type: 'study',
            description: `Review definitions, core properties, and practice questions for ${top.name}`,
            topicId: top.id,
            topicName: top.name,
            estimatedMinutes: Math.round((payload.dailyHours * 60) / matchedTopicIds.length) || 45,
            priority: 'normal',
          });
        }
      });
    }

    // Strict validation of focusUnit against canonical topics
    let validatedFocusUnit = 'Source Curriculum Review';
    const rawFocusUnit = (typeof d.focusUnit === 'string' ? d.focusUnit : '').trim();
    if (rawFocusUnit) {
      const canonicalFocus = payload.topics.find(t => t.name.trim().toLowerCase() === rawFocusUnit.toLowerCase());
      if (canonicalFocus) {
        validatedFocusUnit = canonicalFocus.name;
      } else if (validTopicNames.length > 0) {
        validatedFocusUnit = validTopicNames[0];
      }
    } else if (validTopicNames.length > 0) {
      validatedFocusUnit = validTopicNames[0];
    }

    return {
      dayNumber: d.dayNumber || idx + 1,
      date: d.dateLabel || `Day ${idx + 1}`,
      focusUnit: validatedFocusUnit,
      allocatedHours: d.allocatedHours || payload.dailyHours,
      topicIds: matchedTopicIds,
      topicNames: validTopicNames,
      isCompleted: false,
      notes: d.notes || 'Review foundational definitions and practice sample quiz questions.',
      activities,
    };
  });

  return days;
}

export async function generateQuizQuestions(payload: {
  subjectName: string;
  topics: Topic[];
  targetTopicNames: string[];
  count: number;
  isWeakFocus?: boolean;
  materialContext?: string;
  topicSourceEvidence?: SourceEvidence[];
}): Promise<QuizQuestion[]> {
  const res = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "LearnFlow couldn't generate enough questions directly from this PDF. Please try again.");
  }

  const json = await res.json();
  const questionsData = json.data?.questions || [];

  if (!questionsData || questionsData.length === 0) {
    throw new Error("LearnFlow couldn't generate enough questions directly from this PDF. Please try again.");
  }

  const questions: QuizQuestion[] = [];
  for (let idx = 0; idx < questionsData.length; idx++) {
    const q = questionsData[idx];
    const candidateName = (q.topicName || '').trim().toLowerCase();
    // Strict case-insensitive canonical equality ONLY
    const matchedTopic = payload.topics.find(t => t.name.trim().toLowerCase() === candidateName);

    if (!matchedTopic) {
      console.warn(`[Quiz Client] Discarding quiz question with ungrounded topic: "${q.topicName}"`);
      continue;
    }

    const options = Array.isArray(q.options) && q.options.length === 4 ? q.options : [];
    if (options.length !== 4 || !options.includes(q.correctAnswer)) {
      console.warn(`[Quiz Client] Discarding quiz question with invalid options or missing correctAnswer: "${q.question}"`);
      continue;
    }

    questions.push({
      id: `q-${Date.now()}-${idx}`,
      topicId: matchedTopic.id,
      topicName: matchedTopic.name,
      question: q.question,
      options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || `The answer is directly derived from ${matchedTopic.name} in the uploaded material.`,
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty?.toLowerCase()) ? q.difficulty.toLowerCase() : 'medium',
      conceptKey: q.conceptKey || matchedTopic.name,
      sourceEvidence: Array.isArray(q.sourceEvidence) && q.sourceEvidence.length > 0 ? q.sourceEvidence : (matchedTopic.sourceEvidence || []),
    });
  }

  if (questions.length === 0) {
    throw new Error("LearnFlow couldn't generate enough grounded questions directly from this PDF. Please try again.");
  }

  return questions;
}

export async function evaluateAnswer(payload: {
  question: string;
  options: string[];
  selectedAnswer: string;
  correctAnswer: string;
  topicName: string;
  subjectName: string;
  sourceEvidence?: SourceEvidence[];
  materialContext?: string;
}) {
  const isCorrect = payload.selectedAnswer.trim() === payload.correctAnswer.trim();
  try {
    const res = await fetch('/api/evaluate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (e) {
    console.warn('AI answer evaluation call failed, using direct evaluation:', e);
  }

  // Safe fallback evaluation without fabricating subject content
  return {
    isCorrect,
    summaryFeedback: isCorrect ? 'Correct! Well done.' : 'Incorrect.',
    detailedExplanation: `The correct answer is: "${payload.correctAnswer}".`,
    misconceptionAnalysis: isCorrect ? 'No misconceptions identified.' : `You selected: "${payload.selectedAnswer}".`,
    memoryAid: `Review the definitions for ${payload.topicName}.`,
    recommendedAction: isCorrect ? 'Continue with the quiz session.' : 'Revisit your notes on this topic.',
  };
}

export async function adaptStudyRoadmap(payload: {
  subjectName: string;
  currentRoadmap: RoadmapDay[];
  topics: Topic[];
  quizResults?: any;
  recentQuizScore?: string;
  weakTopicNames: string[];
  examDate?: string;
  dailyHours?: number;
  materialContext?: string;
}): Promise<RoadmapDay[]> {
  const res = await fetch('/api/adapt-roadmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subjectName: payload.subjectName,
      currentRoadmap: payload.currentRoadmap,
      topics: payload.topics,
      quizResults: payload.quizResults || payload.recentQuizScore,
      weakTopicNames: payload.weakTopicNames,
      examDate: payload.examDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dailyHours: payload.dailyHours || 3,
      materialContext: payload.materialContext,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Roadmap adaptation failed (Status ${res.status}).`);
  }

  const json = await res.json();
  const data = json.data;

  const adaptedDays: RoadmapDay[] = (data.adaptedDays || []).map((d: any, idx: number) => {
    const origDay = payload.currentRoadmap[idx] || payload.currentRoadmap[0];
    const activities: RoadmapActivity[] = (d.activities || []).map((act: any, actIdx: number) => {
      const topic = payload.topics.find(t => t.name.toLowerCase().includes((act.topicName || '').toLowerCase()));
      return {
        id: `act-adp-${idx}-${actIdx}`,
        type: act.type || 'study',
        description: act.description,
        topicId: topic ? topic.id : 'remediation',
        topicName: act.topicName || (topic ? topic.name : 'Targeted Review'),
        estimatedMinutes: Number(act.estimatedMinutes) || 40,
        priority: act.priority || 'high',
      };
    });

    return {
      dayNumber: d.dayNumber || idx + 1,
      date: d.dateLabel || `Day ${idx + 1}`,
      focusUnit: d.focusUnit || origDay?.focusUnit || `Day ${idx + 1}`,
      allocatedHours: d.allocatedHours || payload.dailyHours || 3,
      topicIds: origDay ? origDay.topicIds : [],
      topicNames: d.topicNames || (origDay ? origDay.topicNames : []),
      isCompleted: false,
      isAdapted: d.isAdapted !== false,
      adaptationReason: d.adaptationReason || `Adaptive re-allocation based on weak topic analysis.`,
      notes: d.notes || 'Revisit weak areas before testing new topics.',
      activities,
    };
  });

  return adaptedDays.length > 0 ? adaptedDays : payload.currentRoadmap;
}

export async function explainConcept(payload: {
  conceptName: string;
  topicName: string;
  subjectName: string;
  materialContext?: string;
  sourceEvidence?: SourceEvidence[];
}): Promise<ExplainConceptResponse> {
  const res = await fetch('/api/explain-concept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to explain concept (Status ${res.status}). Please try again in a moment.`);
  }

  const json = await res.json();
  if (!json.data) {
    throw new Error('No explanation data returned by the AI service.');
  }

  return json.data;
}

