export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/utils/auth';
import { channelOperations, messageOperations } from '@/lib/db';
import { User } from '@/types/workspace';
import { z } from 'zod';

// パラメーターの型定義
type Params = { params: { channelId: string } };

// チャンネル ID のバリデーションスキーマ
const channelIdSchema = z.object({
  channelId: z.string().cuid({ message: 'チャンネル ID が正しい形式ではありません' }),
});

/**
 * [GET] /api/messages/channel/:channelId: 特定のチャンネルのメッセージを取得
 */
export const GET = withAuth(async (request: NextRequest, { params }: Params, user: User) => {
  // パラメーターのバリデーション
  const result = channelIdSchema.safeParse({ channelId: params.channelId });
  if (!result.success) {
    return NextResponse.json({ error: result.error.format(), message: 'チャンネル ID が無効です' }, { status: 400 });
  }

  // パラメーターからチャンネル ID を取得
  const { channelId } = params;

  try {
    // チャンネル情報を取得して、アクセス権をチェック
    const channel = await channelOperations.getChannelById(channelId);
    if (!channel) return NextResponse.json({ error: 'チャンネルが見つかりません' }, { status: 404 });

    // チャンネルのメンバーに、このユーザーが含まれているか確認
    const isMember = channel.members.some((member) => member.id === user.id);
    if (!isMember) return NextResponse.json({ error: 'このチャンネルにアクセスする権限がありません' }, { status: 403 });

    // チャンネル ID に基づいてメッセージを取得
    const messages = await messageOperations.getMessagesByChannelId(channelId);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('メッセージの取得に失敗しました:', error);

    return NextResponse.json({ error: 'メッセージの取得に失敗しました' }, { status: 500 });
  }
});

// メッセージ内容のバリデーションスキーマ
const messageSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'メッセージは 1 文字以上で入力してください' })
    .max(1000, { message: 'メッセージは 1000 文字以内にしてください' }),
});

/**
 * [POST] /api/messages/channel/:channelId: 特定のチャンネルにメッセージを投稿
 */
export const POST = withAuth(async (request: NextRequest, { params }: Params, user: User) => {
  // パラメーターのバリデーション
  const channelIdResult = channelIdSchema.safeParse({ channelId: params.channelId });
  if (!channelIdResult.success) {
    return NextResponse.json(
      { error: channelIdResult.error.format(), message: 'チャンネル ID が無効です' },
      { status: 400 }
    );
  }

  // リクエストボディを取得
  try {
    const body = await request.json();

    // メッセージ内容のバリデーション
    const messageResult = messageSchema.safeParse(body);
    if (!messageResult.success) {
      return NextResponse.json(
        { error: messageResult.error.format(), message: 'メッセージの形式が不正です' },
        { status: 400 }
      );
    }

    // パラメーターからチャンネル ID を取得
    const { channelId } = params;
    const { content } = body;

    // チャンネル情報を取得して、アクセス権をチェック
    const channel = await channelOperations.getChannelById(channelId);
    if (!channel) return NextResponse.json({ error: 'チャンネルが見つかりません' }, { status: 404 });

    // チャンネルのメンバーに、このユーザーが含まれているか確認
    const isMember = channel.members.some((member) => member.id === user.id);
    if (!isMember) return NextResponse.json({ error: 'このチャンネルにアクセスする権限がありません' }, { status: 403 });

    // メッセージを作成して保存
    const message = await messageOperations.createMessage(channelId, user.id, content);

    return NextResponse.json(message);
  } catch (error) {
    console.error('メッセージの投稿に失敗しました:', error);

    return NextResponse.json({ error: 'メッセージの投稿に失敗しました' }, { status: 500 });
  }
});
