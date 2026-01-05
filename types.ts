
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

export interface ClassData {
  students: Student[];
  events: CalendarEvent[];
  notes: ClassNote[];
  lastSync: string;
  cloudId?: string; // 클라우드 동기화를 위한 학급 고유 코드
}

export type ViewType = 'dashboard' | 'calendar' | 'students' | 'ai-helper' | 'sync';
