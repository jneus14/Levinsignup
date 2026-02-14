
export interface Student {
  id: string;
  name: string;
  email: string;
  classYear: string;
  timestamp: number;
  isPromoted?: boolean; // New flag to track if student came from waitlist
}

export interface DiscussionSession {
  id: string;
  faculty: string;
  topic?: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  isUnlimited?: boolean;
  isActive?: boolean; // Controls whether the session is visible to students
  participants: Student[];
  waitlist: Student[];
}

// Added 'canceled' to ViewState to reflect the view state used in App.tsx
export type ViewState = 'browse' | 'success' | 'admin' | 'canceled';