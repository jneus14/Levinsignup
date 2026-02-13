import React, { useState } from 'react';
import { DiscussionSession, Student } from '../types.ts';
import { SessionModal } from './SessionModal.tsx';
import { getSessionInsights } from '../services/gemini.ts';

interface ParticipantListProps {
  sessions: DiscussionSession[];
  onReset: () => void;
  onAddSession: (session: DiscussionSession) => void;
  onUpdateSession: (session: DiscussionSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onRemoveParticipant: (sessionId: string, studentId: string, listType: 'participants' | 'waitlist') => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ 
  sessions, 
  onReset, 
  onAddSession, 
  onUpdateSession,
  onDeleteSession,
  onRemoveParticipant
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<DiscussionSession | undefined>(undefined);
  const [insights, setInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const getBaseUrl = () => {
    return window.location.origin + window.location.pathname;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEditClick = (session: DiscussionSession) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (session: DiscussionSession) => {
    if (window.confirm(`Are you sure you want to delete the session for ${session.faculty}? This will also delete all registered students and waitlist data.`)) {
      onDeleteSession(session.id);
    }
  };

  const handleRemoveClick = (sessionId: string, student: Student, listType: 'participants' | 'waitlist') => {
    const listLabel = listType === 'participants' ? 'active roster' : 'waitlist';
    if (window.confirm(`Remove ${student.name} from the ${listLabel}? If removed from the roster, the next student on the waitlist will be automatically promoted.`)) {
      onRemoveParticipant(sessionId, student.id, listType);
    }
  };

  const handleAddClick = () => {
    setEditingSession(undefined);
    setIsModalOpen(true);
  };

  const handleSave = (session: DiscussionSession) => {
    if (editingSession) {
      onUpdateSession(session);
    } else {
      onAddSession(session);
    }
    setIsModalOpen(false);
  };

  const handleGenerateAIInsights = async () => {
    setIsGeneratingInsights(true);
    const result = await getSessionInsights(sessions);
    setInsights(result);
    setIsGeneratingInsights(false);
  };

  const publicUrl = getBaseUrl();
  const adminUrl = `${publicUrl}?admin=true`;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 animate-in slide-in-from-bottom duration-500 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
          <p className="text-slate-500">Manage registrations and share links</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAddClick}
            className="px-4 py-2 text-sm font-semibold bg-rose-900 text-white rounded-lg hover:bg-rose-950 transition-colors shadow-md"
          >
            + Add New Session
          </button>
          <button 
            onClick={onReset}
            className="px-4 py-2 text-sm font-semibold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Reset App
          </button>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Roster Intelligence
            </h3>
            <button 
              onClick={handleGenerateAIInsights}
              disabled={isGeneratingInsights || sessions.length === 0}
              className="px-4 py-1.5 bg-rose-900 hover:bg-rose-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg"
            >
              {isGeneratingInsights ? 'Analyzing...' : insights ? 'Update Analysis' : 'Generate Analysis'}
            </button>
          </div>
          
          {insights ? (
            <div className="bg-white/10 rounded-xl p-4 border border-white/10 animate-in fade-in zoom-in duration-300">
              <p className="text-sm text-rose-50 leading-relaxed italic">"{insights}"</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Request an AI-powered executive summary of current enrollment trends and popular faculty sessions.</p>
          )}
        </div>
      </div>

      <div className="bg-rose-950 text-white rounded-2xl shadow-lg p-6 overflow-hidden relative border border-rose-900">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Links
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-xs font-bold text-rose-200 uppercase tracking-widest mb-2">Student Signup Link (Public)</p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm truncate text-rose-50">{publicUrl}</code>
                <button 
                  onClick={() => copyToClipboard(publicUrl, 'public')}
                  className="shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy Link"
                >
                  {copied === 'public' ? (
                    <span className="text-xs font-bold text-emerald-300">Copied!</span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-xs font-bold text-rose-200 uppercase tracking-widest mb-2">Admin Dashboard Link (Secret)</p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm truncate text-rose-50">{adminUrl}</code>
                <button 
                  onClick={() => copyToClipboard(adminUrl, 'admin')}
                  className="shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy Link"
                >
                  {copied === 'admin' ? (
                    <span className="text-xs font-bold text-emerald-300">Copied!</span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-12">
        {sessions.map(session => (
          <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{session.faculty}</h3>
                <p className="text-sm text-slate-500">{session.date} &bull; Capacity: {session.isUnlimited ? 'Unlimited' : session.capacity}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-2">
                  <p className="text-xs font-bold uppercase text-slate-400">Status</p>
                  <p className={`text-sm font-bold ${(!session.isUnlimited && session.participants.length >= session.capacity) ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {(!session.isUnlimited && session.participants.length >= session.capacity) ? 'FULL' : 'OPEN'}
                  </p>
                </div>
                <div className="flex gap-1 border-l pl-3 border-slate-200">
                  <button 
                    onClick={() => handleEditClick(session)}
                    className="p-2 text-slate-400 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Edit Event Details"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(session)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Event"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Participants ({session.participants.length}{session.isUnlimited ? '' : `/${session.capacity}`})
                  </h4>
                  {!session.isUnlimited && (
                    <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-900 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (session.participants.length / session.capacity) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <ul className="space-y-3">
                  {session.participants.length === 0 ? (
                    <li className="text-sm text-slate-400 italic">No registrations yet.</li>
                  ) : (
                    session.participants.map((p, idx) => (
                      <li key={p.id} className="group flex justify-between text-sm items-center py-1">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-900 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-700">{p.name}</p>
                              {p.isPromoted && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-tight ring-1 ring-emerald-200">
                                  Promoted
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-tight">
                                {p.classYear}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{p.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <button 
                            onClick={() => handleRemoveClick(session.id, p, 'participants')}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                            title="Remove Student and Promote Waitlist"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="border-l border-slate-100 pl-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Waitlist ({session.waitlist.length})
                </h4>
                <ul className="space-y-3">
                  {session.waitlist.length === 0 ? (
                    <li className="text-sm text-slate-400 italic">Waitlist is empty.</li>
                  ) : (
                    session.waitlist.map((p, idx) => (
                      <li key={p.id} className="group flex justify-between text-sm items-center py-1">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-700 flex items-center gap-2">
                              {p.name}
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-tight">
                                {p.classYear}
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-400">{p.email}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveClick(session.id, p, 'waitlist')}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                          title="Remove from Waitlist"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No sessions found. Create one to get started!</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <SessionModal 
          initialSession={editingSession}
          onSave={handleSave} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};