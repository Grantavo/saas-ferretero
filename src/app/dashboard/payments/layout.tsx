import { redirect } from 'next/navigation';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export default async function PaymentsLayout({ children }: { children: React.ReactNode }) {
  const access = await requireModuleAccess('payments');

  if (access.error) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}