
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ClassData } from '../types';

let supabaseInstance: SupabaseClient | null = null;
let subscription: RealtimeChannel | null = null;

const defaultUrl = process.env.SUPABASE_URL;
const defaultKey = process.env.SUPABASE_KEY;

if (defaultUrl && defaultKey) {
  supabaseInstance = createClient(defaultUrl, defaultKey);
}

export const syncService = {
  init: (url: string, key: string) => {
    if (url && key) {
      supabaseInstance = createClient(url, key);
      return true;
    }
    return false;
  },

  isConnected: () => !!supabaseInstance,
  hasDefaultConfig: () => !!defaultUrl && !!defaultKey,

  saveToCloud: async (cloudId: string, data: ClassData): Promise<boolean> => {
    if (!supabaseInstance) return false;
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

  loadFromCloud: async (cloudId: string): Promise<ClassData | null> => {
    if (!supabaseInstance) return null;
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

  // 실시간 구독 설정: 다른 기기에서 변경하면 콜백 함수 실행
  subscribeToChanges: (cloudId: string, onUpdate: (newData: ClassData) => void) => {
    if (!supabaseInstance || !cloudId) return null;
    
    // 기존 구독이 있다면 해제
    if (subscription) {
      subscription.unsubscribe();
    }

    subscription = supabaseInstance
      .channel(`class-${cloudId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'class_rooms',
          filter: `code=eq.${cloudId}`,
        },
        (payload) => {
          if (payload.new && payload.new.data) {
            onUpdate(payload.new.data as ClassData);
          }
        }
      )
      .subscribe();

    return subscription;
  },

  getShareLink: (code: string) => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('c', code);
    return url.toString();
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
