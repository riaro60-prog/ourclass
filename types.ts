
export interface Student {
  id: string;
  name: string;
  stickers: number;
  number: number;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'holiday' | 'event' | 'exam' | 'other';
}

export interface ClassNote {
  id: string;
  date: string;
  content: string;
}

export type ViewType = 'dashboard' | 'calendar' | 'students' | 'notes' | 'ai-helper';
