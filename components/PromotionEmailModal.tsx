
import React from 'react';
import { Student, DiscussionSession } from '../types';

interface PromotionEmailModalProps {
  student: Student;
  session: DiscussionSession;
  onClose: () => void;
}

export const PromotionEmailModal: React.FC<PromotionEmailModalProps> = ({ student, session, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="max-w-2xl w-full animate-in zoom-in slide-in-from-bottom-8 duration-500">
        {/* System Notification Header */}
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-3xl flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Automatic System Action: Promotion Email Sent</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Content Container */}
        <div className="bg-white rounded-b-3xl shadow-2xl overflow-hidden border-x-4 border-b-4 border-emerald-600/10">
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
                <span className="text-sm font-black text-indigo-900 uppercase tracking-tight">Confirmed: You've been promoted to the discussion with {session.faculty}</span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-8 md:p-12 font-serif text-slate-800 leading-relaxed text-lg">
            <p className="mb-6">Dear {student.name},</p>
            
            <p className="mb-6">
              Good news! A spot has opened up for the faculty small group discussion with <strong>{session.faculty}</strong>, 
              and you have been automatically moved from the waitlist to the <strong>active registration roster</strong>.
            </p>

            <div className="bg-indigo-50/50 rounded-2xl p-6 border-l-4 border-indigo-600 mb-8 not-italic font-sans">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Event Reminders</h4>
              <div className="space-y-2 text-base font-bold text-indigo-950">
                <p>Date: {session.date}</p>
                <p>Time: {session.time}</p>
                <p>Location: {session.location}</p>
              </div>
            </div>

            <p className="mb-10">
              We look forward to seeing you there. If your plans have changed and you can no longer attend, 
              please use your personal cancellation link to vacate the spot for the next student.
            </p>

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
              className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-black transition-all shadow-lg"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
