
import React, { useState } from 'react';
import { DiscussionSession } from '../types';

interface SignUpFormProps {
  session: DiscussionSession;
  onSubmit: (name: string, email: string, classYear: string) => void;
  onCancel: () => void;
}

const CLASS_YEARS = ['1L', '2L', '3L', 'LLM', 'SPILS', 'JSD', 'Other'];

export const SignUpForm: React.FC<SignUpFormProps> = ({ session, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [classYear, setClassYear] = useState('');
  const isFull = !session.isUnlimited && session.participants.length >= session.capacity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim() && classYear) {
      onSubmit(name, email, classYear);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="my-8 bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className={`p-8 ${isFull ? 'bg-amber-50' : 'bg-indigo-50'}`}>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isFull ? 'Waitlist Registration' : 'Reserve Your Spot'}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Session with <strong>{session.faculty}</strong>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {isFull && (
            <div className="p-4 bg-amber-100 text-amber-800 rounded-2xl text-xs font-bold border border-amber-200 flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Note: This session is full. You will be added to position #{session.waitlist.length + 1} on the waitlist.
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-semibold placeholder:text-slate-300"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-semibold placeholder:text-slate-300"
              placeholder="jane.doe@stanford.edu"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Class Year</label>
            <div className="relative">
              <select
                required
                value={classYear}
                onChange={(e) => setClassYear(e.target.value)}
                className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-semibold appearance-none bg-white cursor-pointer"
              >
                <option value="" disabled>Select your year</option>
                {CLASS_YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-4 text-slate-500 rounded-2xl hover:bg-slate-50 transition-colors font-bold text-sm uppercase tracking-widest"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!classYear}
              className={`flex-[1.5] px-6 py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed ${
                isFull ? 'bg-slate-800 shadow-slate-200' : 'bg-indigo-600 shadow-indigo-100'
              }`}
            >
              {isFull ? 'Waitlist' : 'Sign-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
