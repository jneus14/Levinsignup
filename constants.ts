
import { DiscussionSession } from './types';

export const INITIAL_SESSIONS: DiscussionSession[] = [
  {
    id: 'brest-2025',
    faculty: 'Paul Brest',
    topic: 'Restrictions on academic freedom by state legislatures and the Trump administration',
    date: 'February 18',
    time: '2:00 PM',
    location: 'SLS',
    capacity: 10,
    participants: [],
    waitlist: []
  },
  {
    id: 'fisher-2025',
    faculty: 'George Fisher',
    date: 'Thursday, March 5',
    time: '11:30 AM - 1:00 PM',
    location: 'SLS',
    capacity: 0,
    participants: [],
    waitlist: []
  },
  {
    id: 'chacon-2025',
    faculty: 'Jennifer Chacon',
    topic: 'immigration enforcement; immigration policy',
    date: 'April 16',
    time: '12:45 - 2:00 PM',
    location: 'SLS',
    capacity: 10,
    isUnlimited: true,
    participants: [],
    waitlist: []
  },
  {
    id: 'mcconnell-2025',
    faculty: 'Michael McConnell',
    date: 'TBD',
    time: 'TBD',
    location: 'Faculty Residence (His Home)',
    capacity: 0,
    participants: [],
    waitlist: []
  }
];

export const STORAGE_KEY = 'faculty_discussion_signups_v1';
