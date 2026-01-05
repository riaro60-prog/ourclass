
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClassData } from '../types';

// 싱글톤 클라이언트 관리
let supabaseInstance: SupabaseClient | null = null;

export const syncService = {
  // 사용자가 입력한 설정으로 클라이언트 초기화
  init: (url: string, key: string) => {
    if (url && key) {
      supabaseInstance = createClient(url, key);
      return true;
    }
    supabaseInstance = null;
    return false;
  },

  // 현재 클라이언트 상태 확인
  isConnected: () => !!supabaseInstance,

  // 클라우드에 데이터 저장
  saveToCloud: async (cloudId: string, data: ClassData): Promise<boolean> => {
    if (!supabaseInstance) {
      localStorage.setItem(`cloud_storage_${cloudId}`, JSON.stringify({
        ...data,
        lastSync: new Date().toISOString()
      }));
      return true;
    }

    try {
      const { error } = await supabaseInstance
        .from('class_rooms')
        .upsert({ 
          code: cloudId, 
          data: data, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'code' });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Supabase Save Error:", error);
      return false;
    }
  },

  // 클라우드에서 데이터 불러오기
  loadFromCloud: async (cloudId: string): Promise<ClassData | null> => {
    if (!supabaseInstance) {
      const saved = localStorage.getItem(`cloud_storage_${cloudId}`);
      return saved ? JSON.parse(saved) : null;
    }

    try {
      const { data, error } = await supabaseInstance
        .from('class_rooms')
        .select('data')
        .eq('code', cloudId)
        .single();

      if (error) throw error;
      return data?.data as ClassData;
    } catch (error) {
      console.error("Supabase Load Error:", error);
      return null;
    }
  },

  generateClassCode: () => {
    const adjectives = ['밝은', '기쁜', '행복한', '푸른', '빛나는', '함께하는', '꿈꾸는', '싱그러운'];
    const nouns = ['새싹', '열매', '나무', '하늘', '별빛', '구름', '햇살', '바다'];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}${noun}-${randomNum}`;
  }
};
