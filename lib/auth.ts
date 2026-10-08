import { cookies } from "next/headers";

export const SESSION_COOKIE = "session";

export async function getSession(): Promise<{ token: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return { token };
}
