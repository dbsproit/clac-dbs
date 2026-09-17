"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Card, Button } from "@/components/ui/primitives";
import { useApp } from "@/lib/store";
import type { ClientInfo } from "@/lib/types";

interface ProposalListItem {
  id: string;
  title: string;
  client: ClientInfo;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string | null; email: string };
}

export default function ProposalsPage() {
  const router = useRouter();
  const { newProposal, loadProposal } = useApp();
  const [proposals, setProposals] = useState<ProposalListItem[] | null>(null);

  function refresh() {
    fetch("/api/proposals")
      .then((res) => res.json())
      .then(setProposals);
  }

  useEffect(refresh, []);

  async function openProposal(id: string) {
    const res = await fetch(`/api/proposals/${id}`);
    const data = await res.json();
    loadProposal(data);
    router.push("/calculator");
  }

  async function deleteProposal(id: string) {
    if (!confirm("Delete this proposal? This can't be undone.")) return;
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    refresh();
  }

  function startNew() {
    newProposal();
    router.push("/calculator");
  }

  return (
    <>
      <PageHeader
        title="Proposals"
        subtitle="Every estimate the team has saved — shared across all devices"
        actions={<Button onClick={startNew}>+ New proposal</Button>}
      />
      <div className="space-y-6 p-4 sm:p-8">
        <Card>
          {proposals === null ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
          ) : proposals.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No proposals saved yet — build one and hit Save.
            </p>
          ) : (
            <div className="space-y-1">
              <div className="hidden grid-cols-[1.6fr_1fr_1fr_auto] gap-3 px-1 pb-2 text-xs font-medium uppercase tracking-wide text-slate-400 sm:grid">
                <span>Proposal</span>
                <span>Client</span>
                <span>Last updated</span>
                <span></span>
              </div>
              {proposals.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-[1.6fr_1fr_1fr_auto] sm:items-center sm:border-0 sm:border-b sm:border-slate-100 sm:p-3"
                >
                  <button
                    onClick={() => openProposal(p.id)}
                    className="text-left text-sm font-medium text-brand-700 hover:underline"
                  >
                    {p.title}
                  </button>
                  <span className="text-sm text-slate-600">
                    {p.client?.company || "—"}
                  </span>
                  <span className="text-sm text-slate-500">
                    {new Date(p.updatedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => openProposal(p.id)}>
                      Open
                    </Button>
                    <Button variant="danger" onClick={() => deleteProposal(p.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
