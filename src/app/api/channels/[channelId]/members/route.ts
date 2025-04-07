export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/utils/auth';
import { channelOperations } from '@/lib/db';
import { User } from '@/types/workspace';
import { z } from 'zod';

// パラメーターの型定義
type Params = { params: { channelId: string } };

// チャンネル ID のバリデーションスキーマ
const channelIdSchema = z.object({
  channelId: z.string().cuid({ message: 'チャンネル ID が正しい形式ではありません' }),
});

// メンバー追加のリクエストボディのバリデーションスキーマ
const addMembersSchema = z.object({
  userIds: z.array(z.string().cuid({ message: 'ユーザー ID が正しい形式ではありません' })).min(1, {
    message: '追加するユーザーを少なくとも1人指定してください',
  }),
});

/**
 * [POST] /api/channels/:channelId/members: チャンネルにメンバーを追加
 */
export const POST = withAuth(async (request: NextRequest, { params }: Params, user: User) => {
  // チャンネルIDのバリデーション
  const channelResult = channelIdSchema.safeParse({ channelId: params.channelId });
  if (!channelResult.success) {
    return NextResponse.json(
      { error: channelResult.error.format(), message: 'チャンネル ID が無効です' },
      { status: 400 }
    );
  }

  const { channelId } = params;

  try {
    // チャンネル情報を取得
    const channel = await channelOperations.getChannelById(channelId);
    if (!channel) {
      return NextResponse.json({ error: 'チャンネルが見つかりません' }, { status: 404 });
    }

    // チャンネルのメンバーに、このユーザーが含まれているか確認
    const isMember = channel.members.some((member) => member.id === user.id);
    if (!isMember) {
      return NextResponse.json({ error: 'このチャンネルにアクセスする権限がありません' }, { status: 403 });
    }

    // リクエストボディを取得
    const body = await request.json();

    // バリデーション
    const membersResult = addMembersSchema.safeParse(body);
    if (!membersResult.success) {
      return NextResponse.json(
        { error: membersResult.error.format(), message: 'メンバー追加データが不正です' },
        { status: 400 }
      );
    }

    const { userIds } = body;

    // 既に追加済みのユーザーを、追加するリストから除外
    // (フロントエンド側でもチェックしているが、念のためサーバー側でもチェックする)
    const existingMemberIds = channel.members.map((member) => member.id);
    const newUserIds = userIds.filter((id: string) => !existingMemberIds.includes(id));

    if (newUserIds.length === 0) {
      return NextResponse.json({ message: '全てのユーザーは既にチャンネルのメンバーです' }, { status: 200 });
    }

    // チャンネルにメンバーを追加
    const updatedChannel = await channelOperations.addMembersToChannel(channelId, newUserIds);

    return NextResponse.json(updatedChannel);
  } catch (error) {
    console.error('チャンネルメンバーの追加に失敗しました:', error);
    return NextResponse.json({ error: 'チャンネルメンバーの追加に失敗しました' }, { status: 500 });
  }
});
