export type UsernameKind = "student" | "staff" | "guardian" | "account";

export interface LoginAlias {
  normalizedUsername: string;
  email: string;
  kind: UsernameKind;
}

export function normalizeVietnamesePhone(value: string): string | null {
  const digits = value.replace(/[^0-9]/g, "");
  if (/^0[0-9]{9}$/.test(digits)) return `84${digits.slice(1)}`;
  if (/^84[0-9]{9}$/.test(digits)) return digits;
  return null;
}

export function deriveLoginAlias(username: string, domain: string): LoginAlias | null {
  const trimmed = username.trim();
  const upper = trimmed.toUpperCase();
  const safeDomain = domain.trim().toLowerCase();
  if (!safeDomain || !/^[a-z0-9.-]+$/.test(safeDomain)) return null;

  if (/^CQ[0-9]{4,}$/.test(upper)) {
    return { normalizedUsername: upper, email: `${upper.toLowerCase()}@students.${safeDomain}`, kind: "student" };
  }
  if (/^GLV[0-9]{3,}$/.test(upper)) {
    return { normalizedUsername: upper, email: `${upper.toLowerCase()}@staff.${safeDomain}`, kind: "staff" };
  }

  const phone = normalizeVietnamesePhone(trimmed);
  if (phone) return { normalizedUsername: phone, email: `${phone}@guardians.${safeDomain}`, kind: "guardian" };

  if (/^[A-Za-z][A-Za-z0-9._-]{2,49}$/.test(trimmed)) {
    const normalizedUsername = upper;
    return { normalizedUsername, email: `${trimmed.toLowerCase()}@accounts.${safeDomain}`, kind: "account" };
  }
  return null;
}
