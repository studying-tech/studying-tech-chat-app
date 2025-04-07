export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from '@/utils/auth';
import { channelOperations } from '@/lib/db';
import { User } from '@/types/workspace';
import { z } from 'zod';

/**
 * [GET] /api/channels: 現在認証されているユーザーが参加しているチャンネルを取得
 */
export const GET = withAuth(async (request: NextRequest, _, user: User) => {
  try {
    const channels = await channelOperations.getChannelsByUserId(user.id);

    return NextResponse.json(channels);
  } catch (error) {
    console.error('チャンネル情報の取得に失敗しました:', error);

    return NextResponse.json({ error: 'チャンネル情報の取得に失敗しました' }, { status: 500 });
  }
});

// チャンネル作成のためのバリデーションスキーマ
const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'チャンネル名は必須です' })
    .max(50, { message: 'チャンネル名は 50 文字以内にしてください' }),
  description: z.string().max(200, { message: '説明は 200 文字以内にしてください' }).optional(),
});

/**
 * [POST] /api/channels: 新しいチャンネルを作成
 */
export const POST = withAuth(async (request: NextRequest, _, user: User) => {
  try {
    // リクエストボディを取得
    const body = await request.json();

    // バリデーション
    const result = createChannelSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.format(), message: 'チャンネルの作成データが不正です' },
        { status: 400 }
      );
    }

    // リクエストボディからチャンネル名と説明を取得
    const { name, description = '' } = body;

    // チャンネルを作成
    const channel = await channelOperations.createChannel(name, description, user.id);

    return NextResponse.json(channel);
  } catch (error) {
    console.error('チャンネルの作成に失敗しました:', error);

    return NextResponse.json({ error: 'チャンネルの作成に失敗しました' }, { status: 500 });
  }
});
