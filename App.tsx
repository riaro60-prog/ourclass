
import React, { useState, useEffect } from 'react';
import { Student, CalendarEvent, ViewType, ClassNote, ClassData } from './types.ts';
import Calendar from './components/Calendar.tsx';
import StudentList from './components/StudentList.tsx';
import SyncManager from './components/SyncManager.tsx';
import { getEncouragementMessage, getAIClassSuggestions } from './services/geminiService.ts';
import { syncService } from './services/syncService.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  
  // State Initialization
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
  const [cloudId, setCloudId] = useState<string>(() => {
    return localStorage.getItem('dreamy-cloud-id') || '';
  });
  
  const [encouragement, setEncouragement] = useState('오늘도 우리 아이들과 행복한 시간 보내세요! 🎈');
  const [aiTopic, setAiTopic] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // DB Initialization on Mount
  useEffect(() => {
    const sbUrl = localStorage.getItem('dreamy-sb-url');
    const sbKey = localStorage.getItem('dreamy-sb-key');
    if (sbUrl && sbKey) {
      syncService.init(sbUrl, sbKey);
    }
  }, []);

  // Persistence to LocalStorage
  useEffect(() => {
    localStorage.setItem('dreamy-students', JSON.stringify(students));
    localStorage.setItem('dreamy-events', JSON.stringify(events));
    localStorage.setItem('dreamy-notes', JSON.stringify(notes));
    localStorage.setItem('dreamy-cloud-id', cloudId);
  }, [students, events, notes, cloudId]);

  // Auto Cloud Sync (Debounced)
  useEffect(() => {
    if (cloudId) {
      const timeoutId = setTimeout(async () => {
        setIsCloudSyncing(true);
        const data: ClassData = { students, events, notes, lastSync: new Date().toISOString(), cloudId };
        await syncService.saveToCloud(cloudId, data);
        setIsCloudSyncing(false);
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [students, events, notes, cloudId]);

  useEffect(() => {
    const fetchGreeting = async () => {
      const msg = await getEncouragementMessage();
      setEncouragement(msg);
    };
    fetchGreeting();
  }, []);

  const handleImportData = (newData: ClassData) => {
    setStudents(newData.students || []);
    setEvents(newData.events || []);
    setNotes(newData.notes || []);
    if (newData.cloudId) setCloudId(newData.cloudId);
  };

  const currentClassData: ClassData = { students, events, notes, lastSync: new Date().toISOString(), cloudId };

  const handleAddStudent = (name: string, number: number) => {
    const newStudent: Student = { id: crypto.randomUUID(), name, number, stickers: 0 };
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
    const newEvent: CalendarEvent = { id: crypto.randomUUID(), ...eventData };
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
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-gray-400">우리 반 관리 도구</p>
            {isCloudSyncing && <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></span>}
          </div>
        </div>
        
        <nav className="flex flex-col gap-2">
          <NavItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon="🏠" label="홈 대시보드" color="bg-blue-50 text-blue-600" />
          <NavItem active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} icon="📅" label="2026 학사일정" color="bg-orange-50 text-orange-600" />
          <NavItem active={currentView === 'students'} onClick={() => setCurrentView('students')} icon="⭐" label="칭찬 스티커" color="bg-pink-50 text-pink-600" />
          <NavItem active={currentView === 'ai-helper'} onClick={() => setCurrentView('ai-helper')} icon="🪄" label="AI 교실 도우미" color="bg-purple-50 text-purple-600" />
          <NavItem active={currentView === 'sync'} onClick={() => setCurrentView('sync')} icon="☁️" label="클라우드 동기화" color="bg-sky-50 text-sky-600" />
        </nav>

        <div className="mt-auto bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-200">
          <p className="text-sm font-gaegu text-yellow-700 leading-relaxed italic">
            "{encouragement}"
          </p>
          {cloudId && <p className="mt-3 text-[10px] text-sky-400 font-bold">📡 연결: {cloudId}</p>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full">
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-gaegu font-bold text-gray-800 mb-2">선생님, 반가워요! 👋</h2>
                <p className="text-lg text-gray-500">오늘은 어떤 재미있는 일들이 생길까요?</p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-blue-100 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">🏫</div>
                <h3 className="text-2xl font-gaegu font-bold text-blue-600 mb-2">우리 반 현황</h3>
                <div className="space-y-1">
                  <p className="text-gray-600">학생 수: <span className="font-bold">{students.length}명</span></p>
                  <p className="text-gray-600">등록된 일정: <span className="font-bold">{events.length}건</span></p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-yellow-100 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-2xl font-gaegu font-bold text-yellow-600 mb-2">최고 칭찬 왕!</h3>
                {students.length > 0 ? (
                  <div>
                    <p className="text-xl font-bold text-gray-800">{students.reduce((prev, current) => (prev.stickers > current.stickers) ? prev : current).name} 학생</p>
                    <p className="text-gray-500">박수를 보내주세요! 🎉</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">학생을 등록해주세요.</p>
                )}
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-green-100 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">💡</div>
                <h3 className="text-2xl font-gaegu font-bold text-green-600 mb-2">오늘의 한마디</h3>
                <p className="text-sm italic text-gray-600 leading-relaxed px-4">"모두의 꿈이 예쁘게 자라나는 하루가 되길!"</p>
              </div>
            </div>
            
            <section className="bg-white p-8 rounded-[40px] shadow-lg border-2 border-orange-50">
              <h3 className="text-2xl font-gaegu font-bold text-orange-600 mb-4">📅 다가오는 학사일정</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {events.length > 0 ? (
                  events.slice(0, 5).map(event => (
                    <div key={event.id} className="min-w-[200px] p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <p className="text-xs font-bold text-orange-400 mb-1">{event.date}</p>
                      <p className="font-bold text-gray-800">{event.title}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 py-10 w-full text-center">등록된 일정이 없습니다.</p>
                )}
              </div>
            </section>
          </div>
        )}

        {currentView === 'calendar' && <Calendar events={events} onAddEvent={handleAddEvent} onDeleteEvent={handleDeleteEvent} />}
        {currentView === 'students' && <StudentList students={students} onAddStudent={handleAddStudent} onUpdateStickers={handleUpdateStickers} onDeleteStudent={handleDeleteStudent} />}
        {currentView === 'ai-helper' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center">
              <h2 className="text-4xl font-gaegu font-bold text-purple-600 mb-2">🪄 AI 교실 도우미</h2>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-purple-100">
              <textarea 
                placeholder="예: 초등학생들이 좋아할 만한 새로운 학급 놀이 추천해줘" 
                className="w-full h-32 p-4 border-2 border-purple-50 rounded-2xl focus:border-purple-300 outline-none text-gray-700 resize-none mb-4"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
              <button onClick={handleAskAi} disabled={isAiLoading || !aiTopic} className="w-full py-4 bg-purple-500 text-white rounded-2xl font-bold shadow-lg hover:bg-purple-600 disabled:bg-gray-200">
                {isAiLoading ? '생각 중...' : '아이디어 생성!'}
              </button>
              {aiResponse && <div className="mt-8 p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 font-gaegu text-xl whitespace-pre-wrap">{aiResponse}</div>}
            </div>
          </div>
        )}
        {currentView === 'sync' && <SyncManager data={currentClassData} onImportData={handleImportData} onUpdateCloudId={setCloudId} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t-2 border-orange-100 flex items-center justify-around px-4 z-20">
        <MobileNavItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon="🏠" label="홈" />
        <MobileNavItem active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} icon="📅" label="달력" />
        <MobileNavItem active={currentView === 'students'} onClick={() => setCurrentView('students')} icon="⭐" label="칭찬" />
        <MobileNavItem active={currentView === 'ai-helper'} onClick={() => setCurrentView('ai-helper')} icon="🪄" label="AI" />
        <MobileNavItem active={currentView === 'sync'} onClick={() => setCurrentView('sync')} icon="☁️" label="동기화" />
      </nav>
    </div>
  );
};

interface NavItemProps { active: boolean; onClick: () => void; icon: string; label: string; color: string; }
const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label, color }) => (
  <button onClick={onClick} className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${active ? `${color} font-bold shadow-md transform scale-105` : 'text-gray-500 hover:bg-gray-50'}`}>
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
