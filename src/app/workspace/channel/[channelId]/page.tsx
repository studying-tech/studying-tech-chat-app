'use client';

// React
import { useState, useEffect } from 'react';
// Next.js
import { useParams, notFound } from 'next/navigation';
// 自作コンポーネント
import ChannelHeader from '@/components/channel/channelHeader';
import MessageView from '@/components/channel/messageView';
import MessageForm from '@/components/channel/messageForm';
import Loading from '@/app/loading';
// 型
import { ChannelType } from '@/types/workspace';
// ストア
import { useUserStore } from '@/store/useUserStore';
import { useChannelStore } from '@/store/useChannelStore';
import { useMessageStore } from '@/store/useMessageStore';
// データ
import { getDirectMessagePartner } from '@/lib/db';

export default function ChannelPage() {
  // URL のパスからチャンネル ID を取得
  const { channelId } = useParams<{ channelId: string }>();
  const [isInitialized, setIsInitialized] = useState(false);

  // ストアから、ユーザーとチャンネルとメッセージの状態とアクションを取得
  const { user } = useUserStore();
  const { channels } = useChannelStore();
  const { messages, isLoading: isMessageLoading, fetchMessages, addMessage } = useMessageStore();

  // チャンネル ID が変更されたときにチャンネル情報とメッセージを取得
  useEffect(() => {
    const initData = async () => {
      await fetchMessages(channelId);
      setIsInitialized(true);
    };

    initData();
  }, [channelId, fetchMessages]);

  // ローディング中の表示
  if (!isInitialized || isMessageLoading) return <Loading />;

  // チャンネルが見つからない場合
  const currentChannel = channels.find((channel) => channel.id === channelId);
  if (!currentChannel) return notFound();

  const channelDisplayName =
    currentChannel.channelType === ChannelType.CHANNEL
      ? `# ${currentChannel.name}`
      : getDirectMessagePartner(currentChannel, user?.id ?? '').name;

  const handleSendMessage = async (content: string) => {
    try {
      await addMessage(channelId, content);
    } catch (error) {
      console.error('メッセージの送信に失敗しました:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChannelHeader channel={currentChannel} />
      <MessageView messages={messages} myUserId={user?.id ?? ''} />
      <MessageForm channelDisplayName={channelDisplayName} handleSendMessage={handleSendMessage} />
    </div>
  );
}
