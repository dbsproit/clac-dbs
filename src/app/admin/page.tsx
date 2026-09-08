"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MapPin, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, Field, TextInput, NumberInput, Button } from "@/components/ui/primitives";
import { useApp } from "@/lib/store";
import { pct } from "@/lib/format";
import { isAdminEmail } from "@/lib/authz";
import type { PricingBenchmark, TeamUser } from "@/lib/types";

const PCT_COLUMNS: { key: keyof Omit<PricingBenchmark, "id" | "label">; label: string }[] = [
  { key: "laborPct", label: "Labor" },
  { key: "chemPct", label: "Chem." },
  { key: "machinePct", label: "Machine" },
  { key: "padsPct", label: "Pads" },
  { key: "waterPct", label: "Water" },
  { key: "vehiclePct", label: "Vehicle" },
  { key: "maintPct", label: "Maint." },
  { key: "deprecPct", label: "Deprec." },
  { key: "adminPct", label: "Admin" },
  { key: "commPct", label: "Comm." },
  { key: "profitPct", label: "Profit" },
];

const BLANK_BENCHMARK: Omit<PricingBenchmark, "id"> = {
  label: "New category",
  laborPct: 0,
  chemPct: 0,
  machinePct: 0,
  padsPct: 0,
  waterPct: 0,
  vehiclePct: 0,
  maintPct: 0,
  deprecPct: 0,
  adminPct: 0,
  commPct: 0,
  profitPct: 0,
};

function totalOf(b: PricingBenchmark): number {
  return PCT_COLUMNS.reduce((sum, c) => sum + (b[c.key] || 0), 0);
}

function TeamAccessCard() {
  const { data: session } = useSession();
  const isAdmin = isAdminEmail(session?.user?.email);
  const { teamUsers, loadTeamUsers, addTeamUser, updateTeamUser, removeTeamUser } = useApp();
  const [loaded, setLoaded] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { name: string; email: string }>>({});
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((list: TeamUser[]) => {
        loadTeamUsers(list);
        setDrafts(Object.fromEntries(list.map((u) => [u.id, { name: u.name || "", email: u.email }])));
      })
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveRow(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    try {
      await updateTeamUser(id, { name: draft.name, email: draft.email });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update user.");
    }
  }

  async function handleSetPassword(id: string) {
    if (!newPassword) return;
    try {
      await updateTeamUser(id, { password: newPassword });
      setResettingId(null);
      setNewPassword("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not reset password.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this user's access? This can't be undone.")) return;
    try {
      await removeTeamUser(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete user.");
    }
  }

  async function handleAddUser() {
    if (!newUser.email.trim() || !newUser.password) return;
    setAdding(true);
    try {
      await addTeamUser(newUser.email.trim(), newUser.name.trim(), newUser.password);
      setNewUser({ name: "", email: "", password: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not create user.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card
      title="Team access"
      subtitle={isAdmin ? "Who can log into the system" : "Only it@dbspro.com can manage team access"}
    >
      {!loaded ? (
        <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="w-48 pb-2 pr-2">Name</th>
                <th className="w-56 pb-2 pr-2">Email</th>
                <th className="w-24 pb-2 pr-2">Proposals</th>
                <th className="w-32 pb-2 pr-2">Created</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {teamUsers.map((u) => {
                const draft = drafts[u.id] ?? { name: u.name || "", email: u.email };
                const dirty = draft.name !== (u.name || "") || draft.email !== u.email;
                const canDelete = u.proposalCount === 0 && teamUsers.length > 1;
                return (
                  <tr key={u.id} className="border-t border-slate-100 align-top">
                    <td className="py-1.5 pr-2">
                      {isAdmin ? (
                        <TextInput
                          value={draft.name}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [u.id]: { ...draft, name: e.target.value } }))
                          }
                        />
                      ) : (
                        <span className="text-slate-700">{u.name || "—"}</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-2">
                      {isAdmin ? (
                        <TextInput
                          value={draft.email}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [u.id]: { ...draft, email: e.target.value } }))
                          }
                        />
                      ) : (
                        <span className="text-slate-700">{u.email}</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-2 text-slate-600">{u.proposalCount}</td>
                    <td className="py-1.5 pr-2 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="space-x-1 py-1.5 text-right">
                      {isAdmin && dirty && (
                        <button
                          onClick={() => handleSaveRow(u.id)}
                          className="rounded-md px-2 py-1 text-sm text-brand-600 hover:bg-brand-50"
                        >
                          Save
                        </button>
                      )}
                      {isAdmin &&
                        (resettingId === u.id ? (
                          <span className="inline-flex items-center gap-1">
                            <TextInput
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="New password"
                              className="w-32"
                            />
                            <button
                              onClick={() => handleSetPassword(u.id)}
                              className="rounded-md px-2 py-1 text-sm text-brand-600 hover:bg-brand-50"
                            >
                              Set
                            </button>
                            <button
                              onClick={() => {
                                setResettingId(null);
                                setNewPassword("");
                              }}
                              className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setResettingId(u.id)}
                            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-50"
                          >
                            Reset password
                          </button>
                        ))}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={!canDelete}
                          title={
                            !canDelete
                              ? u.proposalCount > 0
                                ? "Remove or reassign this user's proposals first."
                                : "Can't delete the last remaining user."
                              : undefined
                          }
                          className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {teamUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {isAdmin && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Field label="Name">
                <TextInput
                  value={newUser.name}
                  onChange={(e) => setNewUser((s) => ({ ...s, name: e.target.value }))}
                />
              </Field>
              <Field label="Email">
                <TextInput
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))}
                />
              </Field>
              <Field label="Password">
                <TextInput
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))}
                />
              </Field>
              <div className="flex items-end">
                <Button onClick={handleAddUser} className="w-full sm:w-auto">
                  {adding ? "Adding…" : "+ Add user"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const isAdmin = isAdminEmail(session?.user?.email);
  const { pricingBenchmarks, loadPricingBenchmarks, addPricingBenchmark, updatePricingBenchmark, removePricingBenchmark } =
    useApp();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/pricing-benchmarks")
      .then((res) => res.json())
      .then(loadPricingBenchmarks)
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Team access and pricing policy configuration"
        actions={
          isAdmin ? (
            <Button
              onClick={() =>
                addPricingBenchmark(BLANK_BENCHMARK).catch((err) =>
                  alert(err instanceof Error ? err.message : "Could not add category.")
                )
              }
            >
              + Add category
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-6 p-8">
        <Link href="/admin/market-pricing">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-800">Market Pricing Guide — Utah, USA</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  How your registered services compare to real researched market rates
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </div>
        </Link>

        <TeamAccessCard />

        <Card
          title="Pricing policy"
          subtitle={
            isAdmin
              ? "Master Pricing Reference Table (Policy 01)"
              : "Master Pricing Reference Table (Policy 01) — only it@dbspro.com can edit"
          }
        >
          {!loaded ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                    <th className="w-56 pb-2 pr-2">Service</th>
                    {PCT_COLUMNS.map((c) => (
                      <th key={c.key} className="w-20 pb-2 pr-2">
                        {c.label}
                      </th>
                    ))}
                    <th className="w-20 pb-2 pr-2">Total</th>
                    <th className="w-10 pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {pricingBenchmarks.map((b) => {
                    const total = totalOf(b);
                    const offTotal = Math.abs(total - 100) > 0.1;
                    return (
                      <tr key={b.id} className="border-t border-slate-100">
                        <td className="py-1.5 pr-2">
                          {isAdmin ? (
                            <TextInput
                              value={b.label}
                              onChange={(e) => updatePricingBenchmark(b.id, { label: e.target.value })}
                            />
                          ) : (
                            <span className="text-slate-700">{b.label}</span>
                          )}
                        </td>
                        {PCT_COLUMNS.map((c) => (
                          <td key={c.key} className="py-1.5 pr-2">
                            {isAdmin ? (
                              <NumberInput
                                value={b[c.key]}
                                onChange={(n) => updatePricingBenchmark(b.id, { [c.key]: n })}
                              />
                            ) : (
                              <span className="text-slate-600">{pct(b[c.key], 0)}</span>
                            )}
                          </td>
                        ))}
                        <td
                          className={`py-1.5 pr-2 text-center font-medium ${
                            offTotal ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {pct(total, 0)}
                        </td>
                        <td className="py-1.5">
                          {isAdmin && (
                            <button
                              onClick={() => removePricingBenchmark(b.id)}
                              className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50"
                              aria-label="Remove category"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {pricingBenchmarks.length === 0 && (
                    <tr>
                      <td colSpan={PCT_COLUMNS.length + 3} className="py-6 text-center text-sm text-slate-400">
                        No categories yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
