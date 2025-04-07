'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

import { userOperations } from '@/lib/db';

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: { data: { name: formData.get('name') as string } },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    console.log(error);
    redirect('/error');
  }

  // Supabase の認証後に、ユーザー情報を Prisma でデータベースの User テーブルに保存
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.id) {
    console.error('ユーザー情報が取得できませんでした');
    redirect('/error');
  }

  await userOperations.createUser(user.id, data.email, data.options.data.name);

  revalidatePath('/', 'layout');
  redirect('/workspace');
}
