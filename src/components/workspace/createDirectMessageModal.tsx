'use client';

// React
import { useState } from 'react';
// アイコン
import { Check, Search, Loader2 } from 'lucide-react';
// shadcn/ui
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// ストア
import { useUserStore } from '@/store/useUserStore';
import { useChannelStore } from '@/store/useChannelStore';
// 型
import type { User } from '@/types/workspace';

export default function CreateDirectMessageModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // 検索クエリ
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 選択中のユーザー
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { user: currentUser, otherUsers } = useUserStore();
  const { channels, fetchChannels } = useChannelStore();

  // DM チャンネルの相手ユーザー ID のリストを作成
  const existingDmPartnerIds = currentUser
    ? channels
        .filter((channel) => channel.channelType === 'dm')
        .flatMap((channel) =>
          channel.members.filter((member) => member.id !== currentUser.id).map((member) => member.id)
        )
    : [];

  // まだ DM を開始していないユーザーのみをフィルタリング
  const availableUsers = otherUsers.filter((user) => !existingDmPartnerIds.includes(user.id));

  // 検索クエリに基づいてユーザーをフィルタリング
  const filteredUsers = availableUsers.filter(
    (user) => searchQuery === '' || user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartDm = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      setIsLoading(true);

      // API を呼び出して DM チャンネルを作成
      const res = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || 'DM の開始に失敗しました');
      }

      // 成功したらチャンネル一覧を更新
      await fetchChannels();
      // モーダルを閉じる
      onOpenChange(false);
      // 選択をリセット
      setSelectedUser(null);
      setSearchQuery('');
    } catch (error) {
      console.error('DM 開始エラー:', error);
      setError(error instanceof Error ? error.message : 'DM の開始に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新規ダイレクトメッセージ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ユーザーを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <ScrollArea className="h-72">
            <div className="space-y-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer ${
                      selectedUser?.id === user.id ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium">{user.name}</p>
                    </div>
                    {selectedUser?.id === user.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {availableUsers.length === 0
                    ? 'すべてのユーザーと既に DM を開始しています'
                    : '該当するユーザーが見つかりませんでした'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={handleStartDm} disabled={!selectedUser || isLoading} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'DM を開始中...' : 'DM を開始'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
