
export function getAdminAllowlist(){
  const env = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return env.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}
