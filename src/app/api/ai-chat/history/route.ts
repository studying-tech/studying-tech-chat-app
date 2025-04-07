export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/utils/auth';
import { User } from '@/types/workspace';
import { aiChatOperations } from '@/lib/db';

/**
 * [GET] /api/ai-chat/history: 現在認証されているユーザーの会話履歴を取得
 */
export const GET = withAuth(async (request: NextRequest, _, user: User) => {
  try {
    // ユーザーの会話履歴を取得
    const chats = await aiChatOperations.getConversationHistory(user.id, 50);

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('チャット履歴の取得に失敗しました:', error);

    return NextResponse.json({ error: 'チャット履歴の取得に失敗しました' }, { status: 500 });
  }
});
