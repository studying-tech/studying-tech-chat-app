'use client';

// React
import { useState } from 'react';
// アイコン
import { Search, UserPlus, Loader2 } from 'lucide-react';
// shadcn/ui
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
// ストア
import { useUserStore } from '@/store/useUserStore';
import { useChannelStore } from '@/store/useChannelStore';
// 型
import type { User, Channel } from '@/types/workspace';

interface InviteMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel;
}

export default function InviteMemberModal({ isOpen, onOpenChange, channel }: InviteMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 選択中のユーザーは、チェックボックスで複数選択できるようにする
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { user: currentUser, otherUsers } = useUserStore();
  const { fetchChannels } = useChannelStore();

  // 自分以外のユーザーで、まだチャンネルに参加していないユーザーを取得
  const availableUsers = otherUsers.filter(
    (user) => user.id !== currentUser?.id && !channel.members.some((member) => member.id === user.id)
  );

  // 検索クエリに基づいてユーザーをフィルタリング
  const filteredUsers = availableUsers.filter(
    (user) => searchQuery === '' || user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setError(null);
      setIsLoading(true);

      // APIを呼び出してメンバーを追加
      const res = await fetch(`/api/channels/${channel.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers.map((user) => user.id) }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'メンバーの追加に失敗しました');
      }

      // 成功したらチャンネルのストアを更新
      await fetchChannels();
      // モーダルを閉じる
      onOpenChange(false);
      // 選択をリセット
      setSelectedUsers([]);
      setSearchQuery('');
    } catch (error) {
      console.error('メンバー招待エラー:', error);
      setError(error instanceof Error ? error.message : 'メンバーの追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle># {channel.name} にメンバーを招待</DialogTitle>
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
                    className="flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer hover:bg-muted"
                    onClick={() => toggleUserSelection(user)}
                  >
                    <Checkbox
                      checked={selectedUsers.some((u) => u.id === user.id)}
                      onCheckedChange={() => toggleUserSelection(user)}
                      id={`user-${user.id}`}
                      className="h-4 w-4"
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium">{user.name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {availableUsers.length === 0
                    ? 'すべてのユーザーが既にチャンネルに参加しています'
                    : '該当するユーザーが見つかりませんでした'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{selectedUsers.length}人のユーザーを選択中</p>
          <Button onClick={handleInvite} disabled={selectedUsers.length === 0 || isLoading} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <UserPlus className="h-4 w-4" />
            {isLoading ? '招待中...' : '招待する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
