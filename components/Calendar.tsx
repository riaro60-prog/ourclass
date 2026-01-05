
import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';

interface CalendarProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onAddEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // Start at March 2026
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<CalendarEvent['type']>('event');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setShowAddModal(true);
  };

  const handleSaveEvent = () => {
    if (selectedDate && newTitle) {
      onAddEvent({
        date: selectedDate,
        title: newTitle,
        type: newType
      });
      setNewTitle('');
      setShowAddModal(false);
    }
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 rounded-lg"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      
      days.push(
        <div 
          key={i} 
          onClick={() => handleDateClick(i)}
          className="h-24 p-1 border border-orange-100 bg-white rounded-lg hover:bg-orange-50 cursor-pointer transition-colors overflow-hidden group relative"
        >
          <span className={`text-sm font-bold ${[0].includes((i + firstDayOfMonth - 1) % 7) ? 'text-red-500' : [6].includes((i + firstDayOfMonth - 1) % 7) ? 'text-blue-500' : 'text-gray-700'}`}>
            {i}
          </span>
          <div className="mt-1 flex flex-col gap-0.5">
            {dayEvents.map(ev => (
              <div 
                key={ev.id} 
                className={`text-[10px] px-1 py-0.5 rounded truncate flex justify-between items-center ${
                  ev.type === 'holiday' ? 'bg-red-100 text-red-700' : 
                  ev.type === 'exam' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-blue-100 text-blue-700'
                }`}
              >
                {ev.title}
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev.id); }}
                  className="hidden group-hover:block ml-1 text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-orange-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-gaegu font-bold text-orange-600">
          📅 {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 학사일정
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="px-4 py-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors">◀ 이전</button>
          <button onClick={nextMonth} className="px-4 py-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors">다음 ▶</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, idx) => (
          <div key={d} className={`text-center font-bold py-2 ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {renderDays()}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-3xl w-80 shadow-2xl animate-bounce-in border-4 border-yellow-300">
            <h3 className="text-xl font-gaegu font-bold mb-4 text-orange-600">📌 일정 추가 ({selectedDate})</h3>
            <input 
              type="text" 
              placeholder="일정 제목" 
              className="w-full p-2 border-2 border-orange-100 rounded-xl mb-4 focus:outline-none focus:border-orange-300"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <select 
              className="w-full p-2 border-2 border-orange-100 rounded-xl mb-6 focus:outline-none focus:border-orange-300"
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
            >
              <option value="event">학급 행사</option>
              <option value="holiday">공휴일/방학</option>
              <option value="exam">평가/시험</option>
              <option value="other">기타</option>
            </select>
            <div className="flex gap-2">
              <button 
                onClick={handleSaveEvent}
                className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600"
              >
                저장
              </button>
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
