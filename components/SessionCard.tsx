
import React from 'react';
import { DiscussionSession } from '../types';

interface SessionCardProps {
  session: DiscussionSession;
  onSignUp: (sessionId: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onSignUp }) => {
  const totalRegistered = session.participants.length;
  const isFull = !session.isUnlimited && totalRegistered >= session.capacity;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-stone-900 leading-tight">
            {session.faculty}
          </h3>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
            isFull ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-800'
          }`}>
            {isFull 
              ? 'Waitlist Only' 
              : session.isUnlimited 
                ? 'Registration Open' 
                : `${session.capacity - totalRegistered} Spots Left`}
          </span>
        </div>

        {session.topic && (
          <div className="mb-4">
            <p className="text-stone-600 text-sm leading-relaxed">
              <span className="font-bold text-stone-900">Topic:</span> {session.topic}
            </p>
          </div>
        )}

        <div className="space-y-2 mb-6 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{session.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{session.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{session.location}</span>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={() => onSignUp(session.id)}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm flex items-center justify-center gap-2 ${
              isFull 
              ? 'bg-stone-800 text-white hover:bg-stone-900' 
              : 'bg-red-800 text-white hover:bg-red-900'
            }`}
          >
            {isFull ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Join Waitlist
              </>
            ) : (
              'Sign Up Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
