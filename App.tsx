
import React, { useState, useEffect, useCallback } from 'react';
import { DiscussionSession, ViewState, Student } from './types';
import { SessionCard } from './components/SessionCard';
import { SignUpForm } from './components/SignUpForm';
import { ParticipantList } from './components/ParticipantList';
import { PromotionEmailModal } from './components/PromotionEmailModal';
import { SignupEmailModal } from './components/SignupEmailModal';
import { subscribeToSessions, updateSessionDoc, seedDatabase, deleteSessionDoc, addSessionDoc, clearDatabase } from './services/firebase';

const ADMIN_PASSCODE = "levin2025";

const App: React.FC = () => {
  const [sessions, setSessions] = useState<DiscussionSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('browse'); 
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastRegistered, setLastRegistered] = useState<{ 
    student: Student;
    session: DiscussionSession; 
    isWaitlist: boolean;
  } | null>(null);
  
  // Auth state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [authError, setAuthError] = useState(false);

  const [promotionNotify, setPromotionNotify] = useState<{ student: Student; session: DiscussionSession } | null>(null);
  const [showSignupEmail, setShowSignupEmail] = useState(false);

  // Initialize and check URL params for cancellation
  const connectToDatabase = useCallback(async () => {
    setIsRetrying(true);
    try {
      await seedDatabase();
      setError(null);
      const unsubscribe = subscribeToSessions(
        (data) => {
          setSessions(data);
          setError(null);
          setIsRetrying(false);
        },
        (err) => {
          console.error("Subscription Error:", err);
          setError({ 
            message: err.code === 'permission-denied'
              ? "Database is locked. Security rules update required."
              : "Real-time updates failed. Check your internet connection.", 
            code: err.code 
          });
          setIsRetrying(false);
        }
      );
      return unsubscribe;
    } catch (e: any) {
      console.error("Initialization Error:", e);
      setError({ 
        message: e.code === 'permission-denied' 
          ? "Access denied. Please check your Firestore Security Rules." 
          : "Failed to connect to Firestore service. Ensure the project is active.", 
        code: e.code 
      });
      setIsRetrying(false);
      return () => {};
    }
  }, []);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    const init = async () => {
      const unsub = await connectToDatabase();
      if (unsub) unsubscribe = unsub;
    };
    init();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [connectToDatabase]);

  // Handle URL parameters for Admin and Cancellation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Admin check
    if (params.has('admin')) {
      setIsAdminMode(true);
      if (isAuthenticated) setView('admin');
    }

    // Cancellation check: ?cancel=sessionId:studentId
    const cancelParam = params.get('cancel');
    if (cancelParam && sessions.length > 0) {
      const [sessionId, studentId] = cancelParam.split(':');
      if (sessionId && studentId) {
        handleCancellation(sessionId, studentId);
        // Clear params after handling
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [sessions.length, isAuthenticated]);

  const handleCancellation = async (sessionId: string, studentId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    let isParticipant = session.participants.some(p => p.id === studentId);
    let isWaitlist = session.waitlist.some(p => p.id === studentId);

    if (isParticipant) {
      await performRemoval(sessionId, studentId, 'participants');
      setView('canceled');
    } else if (isWaitlist) {
      await performRemoval(sessionId, studentId, 'waitlist');
      setView('canceled');
    }
  };

  const performRemoval = async (sessionId: string, studentId: string, listType: 'participants' | 'waitlist') => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    let newParticipants = [...session.participants];
    let newWaitlist = [...session.waitlist];

    if (listType === 'participants') {
      newParticipants = newParticipants.filter(p => p.id !== studentId);
      // Promote from waitlist if not unlimited and below capacity
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

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeAttempt === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setView('admin');
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasscodeAttempt('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setView('browse');
    window.history.replaceState({}, '', window.location.pathname);
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
      setShowSignupEmail(true);
    } catch (error) {
      alert("Registration failed. Please try again later.");
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
  const visibleSessions = sessions.filter(session => session.isActive !== false);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans flex flex-col">
      {error && (
        <div className="bg-rose-600 border-b border-rose-700 p-6 sticky top-0 z-[60] shadow-2xl animate-in slide-in-from-top duration-500">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-center">
            <div className="bg-white/20 p-3 rounded-2xl text-white">
              <svg className={`w-8 h-8 ${isRetrying ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m0-6V7m0 11.333V21m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1 text-white">
              <h3 className="text-xl font-black mb-1 tracking-tight">Database Connectivity Alert</h3>
              <p className="text-rose-100 text-sm">{error.message}</p>
            </div>
            <button 
              onClick={() => connectToDatabase()}
              disabled={isRetrying}
              className="px-6 py-3 bg-white text-rose-600 font-black rounded-xl hover:scale-105 transition-all text-sm uppercase tracking-widest shadow-lg"
            >
              {isRetrying ? 'Retrying...' : 'Retry Connection'}
            </button>
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

      {showSignupEmail && lastRegistered && (
        <SignupEmailModal 
          student={lastRegistered.student}
          session={lastRegistered.session}
          isWaitlist={lastRegistered.isWaitlist}
          cancelUrl={getCancellationUrl()}
          calendarUrl={getGoogleCalendarUrl(lastRegistered.session)}
          onClose={() => setShowSignupEmail(false)}
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
                  view === 'browse' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Browse
              </button>
              {(isAdminMode || isAuthenticated) && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (isAuthenticated) setView('admin');
                      else setIsAdminMode(true);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      view === 'admin' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Admin
                  </button>
                  {isAuthenticated && (
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Logout"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 flex-grow w-full">
        {view === 'browse' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {visibleSessions.map(session => (
              <SessionCard key={session.id} session={session} onSignUp={handleSignUpClick} />
            ))}
            {visibleSessions.length === 0 && !error && (
              <div className="col-span-full py-20 text-center">
                {sessions.length > 0 ? (
                    <p className="text-slate-500 font-medium">No active sessions available at the moment.</p>
                ) : (
                    <>
                        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Connecting to Cloud Firestore...</p>
                    </>
                )}
              </div>
            )}
          </div>
        )}

        {(isAdminMode || view === 'admin') && !isAuthenticated && (
          <div className="max-w-md mx-auto py-20 animate-in fade-in zoom-in duration-500">
            <div className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-200">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m0-6V7m0 11.333V21m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-center text-slate-900 mb-2">Admin Access</h2>
              <p className="text-slate-500 text-center mb-8">Please enter the administrative passcode to continue.</p>
              
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder="Enter Passcode"
                    className={`w-full px-5 py-3 border-2 rounded-2xl outline-none transition-all font-semibold text-center tracking-widest ${
                      authError ? 'border-rose-300 bg-rose-50' : 'border-slate-100 focus:border-indigo-500'
                    }`}
                    value={passcodeAttempt}
                    onChange={(e) => {
                      setPasscodeAttempt(e.target.value);
                      setAuthError(false);
                    }}
                    autoFocus
                  />
                  {authError && <p className="text-rose-600 text-[10px] font-black uppercase text-center mt-2 tracking-widest">Incorrect Passcode</p>}
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-sm"
                >
                  Unlock Dashboard
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsAdminMode(false);
                    setView('browse');
                  }}
                  className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

        {view === 'admin' && isAuthenticated && (
          <ParticipantList 
            sessions={sessions} 
            onReset={handleReset} 
            onAddSession={addSessionDoc}
            onUpdateSession={updateSessionDoc}
            onDeleteSession={deleteSessionDoc}
            onRemoveParticipant={performRemoval}
          />
        )}

        {view === 'success' && lastRegistered && (
          <div className="max-w-4xl mx-auto animate-in zoom-in duration-500">
            <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-slate-200 text-center">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                 </svg>
               </div>
               <h2 className="text-4xl font-black text-indigo-950 mb-4 tracking-tight">
                 {lastRegistered.isWaitlist ? 'Waitlist Confirmed' : 'Registration Complete'}
               </h2>
               <p className="text-xl text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed">
                 {lastRegistered.isWaitlist 
                   ? `You've been added to the waitlist for the session with `
                   : `You are all set for the session with `
                 }
                 <strong>{lastRegistered.session.faculty}</strong>.
               </p>
               
               <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-sm mx-auto">
                 {!lastRegistered.isWaitlist && (
                   <a 
                    href={getGoogleCalendarUrl(lastRegistered.session)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-105 flex items-center justify-center gap-2"
                   >
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                     Add to Google Calendar
                   </a>
                 )}
                 <button 
                  onClick={() => setView('browse')} 
                  className={`w-full px-8 py-4 font-black rounded-2xl transition-all hover:scale-105 ${
                    lastRegistered.isWaitlist 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                 >
                   Back to Browse
                 </button>
               </div>
            </div>
          </div>
        )}

        {view === 'canceled' && (
          <div className="max-w-xl mx-auto text-center py-20 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Registration Vacated</h2>
            <p className="text-lg text-slate-600 mb-10">Your spot has been successfully removed and the waitlist updated.</p>
            <button onClick={() => setView('browse')} className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 transition-all uppercase tracking-widest text-sm">Return Home</button>
          </div>
        )}
      </main>

      <footer className="mt-auto py-12 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm font-medium">© 2025 Stanford Law School Levin Center</p>
          <div className="flex gap-6">
            <button 
              onClick={() => {
                if (isAuthenticated) setView('admin');
                else setIsAdminMode(true);
              }}
              className="text-slate-300 hover:text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] transition-colors"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

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
