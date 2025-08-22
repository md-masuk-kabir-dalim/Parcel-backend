export function generateUniqueId(): string {
  const prefix = "PKL";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${date}-${random}`;
}
