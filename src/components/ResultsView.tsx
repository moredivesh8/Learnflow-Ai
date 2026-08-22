import React from 'react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  RotateCcw, 
  Lightbulb, 
  BookOpen,
  Calendar
} from 'lucide-react';
import { QuizSession, StudyPlan, Topic, ViewState } from '../types';

interface ResultsViewProps {
  session: QuizSession;
  plan: StudyPlan;
  onNavigate: (view: ViewState) => void;
  onStartQuiz: (options?: { topicIds?: string[]; weakFocus?: boolean }) => void;
  onExplainTopic: (topic: Topic) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  session,
  plan,
  onNavigate,
  onStartQuiz,
  onExplainTopic,
}) => {
  const hasWeakTopics = session.weakTopicsIdentified.length > 0;
  const weakTopics = plan.topics.filter(t => session.weakTopicsIdentified.includes(t.id));

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Performance Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                Quiz Results Completed
              </span>
              <span className="text-xs text-slate-400">
                {session.createdAt}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {session.title}
            </h1>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {session.score}/{session.totalQuestions}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Raw Score
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="text-center">
              <div className={`text-2xl font-extrabold ${
                session.percentage >= 80 ? 'text-emerald-600' : session.percentage >= 60 ? 'text-blue-600' : 'text-rose-600'
              }`}>
                {session.percentage}%
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Accuracy
              </div>
            </div>
          </div>
        </div>

        {/* ⚡ Adaptive System Response Banner */}
        {hasWeakTopics ? (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-blue-500/10 border border-amber-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 font-bold">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                  ⚡ Adaptive Engine Triggered: Roadmap Automatically Re-Configured
                </h3>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                  Based on your performance, the AI detected knowledge gaps in <span className="font-bold text-slate-900 dark:text-white">{weakTopics.map(w => w.name).join(', ')}</span>.
                  Your study schedule for upcoming days has been adapted with targeted review sessions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                id="results-view-adapted-roadmap-btn"
                onClick={() => onNavigate('roadmap')}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>View Adapted Roadmap</span>
              </button>

              <button
                id="results-retest-weak-btn"
                onClick={() => onStartQuiz({ topicIds: session.weakTopicsIdentified, weakFocus: true })}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Practice Weak Topics Again
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>High mastery maintained across tested units! No urgent roadmap revisions needed.</span>
          </div>
        )}

        {/* Topic Mastery Deltas */}
        {session.masteryChanges && session.masteryChanges.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Topic Mastery Score Updates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {session.masteryChanges.map((mc, idx) => {
                const isDown = mc.change < 0;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={mc.topicName}>
                        {mc.topicName}
                      </span>
                      <span className={`font-bold flex items-center gap-0.5 ${
                        isDown ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {isDown ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {mc.change > 0 ? `+${mc.change}%` : `${mc.change}%`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Previous: {mc.oldScore}%</span>
                      <span className="font-bold text-slate-900 dark:text-white">New: {mc.newScore}%</span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full ${mc.newScore >= 80 ? 'bg-emerald-500' : mc.newScore >= 60 ? 'bg-blue-500' : 'bg-rose-500'}`}
                        style={{ width: `${mc.newScore}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Question Breakdown Review */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Question-by-Question Diagnostic Review
        </h3>

        <div className="space-y-4">
          {session.questions.map((q, qIdx) => {
            const isCorrect = q.isCorrect;
            const topic = plan.topics.find(t => t.id === q.topicId);

            return (
              <div
                key={q.id || qIdx}
                className={`p-4 rounded-xl border space-y-3 ${
                  isCorrect
                    ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                    : 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Q{qIdx + 1} • {q.topicName}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                        {q.question}
                      </p>
                    </div>
                  </div>

                  {topic && (
                    <button
                      id={`results-explain-btn-${qIdx}`}
                      onClick={() => onExplainTopic(topic)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Lightbulb className="w-3 h-3" />
                      <span>Explain</span>
                    </button>
                  )}
                </div>

                {/* Answers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Your Answer</span>
                    <span className={isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-rose-700 dark:text-rose-300 font-medium'}>
                      {q.userAnswer || 'No answer selected'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Correct Answer</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                      {q.correctAnswer}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  💡 <strong className="text-slate-900 dark:text-white">Why:</strong> {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          id="results-back-dashboard-btn"
          onClick={() => onNavigate('dashboard')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Return to Dashboard
        </button>

        <button
          id="results-go-roadmap-btn"
          onClick={() => onNavigate('roadmap')}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <span>Continue with Study Roadmap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
