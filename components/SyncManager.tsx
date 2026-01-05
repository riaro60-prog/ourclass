
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
  
  const [sbUrl, setSbUrl] = useState(() => localStorage.getItem('dreamy-sb-url') || '');
  const [sbKey, setSbKey] = useState(() => localStorage.getItem('dreamy-sb-key') || '');
  const [isDbConnected, setIsDbConnected] = useState(syncService.isConnected());

  const handleCopyLink = () => {
    if (!data.cloudId) return;
    const link = syncService.getShareLink(data.cloudId);
    navigator.clipboard.writeText(link);
    alert('초대 링크가 복사되었습니다! 📋\n다른 기기의 브라우저 주소창에 붙여넣으세요.');
  };

  const handleCreateCloud = async () => {
    if (!syncService.isConnected() && !syncService.hasDefaultConfig()) {
      alert('DB 연결 설정이 필요합니다. 아래 "DB 설정하기"를 눌러주세요.');
      setShowSettings(true);
      return;
    }
    const newCode = syncService.generateClassCode();
    onUpdateCloudId(newCode);
    await syncService.saveToCloud(newCode, data);
    alert(`새로운 학급이 생성되었습니다: ${newCode}`);
  };

  const handleConnectCloud = async () => {
    if (!inputCode.trim()) return;
    if (!syncService.isConnected()) {
      alert('연결된 데이터베이스가 없습니다.');
      return;
    }
    setIsSyncing(true);
    const cloudData = await syncService.loadFromCloud(inputCode.trim());
    if (cloudData) {
      onImportData({ ...cloudData, cloudId: inputCode.trim() });
      onUpdateCloudId(inputCode.trim());
      alert('학급 데이터를 불러왔습니다! 🚀');
    } else {
      alert('해당 코드의 데이터를 찾을 수 없습니다.');
    }
    setIsSyncing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in pb-10">
      <div className="text-center">
        <h2 className="text-4xl font-gaegu font-bold text-sky-600 mb-2">실시간 학급 공유</h2>
        <p className="text-gray-500">링크 하나로 다른 기기와 데이터를 실시간 공유하세요.</p>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-2xl flex items-center justify-between ${syncService.isConnected() ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{syncService.isConnected() ? '🟢' : '⚪'}</span>
          <span className="font-bold">{syncService.isConnected() ? '서버 연결됨 (동기화 가능)' : '서버 미연결 (로컬 저장 중)'}</span>
        </div>
        {!syncService.hasDefaultConfig() && (
          <button onClick={() => setShowSettings(!showSettings)} className="text-sm underline">
            {showSettings ? '설정 닫기' : 'DB 수동 설정'}
          </button>
        )}
      </div>

      {showSettings && (
        <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-700">⚙️ 데이터베이스 수동 연결</h3>
          <div className="grid gap-3">
            <input 
              className="p-3 bg-gray-50 rounded-xl text-sm outline-none border-2 border-transparent focus:border-sky-200"
              placeholder="Supabase URL"
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
            />
            <input 
              className="p-3 bg-gray-50 rounded-xl text-sm outline-none border-2 border-transparent focus:border-sky-200"
              type="password"
              placeholder="Supabase Anon Key"
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
            />
            <button 
              onClick={() => {
                const ok = syncService.init(sbUrl, sbKey);
                if (ok) {
                  localStorage.setItem('dreamy-sb-url', sbUrl);
                  localStorage.setItem('dreamy-sb-key', sbKey);
                  setIsDbConnected(true);
                  alert('연결 성공!');
                }
              }}
              className="bg-sky-500 text-white py-3 rounded-xl font-bold"
            >
              연결 테스트 및 저장
            </button>
          </div>
        </div>
      )}

      {/* Main Sync UI */}
      <div className={`p-10 rounded-[45px] border-4 transition-all duration-500 ${data.cloudId ? 'bg-white shadow-2xl border-sky-400' : 'bg-gray-50 border-gray-200 shadow-inner'}`}>
        {data.cloudId ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce-in">
              <span className="text-4xl animate-pulse">📡</span>
            </div>
            <div>
              <h3 className="text-3xl font-gaegu font-bold text-sky-700 mb-2">실시간 동기화 중</h3>
              <div className="flex flex-col items-center gap-4">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-2xl font-bold text-2xl shadow-lg">
                  <span>{data.cloudId}</span>
                </div>
                <button 
                  onClick={handleCopyLink}
                  className="px-6 py-3 bg-white border-2 border-sky-200 text-sky-600 rounded-2xl font-bold hover:bg-sky-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  🔗 초대 링크 복사하기
                </button>
                <p className="text-xs text-gray-400">링크를 복사해 다른 기기(폰, 태블릿 등)에서 여세요.</p>
              </div>
            </div>
            <button 
              onClick={() => onUpdateCloudId('')}
              className="px-6 py-2 text-gray-300 hover:text-red-400 font-bold transition-colors"
            >
              공유 중단하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={handleCreateCloud}
              className="p-8 bg-white border-4 border-sky-50 rounded-[35px] hover:border-sky-300 hover:shadow-xl transition-all text-left group"
            >
              <div className="text-3xl mb-4">✨</div>
              <span className="font-bold text-sky-600 block text-xl mb-1 font-gaegu">새 학급 동기화 시작</span>
              <span className="text-sm text-gray-400 leading-tight">서버에 데이터를 올리고 고유 코드를 생성합니다.</span>
            </button>

            <div className="p-8 bg-white border-4 border-orange-50 rounded-[35px] hover:border-orange-200 transition-all">
              <div className="text-3xl mb-4">🔑</div>
              <span className="font-bold text-orange-600 block text-xl mb-3 font-gaegu">기존 학급 코드 연결</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="예: 기쁜나무-1234" 
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
