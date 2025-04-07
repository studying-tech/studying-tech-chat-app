export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/utils/auth';
import { channelOperations } from '@/lib/db';
import { User } from '@/types/workspace';
import { z } from 'zod';

// ダイレクトメッセージ作成のためのバリデーションスキーマ
const createDmSchema = z.object({
  userId: z.string().cuid({ message: 'ユーザー ID が正しい形式ではありません' }),
});

/**
 * [POST] /api/direct-messages: 新しいダイレクトメッセージチャンネルを作成
 */
export const POST = withAuth(async (request: NextRequest, _, user: User) => {
  try {
    // リクエストボディを取得
    const body = await request.json();

    // バリデーション
    const result = createDmSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.format(), message: 'ダイレクトメッセージの作成データが不正です' },
        { status: 400 }
      );
    }

    const { userId: recipientId } = body;

    // 自分自身との DM は作成できない
    if (recipientId === user.id) {
      return NextResponse.json({ error: '自分自身とダイレクトメッセージを開始することはできません' }, { status: 400 });
    }

    // DM チャンネルを作成 （既存のものがあればそれを返す）
    const channel = await channelOperations.createDirectMessage(user.id, recipientId);

    return NextResponse.json(channel);
  } catch (error) {
    console.error('ダイレクトメッセージの作成に失敗しました:', error);

    return NextResponse.json({ error: 'ダイレクトメッセージの作成に失敗しました' }, { status: 500 });
  }
});
