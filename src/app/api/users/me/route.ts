export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/utils/auth';
import { User } from '@/types/workspace';
import { userOperations } from '@/lib/db';
import { z } from 'zod';

/**
 * [GET] /api/users/me: 現在認証されているユーザーの情報を取得
 */
export const GET = withAuth(async (request: NextRequest, _, user: User) => {
  // 認証済みユーザーの情報をそのまま返す
  return NextResponse.json(user);
});

// ユーザープロフィール更新のバリデーションスキーマ
const updateProfileSchema = z.object({
  name: z
    .string({ required_error: 'ユーザー名は必須です', invalid_type_error: 'ユーザー名は文字列である必要があります' })
    .min(1, 'ユーザー名は 1 文字以上である必要があります')
    .max(30, 'ユーザー名は 30 文字以下である必要があります'),
});

/**
 * [PATCH] /api/users/me: 現在認証されているユーザーの情報を更新
 */
export const PATCH = withAuth(async (request: NextRequest, _, user: User) => {
  try {
    const body = await request.json();

    // リクエストボディのバリデーション
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.format(), message: 'バリデーションエラー' }, { status: 400 });
    }

    // バリデーション済みのデータを使用
    const { name } = result.data;

    // ユーザー名を更新
    const updatedUser = await userOperations.updateUserName(user.id, name);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    return NextResponse.json({ error: 'ユーザー情報の更新中にエラーが発生しました' }, { status: 500 });
  }
});
