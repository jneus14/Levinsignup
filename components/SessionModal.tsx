
import React, { useState, useEffect } from 'react';
import { DiscussionSession } from '../types';

interface SessionModalProps {
  initialSession?: DiscussionSession;
  onSave: (session: DiscussionSession) => void;
  onClose: () => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({ initialSession, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    faculty: '',
    topic: '',
    date: '',
    time: '',
    location: '',
    capacity: '10',
    isUnlimited: false
  });

  useEffect(() => {
    if (initialSession) {
      setFormData({
        faculty: initialSession.faculty,
        topic: initialSession.topic || '',
        date: initialSession.date,
        time: initialSession.time,
        location: initialSession.location,
        capacity: initialSession.capacity.toString(),
        isUnlimited: !!initialSession.isUnlimited
      });
    }
  }, [initialSession]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse capacity safely
    let parsedCapacity = parseInt(formData.capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity < 0) {
      parsedCapacity = 0;
    }

    const sessionData: DiscussionSession = {
      id: initialSession?.id || Math.random().toString(36).substr(2, 9),
      faculty: formData.faculty,
      topic: formData.topic || undefined,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      capacity: parsedCapacity,
      isUnlimited: formData.isUnlimited,
      participants: initialSession?.participants || [],
      waitlist: initialSession?.waitlist || []
    };
    onSave(sessionData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-stone-900">
            {initialSession ? 'Edit Discussion' : 'Create New Discussion'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-stone-700 mb-1">Faculty Member</label>
              <input
                required
                type="text"
                placeholder="e.g. Jennifer Chacon"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                value={formData.faculty}
                onChange={e => setFormData({...formData, faculty: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-stone-700 mb-1">Topic (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Immigration Policy"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Date</label>
              <input
                required
                type="text"
                placeholder="e.g. April 16"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Time</label>
              <input
                required
                type="text"
                placeholder="e.g. 12:45 - 2:00 PM"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                value={formData.time}
                onChange={e => setFormData({...formData, time: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-stone-700 mb-1">Location</label>
              <input
                required
                type="text"
                placeholder="e.g. SLS Room 180"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-800 outline-none"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-stone-700 mb-1">Capacity</label>
              <input
                disabled={formData.isUnlimited}
                type="number"
                min="0"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-red-800 outline-none disabled:bg-stone-50 disabled:text-stone-400"
                value={formData.capacity}
                onChange={e => setFormData({...formData, capacity: e.target.value})}
              />
            </div>
            <div className="col-span-1 flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-red-800 rounded focus:ring-red-800"
                  checked={formData.isUnlimited}
                  onChange={e => setFormData({...formData, isUnlimited: e.target.checked})}
                />
                <span className="text-sm font-medium text-stone-700">Unlimited Spots</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 font-semibold shadow-lg shadow-red-200"
            >
              {initialSession ? 'Save Changes' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
