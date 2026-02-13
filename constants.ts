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
    isActive: true,
    participants: [],
    waitlist: []
  },
  {
    id: 'fisher-2025',
    faculty: 'George Fisher',
    date: 'Thursday, March 5',
    time: '11:30 AM - 1:00 PM',
    location: 'Coupa or Crocker',
    capacity: 0,
    isActive: true,
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
    isActive: true,
    participants: [],
    waitlist: []
  },
  {
    id: 'mcconnell-2025',
    faculty: 'Michael McConnell',
    date: 'to be scheduled with interested students',
    time: 'TBD',
    location: 'Faculty Residence (His Home)',
    capacity: 0,
    isActive: true,
    participants: [],
    waitlist: []
  }
];

export const STORAGE_KEY = 'faculty_discussion_signups_v1';