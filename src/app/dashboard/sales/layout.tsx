import { redirect } from 'next/navigation';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const access = await requireModuleAccess('sales');

  if (access.error) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}