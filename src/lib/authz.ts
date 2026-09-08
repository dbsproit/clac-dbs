// Single hardcoded admin account allowed to add/edit/delete team logins,
// salespeople, and pricing-policy categories. Everyone else can still view
// the Admin area — only the mutating actions are restricted.
export const ADMIN_EMAIL = "it@dbspro.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}
