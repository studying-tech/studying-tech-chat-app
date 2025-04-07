import { create } from 'zustand';
// 型
import { Channel } from '@/types/workspace';

interface ChannelState {
  // チャンネル一覧
  channels: Channel[];
  // ローディング状態
  isLoading: boolean;
  // エラー情報
  error: string | null;
  // チャンネル一覧を取得する Action
  fetchChannels: () => Promise<void>;
  // チャンネル一覧をクリアする Action
  clearChannels: () => void;
}

// Zustand を使って ChannelState ストアを作成
export const useChannelStore = create<ChannelState>((set) => ({
  // 初期 State
  channels: [],
  isLoading: false,
  error: null,

  // チャンネル一覧を取得
  fetchChannels: async () => {
    try {
      set({ isLoading: true, error: null });

      // API からチャンネル一覧を取得
      const res = await fetch('/api/channels');

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'チャンネル一覧の取得に失敗しました');
      }

      const channels = (await res.json()) as Channel[];
      set({ channels, isLoading: false });
    } catch (error) {
      console.error('チャンネル一覧の取得に失敗:', error);
      set({
        error: error instanceof Error ? error.message : 'チャンネル一覧の取得に失敗しました',
        isLoading: false,
      });
    }
  },

  clearChannels: () => {
    set({ channels: [] });
  },
}));
