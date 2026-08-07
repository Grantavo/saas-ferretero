import { redirect } from 'next/navigation';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const access = await requireModuleAccess('settings');

  if (access.error) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}