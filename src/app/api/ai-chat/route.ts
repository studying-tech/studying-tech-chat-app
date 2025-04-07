export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/utils/auth';
import { aiChatOperations } from '@/lib/db';
import { openai, SYSTEM_PROMPT } from '@/lib/openai';
import { User } from '@/types/workspace';

export const POST = withAuth(async (request: NextRequest, _, user: User) => {
  try {
    const body = await request.json();
    const { message } = body;

    // 使用制限をチェック
    const isLimitExceeded = await aiChatOperations.isLimitExceeded(user.id);
    if (isLimitExceeded) {
      return NextResponse.json({ error: '1 日の利用回数を超えました。明日までお待ちください。' }, { status: 429 });
    }

    // OpenAI API を呼び出す
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    });

    const aiResponse = res.choices[0].message.content || '';

    // 会話をデータベースに保存
    await aiChatOperations.saveConversation(user.id, message, aiResponse);

    // 残り使用回数を取得
    const remainingUsage = await aiChatOperations.getRemainingUsage(user.id);

    // AI チャットのレスポンスと残り回数を返す
    return NextResponse.json({ response: aiResponse, remainingToday: remainingUsage });
  } catch (error) {
    console.error('AI チャットの処理中にエラーが発生しました:', error);

    return NextResponse.json({ error: 'AI チャットの処理中にエラーが発生しました' }, { status: 500 });
  }
});
