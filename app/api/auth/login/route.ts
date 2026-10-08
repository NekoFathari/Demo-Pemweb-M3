import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

const DUMMYJSON_LOGIN = "https://dummyjson.com/auth/login";

interface DummyJsonLoginResponse {
  accessToken: string;
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  user?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { username, password } = (body ?? {}) as {
    username?: unknown;
    password?: unknown;
  };

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Username dan password wajib diisi" },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(DUMMYJSON_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, expiresInMins: 60 }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Tidak dapat menghubungi server autentikasi" },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Username atau password salah" },
      { status: 401 },
    );
  }

  const data = (await upstream.json()) as DummyJsonLoginResponse;
  const profile = data.user ?? {
    id: data.id ?? 0,
    username: data.username ?? username,
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    email: data.email ?? "",
  };

  const response = NextResponse.json({
    accessToken: data.accessToken,
    user: {
      id: profile.id,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    },
  });

  response.cookies.set(SESSION_COOKIE, data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}
