import { redirect } from 'next/navigation';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export default async function TasksLayout({ children }: { children: React.ReactNode }) {
  const access = await requireModuleAccess('tasks');

  if (access.error) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}