const CAT_FACT_URL = 'https://catfact.ninja/fact';

export async function fetchCatFact(): Promise<string> {
  const response = await fetch(CAT_FACT_URL, { credentials: 'omit' });
  if (!response.ok) {
    throw new Error(`Cat facts request failed (${response.status})`);
  }
  const data = (await response.json()) as { fact?: unknown };
  if (typeof data.fact !== 'string' || !data.fact.trim()) {
    throw new Error('No cat fact returned');
  }
  return data.fact.trim();
}
