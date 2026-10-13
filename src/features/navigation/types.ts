export type NavigationBadgeKind = "attendance" | "promotions" | "notifications";

export interface ShellPreferences {
  /** Opaque cookie namespace, not an identity or authorization claim. */
  key: string;
  collapsed: boolean;
  menuSeen: boolean;
}

export function saveShellPreference(key: string | undefined, kind: "rail" | "menu", value: boolean): void {
  if (!key || !/^cq-shell-[a-f0-9]{24}$/.test(key)) return;
  try {
    document.cookie = `${key}-${kind}=${value ? "1" : "0"}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  } catch {
    // Blocked cookies must not prevent toggling or closing navigation.
  }
}
