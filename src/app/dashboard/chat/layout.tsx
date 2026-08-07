import { redirect } from 'next/navigation';
import { requireModuleAccess } from '@/lib/supabase/requireModule';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const access = await requireModuleAccess('chat');

  if (access.error) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}