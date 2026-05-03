'use server';

import { supabaseAdmin } from '@/lib/supabase';

export async function logTelemetryData(data: any) {
  // Use supabaseAdmin to bypass RLS for server-side insertions,
  // or use the standard client since we have an insert policy.
  // Using supabaseAdmin is safe here as this is a server action.
  const { error } = await supabaseAdmin
    .from('telemetry_logs')
    .insert([
      {
        type: data.type,
        status: data.status,
        browser: data.browser,
        location: data.location,
        photo: data.photo,
        error: data.error,
      }
    ]);

  if (error) {
    console.error("Failed to log telemetry to Supabase:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getTelemetryData() {
  const { data, error } = await supabaseAdmin
    .from('telemetry_logs')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error("Failed to fetch telemetry from Supabase:", error);
    throw new Error(error.message);
  }

  return data || [];
}

export async function clearTelemetryData() {
  // Delete all records (since it's an admin action)
  const { error } = await supabaseAdmin
    .from('telemetry_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // hack to delete all

  if (error) {
    console.error("Failed to clear telemetry from Supabase:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
