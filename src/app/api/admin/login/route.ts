import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  adminSessionValue,
  verifyAdminPassword,
} from "@/lib/adminAuth";
import { checkLockout, clearAttempts, getClientIp, recordFailedAttempt } from "@/lib/loginRateLimit";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  const lockedForSeconds = checkLockout(ip);
  if (lockedForSeconds !== null) {
    return NextResponse.json(
      { error: `試行回数が多すぎます。${lockedForSeconds}秒後にもう一度お試しください` },
      { status: 429 },
    );
  }

  const { password } = (await request.json()) as { password?: string };

  if (!password || !verifyAdminPassword(password)) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  }

  clearAttempts(ip);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, adminSessionValue(), adminCookieOptions());

  return NextResponse.json({ ok: true });
}
