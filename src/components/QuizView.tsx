import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Loader2, 
  AlertTriangle, 
  Lightbulb, 
  RotateCcw, 
  Flame, 
  Brain,
  Award,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyPlan, Topic, QuizQuestion, QuizSession, MasteryChange, ViewState } from '../types';
import { generateQuizQuestions, evaluateAnswer } from '../services/api';
import { calculateUpdatedMastery, calculateOverallMastery } from '../utils/masteryCalculator';

interface QuizViewProps {
  plan: StudyPlan;
  initialTopicIds?: string[];
  initialWeakFocus?: boolean;
  onQuizCompleted: (session: QuizSession, updatedPlan: StudyPlan) => void;
  onNavigate: (view: ViewState) => void;
  onExplainTopic: (topic: Topic) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  plan,
  initialTopicIds,
  initialWeakFocus = false,
  onQuizCompleted,
  onNavigate,
  onExplainTopic,
}) => {
  // Quiz Configuration State
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>(
    initialTopicIds && initialTopicIds.length > 0
      ? initialTopicIds
      : plan.topics.map(t => t.id)
  );
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isWeakFocus, setIsWeakFocus] = useState<boolean>(initialWeakFocus);

  // Active Quiz Play State
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Question Response State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Accumulated Answers for Results
  const [answeredQuestions, setAnsweredQuestions] = useState<QuizQuestion[]>([]);

  // If initial props change, sync selection
  useEffect(() => {
    if (initialTopicIds && initialTopicIds.length > 0) {
      setSelectedTopicIds(initialTopicIds);
    }
    if (initialWeakFocus !== undefined) {
      setIsWeakFocus(initialWeakFocus);
    }
  }, [initialTopicIds, initialWeakFocus]);

  const handleStartQuiz = async () => {
    setIsLoadingQuestions(true);
    setQuizError(null);
    setCurrentIndex(0);
    setAnsweredQuestions([]);
    setSelectedOption(null);
    setIsSubmitted(false);
    setAiEvaluation(null);

    const targetTopics = plan.topics.filter(t => selectedTopicIds.includes(t.id));
    const targetNames = targetTopics.map(t => t.name);
    const targetSourceEvidence = targetTopics.flatMap(t => t.sourceEvidence || []);

    try {
      const generated = await generateQuizQuestions({
        subjectName: plan.subjectName,
        topics: plan.topics,
        targetTopicNames: targetNames.length > 0 ? targetNames : plan.topics.map(t => t.name),
        count: questionCount,
        isWeakFocus,
        materialContext: plan.materialTextSnippet,
        topicSourceEvidence: targetSourceEvidence,
      });

      if (!generated || generated.length === 0) {
        throw new Error('Could not generate quiz questions. Please try again.');
      }

      setQuestions(generated);
      setQuizStarted(true);
    } catch (err: any) {
      console.error('Quiz start error:', err);
      setQuizError(err.message || 'AI service temporarily unavailable. Please try again in a moment.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQ) return;

    setIsEvaluating(true);
    const isCorrect = selectedOption.trim() === currentQ.correctAnswer.trim();

    try {
      const evalData = await evaluateAnswer({
        question: currentQ.question,
        options: currentQ.options,
        selectedAnswer: selectedOption,
        correctAnswer: currentQ.correctAnswer,
        topicName: currentQ.topicName,
        subjectName: plan.subjectName,
        sourceEvidence: currentQ.sourceEvidence,
        materialContext: plan.materialTextSnippet,
      });

      setAiEvaluation(evalData);
      setIsSubmitted(true);

      const answeredQ: QuizQuestion = {
        ...currentQ,
        userAnswer: selectedOption,
        isCorrect,
      };

      setAnsweredQuestions(prev => [...prev, answeredQ]);

      // Confetti burst if correct
      if (isCorrect) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
        });
      }
    } catch (err) {
      console.error('Answer eval error:', err);
      setIsSubmitted(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextOrFinish = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
      setAiEvaluation(null);
    } else {
      finishQuizSession();
    }
  };

  const finishQuizSession = () => {
    const allAnswered = answeredQuestions;
    const totalCorrect = allAnswered.filter(q => q.isCorrect).length;
    const totalCount = allAnswered.length;
    const percentage = totalCount > 0 ? Math.round((totalCorrect / totalCount) * 100) : 0;

    // Recalculate Mastery Score per topic
    const topicStats: Record<string, { correct: number; total: number }> = {};
    allAnswered.forEach(q => {
      if (!topicStats[q.topicId]) {
        topicStats[q.topicId] = { correct: 0, total: 0 };
      }
      topicStats[q.topicId].total += 1;
      if (q.isCorrect) {
        topicStats[q.topicId].correct += 1;
      }
    });

    const masteryChanges: MasteryChange[] = [];
    const updatedTopics: Topic[] = plan.topics.map(topic => {
      const stats = topicStats[topic.id];
      if (!stats) return topic;

      const { newScore, change, trend } = calculateUpdatedMastery(
        topic.masteryScore,
        stats.correct,
        stats.total
      );

      let newStatus: Topic['status'] = 'developing';
      if (newScore < 40) newStatus = 'needs_attention';
      else if (newScore < 60) newStatus = 'weak';
      else if (newScore < 80) newStatus = 'developing';
      else newStatus = 'strong';

      masteryChanges.push({
        topicId: topic.id,
        topicName: topic.name,
        oldScore: topic.masteryScore,
        newScore,
        change,
      });

      return {
        ...topic,
        masteryScore: newScore,
        quizAttempts: topic.quizAttempts + stats.total,
        correctAnswers: topic.correctAnswers + stats.correct,
        status: newStatus,
        trend,
        lastTestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    });

    const newOverallMastery = calculateOverallMastery(updatedTopics);
    const weakTopicsNow = updatedTopics.filter(t => t.masteryScore < 60).map(t => t.id);

    const session: QuizSession = {
      id: `quiz-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today',
      title: isWeakFocus ? 'Remediation Diagnostic Quiz' : 'Adaptive Progress Quiz',
      topicIds: selectedTopicIds,
      score: totalCorrect,
      totalQuestions: totalCount,
      percentage,
      questions: allAnswered,
      masteryChanges,
      weakTopicsIdentified: weakTopicsNow,
    };

    const updatedPlan: StudyPlan = {
      ...plan,
      topics: updatedTopics,
      overallMastery: newOverallMastery,
      quizHistory: [session, ...plan.quizHistory],
    };

    onQuizCompleted(session, updatedPlan);
  };

  // If Quiz is not started yet: Show Quiz Setup Screen
  if (!quizStarted) {
    const weakTopics = plan.topics.filter(t => t.masteryScore < 60);

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Brain className="w-3.5 h-3.5" />
            <span>Interactive Assessment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Adaptive Knowledge Quiz
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Test your understanding with curriculum-grounded questions. Your performance immediately updates your topic mastery and dynamically adapts your study roadmap.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Quick Focus Mode Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Quiz Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="quiz-mode-all-btn"
                onClick={() => {
                  setIsWeakFocus(false);
                  setSelectedTopicIds(plan.topics.map(t => t.id));
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  !isWeakFocus
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs">Balanced Mastery Assessment</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Comprehensive questions across all active syllabus units</div>
              </button>

              <button
                id="quiz-mode-weak-btn"
                onClick={() => {
                  setIsWeakFocus(true);
                  if (weakTopics.length > 0) {
                    setSelectedTopicIds(weakTopics.map(t => t.id));
                  }
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isWeakFocus
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Targeted Weak Gaps ({weakTopics.length})</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Focus specifically on topics with mastery &lt; 60%</div>
              </button>
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Question Count
            </label>
            <div className="flex items-center gap-3">
              {[3, 5, 10].map(count => (
                <button
                  key={count}
                  id={`quiz-count-btn-${count}`}
                  onClick={() => setQuestionCount(count)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    questionCount === count
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selectors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Include Topics ({selectedTopicIds.length} Selected)
              </label>
              <button
                id="toggle-all-topics-btn"
                onClick={() => {
                  if (selectedTopicIds.length === plan.topics.length) {
                    setSelectedTopicIds([]);
                  } else {
                    setSelectedTopicIds(plan.topics.map(t => t.id));
                  }
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {selectedTopicIds.length === plan.topics.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
              {plan.topics.map((t, idx) => {
                const isSelected = selectedTopicIds.includes(t.id);
                return (
                  <button
                    key={t.id || idx}
                    id={`quiz-topic-toggle-${idx}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTopicIds(selectedTopicIds.filter(id => id !== t.id));
                      } else {
                        setSelectedTopicIds([...selectedTopicIds, t.id]);
                      }
                    }}
                    className={`p-2.5 rounded-lg text-left text-xs font-medium border transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="truncate max-w-[200px]">{t.name}</span>
                    <span className="text-[10px] font-bold shrink-0 ml-1">
                      {t.masteryScore}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {quizError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{quizError}</p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Please check your connection and try starting the quiz again.</p>
              </div>
            </div>
          )}

          {/* Start CTA */}
          <button
            id="start-quiz-cta-btn"
            disabled={isLoadingQuestions || selectedTopicIds.length === 0}
            onClick={handleStartQuiz}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            {isLoadingQuestions ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Curriculum-Grounded Questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Quiz ({questionCount} Questions)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Active Quiz Question Interface
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Top Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Topic: {currentQ?.topicName}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            currentQ?.difficulty === 'hard'
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              : currentQ?.difficulty === 'easy'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
          }`}>
            {currentQ?.difficulty}
          </span>

          <span className="text-xs text-slate-400">
            Score: {answeredQuestions.filter(q => q.isCorrect).length}/{currentIndex + (isSubmitted ? 1 : 0)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          {currentQ?.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQ?.options.map((option, optIdx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option.trim() === currentQ.correctAnswer.trim();

            let optionStyle = "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-400";

            if (isSubmitted) {
              if (isCorrect) {
                optionStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500";
              } else if (isSelected && !isCorrect) {
                optionStyle = "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500";
              } else {
                optionStyle = "opacity-50 border-slate-200 dark:border-slate-800 text-slate-400";
              }
            } else if (isSelected) {
              optionStyle = "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600";
            }

            return (
              <button
                key={optIdx}
                id={`quiz-option-${optIdx}`}
                disabled={isSubmitted || isEvaluating}
                onClick={() => setSelectedOption(option)}
                className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span>{option}</span>
                </div>

                {isSubmitted && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                )}
                {isSubmitted && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate AI Tutor Feedback Banner */}
        {isSubmitted && (
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedOption?.trim() === currentQ.correctAnswer.trim() ? (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Correct!
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" /> Incorrect
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Concept: {currentQ.conceptKey}
                </span>
              </div>

              {/* Explain this concept button */}
              {(() => {
                const topic = plan.topics.find(t => t.id === currentQ.topicId);
                return topic ? (
                  <button
                    id="quiz-explain-in-modal-btn"
                    onClick={() => onExplainTopic(topic)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Explain Topic Deeply</span>
                  </button>
                ) : null;
              })()}
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Explanation: </strong>
              {aiEvaluation?.detailedExplanation || currentQ.explanation}
            </p>

            {aiEvaluation?.memoryAid && (
              <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span><strong className="font-bold">Memory Aid:</strong> {aiEvaluation.memoryAid}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 flex items-center justify-between">
          <button
            id="quiz-cancel-btn"
            onClick={() => setQuizStarted(false)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
          >
            Cancel Quiz
          </button>

          {!isSubmitted ? (
            <button
              id="quiz-submit-btn"
              disabled={!selectedOption || isEvaluating}
              onClick={handleSubmitAnswer}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <span>Submit Answer</span>
              )}
            </button>
          ) : (
            <button
              id="quiz-next-question-btn"
              onClick={handleNextOrFinish}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Results & Adapt Roadmap'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
