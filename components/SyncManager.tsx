
import React, { useState, useEffect } from 'react';
import { ClassData } from '../types';
import { syncService } from '../services/syncService.ts';

interface SyncManagerProps {
  data: ClassData;
  onImportData: (newData: ClassData) => void;
  onUpdateCloudId: (cloudId: string) => void;
}

const SyncManager: React.FC<SyncManagerProps> = ({ data, onImportData, onUpdateCloudId }) => {
  const [inputCode, setInputCode] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Supabase Credentials
  const [sbUrl, setSbUrl] = useState(() => localStorage.getItem('dreamy-sb-url') || '');
  const [sbKey, setSbKey] = useState(() => localStorage.getItem('dreamy-sb-key') || '');
  const [isDbConnected, setIsDbConnected] = useState(false);

  useEffect(() => {
    if (sbUrl && sbKey) {
      const connected = syncService.init(sbUrl, sbKey);
      setIsDbConnected(connected);
    }
  }, [sbUrl, sbKey]);

  const saveDbSettings = () => {
    localStorage.setItem('dreamy-sb-url', sbUrl);
    localStorage.setItem('dreamy-sb-key', sbKey);
    const connected = syncService.init(sbUrl, sbKey);
    setIsDbConnected(connected);
    alert(connected ? 'DB가 성공적으로 연결되었습니다! ✅' : '정보를 확인해주세요.');
  };

  const handleCreateCloud = () => {
    const newCode = syncService.generateClassCode();
    if (window.confirm(`새로운 학급 코드 [${newCode}]를 생성할까요?`)) {
      onUpdateCloudId(newCode);
      syncService.saveToCloud(newCode, data);
      alert(`학급 코드가 생성되었습니다: ${newCode}`);
    }
  };

  const handleConnectCloud = async () => {
    if (!inputCode.trim()) return;
    setIsSyncing(true);
    const cloudData = await syncService.loadFromCloud(inputCode.trim());
    if (cloudData) {
      onImportData({ ...cloudData, cloudId: inputCode.trim() });
      onUpdateCloudId(inputCode.trim());
      alert('성공적으로 연결되었습니다! 🚀');
    } else {
      alert('데이터를 찾을 수 없습니다.');
    }
    setIsSyncing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in pb-10">
      <div className="text-center">
        <h2 className="text-4xl font-gaegu font-bold text-sky-600 mb-2">실시간 서버 동기화</h2>
        <p className="text-gray-500">모든 기기에서 데이터를 공유합니다.</p>
      </div>

      {/* Database Connection Status Banner */}
      <div className={`p-4 rounded-2xl flex items-center justify-between ${isDbConnected ? 'bg-green-50 text-green-700 border-2 border-green-100' : 'bg-amber-50 text-amber-700 border-2 border-amber-100'}`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{isDbConnected ? '🟢' : '🟡'}</span>
          <span className="font-bold">{isDbConnected ? '실시간 DB 연결됨' : '오프라인 모드 (기기에만 저장)'}</span>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="text-sm font-bold underline"
        >
          {showSettings ? '설정 닫기' : 'DB 설정하기'}
        </button>
      </div>

      {/* Advanced DB Settings */}
      {showSettings && (
        <div className="bg-white p-8 rounded-[40px] shadow-xl border-4 border-gray-100 space-y-4 animate-in slide-in-from-bottom-4">
          <h3 className="text-xl font-bold text-gray-700">⚙️ Supabase 프로젝트 설정</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            무료 DB 서비스를 사용하려면 Supabase 대시보드(Settings &gt; API)에서 주소와 키를 복사해오세요.<br/>
            <strong>테이블 이름:</strong> <code className="bg-gray-100 px-1 rounded text-red-500">class_rooms</code>가 필요합니다.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Project URL</label>
              <input 
                type="text" 
                className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-sky-300 outline-none text-sm"
                placeholder="https://your-project.supabase.co"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Anon Key (API Key)</label>
              <input 
                type="password" 
                className="w-full p-3 border-2 border-gray-50 rounded-xl focus:border-sky-300 outline-none text-sm"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                value={sbKey}
                onChange={(e) => setSbKey(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={saveDbSettings}
                className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-bold shadow-md hover:bg-sky-600 transition-all"
              >
                설정 저장 및 연결
              </button>
              <button 
                onClick={() => { setSbUrl(''); setSbKey(''); localStorage.removeItem('dreamy-sb-url'); localStorage.removeItem('dreamy-sb-key'); }}
                className="px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold hover:bg-gray-200"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Sync UI */}
      <div className={`p-10 rounded-[45px] border-4 transition-all duration-500 ${data.cloudId ? 'bg-white shadow-2xl border-sky-400' : 'bg-gray-50 border-gray-200 shadow-inner'}`}>
        {data.cloudId ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce-in">
              <span className="text-4xl animate-pulse">📡</span>
            </div>
            <div>
              <h3 className="text-3xl font-gaegu font-bold text-sky-700 mb-2">실시간 동기화 중</h3>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-2xl font-bold text-2xl shadow-lg mb-4">
                <span>{data.cloudId}</span>
              </div>
              <p className="text-gray-500 max-w-sm mx-auto leading-relaxed italic">
                "{isDbConnected ? '클라우드 서버에 안전하게 연결되었습니다.' : '연결 정보가 없어 기기에만 저장 중입니다.'}"
              </p>
            </div>
            <button 
              onClick={() => onUpdateCloudId('')}
              className="px-6 py-2 text-gray-400 hover:text-red-400 font-bold transition-colors"
            >
              연결 해제하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={handleCreateCloud}
              className="p-8 bg-white border-4 border-sky-50 rounded-[35px] hover:border-sky-300 hover:shadow-xl transition-all text-left group"
            >
              <div className="text-3xl mb-4">✨</div>
              <span className="font-bold text-sky-600 block text-xl mb-1 font-gaegu">새 학급 코드 만들기</span>
              <span className="text-sm text-gray-400 leading-tight">동기화를 위한 새 아이디를 생성합니다.</span>
            </button>

            <div className="p-8 bg-white border-4 border-orange-50 rounded-[35px] hover:border-orange-200 transition-all">
              <div className="text-3xl mb-4">🔑</div>
              <span className="font-bold text-orange-600 block text-xl mb-3 font-gaegu">코드 입력하여 연결</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="예: 푸른하늘-1234" 
                  className="flex-1 p-3 border-2 border-orange-50 rounded-2xl focus:outline-none focus:border-orange-300 text-sm font-bold"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                />
                <button 
                  onClick={handleConnectCloud}
                  disabled={isSyncing}
                  className="px-5 py-3 bg-orange-400 text-white rounded-2xl font-bold hover:bg-orange-500 shadow-md"
                >
                  {isSyncing ? '...' : '연결'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncManager;
