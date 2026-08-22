import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  Lightbulb, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight 
} from 'lucide-react';
import { Topic } from '../types';
import { explainConcept, ExplainConceptResponse } from '../services/api';

interface ConceptExplainModalProps {
  topic: Topic | null;
  conceptName?: string;
  subjectName: string;
  materialContext?: string;
  onClose: () => void;
}

export const ConceptExplainModal: React.FC<ConceptExplainModalProps> = ({
  topic,
  conceptName,
  subjectName,
  materialContext,
  onClose,
}) => {
  const targetConcept = conceptName || topic?.name || 'Selected Concept';
  const targetTopic = topic?.name || 'General Topic';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<ExplainConceptResponse | null>(null);
  const [selectedQuickAnswer, setSelectedQuickAnswer] = useState<string | null>(null);
  const [showQuickResult, setShowQuickResult] = useState(false);

  const loadExplanation = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSelectedQuickAnswer(null);
    setShowQuickResult(false);
    try {
      const result = await explainConcept({
        conceptName: targetConcept,
        topicName: targetTopic,
        subjectName,
        materialContext,
        sourceEvidence: topic?.sourceEvidence,
      });
      setData(result);
    } catch (err: any) {
      console.error('Error fetching concept explanation:', err);
      setErrorMsg(err.message || 'AI tutor service temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExplanation();
  }, [targetConcept, targetTopic, subjectName, materialContext]);

  if (!topic && !conceptName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        id="explain-modal-card"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {targetConcept}
                </h3>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  AI Concept Breakdown
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Subject: {subjectName} • Topic: {targetTopic}
              </p>
            </div>
          </div>
          <button
            id="close-explain-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Consulting LearnFlow AI Tutor...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Synthesizing intuition, mechanics, analogies & exam traps grounded in your material.
                </p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* 1. Intuition */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>The Intuition (In Plain English)</span>
                </div>
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                  {data.simpleExplanation}
                </div>
              </div>

              {/* 2. Real World Analogy */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Real-World Analogy</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                  {data.realWorldAnalogy}
                </div>
              </div>

              {/* 3. Technical Deep Dive */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Layers className="w-4 h-4" />
                  <span>Technical Mechanics & Key Details</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {data.technicalDeepDive}
                </div>
              </div>

              {/* 4. Common Exam Pitfalls */}
              {data.commonPitfalls && data.commonPitfalls.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Common Exam Traps & Misconceptions</span>
                  </div>
                  <ul className="space-y-2">
                    {data.commonPitfalls.map((pitfall, pIdx) => (
                      <li 
                        key={pIdx}
                        className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{pitfall}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 5. Interactive Quick Check */}
              {data.quickCheckQuestion && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      Quick Comprehension Check
                    </span>
                    {showQuickResult && (
                      <span className="text-xs font-semibold">
                        {selectedQuickAnswer === data.quickCheckQuestion.correctAnswer ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct!
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Try again
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {data.quickCheckQuestion.question}
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {data.quickCheckQuestion.options.map((opt, optIdx) => {
                      const isSelected = selectedQuickAnswer === opt;
                      const isCorrect = opt === data.quickCheckQuestion.correctAnswer;
                      let btnStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400";
                      
                      if (showQuickResult) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-semibold";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200";
                        }
                      } else if (isSelected) {
                        btnStyle = "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200";
                      }

                      return (
                        <button
                          key={optIdx}
                          id={`quick-opt-${optIdx}`}
                          onClick={() => {
                            setSelectedQuickAnswer(opt);
                            setShowQuickResult(true);
                          }}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {showQuickResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {showQuickResult && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                      💡 {data.quickCheckQuestion.explanation}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : errorMsg ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{errorMsg}</p>
              <button
                onClick={loadExplanation}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                Try Again
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-500">Explanation could not be loaded.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50 dark:bg-slate-900">
          <button
            id="done-explain-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Got it, back to study</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
