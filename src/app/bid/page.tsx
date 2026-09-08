"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  Card,
  Field,
  TextInput,
  NumberInput,
  TextArea,
  Button,
} from "@/components/ui/primitives";
import ProposalDocument from "@/components/ProposalDocument";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import SaveProposalButton from "@/components/SaveProposalButton";

export default function BidPage() {
  const hydrated = useHydrated();
  const { client, setClient, bid, setBid, company, loadAreaTypes } = useApp();
  const [includeExtras, setIncludeExtras] = useState(true);
  const [includeScope, setIncludeScope] = useState(true);

  useEffect(() => {
    fetch("/api/area-types")
      .then((res) => res.json())
      .then(loadAreaTypes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) return <PageHeader title="BID / Proposal" />;

  return (
    <>
      <PageHeader
        title="BID / Proposal Builder"
        subtitle="Assemble a professional proposal from your estimate, scope and terms"
        actions={
          <>
            <SaveProposalButton />
            <Button onClick={() => window.print()}>🖨 Print / Save PDF</Button>
          </>
        }
      />
      <div className="grid gap-6 p-8 xl:grid-cols-[380px_1fr]">
        {/* -------------------------------------------------------- editor */}
        <div className="no-print space-y-6">
          <Card title="Client details">
            <div className="grid gap-4">
              <Field label="Client company">
                <TextInput
                  value={client.company}
                  onChange={(e) => setClient({ company: e.target.value })}
                  placeholder="Summit Property Group"
                />
              </Field>
              <Field label="Contact name">
                <TextInput
                  value={client.contactName}
                  onChange={(e) => setClient({ contactName: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email">
                  <TextInput
                    value={client.email}
                    onChange={(e) => setClient({ email: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <TextInput
                    value={client.phone}
                    onChange={(e) => setClient({ phone: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Property address">
                <TextInput
                  value={client.propertyAddress}
                  onChange={(e) =>
                    setClient({ propertyAddress: e.target.value })
                  }
                />
              </Field>
            </div>
          </Card>

          <Card title="Proposal terms">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Proposal #">
                  <TextInput
                    value={bid.proposalNumber}
                    onChange={(e) => setBid({ proposalNumber: e.target.value })}
                  />
                </Field>
                <Field label="Date">
                  <TextInput
                    type="date"
                    value={bid.date}
                    onChange={(e) => setBid({ date: e.target.value })}
                  />
                </Field>
                <Field label="Valid for (days)">
                  <NumberInput
                    value={bid.validForDays}
                    onChange={(n) => setBid({ validForDays: n })}
                  />
                </Field>
                <Field label="Contract term (months)">
                  <NumberInput
                    value={bid.contractTermMonths}
                    onChange={(n) => setBid({ contractTermMonths: n })}
                  />
                </Field>
              </div>
              <Field label="Proposed start date">
                <TextInput
                  type="date"
                  value={bid.startDate}
                  onChange={(e) => setBid({ startDate: e.target.value })}
                />
              </Field>
              <Field label="Payment terms">
                <TextInput
                  value={bid.paymentTerms}
                  onChange={(e) => setBid({ paymentTerms: e.target.value })}
                />
              </Field>
              <Field label="Notes / conditions">
                <TextArea
                  value={bid.notes}
                  onChange={(e) => setBid({ notes: e.target.value })}
                />
              </Field>
            </div>
          </Card>

          <Card title="Include in proposal">
            <label className="flex items-center gap-2 py-1 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeExtras}
                onChange={(e) => setIncludeExtras(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Additional / specialty services
            </label>
            <label className="flex items-center gap-2 py-1 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeScope}
                onChange={(e) => setIncludeScope(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Scope of Work
            </label>
            <p className="mt-2 text-xs text-slate-400">
              Company info is set in{" "}
              <span className="font-medium">Rates &amp; Settings</span>. Pricing
              comes from the <span className="font-medium">Budget Calculator</span>.
            </p>
          </Card>
        </div>

        {/* --------------------------------------------------- live preview */}
        <div className="rounded-xl bg-slate-100 p-4 print:bg-white print:p-0">
          <ProposalDocument
            includeExtras={includeExtras}
            includeScope={includeScope}
          />
        </div>
      </div>
    </>
  );
}
