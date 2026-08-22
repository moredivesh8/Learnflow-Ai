export type Difficulty = 'easy' | 'medium' | 'hard';

export type MasteryStatus = 'needs_attention' | 'weak' | 'developing' | 'strong';

export interface SourceEvidence {
  page?: number;
  text: string;
}

export interface TopicDefinition {
  term: string;
  definition: string;
}

export interface SourceCurriculumTopic {
  id: string;
  name: string;
  unit: string;
  description: string;
  difficulty: Difficulty;
  subtopics: string[];
  concepts: string[];
  definitions?: TopicDefinition[];
  keyFacts?: string[];
  examples?: string[];
  sourceEvidence: SourceEvidence[];
  prerequisites?: string[];
}

export interface SourceCurriculum {
  title: string;
  documentSummary: string;
  totalTopics: number;
  topics: SourceCurriculumTopic[];
}

export interface Topic {
  id: string;
  name: string;
  unit: string;
  difficulty: Difficulty;
  prerequisites: string[];
  summary: string;
  keyConcepts: string[];
  subtopics?: string[];
  definitions?: TopicDefinition[];
  keyFacts?: string[];
  examples?: string[];
  sourceEvidence?: SourceEvidence[];
  masteryScore: number; // 0 - 100
  quizAttempts: number;
  correctAnswers: number;
  lastTestedAt?: string;
  status: MasteryStatus;
  trend: 'up' | 'down' | 'neutral';
}

export interface RoadmapActivity {
  id: string;
  type: 'study' | 'quiz' | 'review' | 'flashcard';
  description: string;
  topicId: string;
  topicName: string;
  estimatedMinutes: number;
  priority: 'urgent' | 'high' | 'normal';
  completed?: boolean;
}

export interface RoadmapDay {
  dayNumber: number;
  date: string;
  focusUnit: string;
  allocatedHours: number;
  topicIds: string[];
  topicNames: string[];
  isCompleted: boolean;
  notes: string;
  isAdapted?: boolean;
  adaptationReason?: string;
  activities: RoadmapActivity[];
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  topicName: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  conceptKey: string;
  sourceEvidence?: SourceEvidence[];
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface MasteryChange {
  topicId: string;
  topicName: string;
  oldScore: number;
  newScore: number;
  change: number;
}

export interface QuizSession {
  id: string;
  createdAt: string;
  title: string;
  topicIds: string[];
  score: number;
  totalQuestions: number;
  percentage: number;
  questions: QuizQuestion[];
  masteryChanges: MasteryChange[];
  weakTopicsIdentified: string[];
}

export interface UploadedFileSummary {
  name: string;
  size: number;
  pageCount?: number;
  extractedChars: number;
  uploadedAt: string;
}

export interface StudyPlan {
  id: string;
  subjectName: string;
  examDate: string;
  dailyHours: number;
  learningGoal?: string;
  fullDocumentText?: string;
  materialTextSnippet: string;
  sourceCurriculum?: SourceCurriculum;
  isDemo?: boolean;
  uploadedFiles: UploadedFileSummary[];
  topics: Topic[];
  roadmap: RoadmapDay[];
  quizHistory: QuizSession[];
  overallMastery: number;
  lastAdaptedAt?: string;
  adaptationCount: number;
}

export type ViewState = 
  | 'landing'
  | 'dashboard'
  | 'setup'
  | 'roadmap'
  | 'quiz'
  | 'results'
  | 'progress'
  | 'explain';

