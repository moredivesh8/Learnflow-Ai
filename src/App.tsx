import React, { useState, useEffect } from 'react';
import { ViewState, StudyPlan, Topic, QuizSession } from './types';
import { sampleStudyPlan } from './data/demoData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPageView } from './components/LandingPageView';
import { DashboardView } from './components/DashboardView';
import { UploadSetupView } from './components/UploadSetupView';
import { RoadmapView } from './components/RoadmapView';
import { QuizView } from './components/QuizView';
import { ResultsView } from './components/ResultsView';
import { ProgressView } from './components/ProgressView';
import { ConceptExplainModal } from './components/ConceptExplainModal';
import { DemoWalkthroughModal } from './components/DemoWalkthroughModal';
import { adaptStudyRoadmap } from './services/api';
import { 
  Compass, 
  Calendar, 
  HelpCircle, 
  BarChart3, 
  Folder, 
  Menu, 
  X, 
  Sparkles,
  Zap
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('learnflow_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('learnflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('learnflow_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Active View Navigation
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Active Study Plan (Preloaded with sample Computer Networks course)
  const [studyPlan, setStudyPlan] = useState<StudyPlan>(() => {
    const saved = localStorage.getItem('learnflow_active_plan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved plan:', e);
      }
    }
    return sampleStudyPlan;
  });

  // Save plan updates to localStorage
  useEffect(() => {
    if (studyPlan) {
      localStorage.setItem('learnflow_active_plan', JSON.stringify(studyPlan));
    }
  }, [studyPlan]);

  // Quiz Navigation & Parameters State
  const [quizTopicIds, setQuizTopicIds] = useState<string[] | undefined>(undefined);
  const [quizWeakFocus, setQuizWeakFocus] = useState<boolean>(false);
  const [activeQuizSession, setActiveQuizSession] = useState<QuizSession | null>(null);

  // Modals
  const [explainingTopic, setExplainingTopic] = useState<Topic | null>(null);
  const [showDemoWalkthrough, setShowDemoWalkthrough] = useState<boolean>(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Handler: Start Quiz with custom parameters
  const handleStartQuiz = (options?: { topicIds?: string[]; weakFocus?: boolean }) => {
    setQuizTopicIds(options?.topicIds);
    setQuizWeakFocus(options?.weakFocus || false);
    setCurrentView('quiz');
  };

  // Handler: Completed Quiz Session
  const handleQuizCompleted = (session: QuizSession, updatedPlan: StudyPlan) => {
    setActiveQuizSession(session);
    setStudyPlan(updatedPlan);

    // If weak topics were detected, trigger automatic adaptation
    if (session.weakTopicsIdentified && session.weakTopicsIdentified.length > 0) {
      const weakTopicNames = updatedPlan.topics
        .filter(t => session.weakTopicsIdentified.includes(t.id))
        .map(t => t.name);

      adaptStudyRoadmap({
        subjectName: updatedPlan.subjectName,
        currentRoadmap: updatedPlan.roadmap,
        topics: updatedPlan.topics,
        weakTopicNames,
        recentQuizScore: `${session.score}/${session.totalQuestions} (${session.percentage}%)`,
        materialContext: updatedPlan.materialTextSnippet,
      }).then(adaptedRoadmap => {
        setStudyPlan(prev => ({
          ...prev,
          roadmap: adaptedRoadmap,
          adaptationCount: prev.adaptationCount + 1,
          lastAdaptedAt: 'Just now (Post-quiz trigger)',
        }));
        showToast(
          '⚡ Study Roadmap Automatically Adapted',
          `Prioritized ${weakTopicNames.slice(0, 2).join(' & ')} into upcoming study sessions.`
        );
      }).catch(err => {
        console.error('Background adaptation failed:', err);
      });
    }

    setCurrentView('results');
  };

  // Handler: Load Sample Demo Subject
  const handleLoadDemo = () => {
    setStudyPlan(sampleStudyPlan);
    setCurrentView('dashboard');
    showToast(
      'Demo Dataset Loaded',
      'Computer Networks course initialized with 4 units, topic mastery index, and adaptive roadmap.'
    );
  };

  // Handler: Live Interactive Adaptation Demo Trigger (for judges)
  const handleTriggerAdaptationDemo = async () => {
    // Dynamically identify target weak topics from the ACTIVE study plan's topics
    const targetWeak = studyPlan.topics.length >= 2 ? studyPlan.topics.slice(0, 2) : studyPlan.topics;
    const weakTopicNames = targetWeak.map(t => t.name);
    
    // Simulate mastery reduction for weak topics
    const updatedTopics = studyPlan.topics.map((t, idx) => {
      if (targetWeak.some(wt => wt.id === t.id)) {
        const simulatedScore = idx === 0 ? 38 : 45;
        return { ...t, masteryScore: simulatedScore, status: 'weak' as const, trend: 'down' as const };
      }
      return t;
    });

    try {
      showToast('⚡ AI Adaptive Engine Analyzing...', `Re-sequencing study roadmap based on knowledge gaps in ${weakTopicNames.slice(0, 2).join(' & ')}.`);
      
      const adaptedRoadmap = await adaptStudyRoadmap({
        subjectName: studyPlan.subjectName,
        currentRoadmap: studyPlan.roadmap,
        topics: updatedTopics,
        weakTopicNames,
        recentQuizScore: `2/5 (40% - Knowledge Gaps Detected in ${weakTopicNames[0] || 'Core Topics'})`,
        materialContext: studyPlan.materialTextSnippet,
      });

      setStudyPlan(prev => ({
        ...prev,
        topics: updatedTopics,
        roadmap: adaptedRoadmap,
        adaptationCount: prev.adaptationCount + 1,
        lastAdaptedAt: 'Just now (Interactive Adaptation Trigger)',
      }));

      setCurrentView('roadmap');
      showToast(
        '⚡ Schedule Re-configured!',
        `Weak topic "${weakTopicNames[0] || 'Target Topic'}" injected into Day 1 & Day 2 review sessions with urgent priority.`
      );
    } catch (err: any) {
      console.error('Adaptation demo trigger failed:', err);
      showToast(
        'Adaptation Notice',
        err.message || 'AI service temporarily unavailable. Please try again in a moment.'
      );
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Landing Page full-screen view */}
      {currentView === 'landing' ? (
        <div className="w-full h-full overflow-y-auto">
          <LandingPageView
            onNavigate={setCurrentView}
            onLoadDemo={handleLoadDemo}
            onOpenWalkthrough={() => setShowDemoWalkthrough(true)}
          />
        </div>
      ) : (
        /* High Density App Shell: Desktop Left Sidebar + Top Header + Scrollable View */
        <div className="flex w-full h-full overflow-hidden">
          {/* Desktop Left Sidebar */}
          <div className="hidden md:flex flex-col shrink-0">
            <Sidebar
              currentView={currentView}
              onNavigate={(view) => {
                setCurrentView(view);
                setMobileMenuOpen(false);
              }}
              activePlan={studyPlan}
              onLoadDemo={handleLoadDemo}
              onOpenWalkthrough={() => setShowDemoWalkthrough(true)}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          </div>

          {/* Mobile Sidebar Overlay */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden bg-black/50 backdrop-blur-xs">
              <div className="w-72 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-fadeIn">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Menu</span>
                  <button 
                    id="mobile-close-menu-btn"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Sidebar
                    currentView={currentView}
                    onNavigate={(view) => {
                      setCurrentView(view);
                      setMobileMenuOpen(false);
                    }}
                    activePlan={studyPlan}
                    onLoadDemo={() => {
                      handleLoadDemo();
                      setMobileMenuOpen(false);
                    }}
                    onOpenWalkthrough={() => {
                      setShowDemoWalkthrough(true);
                      setMobileMenuOpen(false);
                    }}
                    isDarkMode={isDarkMode}
                    onToggleTheme={toggleTheme}
                  />
                </div>
              </div>
              <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
            </div>
          )}

          {/* Main Area: Top Header + Content Container */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Mobile Header Menu Trigger */}
            <div className="md:hidden h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0">
              <button
                id="mobile-open-menu-btn"
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">LearnFlow AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="mobile-theme-toggle-btn"
                  onClick={toggleTheme}
                  className="p-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold"
                  title="Toggle Light/Dark Theme"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <button
                  id="mobile-quick-demo-btn"
                  onClick={() => setShowDemoWalkthrough(true)}
                  className="p-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold"
                >
                  Demo
                </button>
              </div>
            </div>

            {/* High Density Desktop Header */}
            <Header
              currentView={currentView}
              onNavigate={setCurrentView}
              activePlan={studyPlan}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
              onOpenWalkthrough={() => setShowDemoWalkthrough(true)}
              onStartQuiz={() => handleStartQuiz({ weakFocus: true })}
            />

            {/* Scrollable View Content Section */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                {currentView === 'setup' && (
                  <UploadSetupView
                    onPlanCreated={(newPlan) => {
                      setStudyPlan(newPlan);
                      setCurrentView('dashboard');
                      showToast('Study Plan Generated!', `${newPlan.subjectName} roadmap initialized.`);
                    }}
                    onNavigate={setCurrentView}
                    onLoadDemo={handleLoadDemo}
                  />
                )}

                {currentView === 'dashboard' && (
                  <DashboardView
                    plan={studyPlan}
                    onNavigate={setCurrentView}
                    onStartQuiz={handleStartQuiz}
                    onExplainTopic={(t) => setExplainingTopic(t)}
                    onTriggerAdaptationDemo={handleTriggerAdaptationDemo}
                  />
                )}

                {currentView === 'roadmap' && (
                  <RoadmapView
                    plan={studyPlan}
                    onNavigate={setCurrentView}
                    onStartQuiz={handleStartQuiz}
                    onExplainTopic={(t) => setExplainingTopic(t)}
                    onTriggerAdaptationDemo={handleTriggerAdaptationDemo}
                  />
                )}

                {currentView === 'quiz' && (
                  <QuizView
                    plan={studyPlan}
                    initialTopicIds={quizTopicIds}
                    initialWeakFocus={quizWeakFocus}
                    onQuizCompleted={handleQuizCompleted}
                    onNavigate={setCurrentView}
                    onExplainTopic={(t) => setExplainingTopic(t)}
                  />
                )}

                {currentView === 'results' && activeQuizSession && (
                  <ResultsView
                    session={activeQuizSession}
                    plan={studyPlan}
                    onNavigate={setCurrentView}
                    onStartQuiz={handleStartQuiz}
                    onExplainTopic={(t) => setExplainingTopic(t)}
                  />
                )}

                {currentView === 'progress' && (
                  <ProgressView
                    plan={studyPlan}
                    onNavigate={setCurrentView}
                    onStartQuiz={handleStartQuiz}
                    onExplainTopic={(t) => setExplainingTopic(t)}
                  />
                )}
              </div>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 flex items-center justify-around text-xs shrink-0">
              <button
                id="mob-nav-dash-btn"
                onClick={() => setCurrentView('dashboard')}
                className={`p-1 flex flex-col items-center gap-0.5 ${
                  currentView === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span className="text-[10px]">Dashboard</span>
              </button>

              <button
                id="mob-nav-roadmap-btn"
                onClick={() => setCurrentView('roadmap')}
                className={`p-1 flex flex-col items-center gap-0.5 ${
                  currentView === 'roadmap' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-[10px]">Roadmap</span>
              </button>

              <button
                id="mob-nav-quiz-btn"
                onClick={() => handleStartQuiz({ weakFocus: true })}
                className={`p-1 flex flex-col items-center gap-0.5 ${
                  currentView === 'quiz' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-[10px]">Quiz</span>
              </button>

              <button
                id="mob-nav-prog-btn"
                onClick={() => setCurrentView('progress')}
                className={`p-1 flex flex-col items-center gap-0.5 ${
                  currentView === 'progress' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-[10px]">Mastery</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concept Explain Modal */}
      {explainingTopic && (
        <ConceptExplainModal
          topic={explainingTopic}
          subjectName={studyPlan.subjectName}
          onClose={() => setExplainingTopic(null)}
          onStartTargetedQuiz={(topic) => {
            setExplainingTopic(null);
            handleStartQuiz({ topicIds: [topic.id], weakFocus: true });
          }}
        />
      )}

      {/* Hackathon Demo Walkthrough Modal */}
      {showDemoWalkthrough && (
        <DemoWalkthroughModal
          onClose={() => setShowDemoWalkthrough(false)}
          onNavigate={(view) => setCurrentView(view)}
          onTriggerAdaptationDemo={handleTriggerAdaptationDemo}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div 
          id="learnflow-toast-notification"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 border border-slate-700 dark:border-slate-300 shadow-xl max-w-sm animate-fadeIn flex items-start gap-3 backdrop-blur"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0 animate-ping" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold">
              {toastMessage.title}
            </h4>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {toastMessage.desc}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
