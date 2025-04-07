'use client';

// React
import { useState } from 'react';
// テーマ
import { useTheme } from 'next-themes';
// アイコン
import { LogOut, Settings } from 'lucide-react';
// shadcn/ui
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
// 型
import type { User } from '@/types/workspace';
// サーバーアクション
import { logout } from '@/app/logout/actions';
// ストア
import { useUserStore } from '@/store/useUserStore';
import { useChannelStore } from '@/store/useChannelStore';
import { useMessageStore } from '@/store/useMessageStore';

export default function UserProfileBar({ user }: { user: User }) {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [logoutOpen, setLogoutOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(user.name);
  const { theme, setTheme } = useTheme();
  const { clearUser, clearOtherUsers, updateUserName } = useUserStore();
  const { clearChannels } = useChannelStore();
  const { clearMessages } = useMessageStore();

  // ダークモードの切り替え
  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      // クライアント側のストア状態をクリア
      clearUser();
      clearOtherUsers();
      clearChannels();
      clearMessages();
      // サーバー側でのログアウト処理
      await logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // ユーザープロフィールの更新処理
  const handleSaveSettings = async () => {
    try {
      await updateUserName(userName);
      setSettingsOpen(false);
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-medium leading-none">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>

      {/* 環境設定ボタン */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
            <span className="sr-only">環境設定</span>
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>環境設定</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-2">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="ユーザー名を入力"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="darkmode" checked={theme === 'dark'} onCheckedChange={toggleDarkMode} />
              <Label htmlFor="darkmode">ダークモードを有効にする</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSettings}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ログアウトボタン */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">ログアウト</span>
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ログアウト</AlertDialogTitle>
            <AlertDialogDescription>本当にログアウトしますか？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>ログアウト</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
