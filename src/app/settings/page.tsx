"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/PageHeader";
import { Card, Field, NumberInput, TextInput, TextArea, Button } from "@/components/ui/primitives";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { isAdminEmail } from "@/lib/authz";
import { pct } from "@/lib/format";

const MAX_LOGO_BYTES = 300 * 1024;

export default function SettingsPage() {
  const hydrated = useHydrated();
  const { data: session } = useSession();
  const isAdmin = isAdminEmail(session?.user?.email);
  const {
    company,
    setCompany,
    proposalDefaults,
    setProposalDefaults,
    loadSettings,
    saveSettings,
    salespeople,
    loadSalespeople,
    addSalesperson,
    updateSalesperson,
    removeSalesperson,
  } = useApp();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [newSalesName, setNewSalesName] = useState("");
  const [newSalesPct, setNewSalesPct] = useState(10);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => loadSettings(data.costSettings, data.company, data.proposalDefaults))
      .finally(() => setLoaded(true));
    fetch("/api/salespeople")
      .then((res) => res.json())
      .then(loadSalespeople);
    // Runs once on mount to hydrate from the shared server settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Image must be smaller than 300 KB — resize it and try again.");
      return;
    }
    setLogoError("");
    const reader = new FileReader();
    reader.onload = () => setCompany({ logoUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  async function handleAddSalesperson() {
    if (!newSalesName.trim()) return;
    try {
      await addSalesperson(newSalesName.trim(), newSalesPct);
      setNewSalesName("");
      setNewSalesPct(10);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not add salesperson.");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveSettings();
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated || !loaded) return <PageHeader title="Settings" />;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Company profile, proposal defaults, and your sales team"
        actions={<Button onClick={handleSave}>{saving ? "Saving…" : "Save settings"}</Button>}
      />
      <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-2">
        <Card
          title="Company profile"
          subtitle="Appears on BIDs and Scope of Work documents"
        >
          <div className="grid gap-4">
            <Field label="Company logo" hint="PNG or JPG, under 300 KB">
              <div className="flex items-center gap-3">
                {company.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={company.logoUrl}
                    alt="Company logo"
                    className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-contain"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="text-sm text-slate-600"
                />
                {company.logoUrl && (
                  <button
                    onClick={() => setCompany({ logoUrl: "" })}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
            </Field>
            <Field label="Company name">
              <TextInput
                value={company.name}
                onChange={(e) => setCompany({ name: e.target.value })}
              />
            </Field>
            <Field label="Tagline">
              <TextInput
                value={company.tagline}
                onChange={(e) => setCompany({ tagline: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Contact name">
                <TextInput
                  value={company.contactName}
                  onChange={(e) => setCompany({ contactName: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <TextInput
                  value={company.phone}
                  onChange={(e) => setCompany({ phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <TextInput
                  value={company.email}
                  onChange={(e) => setCompany({ email: e.target.value })}
                />
              </Field>
              <Field label="Website">
                <TextInput
                  value={company.website}
                  onChange={(e) => setCompany({ website: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Address">
              <TextInput
                value={company.address}
                onChange={(e) => setCompany({ address: e.target.value })}
              />
            </Field>
          </div>
        </Card>

        <Card
          title="Proposal defaults"
          subtitle="Applied to every new proposal's BID terms"
        >
          <div className="grid gap-4">
            <Field label="Proposal number prefix" hint='e.g. "DBS" → DBS-2026-001'>
              <TextInput
                value={proposalDefaults.proposalNumberPrefix}
                onChange={(e) => setProposalDefaults({ proposalNumberPrefix: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Valid for" hint="Days the quote stays valid">
                <NumberInput
                  value={proposalDefaults.defaultValidForDays}
                  onChange={(n) => setProposalDefaults({ defaultValidForDays: n })}
                  suffix="days"
                />
              </Field>
              <Field label="Contract term" hint="Months">
                <NumberInput
                  value={proposalDefaults.defaultContractTermMonths}
                  onChange={(n) => setProposalDefaults({ defaultContractTermMonths: n })}
                  suffix="mo"
                />
              </Field>
            </div>
            <Field label="Payment terms">
              <TextInput
                value={proposalDefaults.defaultPaymentTerms}
                onChange={(e) => setProposalDefaults({ defaultPaymentTerms: e.target.value })}
              />
            </Field>
            <Field label="Boilerplate notes" hint="Printed at the bottom of every BID">
              <TextArea
                value={proposalDefaults.defaultProposalNotes}
                onChange={(e) => setProposalDefaults({ defaultProposalNotes: e.target.value })}
              />
            </Field>
          </div>
        </Card>

        <Card
          title="Sales team"
          subtitle={
            isAdmin
              ? "Salespeople and their commission % — pick from this list on Extra Services lines"
              : "Only it@dbspro.com can add, edit, or remove salespeople"
          }
        >
          <div className="space-y-2">
            {salespeople.map((p) =>
              isAdmin ? (
                <div
                  key={p.id}
                  className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_120px_auto]"
                >
                  <TextInput
                    value={p.name}
                    onChange={(e) => updateSalesperson(p.id, { name: e.target.value })}
                  />
                  <NumberInput
                    value={p.commissionPct}
                    onChange={(n) => updateSalesperson(p.id, { commissionPct: n })}
                    suffix="%"
                  />
                  <button
                    onClick={() => removeSalesperson(p.id)}
                    className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50"
                    aria-label="Remove salesperson"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div key={p.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-slate-700">{p.name}</span>
                  <span className="text-slate-500">{pct(p.commissionPct)}</span>
                </div>
              )
            )}
            {salespeople.length === 0 && (
              <p className="py-2 text-sm text-slate-400">No salespeople yet.</p>
            )}
            {isAdmin && (
              <div className="grid grid-cols-1 items-center gap-3 border-t border-slate-100 pt-3 sm:grid-cols-[1fr_120px_auto]">
                <TextInput
                  value={newSalesName}
                  onChange={(e) => setNewSalesName(e.target.value)}
                  placeholder="Name"
                />
                <NumberInput value={newSalesPct} onChange={setNewSalesPct} suffix="%" />
                <Button variant="ghost" onClick={handleAddSalesperson}>
                  + Add
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
