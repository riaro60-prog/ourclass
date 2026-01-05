
import React, { useState, useEffect, useRef } from 'react';
import { Student, CalendarEvent, ViewType, ClassNote, ClassData } from './types.ts';
import Calendar from './components/Calendar.tsx';
import StudentList from './components/StudentList.tsx';
import SyncManager from './components/SyncManager.tsx';
import { getEncouragementMessage, getAIClassSuggestions } from './services/geminiService.ts';
import { syncService } from './services/syncService.ts';

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
  const [cloudId, setCloudId] = useState<string>(() => {
    return localStorage.getItem('dreamy-cloud-id') || '';
  });
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('dreamy-last-sync') || new Date(0).toISOString();
  });
  
  const [encouragement, setEncouragement] = useState('오늘도 우리 아이들과 행복한 시간 보내세요! 🎈');
  const [aiTopic, setAiTopic] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  
  const isInternalUpdate = useRef(false);

  // 데이터 수동/자동 로드 함수
  const fetchLatestData = async (code: string) => {
    setIsCloudSyncing(true);
    const data = await syncService.loadFromCloud(code);
    if (data) {
      if (!lastSyncTime || data.lastSync > lastSyncTime) {
        applyData(data);
      }
    }
    setIsCloudSyncing(false);
  };

  useEffect(() => {
    const initApp = async () => {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get('c');
      const activeCode = codeFromUrl || cloudId;

      if (activeCode) {
        if (codeFromUrl) {
          setCloudId(codeFromUrl);
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        await fetchLatestData(activeCode);

        // 실시간 구독 시작
        const sub = syncService.subscribeToChanges(activeCode, (newData) => {
          if (newData.lastSync > lastSyncTime) {
            isInternalUpdate.current = true;
            applyData(newData);
            setTimeout(() => { isInternalUpdate.current = false; }, 500);
          }
        });
        
        if (sub) setIsRealtimeActive(true);
      }
    };

    initApp();
  }, []);

  const applyData = (data: ClassData) => {
    setStudents(data.students || []);
    setEvents(data.events || []);
    setNotes(data.notes || []);
    if (data.lastSync) setLastSyncTime(data.lastSync);
  };

  useEffect(() => {
    localStorage.setItem('dreamy-students', JSON.stringify(students));
    localStorage.setItem('dreamy-events', JSON.stringify(events));
    localStorage.setItem('dreamy-notes', JSON.stringify(notes));
    localStorage.setItem('dreamy-cloud-id', cloudId);
    localStorage.setItem('dreamy-last-sync', lastSyncTime);
  }, [students, events, notes, cloudId, lastSyncTime]);

  useEffect(() => {
    if (cloudId && syncService.isConnected() && !isInternalUpdate.current) {
      const timeoutId = setTimeout(async () => {
        setIsCloudSyncing(true);
        const now = new Date().toISOString();
        const data: ClassData = { students, events, notes, lastSync: now, cloudId };
        const success = await syncService.saveToCloud(cloudId, data);
        if (success) setLastSyncTime(now);
        setIsCloudSyncing(false);
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [students, events, notes, cloudId]);

  useEffect(() => {
    getEncouragementMessage().then(setEncouragement);
  }, []);

  // Add missing student management handlers
  const handleAddStudent = (name: string, number: number) => {
    const newStudent: Student = {
      id: crypto.randomUUID(),
      name,
      number,
      stickers: 0,
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const handleUpdateStickers = (id: string, amount: number) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, stickers: Math.max(0, s.stickers + amount) } : s
      )
    );
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Add missing AI assistant handler
  const handleAskAi = async () => {
    if (!aiTopic) return;
    setIsAiLoading(true);
    setAiResponse('');
    const result = await getAIClassSuggestions(aiTopic);
    setAiResponse(result || '');
    setIsAiLoading(false);
  };

  const handleImportData = (newData: ClassData) => {
    applyData(newData);
    if (newData.cloudId) {
      setCloudId(newData.cloudId);
      const sub = syncService.subscribeToChanges(newData.cloudId, (remoteData) => {
        if (remoteData.lastSync > lastSyncTime) {
          applyData(remoteData);
        }
      });
      setIsRealtimeActive(!!sub);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pl-64 flex flex-col bg-[#fff9f0]">
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
          <NavItem active={currentView === 'sync'} onClick={() => setCurrentView('sync')} icon="☁️" label="실시간 공유" color="bg-sky-50 text-sky-600" />
        </nav>

        <div className="mt-auto bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-200">
          <p className="text-sm font-gaegu text-yellow-700 leading-relaxed italic">"{encouragement}"</p>
          {cloudId && (
            <div className="mt-3 space-y-1">
               <div className="flex items-center gap-2">
                 <span className={`flex h-2 w-2 rounded-full ${isRealtimeActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                 <p className="text-[10px] text-sky-500 font-bold">연결: {cloudId}</p>
               </div>
               <button onClick={() => fetchLatestData(cloudId)} className="text-[9px] text-gray-400 hover:text-sky-500 underline">지금 바로 새로고침</button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full">
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-4xl font-gaegu font-bold text-gray-800 mb-2">선생님, 반가워요! 👋</h2>
                <div className="flex items-center gap-2">
                  <p className="text-lg text-gray-500">
                    {cloudId ? `현재 '${cloudId}' 그룹과 실시간 연결 중입니다.` : '로컬 모드로 사용 중입니다.'}
                  </p>
                  {cloudId && (
                    <button 
                      onClick={() => fetchLatestData(cloudId)}
                      className="p-2 bg-sky-100 text-sky-600 rounded-full hover:bg-sky-200 transition-colors"
                      title="강제 새로고침"
                    >
                      <span className={isCloudSyncing ? 'animate-spin block' : ''}>🔄</span>
                    </button>
                  )}
                </div>
              </div>
              {isCloudSyncing && <div className="bg-sky-100 text-sky-600 px-4 py-1 rounded-full text-xs font-bold animate-pulse">데이터 동기화 중...</div>}
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
                    <p className="text-xl font-bold text-gray-800">
                      {students.length > 0 ? students.reduce((prev, curr) => (prev.stickers > curr.stickers) ? prev : curr).name : '-'} 학생
                    </p>
                    <p className="text-gray-500">박수를 보내주세요! 🎉</p>
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">학생을 등록해주세요.</p>
                )}
              </div>

              <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-green-100 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-4">📡</div>
                <h3 className="text-2xl font-gaegu font-bold text-green-600 mb-2">실시간 연결</h3>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isRealtimeActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                  <p className={`text-sm font-bold ${cloudId ? 'text-sky-500' : 'text-gray-400'}`}>
                    {cloudId ? (isRealtimeActive ? '실시간 감지 중' : '서버 대기 중') : '로컬 저장 전용'}
                  </p>
                </div>
                <button onClick={() => setCurrentView('sync')} className="mt-2 text-xs text-gray-400 underline">상세 보기</button>
              </div>
            </div>
            
            <section className="bg-white p-8 rounded-[40px] shadow-lg border-2 border-orange-50">
              <h3 className="text-2xl font-gaegu font-bold text-orange-600 mb-4">📅 다가오는 학사일정</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {events.length > 0 ? (
                  events.slice().sort((a,b) => a.date.localeCompare(b.date)).slice(0, 5).map(event => (
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

        {currentView === 'calendar' && <Calendar events={events} onAddEvent={(e) => { setEvents(prev => [...prev, {id: crypto.randomUUID(), ...e}]); }} onDeleteEvent={(id) => setEvents(prev => prev.filter(e => e.id !== id))} />}
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
        {currentView === 'sync' && <SyncManager data={{students, events, notes, lastSync: lastSyncTime, cloudId}} onImportData={handleImportData} onUpdateCloudId={setCloudId} />}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t-2 border-orange-100 flex items-center justify-around px-4 z-20">
        <MobileNavItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon="🏠" label="홈" />
        <MobileNavItem active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')} icon="📅" label="달력" />
        <MobileNavItem active={currentView === 'students'} onClick={() => setCurrentView('students')} icon="⭐" label="칭찬" />
        <MobileNavItem active={currentView === 'ai-helper'} onClick={() => setCurrentView('ai-helper')} icon="🪄" label="AI" />
        <MobileNavItem active={currentView === 'sync'} onClick={() => setCurrentView('sync')} icon="☁️" label="공유" />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string; color: string }> = ({ active, onClick, icon, label, color }) => (
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
