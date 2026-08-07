import { redirect } from 'next/navigation';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const access = await requireModuleAccess('pos');

  if (access.error) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}