import { redirect } from 'next/navigation';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export default async function CustomersLayout({ children }: { children: React.ReactNode }) {
  const access = await requireModuleAccess('customers');

  if (access.error) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}