
import React, { useState } from 'react';
import { Student } from '../types';

interface StudentListProps {
  students: Student[];
  onAddStudent: (name: string, number: number) => void;
  onUpdateStickers: (id: string, amount: number) => void;
  onDeleteStudent: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onAddStudent, onUpdateStickers, onDeleteStudent }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState(students.length + 1);

  const handleAdd = () => {
    if (newName) {
      onAddStudent(newName, newNumber);
      setNewName('');
      setNewNumber(prev => prev + 1);
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-gaegu font-bold text-pink-600">🌟 우리 반 칭찬 스티커 판</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-2 bg-pink-400 text-white rounded-full font-bold shadow-md hover:bg-pink-500 transition-all transform hover:scale-105"
        >
          + 학생 등록
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {students.sort((a, b) => a.number - b.number).map(student => (
          <div 
            key={student.id} 
            className="bg-white p-5 rounded-3xl shadow-lg border-2 border-pink-100 hover:border-pink-300 transition-all group relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-lg">
                {student.number}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{student.name}</h3>
                <p className="text-sm text-gray-500">스티커: {student.stickers}개</p>
              </div>
              <button 
                onClick={() => onDeleteStudent(student.id)}
                className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition-opacity"
              >
                삭제
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mb-4 h-16 overflow-y-auto content-start p-1 bg-pink-50/50 rounded-xl">
              {Array.from({ length: Math.min(student.stickers, 50) }).map((_, i) => (
                <span key={i} className="text-xl">⭐</span>
              ))}
              {student.stickers > 50 && <span className="text-xs text-pink-400 font-bold self-center">+{student.stickers - 50}</span>}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => onUpdateStickers(student.id, 1)}
                className="flex-1 py-2 bg-yellow-400 text-white rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-sm active:scale-95"
              >
                칭찬해요!
              </button>
              <button 
                onClick={() => onUpdateStickers(student.id, -1)}
                className="px-4 py-2 bg-gray-100 text-gray-400 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                -1
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border-4 border-pink-200">
            <h3 className="text-2xl font-gaegu font-bold mb-6 text-pink-600 text-center">새로운 친구 등록</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">번호</label>
                <input 
                  type="number" 
                  className="w-full p-3 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-300"
                  value={newNumber}
                  onChange={(e) => setNewNumber(parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">이름</label>
                <input 
                  type="text" 
                  placeholder="예: 김하늘" 
                  className="w-full p-3 border-2 border-pink-50 rounded-2xl focus:outline-none focus:border-pink-300"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleAdd}
                className="flex-1 py-3 bg-pink-500 text-white rounded-2xl font-bold hover:bg-pink-600 shadow-lg"
              >
                친구 추가하기
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
