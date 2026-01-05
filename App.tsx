
import React, { useState, useEffect } from 'react';
import { Student, CalendarEvent, ViewType, ClassNote } from './types.ts';
import Calendar from './components/Calendar.tsx';
import StudentList from './components/StudentList.tsx';
import { getEncouragementMessage, getAIClassSuggestions } from './services/geminiService.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('dreamy-students');
    return saved ? JSON.parse(saved) : [];
  });
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('dreamy-events');
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState<ClassNote[]>(() => {
    const saved = localStorage.getItem('dreamy-notes');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [encouragement, setEncouragement] = useState('오늘도 우리 아이들과 행복한 시간 보내세요! 🎈');
  const [aiTopic, setAiTopic] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sync data to localStorage
  useEffect(() => {
    localStorage.setItem('dreamy-students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('dreamy-events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('dreamy-notes', JSON.stringify(notes));
  }, [notes]);

  // Initial greeting
  useEffect(() => {
    const fetchGreeting = async () => {
      const msg = await getEncouragementMessage();
      setEncouragement(msg);
    };
    fetchGreeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddStudent = (name: string, number: number) => {
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name,
      number,
      stickers: 0
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleUpdateStickers = (id: string, amount: number) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, stickers: Math.max(0, s.stickers + amount) } : s));
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm('정말 삭제할까요?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleAddEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      ...eventData
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleAskAi = async () => {
    if (!aiTopic) return;
    setIsAiLoading(true);
    const response = await getAIClassSuggestions(aiTopic);
    setAiResponse(response);
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-64 flex flex-col bg-[#fff9f0]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r-4 border-orange-100 p-6 z-20">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-gaegu font-bold text-orange-500 mb-1">🌈 꿈꾸는 교실</h1>
          <p className="text-xs text-gray-400">함께 성장하는 우리 반</p>
        </div>
        
        <nav className="flex flex-col gap-4">
          <NavItem 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
            icon="🏠" 
            label="홈 대시보드" 
            color="bg-blue-50 text-blue-600"
          />
          <NavItem 
            active={currentView === 'calendar'} 
            onClick={() => setCurrentView('calendar')} 
            icon="📅" 
            label="2026 학사일정" 
            color="bg-orange-50 text-orange-600"
          />
          <NavItem 
            active={currentView === 'students'} 
            onClick={() => setCurrentView('students')} 
            icon="⭐" 
            label="칭찬 스티커" 
            color="bg-pink-50 text-pink-600"
          />
          <NavItem 
            active={currentView === 'ai-helper'} 
            onClick={() => setCurrentView('ai-helper')} 
            icon="🪄" 
            label="AI 교실 도우미" 
            color="bg-purple-50 text-purple-600"
          />
        </nav>

        <div className="mt-auto bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-200">
          <p className="text-sm font-gaegu text-yellow-700 leading-relaxed italic">
            "{encouragement}"
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full">
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header>
              <h2 className="text-4xl font-gaegu font-bold text-gray-800 mb-2">선생님, 반가워요! 👋</h2>
              <p className="text-lg text-gray-500">오늘은 어떤 재미있는 일들이 생길까요?</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Today's Stats Card */}
              <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-blue-100 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">🏫</div>
                <h3 className="text-2xl font-gaegu font-bold text-blue-600 mb-2">우리 반 현황</h3>
                <div className="space-y-1">
                  <p className="text-gray-600">등록된 학생: <span className="font-bold">{students.length}명</span></p>
                  <p className="text-gray-600">이번 달 일정: <span className="font-bold">{events.filter(e => e.date.startsWith('2026-03')).length}건</span></p>
                </div>
              </div>

              {/* Top Sticker Card */}
              <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-yellow-100 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-2xl font-gaegu font-bold text-yellow-600 mb-2">칭찬 왕!</h3>
                {students.length > 0 ? (
                  <div>
                    <p className="text-xl font-bold text-gray-800">{students.reduce((prev, current) => (prev.stickers > current.stickers) ? prev : current).name} 학생</p>
                    <p className="text-gray-500">대단해요! 박수를 보냅니다!</p>
                  </div>
                ) : (
                  <p className="text-gray-400">아직 등록된 학생이 없어요</p>
                )}
              </div>

              {/* Fast Add Memo */}
              <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-green-100 flex flex-col">
                <h3 className="text-2xl font-gaegu font-bold text-green-600 mb-4 text-center">💡 오늘의 한마디</h3>
                <div className="bg-green-50 p-4 rounded-2xl flex-1 flex items-center justify-center italic text-green-800 text-center">
                  "모든 아이는 저마다의 빛을 가지고 태어납니다."
                </div>
              </div>
            </div>

            {/* Upcoming Events Preview */}
            <section className="bg-white p-8 rounded-[40px] shadow-lg border-2 border-orange-50">
              <h3 className="text-2xl font-gaegu font-bold text-orange-600 mb-4">📅 다가오는 학사일정</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {events.length > 0 ? (
                  events.slice(0, 5).map(event => (
                    <div key={event.id} className="min-w-[200px] p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <p className="text-xs font-bold text-orange-400 mb-1">{event.date}</p>
                      <p className="font-bold text-gray-800">{event.title}</p>
                      <p className="text-[10px] text-orange-300 mt-2 uppercase">{event.type}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 py-10">등록된 일정이 없습니다.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {currentView === 'calendar' && (
          <div className="animate-in fade-in duration-300">
            <Calendar 
              events={events} 
              onAddEvent={handleAddEvent} 
              onDeleteEvent={handleDeleteEvent} 
            />
          </div>
        )}

        {currentView === 'students' && (
          <div className="animate-in fade-in duration-300">
            <StudentList 
              students={students} 
              onAddStudent={handleAddStudent} 
              onUpdateStickers={handleUpdateStickers} 
              onDeleteStudent={handleDeleteStudent}
            />
          </div>
        )}

        {currentView === 'ai-helper' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
              <h2 className="text-4xl font-gaegu font-bold text-purple-600 mb-2">🪄 마법의 AI 교실 도우미</h2>
              <p className="text-gray-500">학급 활동, 놀이, 상담 아이디어를 물어보세요!</p>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-purple-100">
              <div className="flex flex-col gap-4">
                <textarea 
                  placeholder="예: 초등학교 3학년 아이들과 할 수 있는 재미있는 실내 놀이 추천해줘" 
                  className="w-full h-32 p-4 border-2 border-purple-50 rounded-2xl focus:outline-none focus:border-purple-300 resize-none text-gray-700"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
                <button 
                  onClick={handleAskAi}
                  disabled={isAiLoading || !aiTopic}
                  className="w-full py-4 bg-purple-500 text-white rounded-2xl font-bold shadow-lg hover:bg-purple-600 transition-all disabled:bg-gray-200"
                >
                  {isAiLoading ? '반짝이는 아이디어를 생각 중이에요... ✨' : '아이디어 얻기!'}
                </button>
              </div>

              {aiResponse && (
                <div className="mt-8 p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 text-gray-700 leading-relaxed whitespace-pre-wrap font-gaegu text-xl">
                  {aiResponse}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t-2 border-orange-100 flex items-center justify-around px-4 z-20">
        <MobileNavItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon="🏠" label="홈" />
        <MobileNavItem active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} icon="📅" label="달력" />
        <MobileNavItem active={currentView === 'students'} onClick={() => setCurrentView('students')} icon="⭐" label="칭찬" />
        <MobileNavItem active={currentView === 'ai-helper'} onClick={() => setCurrentView('ai-helper')} icon="🪄" label="AI" />
      </nav>
    </div>
  );
};

// Sub-components for navigation
interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  color: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label, color }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${active ? `${color} font-bold shadow-md transform scale-105` : 'text-gray-500 hover:bg-gray-50'}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="font-gaegu text-xl">{label}</span>
  </button>
);

const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center ${active ? 'text-orange-500' : 'text-gray-400'}`}>
    <span className="text-2xl">{icon}</span>
    <span className="text-[10px] font-bold mt-1">{label}</span>
  </button>
);

export default App;
