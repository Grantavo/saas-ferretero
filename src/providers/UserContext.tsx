'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  full_name: string;
  tenant_id: string;
  role: string;
  is_super_admin: boolean;
};

type Tenant = {
  id: string;
  name: string;
  is_active: boolean;
  logo_url: string | null;
};

type UserContextType = {
  user: User | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  tenant: null,
  loading: true,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchUserData = async (currentUser: User | null) => {
    setLoading(true);
    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      setUser(currentUser);

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setProfile(null);
        setTenant(null);
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile);

      // Fetch Tenant if exists
      if (profileData?.tenant_id) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profileData.tenant_id)
          .single();

        if (tenantError) {
          console.error('Error fetching tenant:', tenantError);
          setTenant(null);
        } else {
          setTenant(tenantData as Tenant);
        }
      } else {
        setTenant(null);
      }
    } catch (error) {
      console.error('Unexpected error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
      fetchUserData(user);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserData(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await fetchUserData(user);
  };

  return (
    <UserContext.Provider value={{ user, profile, tenant, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
