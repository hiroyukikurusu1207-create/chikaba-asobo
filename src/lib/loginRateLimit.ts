const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30_000;

type AttemptRecord = { count: number; lockedUntil: number };

// サーバーレス関数のインスタンスが再利用される間だけ有効な簡易的な制限。
// 完全な防御ではないが、素朴な総当たりを大きく遅くする目的には十分。
const attempts = new Map<string, AttemptRecord>();

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// ロックアウト中なら残り秒数を返す。ロックアウトしていなければnull。
export function checkLockout(ip: string): number | null {
  const record = attempts.get(ip);
  if (!record || record.lockedUntil <= Date.now()) return null;
  return Math.ceil((record.lockedUntil - Date.now()) / 1000);
}

export function recordFailedAttempt(ip: string): void {
  const record = attempts.get(ip);
  const count = (record?.count ?? 0) + 1;
  if (count >= MAX_ATTEMPTS) {
    attempts.set(ip, { count: 0, lockedUntil: Date.now() + LOCKOUT_MS });
  } else {
    attempts.set(ip, { count, lockedUntil: 0 });
  }
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}
