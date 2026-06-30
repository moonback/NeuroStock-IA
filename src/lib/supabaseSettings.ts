import { getHeaders, getRestUrl as getTableRestUrl, isSupabaseConfigured, handleSupabaseUnauthorized, request } from './supabaseRest';

export { isSupabaseConfigured };

export interface SupabaseAppSettingRow {
  key: string;
  value: string;
  updated_at?: string;
}

const settingsTable = 'app_settings';

function getRestUrl(path = ''): string {
  return getTableRestUrl(settingsTable, path);
}

export async function fetchSetting(key: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const rows = await request<SupabaseAppSettingRow[]>(
      getRestUrl(`?select=value&key=eq.${encodeURIComponent(key)}&limit=1`),
      { headers: getHeaders() },
    );

    return rows[0]?.value ?? null;
  } catch (error) {
    console.error('Erreur lecture setting Supabase:', error);
    return null;
  }
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const response = await fetch(getRestUrl('?on_conflict=key'), {
      method: 'POST',
      headers: getHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify({ key, value }),
    });

    if (response.status === 401) {
      handleSupabaseUnauthorized();
      return;
    }

    if (!response.ok && response.status !== 204) {
      const text = await response.text();
      throw new Error(text || response.statusText || 'Erreur lors de la mise a jour du setting.');
    }
  } catch (error) {
    console.error('Erreur écriture setting Supabase:', error);
  }
}
