import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = await createClient();

  // 1. Check Auth User
  const { data: { user } } = await supabase.auth.getUser();

  // If no user is logged in, redirect to login (we'll need to build this next)
  if (!user) {
    return redirect('/login'); 
  }

  // 2. Check Profile Role
  // We explicitly select the 'role' column from the 'profiles' table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // 3. Routing Logic
  // Adjust 'admin' string if your enum uses different casing (e.g. 'Admin', 'ORG_ADMIN')
  if (profile?.role === 'admin') {
    return redirect('/dashboard');
  } else {
    // Non-admins (members) go to events
    return redirect('/events');
  }
}