'use server';

import { cookies } from 'next/headers';

export async function loginAdmin(userId: string, pass: string) {
  // Hardcoded check based on prompt
  if (userId === 'Sanjay@997721atul' && pass === 'atul99@7721') {
    // In a real application, set a secure HTTP-only cookie with a JWT or session ID
    // Awaiting cookies() is required in newer Next.js versions
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });
    
    return { success: true };
  }
  
  return { success: false, message: 'Invalid User ID or Password' };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return { success: true };
}
