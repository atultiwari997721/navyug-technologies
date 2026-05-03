'use server';

// Temporary in-memory store for local development.
// In a real application, this would be saved to a database like Supabase.
declare global {
  var globalTelemetryStore: any[];
}

if (!global.globalTelemetryStore) {
  global.globalTelemetryStore = [];
}

export async function logTelemetryData(data: any) {
  const entry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  // Add to the beginning of the array so newest is first
  global.globalTelemetryStore.unshift(entry);
  
  // Keep only the last 50 entries to prevent memory leaks in dev
  if (global.globalTelemetryStore.length > 50) {
    global.globalTelemetryStore.pop();
  }

  return { success: true };
}

export async function getTelemetryData() {
  return global.globalTelemetryStore || [];
}

export async function clearTelemetryData() {
  global.globalTelemetryStore = [];
  return { success: true };
}
