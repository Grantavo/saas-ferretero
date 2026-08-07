import { redirect } from 'next/navigation';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export default async function HistoryLayout({ children }: { children: React.ReactNode }) {
  const access = await requireModuleAccess('history');

  if (access.error) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}