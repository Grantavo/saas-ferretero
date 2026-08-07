import { redirect } from 'next/navigation';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export default async function CalendarLayout({ children }: { children: React.ReactNode }) {
  const access = await requireModuleAccess('calendar');

  if (access.error) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}