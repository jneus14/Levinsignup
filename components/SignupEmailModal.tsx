import React from 'react';
import { Student, DiscussionSession } from '../types';

interface SignupEmailModalProps {
  student: Student;
  session: DiscussionSession;
  isWaitlist: boolean;
  cancelUrl: string;
  calendarUrl: string;
  onClose: () => void;
}

export const SignupEmailModal: React.FC<SignupEmailModalProps> = ({ 
  student, 
  session, 
  isWaitlist, 
  cancelUrl, 
  calendarUrl,
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto font-sans">
      <div className="max-w-2xl w-full animate-in zoom-in slide-in-from-bottom-8 duration-500">
        {/* System Notification Header */}
        <div className="bg-rose-900 text-white px-6 py-4 rounded-t-3xl flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-800 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Automatic System Action: Confirmation Email Sent</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Content Container */}
        <div className="bg-white rounded-b-3xl shadow-2xl overflow-hidden border-x-4 border-b-4 border-rose-900/10">
          {/* Email Headers */}
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="space-y-3">
              <div className="flex">
                <span className="w-20 text-xs font-black text-slate-400 uppercase tracking-widest">From:</span>
                <span className="text-sm font-bold text-slate-700">Levin Center <span className="text-slate-400 font-medium">&lt;levincenter@law.stanford.edu&gt;</span></span>
              </div>
              <div className="flex">
                <span className="w-20 text-xs font-black text-slate-400 uppercase tracking-widest">To:</span>
                <span className="text-sm font-bold text-slate-700">{student.name} <span className="text-slate-400 font-medium">&lt;{student.email}&gt;</span></span>
              </div>
              <div className="flex">
                <span className="w-20 text-xs font-black text-slate-400 uppercase tracking-widest">Subject:</span>
                <span className="text-sm font-black text-rose-950 uppercase tracking-tight">
                  {isWaitlist ? 'Waitlist Confirmation' : 'Registration Confirmed'}: Discussion with {session.faculty}
                </span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-8 md:p-12 font-serif text-slate-800 leading-relaxed text-lg">
            <p className="mb-6">Dear {student.name},</p>
            
            <p className="mb-6">
              Thank you for signing up for the faculty small group discussion with <strong>{session.faculty}</strong>. 
              {isWaitlist 
                ? " You have been added to the waitlist. We will notify you automatically if a spot becomes available."
                : " Your spot is confirmed."}
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 border-l-4 border-slate-300 mb-8 not-italic font-sans">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Session Details</h4>
                  <div className="space-y-2 text-base font-bold text-slate-900">
                    <p>Date: {session.date}</p>
                    <p>Time: {session.time}</p>
                    <p>Location: {session.location}</p>
                  </div>
                </div>
                {!isWaitlist && (
                  <a 
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-rose-900 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-md hover:bg-rose-950 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Add to Calendar
                  </a>
                )}
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-100 mb-8 not-italic font-sans">
              <h4 className="text-xs font-black text-amber-600 uppercase tracking-[0.2em] mb-3">Important: Cancellation Policy</h4>
              <p className="text-sm text-amber-800 leading-relaxed mb-4">
                Space in these discussions is extremely limited. If you can no longer attend, you <strong>must</strong> use your unique cancellation link so that we can promote a student from the waitlist.
              </p>
              <div className="bg-white border border-amber-200 rounded-xl p-3 font-mono text-[13px] break-all text-amber-700 shadow-inner">
                {cancelUrl}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8 italic text-slate-500 text-sm">
              <p>Best regards,</p>
              <p className="font-bold text-slate-900 not-italic mt-1">Levin Center for Public Service & Public Interest Law</p>
              <p>Stanford Law School</p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-rose-950 text-white font-black rounded-xl hover:bg-black transition-all shadow-lg"
            >
              Continue to Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};