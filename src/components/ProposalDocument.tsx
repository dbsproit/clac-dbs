"use client";
import { useApp } from "@/lib/store";
import { computeEstimate, computeExtraServices } from "@/lib/pricing";
import { usd, num } from "@/lib/format";

/**
 * Print-ready BID / proposal. Rendered on white, sized for Letter, and cleaned
 * up by the @media print rules in globals.css.
 */
export default function ProposalDocument({
  includeExtras,
  includeScope,
}: {
  includeExtras: boolean;
  includeScope: boolean;
}) {
  const { company, client, estimate, extraLines, scope, bid, settings, areaTypes } =
    useApp();
  const est = computeEstimate(estimate, settings, areaTypes);
  const extras = computeExtraServices(extraLines, settings);

  const showExtras = includeExtras && extraLines.length > 0;
  const showScope = includeScope && scope.areas.length > 0;

  const grandTotalFirstMonth =
    est.monthlyPrice + (showExtras ? extras.totalRecommendedPrice : 0);

  return (
    <div className="print-area mx-auto max-w-[850px] bg-white p-10 text-[13px] leading-relaxed text-slate-800 shadow-sm print:shadow-none">
      {/* header */}
      <header className="flex items-start justify-between border-b-2 border-brand-600 pb-5">
        <div className="flex items-center gap-3">
          {company.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt="" className="h-12 w-12 object-contain" />
          )}
          <div>
            <div className="text-2xl font-bold text-brand-700">{company.name}</div>
            <div className="text-sm text-slate-500">{company.tagline}</div>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          {company.address && <div>{company.address}</div>}
          {company.phone && <div>{company.phone}</div>}
          <div>{company.email}</div>
          <div>{company.website}</div>
        </div>
      </header>

      {/* title */}
      <div className="mt-6 flex items-end justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Cleaning Services Proposal
        </h1>
        <div className="text-right text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Proposal #:</span>{" "}
            {bid.proposalNumber}
          </div>
          <div>
            <span className="font-semibold text-slate-700">Date:</span> {bid.date}
          </div>
          <div>
            <span className="font-semibold text-slate-700">Valid for:</span>{" "}
            {bid.validForDays} days
          </div>
        </div>
      </div>

      {/* parties */}
      <div className="mt-5 grid grid-cols-2 gap-6">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Prepared for
          </div>
          <div className="font-semibold text-slate-800">
            {client.company || "—"}
          </div>
          {client.contactName && <div>{client.contactName}</div>}
          {client.propertyAddress && <div>{client.propertyAddress}</div>}
          {client.phone && <div>{client.phone}</div>}
          {client.email && <div>{client.email}</div>}
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Property
          </div>
          <div className="font-semibold text-slate-800">
            {estimate.propertyName || client.company || "—"}
          </div>
          <div>{num(est.totalSqft)} sq ft serviced</div>
          <div>{estimate.frequencyPerWeek}× per week</div>
          {bid.startDate && <div>Proposed start: {bid.startDate}</div>}
        </div>
      </div>

      {/* recurring pricing */}
      <section className="mt-7">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-700">
          Recurring Janitorial Service
        </h2>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Frequency</th>
              <th className="py-2 text-right">Monthly</th>
              <th className="py-2 text-right">Annual</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-2.5">
                Complete janitorial cleaning of {num(est.totalSqft)} sq ft
                {estimate.propertyName ? ` at ${estimate.propertyName}` : ""}
              </td>
              <td className="py-2.5 text-right">
                {estimate.frequencyPerWeek}× / week
              </td>
              <td className="py-2.5 text-right font-semibold">
                {usd(est.monthlyPrice, 2)}
              </td>
              <td className="py-2.5 text-right">{usd(est.annualPrice, 0)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* extras */}
      {showExtras && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-700">
            Additional / Specialty Services
          </h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2">Service</th>
                <th className="py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {extras.lines.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="py-2.5">{l.label}</td>
                  <td className="py-2.5 text-right font-semibold">
                    {usd(l.recommendedPrice, 2)}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 text-right text-slate-500">
                  One-time / as-needed subtotal
                </td>
                <td className="py-2.5 text-right font-semibold">
                  {usd(extras.totalRecommendedPrice, 2)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* investment summary */}
      <section className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            Recurring monthly investment
          </span>
          <span className="text-lg font-bold text-brand-700">
            {usd(est.monthlyPrice, 2)}
          </span>
        </div>
        {showExtras && (
          <div className="mt-1 flex items-center justify-between text-sm text-slate-600">
            <span>Additional services (one-time)</span>
            <span>{usd(extras.totalRecommendedPrice, 2)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-brand-200 pt-2">
          <span className="text-sm font-semibold text-slate-800">
            {showExtras ? "First-month total" : "Monthly total"}
          </span>
          <span className="text-lg font-bold text-brand-800">
            {usd(grandTotalFirstMonth, 2)}
          </span>
        </div>
      </section>

      {/* scope of work */}
      {showScope && (
        <section className="mt-7">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-700">
            Scope of Work
          </h2>
          <div className="space-y-4">
            {scope.areas.map((area) => (
              <div key={area.id}>
                <div className="mb-1 font-semibold text-slate-800">
                  {area.name}
                </div>
                <table className="w-full border-collapse text-left">
                  <tbody>
                    {area.tasks.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100">
                        <td className="py-1.5 pr-4">{t.description}</td>
                        <td className="w-28 py-1.5 text-right text-slate-500">
                          {t.frequency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          {scope.notes && (
            <p className="mt-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Notes: </span>
              {scope.notes}
            </p>
          )}
        </section>
      )}

      {/* terms */}
      <section className="mt-7">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-700">
          Terms
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-700">Contract term:</span>{" "}
            {bid.contractTermMonths} months
          </div>
          <div>
            <span className="font-semibold text-slate-700">Payment terms:</span>{" "}
            {bid.paymentTerms}
          </div>
        </div>
        {bid.notes && (
          <p className="mt-2 text-xs text-slate-500">{bid.notes}</p>
        )}
      </section>

      {/* signatures */}
      <section className="mt-10 grid grid-cols-2 gap-10">
        <div>
          <div className="h-10 border-b border-slate-400"></div>
          <div className="mt-1 text-xs text-slate-500">
            Authorized signature — {client.company || "Client"}
          </div>
          <div className="mt-4 h-6 border-b border-slate-300"></div>
          <div className="mt-1 text-xs text-slate-400">Date</div>
        </div>
        <div>
          <div className="h-10 border-b border-slate-400"></div>
          <div className="mt-1 text-xs text-slate-500">
            {company.contactName
              ? `${company.contactName} — ${company.name}`
              : company.name}
          </div>
          <div className="mt-4 h-6 border-b border-slate-300"></div>
          <div className="mt-1 text-xs text-slate-400">Date</div>
        </div>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-3 text-center text-xs text-slate-400">
        {company.name} · {company.website} · {company.email}
      </footer>
    </div>
  );
}
