const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json() as Promise<{ status: string; sandboxMode: boolean }>;
}
