import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("Local Supabase URL/anon/service-role environment is required.");
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const userClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = `${Date.now()}${randomBytes(3).toString("hex")}`;
const username = `AUTH${suffix}`;
const email = `${username.toLowerCase()}@accounts.choquan.internal`;
const initialPassword = `a${randomBytes(8).toString("hex")}2`;
const ownPassword = `b${randomBytes(8).toString("hex")}3`;
const resetPassword = `c${randomBytes(8).toString("hex")}4`;
let userId;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: initialPassword,
    email_confirm: true,
  });
  if (createError || !created.user) throw new Error("Auth user provisioning failed.");
  userId = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    username,
    display_name: "Auth Flow Test",
    account_status: "active",
    must_change_password: true,
  });
  if (profileError) throw new Error("Profile provisioning failed.");
  const { error: roleError } = await admin.from("role_assignments").insert({ profile_id: userId, role: "guardian" });
  if (roleError) throw new Error("Role provisioning failed.");

  const firstLogin = await userClient.auth.signInWithPassword({ email, password: initialPassword });
  assert(!firstLogin.error && firstLogin.data.user?.id === userId, "Initial login failed.");
  const ownUpdate = await userClient.auth.updateUser({ password: ownPassword });
  assert(!ownUpdate.error, "Own password change failed.");
  const completion = await userClient.rpc("complete_password_change");
  assert(!completion.error, "Password completion RPC failed.");
  const completedProfile = await userClient.from("profiles").select("must_change_password").single();
  assert(completedProfile.data?.must_change_password === false, "Must-change flag was not cleared.");

  const adminReset = await admin.auth.admin.updateUserById(userId, { password: resetPassword });
  assert(!adminReset.error, "Admin reset failed.");
  const resetFlag = await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);
  assert(!resetFlag.error, "Must-change flag was not restored.");
  await userClient.auth.signOut();
  const resetLogin = await userClient.auth.signInWithPassword({ email, password: resetPassword });
  assert(!resetLogin.error, "Login with reset password failed.");

  const disabled = await admin.from("profiles").update({ account_status: "disabled" }).eq("id", userId);
  assert(!disabled.error, "Profile disable failed.");
  const banned = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  assert(!banned.error, "Auth disable failed.");
  await userClient.auth.signOut();
  const disabledLogin = await userClient.auth.signInWithPassword({ email, password: resetPassword });
  assert(Boolean(disabledLogin.error), "Disabled account unexpectedly logged in.");

  process.stdout.write("Auth flow smoke passed: provision, login, change, reset, disable.\n");
} finally {
  if (userId) await admin.auth.admin.deleteUser(userId);
}
