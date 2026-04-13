/* ============================================================
   /admin — Usage Dashboard (admin-only, no nav entry point)
   Access: direct URL only. Non-admins see a 403 screen.
   ============================================================ */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, ShieldAlert, Users, Zap, Calendar, Key } from "lucide-react";

const INK    = "oklch(0.28 0.040 320)";
const MUTED  = "oklch(0.52 0.040 330)";
const BORDER = "oklch(0.82 0.060 340)";
const CREAM  = "oklch(0.970 0.022 355)";
const TC     = "oklch(0.58 0.18 340)";
const BG     = "oklch(0.960 0.018 355)";

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div style={{
      background: CREAM,
      border: `1px solid ${BORDER}`,
      padding: "14px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: INK, fontFamily: "'Playfair Display', serif" }}>
        {value}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { data: rows, isLoading, error } = trpc.admin.getAllUsersUsage.useQuery(undefined, {
    enabled: user?.role === "admin",
    retry: false,
  });

  // ── Loading auth ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
        <Loader2 size={24} className="animate-spin" style={{ color: TC }} />
      </div>
    );
  }

  // ── Not admin ─────────────────────────────────────────────
  if (!user || user.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: BG, gap: 12 }}>
        <ShieldAlert size={36} style={{ color: TC, opacity: 0.7 }} />
        <p style={{ fontSize: 14, color: INK, fontFamily: "'Space Mono', monospace", letterSpacing: "0.06em" }}>403 — admin access only</p>
        <a href="/" style={{ fontSize: 11, color: MUTED, fontFamily: "'Space Mono', monospace", textDecoration: "underline" }}>← go back</a>
      </div>
    );
  }

  // ── Stats ─────────────────────────────────────────────────
  const totalUsers   = rows?.length ?? 0;
  const totalCalls   = rows?.reduce((s, r) => s + r.aiCallsTotal, 0) ?? 0;
  const monthCalls   = rows?.reduce((s, r) => s + r.aiCallsThisMonth, 0) ?? 0;
  const ownKeyUsers  = rows?.filter(r => r.hasOwnKey).length ?? 0;
  const currentMonth = rows?.[0]?.aiCallsMonthKey ?? new Date().toISOString().slice(0, 7);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Mono', monospace" }}>
      {/* Header bar */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`,
        background: CREAM,
        padding: "12px 28px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <ShieldAlert size={14} style={{ color: TC }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: INK, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Admin · Usage Dashboard
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: 9,
          color: MUTED,
          background: "oklch(0.93 0.030 168)",
          border: "1px solid oklch(0.70 0.12 168)",
          padding: "1px 6px",
          borderRadius: 3,
        }}>
          {user.name ?? user.email}
        </span>
        <a href="/" style={{ fontSize: 9, color: MUTED, textDecoration: "none", letterSpacing: "0.06em", opacity: 0.7 }}>← app</a>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard label="Total users" value={totalUsers} icon={<Users size={11} />} />
          <StatCard label="AI calls (all time)" value={totalCalls} icon={<Zap size={11} />} />
          <StatCard label={`AI calls (${currentMonth})`} value={monthCalls} icon={<Calendar size={11} />} />
          <StatCard label="Own-key users" value={ownKeyUsers} icon={<Key size={11} />} />
        </div>

        {/* Table */}
        <div style={{ background: CREAM, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 80px 100px 100px 80px 120px",
            padding: "8px 14px",
            background: "oklch(0.940 0.040 355)",
            borderBottom: `1px solid ${BORDER}`,
            fontSize: 8,
            color: MUTED,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}>
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Calls (total)</span>
            <span>Calls (month)</span>
            <span>Own key</span>
            <span>Last seen</span>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div style={{ padding: "32px", display: "flex", justifyContent: "center" }}>
              <Loader2 size={18} className="animate-spin" style={{ color: TC }} />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div style={{ padding: "20px 14px", fontSize: 11, color: "oklch(0.52 0.20 25)", fontFamily: "'Space Mono', monospace" }}>
              Failed to load: {error.message}
            </div>
          )}

          {/* Rows */}
          {rows?.map((row, i) => (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 80px 100px 100px 80px 120px",
                padding: "9px 14px",
                borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none",
                background: i % 2 === 0 ? "transparent" : "oklch(0.975 0.012 355 / 0.5)",
                fontSize: 10,
                color: INK,
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: row.role === "admin" ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.name}
                {row.role === "admin" && (
                  <span style={{ marginLeft: 5, fontSize: 7, color: TC, letterSpacing: "0.08em" }}>ADMIN</span>
                )}
              </span>
              <span style={{ color: MUTED, fontSize: 9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.email}</span>
              <span style={{ fontSize: 9, color: MUTED }}>{row.role}</span>
              <span style={{
                fontWeight: row.aiCallsTotal > 50 ? 700 : 400,
                color: row.aiCallsTotal > 50 ? TC : INK,
              }}>
                {row.aiCallsTotal}
              </span>
              <span style={{
                fontWeight: row.aiCallsThisMonth > 20 ? 700 : 400,
                color: row.aiCallsThisMonth > 20 ? TC : INK,
              }}>
                {row.aiCallsThisMonth}
                <span style={{ fontSize: 8, color: MUTED, marginLeft: 3 }}>{row.aiCallsMonthKey}</span>
              </span>
              <span style={{
                fontSize: 9,
                color: row.hasOwnKey ? "oklch(0.40 0.14 168)" : MUTED,
                fontWeight: row.hasOwnKey ? 600 : 400,
              }}>
                {row.hasOwnKey ? `✓ ${row.keyType}` : "—"}
              </span>
              <span style={{ fontSize: 9, color: MUTED }}>
                {new Date(row.lastSignedIn).toLocaleDateString()}
              </span>
            </div>
          ))}

          {rows?.length === 0 && !isLoading && (
            <div style={{ padding: "24px 14px", fontSize: 10, color: MUTED, textAlign: "center" }}>
              No users yet.
            </div>
          )}
        </div>

        <p style={{ marginTop: 10, fontSize: 8, color: MUTED, letterSpacing: "0.04em", opacity: 0.7 }}>
          Rows highlighted in pink = heavy consumers (&gt;50 total / &gt;20 this month). API keys are masked — only key presence is shown.
        </p>
      </div>
    </div>
  );
}
