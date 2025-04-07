import { create } from 'zustand';
// 型
import { Message } from '@/types/workspace';

interface MessageState {
  // メッセージの配列を保持する State
  messages: Message[];
  // ローディング状態
  isLoading: boolean;
  // エラー情報
  error: string | null;
  // 特定チャンネルのメッセージを取得する Action
  fetchMessages: (channelId: string) => Promise<void>;
  // 新しいメッセージを追加する Action
  addMessage: (channelId: string, content: string) => Promise<void>;
  // メッセージをクリアする Action
  clearMessages: () => void;
}

// Zustand を使って MessageState ストアを作成
export const useMessageStore = create<MessageState>((set) => ({
  // 初期 State
  messages: [],
  isLoading: false,
  error: null,

  fetchMessages: async (channelId: string) => {
    try {
      set({ isLoading: true, error: null });

      const res = await fetch(`/api/messages/channel/${channelId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'メッセージの取得に失敗しました');
      }

      const messages = (await res.json()) as Message[];
      // 取得したメッセージで状態を更新
      set({ messages, isLoading: false });
    } catch (error) {
      console.error('メッセージの取得に失敗しました:', error);
      set({
        error: error instanceof Error ? error.message : 'メッセージの取得に失敗しました',
        isLoading: false,
      });
      throw error;
    }
  },

  addMessage: async (channelId: string, content: string) => {
    try {
      // API を呼び出し、メッセージを保存
      const res = await fetch(`/api/messages/channel/${channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'メッセージの送信に失敗しました');
      }

      const newMessage = await res.json();

      // 現在のメッセージ配列に新しいメッセージを追加
      set((state) => ({ messages: [...state.messages, newMessage] }));
    } catch (error) {
      console.error('メッセージの送信に失敗しました:', error);
      set({
        error: error instanceof Error ? error.message : 'メッセージの送信に失敗しました',
        isLoading: false,
      });
      throw error;
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));
