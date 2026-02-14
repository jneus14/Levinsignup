
import React, { useState, useEffect } from 'react';
import { DiscussionSession, ViewState, Student } from './types';
import { SessionCard } from './components/SessionCard';
import { SignUpForm } from './components/SignUpForm';
import { ParticipantList } from './components/ParticipantList';
import { PromotionEmailModal } from './components/PromotionEmailModal';
import { 
  subscribeToSessions, 
  updateSessionDoc, 
  updateSessionDetails, 
  seedDatabase, 
  addSessionDoc, 
  deleteSessionDoc,
  clearDatabase
} from './services/firebase';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<DiscussionSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('browse'); 
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [lastRegistered, setLastRegistered] = useState<{ 
    student: Student;
    session: DiscussionSession; 
    isWaitlist: boolean;
  } | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [promotionNotify, setPromotionNotify] = useState<{ student: Student; session: DiscussionSession } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await seedDatabase();
        if (isMounted) setError(null);
      } catch (e: any) {
        console.error("Initialization Error:", e);
        if (isMounted) {
          setError({ 
            message: e.code === 'permission-denied' 
              ? "Access denied. Please check your Firestore Security Rules." 
              : "Failed to connect to database.", 
            code: e.code 
          });
        }
      }
    };

    init();

    const unsubscribe = subscribeToSessions(
      (data) => {
        if (isMounted) {
          setSessions(data);
          setError(null); // Clear error on successful data arrival
        }
      },
      (err) => {
        console.error("Subscription Error:", err);
        if (isMounted) {
          setError({ 
            message: err.code === 'permission-denied'
              ? "Database is locked. Security rules update required."
              : "Real-time updates failed.", 
            code: err.code 
          });
        }
      }
    );

    const params = new URLSearchParams(window.location.search);
    if (params.has('admin')) {
      setIsAdminMode(true);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cancelData = params.get('cancel');
    if (cancelData && sessions.length > 0) {
      const [sId, pId] = cancelData.split(':');
      const session = sessions.find(s => s.id === sId);
      if (session) {
        const isInParticipants = session.participants.some(p => p.id === pId);
        const isInWaitlist = session.waitlist.some(p => p.id === pId);
        if (isInParticipants || isInWaitlist) {
          const listType = isInParticipants ? 'participants' : 'waitlist';
          performRemoval(sId, pId, listType);
          setView('canceled');
          window.history.replaceState({}, '', window.location.pathname + (isAdminMode ? '?admin=true' : ''));
        }
      }
    }
  }, [sessions]);

  const performRemoval = async (sessionId: string, studentId: string, listType: 'participants' | 'waitlist') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    let newParticipants = [...session.participants];
    let newWaitlist = [...session.waitlist];

    if (listType === 'participants') {
      newParticipants = newParticipants.filter(p => p.id !== studentId);
      if (!session.isUnlimited && newParticipants.length < session.capacity && newWaitlist.length > 0) {
        const [nextInLine, ...remainingWaitlist] = newWaitlist;
        const promotedStudent = { ...nextInLine, isPromoted: true };
        newParticipants = [...newParticipants, promotedStudent];
        newWaitlist = remainingWaitlist;
        setPromotionNotify({ student: promotedStudent, session: session });
      }
    } else {
      newWaitlist = newWaitlist.filter(p => p.id !== studentId);
    }

    const updatedSession = { ...session, participants: newParticipants, waitlist: newWaitlist };
    await updateSessionDoc(updatedSession);
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset the application? This will clear all registrations and restore default sessions.")) {
      try {
        await clearDatabase();
        await seedDatabase();
        alert("App reset successfully.");
      } catch (err) {
        console.error(err);
        alert("Reset failed. Check console for details.");
      }
    }
  };

  const handleSignUpClick = (id: string) => {
    setActiveSessionId(id);
  };

  const handleRegistrationSubmit = async (name: string, email: string, classYear: string) => {
    if (!activeSessionId) return;
    const targetSession = sessions.find(s => s.id === activeSessionId);
    if (!targetSession) return;

    const isWaitlist = !targetSession.isUnlimited && targetSession.participants.length >= targetSession.capacity;
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name, email, classYear,
      timestamp: Date.now()
    };

    const updatedSession = {
      ...targetSession,
      participants: isWaitlist ? targetSession.participants : [...targetSession.participants, newStudent],
      waitlist: isWaitlist ? [...targetSession.waitlist, newStudent] : targetSession.waitlist
    };

    try {
      await updateSessionDoc(updatedSession);
      setActiveSessionId(null);
      setLastRegistered({ student: newStudent, session: targetSession, isWaitlist });
      setView('success');
    } catch (error) {
      alert("Registration failed. This usually happens if the database is in Locked Mode.");
    }
  };

  const getCancellationUrl = () => {
    if (!lastRegistered) return '';
    return `${window.location.origin}${window.location.pathname}?cancel=${lastRegistered.session.id}:${lastRegistered.student.id}`;
  };

  const getGoogleCalendarUrl = (session: DiscussionSession) => {
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('SLS Discussion: ' + session.faculty)}&details=${encodeURIComponent(session.topic || '')}&location=${encodeURIComponent(session.location)}`;
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Permission Error Banner */}
      {error && (error.code === 'permission-denied') && (
        <div className="bg-rose-600 border-b border-rose-700 p-6 sticky top-0 z-[60] shadow-2xl animate-in slide-in-from-top duration-500">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-center">
            <div className="bg-white/20 p-3 rounded-2xl text-white">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m0-6V7m0 11.333V21m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 text-white">
              <h3 className="text-xl font-black mb-1 tracking-tight">Database Locked (Permission Denied)</h3>
              <p className="text-rose-100 text-sm mb-4">
                You must update your **Firestore Security Rules** in the Firebase Console to allow the app to work.
              </p>
              <div className="relative group max-w-lg">
                <pre className="bg-rose-950 text-rose-200 p-4 rounded-xl text-[10px] font-mono overflow-x-auto border border-rose-800 shadow-inner">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                </pre>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`);
                    alert("Rules copied to clipboard!");
                  }}
                  className="absolute top-2 right-2 bg-white text-rose-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all shadow-sm"
                >
                  Copy Rules
                </button>
              </div>
            </div>
            <a 
              href="https://console.firebase.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-rose-600 font-black rounded-xl hover:scale-105 transition-all text-sm uppercase tracking-widest shadow-lg"
            >
              Open Firebase Console
            </a>
          </div>
        </div>
      )}

      {promotionNotify && (
        <PromotionEmailModal 
          student={promotionNotify.student}
          session={promotionNotify.session}
          onClose={() => setPromotionNotify(null)}
        />
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-900 tracking-tight leading-tight">
                SLS Levin Center
              </h1>
              <h2 className="text-lg md:text-xl font-bold text-slate-500 tracking-tight">
                Faculty Small Group Discussions
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('browse')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view !== 'admin' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Browse
              </button>
              {isAdminMode && (
                <button 
                  onClick={() => setView('admin')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    view === 'admin' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {view === 'browse' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {sessions.map(session => (
              <SessionCard key={session.id} session={session} onSignUp={handleSignUpClick} />
            ))}
            {sessions.length === 0 && !error && (
              <div className="col-span-full py-20 text-center">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Connecting to Cloud Firestore...</p>
              </div>
            )}
            {sessions.length === 0 && error && error.code !== 'permission-denied' && (
              <div className="col-span-full py-20 text-center">
                <div className="bg-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Service Offline</h3>
                <p className="text-slate-500 max-w-sm mx-auto italic">{error.message}</p>
              </div>
            )}
          </div>
        )}

        {view === 'canceled' && (
          <div className="max-w-xl mx-auto text-center py-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Registration Vacated</h2>
            <p className="text-lg text-slate-600 mb-10">Your spot has been successfully removed and the next student notified.</p>
            <button onClick={() => setView('browse')} className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100">Return Home</button>
          </div>
        )}

        {view === 'success' && lastRegistered && (
          <div className="max-w-4xl mx-auto animate-in zoom-in duration-500">
            <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-slate-200 text-center">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                 </svg>
               </div>
               <h2 className="text-4xl font-black text-indigo-950 mb-4 tracking-tight">Registration Complete</h2>
               <p className="text-xl text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
                 You are all set for the session with <strong>{lastRegistered.session.faculty}</strong>.
                 <br/><br/>
                 <span className="font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">Please Note: No confirmation email will be sent.</span>
               </p>
               
               <div className="bg-amber-50 rounded-3xl p-8 mb-10 text-left border border-amber-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    CRITICAL: Save Your Cancellation Link
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed mb-4">
                    Since you will not receive an email, you <strong>must save the link below</strong>. It is the only way to cancel your registration if you cannot attend.
                  </p>
                  <div className="bg-white/60 p-4 rounded-xl font-mono text-xs break-all text-amber-800 border border-amber-200/50 select-all flex justify-between items-center gap-4">
                    <span>{getCancellationUrl()}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(getCancellationUrl());
                        alert("Link copied to clipboard!");
                      }}
                      className="bg-white/50 hover:bg-white text-amber-700 p-2 rounded-lg transition-colors"
                      title="Copy to Clipboard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
               </div>
               
               <button onClick={() => setView('browse')} className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-105">Back to Browse</button>
            </div>
          </div>
        )}

        {view === 'admin' && isAdminMode && (
          <ParticipantList 
            sessions={sessions} 
            onReset={handleReset} 
            onSeed={seedDatabase}
            onAddSession={addSessionDoc}
            onUpdateSession={updateSessionDetails}
            onDeleteSession={deleteSessionDoc}
            onRemoveParticipant={performRemoval}
          />
        )}
      </main>

      {activeSession && (
        <SignUpForm 
          session={activeSession} 
          onSubmit={handleRegistrationSubmit} 
          onCancel={() => setActiveSessionId(null)} 
        />
      )}
    </div>
  );
};

export default App;
