import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

export const adminRouter = router({
  /**
   * Returns all users with their AI usage stats (split by provider), sorted by total calls desc.
   * Protected by adminProcedure — throws FORBIDDEN for non-admin users.
   */
  getAllUsersUsage: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        keyType: users.keyType,
        hasOwnKey: users.apiKey,
        aiCallsTotal: users.aiCallsTotal,
        aiCallsThisMonth: users.aiCallsThisMonth,
        aiCallsMonthKey: users.aiCallsMonthKey,
        manusCallsTotal: users.manusCallsTotal,
        manusCallsThisMonth: users.manusCallsThisMonth,
        openaiCallsTotal: users.openaiCallsTotal,
        openaiCallsThisMonth: users.openaiCallsThisMonth,
        lastSignedIn: users.lastSignedIn,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.aiCallsTotal));

    // Mask the apiKey — only expose whether they have one, not the key itself
    return rows.map((u) => ({
      id: u.id,
      name: u.name ?? "(no name)",
      email: u.email ?? "(no email)",
      role: u.role,
      keyType: u.keyType ?? "openai",
      hasOwnKey: Boolean(u.hasOwnKey),
      aiCallsTotal: u.aiCallsTotal,
      aiCallsThisMonth: u.aiCallsThisMonth,
      aiCallsMonthKey: u.aiCallsMonthKey ?? "—",
      manusCallsTotal: u.manusCallsTotal,
      manusCallsThisMonth: u.manusCallsThisMonth,
      openaiCallsTotal: u.openaiCallsTotal,
      openaiCallsThisMonth: u.openaiCallsThisMonth,
      lastSignedIn: u.lastSignedIn,
      createdAt: u.createdAt,
    }));
  }),
});
