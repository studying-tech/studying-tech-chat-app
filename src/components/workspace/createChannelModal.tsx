'use client';

// React
import { useState } from 'react';
// アイコン
import { Loader2 } from 'lucide-react';
// shadcn/ui
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// ストア
import { useChannelStore } from '@/store/useChannelStore';

export default function CreateChannelModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [channelName, setChannelName] = useState<string>('');
  const [channelDescription, setChannelDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fetchChannels = useChannelStore((state) => state.fetchChannels);

  const handleCreateChannel = async () => {
    try {
      setIsLoading(true);

      // API を呼び出してチャンネルを作成
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: channelName, description: channelDescription }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'チャンネルの作成に失敗しました');
      }

      // チャンネル一覧を再読込
      await fetchChannels();
      // モーダルを閉じる
      onOpenChange(false);
      // チャンネル作成フォームをクリア
      setChannelName('');
      setChannelDescription('');
    } catch (error) {
      console.error('チャンネル作成エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規チャンネル作成</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="channel-name">チャンネル名</Label>
            <Input
              id="channel-name"
              placeholder="チャンネル名を入力してください"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-description">説明（任意）</Label>
            <Textarea
              id="channel-description"
              placeholder="このチャンネルの目的を説明してください"
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCreateChannel} disabled={!channelName.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? '作成中...' : '作成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
