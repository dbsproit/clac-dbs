"use client";
// =============================================================================
// Global app state (Zustand). One store carries data across all four modules
// so a Budget estimate can flow straight into a Scope of Work and a BID.
// Settings, proposals, and the sales team registry are persisted server-side
// (see saveSettings/saveProposal/*Salesperson actions) rather than to
// localStorage, so the team shares one set of data.
// =============================================================================

import { create } from "zustand";
import type {
  CostSettings,
  Estimate,
  ExtraServiceLine,
  ScopeOfWork,
  CompanyInfo,
  ClientInfo,
  BidTerms,
  Salesperson,
  PricingBenchmark,
  TeamUser,
  CrewMember,
  PayType,
  ProposalDefaults,
  AreaType,
  SpecialtyService,
} from "./types";
import {
  DEFAULT_COST_SETTINGS,
  DEFAULT_COMPANY,
  DEFAULT_PROPOSAL_DEFAULTS,
} from "./rates";
import { uid } from "./format";

interface AppState {
  settings: CostSettings;
  company: CompanyInfo;
  proposalDefaults: ProposalDefaults;
  client: ClientInfo;
  estimate: Estimate;
  extraLines: ExtraServiceLine[];
  scope: ScopeOfWork;
  bid: BidTerms;
  /** Id of the saved Proposal currently loaded, or null for an unsaved draft. */
  currentProposalId: string | null;
  saving: boolean;

  // settings
  setSettings: (patch: Partial<CostSettings>) => void;
  resetSettings: () => void;
  /** Replaces settings/company with what was loaded from the server. */
  loadSettings: (costSettings: CostSettings, company: CompanyInfo, proposalDefaults: ProposalDefaults) => void;
  saveSettings: () => Promise<void>;
  setProposalDefaults: (patch: Partial<ProposalDefaults>) => void;

  // sales team (shared registry backing the commission picker on extra-service lines)
  salespeople: Salesperson[];
  loadSalespeople: (list: Salesperson[]) => void;
  addSalesperson: (name: string, commissionPct: number) => Promise<void>;
  updateSalesperson: (id: string, patch: Partial<Pick<Salesperson, "name" | "commissionPct">>) => Promise<void>;
  removeSalesperson: (id: string) => Promise<void>;

  // Policy 01 pricing-benchmark table (admin-editable, see /admin)
  pricingBenchmarks: PricingBenchmark[];
  loadPricingBenchmarks: (list: PricingBenchmark[]) => void;
  addPricingBenchmark: (data: Omit<PricingBenchmark, "id">) => Promise<void>;
  updatePricingBenchmark: (id: string, patch: Partial<Omit<PricingBenchmark, "id">>) => Promise<void>;
  removePricingBenchmark: (id: string) => Promise<void>;

  // area production rates (Budget Calculator), editable on Rates
  areaTypes: AreaType[];
  loadAreaTypes: (list: AreaType[]) => void;
  addAreaType: (data: Omit<AreaType, "id">) => Promise<void>;
  updateAreaType: (id: string, patch: Partial<Omit<AreaType, "id">>) => Promise<void>;
  removeAreaType: (id: string) => Promise<void>;

  // Extra Services catalog defaults, editable on Rates
  specialtyServices: SpecialtyService[];
  loadSpecialtyServices: (list: SpecialtyService[]) => void;
  addSpecialtyService: (data: Omit<SpecialtyService, "id">) => Promise<void>;
  updateSpecialtyService: (id: string, patch: Partial<Omit<SpecialtyService, "id">>) => Promise<void>;
  removeSpecialtyService: (id: string) => Promise<void>;

  // team logins (admin-managed, see /admin)
  teamUsers: TeamUser[];
  loadTeamUsers: (list: TeamUser[]) => void;
  addTeamUser: (email: string, name: string, password: string) => Promise<void>;
  updateTeamUser: (id: string, patch: { name?: string; email?: string; password?: string }) => Promise<void>;
  removeTeamUser: (id: string) => Promise<void>;

  // proposals (server-persisted snapshots of client + estimate + extraLines + scope + bid)
  newProposal: () => void;
  loadProposal: (data: {
    id: string;
    client: ClientInfo;
    estimate: Estimate;
    extraLines: ExtraServiceLine[];
    scope: ScopeOfWork;
    bid: BidTerms;
  }) => void;
  saveProposal: () => Promise<void>;

  // company / client
  setCompany: (patch: Partial<CompanyInfo>) => void;
  setClient: (patch: Partial<ClientInfo>) => void;

  // estimate (recurring budget)
  setEstimate: (patch: Partial<Estimate>) => void;
  addArea: () => void;
  updateArea: (id: string, patch: Partial<Estimate["areas"][number]>) => void;
  removeArea: (id: string) => void;

  // extra services
  addExtraLine: (serviceId: string) => void;
  updateExtraLine: (id: string, patch: Partial<ExtraServiceLine>) => void;
  removeExtraLine: (id: string) => void;
  addCrewMember: (lineId: string, role: "workers" | "helpers") => void;
  updateCrewMember: (
    lineId: string,
    role: "workers" | "helpers",
    memberId: string,
    patch: Partial<Omit<CrewMember, "id">>
  ) => void;
  removeCrewMember: (lineId: string, role: "workers" | "helpers", memberId: string) => void;

  // scope of work
  setScope: (patch: Partial<ScopeOfWork>) => void;
  addScopeArea: (name: string) => void;
  updateScopeArea: (id: string, patch: Partial<ScopeOfWork["areas"][number]>) => void;
  removeScopeArea: (id: string) => void;
  addScopeTask: (areaId: string, description: string) => void;
  updateScopeTask: (
    areaId: string,
    taskId: string,
    patch: Partial<{ description: string; frequency: ScopeOfWork["areas"][number]["tasks"][number]["frequency"] }>
  ) => void;
  removeScopeTask: (areaId: string, taskId: string) => void;

  // bid
  setBid: (patch: Partial<BidTerms>) => void;
}

const defaultEstimate: Estimate = {
  clientName: "",
  propertyName: "",
  frequencyPerWeek: 5,
  fixedMonthlyCost: 0,
  areas: [
    { id: uid(), name: "Main office", areaTypeId: "office", sqft: 6000 },
    { id: uid(), name: "Restrooms", areaTypeId: "restroom", sqft: 600 },
    { id: uid(), name: "Lobby & corridors", areaTypeId: "lobby", sqft: 1200 },
  ],
};

const defaultClient: ClientInfo = {
  company: "",
  contactName: "",
  email: "",
  phone: "",
  propertyAddress: "",
};

const defaultScope: ScopeOfWork = { areas: [], notes: "" };

const today = () => new Date().toISOString().slice(0, 10);

const defaultBid: BidTerms = {
  proposalNumber: "DBS-" + new Date().getFullYear() + "-001",
  date: today(),
  validForDays: 30,
  contractTermMonths: 12,
  paymentTerms: "Net 30, invoiced monthly",
  startDate: "",
  notes:
    "Pricing includes all labor, supervision, cleaning supplies, and equipment. Consumable restroom products (paper, soap) billed at cost unless otherwise agreed.",
};

/** Builds fresh BID terms from the team's saved Proposal defaults (Settings). */
function buildBidFromDefaults(pd: ProposalDefaults): BidTerms {
  return {
    proposalNumber: `${pd.proposalNumberPrefix}-${new Date().getFullYear()}-001`,
    date: today(),
    validForDays: pd.defaultValidForDays,
    contractTermMonths: pd.defaultContractTermMonths,
    paymentTerms: pd.defaultPaymentTerms,
    startDate: "",
    notes: pd.defaultProposalNotes,
  };
}

/**
 * Proposals saved before workers/helpers became repeatable lists stored the
 * old single-slot fields (workerName/workerRate/... and hasHelper/helperName/...)
 * instead of `workers`/`helpers` arrays, and proposals saved before fixed
 * total pricing existed have no `pricingMode`/`fixedSalePrice` at all.
 * Reading either kind back in fills in the missing pieces so it still loads
 * correctly instead of crashing the calculator.
 */
export function normalizeExtraLine(raw: any): ExtraServiceLine {
  const hasCrewLists = Array.isArray(raw.workers) && Array.isArray(raw.helpers);

  const workers: CrewMember[] = hasCrewLists
    ? raw.workers
    : typeof raw.workerName === "string"
      ? [
          {
            id: uid(),
            name: (raw.workerName as string) || "",
            payType: (raw.workerPayType as PayType) || "hourly",
            rate: (raw.workerRate as number) || 0,
          },
        ]
      : [];
  const helpers: CrewMember[] = hasCrewLists
    ? raw.helpers
    : raw.hasHelper && typeof raw.helperName === "string"
      ? [
          {
            id: uid(),
            name: (raw.helperName as string) || "",
            payType: (raw.helperPayType as PayType) || "hourly",
            rate: (raw.helperRate as number) || 0,
          },
        ]
      : [];

  return {
    ...raw,
    workers,
    helpers,
    pricingMode: raw.pricingMode === "fixed" ? "fixed" : "calculated",
    fixedSalePrice: raw.fixedSalePrice || 0,
  };
}

export const useApp = create<AppState>()(
  (set, get) => ({
      settings: DEFAULT_COST_SETTINGS,
      company: DEFAULT_COMPANY,
      proposalDefaults: DEFAULT_PROPOSAL_DEFAULTS,
      client: defaultClient,
      estimate: defaultEstimate,
      extraLines: [],
      scope: defaultScope,
      bid: defaultBid,
      currentProposalId: null,
      saving: false,
      salespeople: [],
      pricingBenchmarks: [],
      areaTypes: [],
      specialtyServices: [],
      teamUsers: [],

      setSettings: (patch) =>
        set((st) => ({ settings: { ...st.settings, ...patch } })),
      resetSettings: () => set({ settings: DEFAULT_COST_SETTINGS }),
      loadSettings: (costSettings, company, proposalDefaults) =>
        set({ settings: costSettings, company, proposalDefaults }),
      saveSettings: async () => {
        const { settings, company, proposalDefaults } = get();
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ costSettings: settings, company, proposalDefaults }),
        });
      },
      setProposalDefaults: (patch) =>
        set((st) => ({ proposalDefaults: { ...st.proposalDefaults, ...patch } })),

      newProposal: () =>
        set((st) => ({
          currentProposalId: null,
          client: defaultClient,
          estimate: defaultEstimate,
          extraLines: [],
          scope: defaultScope,
          bid: buildBidFromDefaults(st.proposalDefaults),
        })),
      loadProposal: (data) =>
        set({
          currentProposalId: data.id,
          client: data.client,
          estimate: data.estimate,
          extraLines: data.extraLines.map(normalizeExtraLine),
          scope: data.scope,
          bid: data.bid,
        }),
      saveProposal: async () => {
        const { currentProposalId, client, estimate, extraLines, scope, bid } = get();
        set({ saving: true });
        const title =
          [estimate.clientName, estimate.propertyName].filter(Boolean).join(" — ") ||
          "Untitled proposal";
        const body = JSON.stringify({ title, client, estimate, extraLines, scope, bid });
        try {
          const res = await fetch(
            currentProposalId ? `/api/proposals/${currentProposalId}` : "/api/proposals",
            {
              method: currentProposalId ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body,
            }
          );
          const saved = await res.json();
          if (!res.ok) throw new Error(saved.error || "Could not save proposal.");
          set({ currentProposalId: saved.id });
        } finally {
          set({ saving: false });
        }
      },

      loadSalespeople: (list) => set({ salespeople: list }),
      addSalesperson: async (name, commissionPct) => {
        const res = await fetch("/api/salespeople", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, commissionPct }),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error || "Could not add salesperson.");
        set((st) => ({ salespeople: [...st.salespeople, created] }));
      },
      updateSalesperson: async (id, patch) => {
        const current = get().salespeople.find((p) => p.id === id);
        if (!current) return;
        const updated = { ...current, ...patch };
        set((st) => ({
          salespeople: st.salespeople.map((p) => (p.id === id ? updated : p)),
        }));
        await fetch(`/api/salespeople/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: updated.name, commissionPct: updated.commissionPct }),
        });
      },
      removeSalesperson: async (id) => {
        set((st) => ({ salespeople: st.salespeople.filter((p) => p.id !== id) }));
        await fetch(`/api/salespeople/${id}`, { method: "DELETE" });
      },

      loadPricingBenchmarks: (list) => set({ pricingBenchmarks: list }),
      addPricingBenchmark: async (data) => {
        const res = await fetch("/api/pricing-benchmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error || "Could not add category.");
        set((st) => ({ pricingBenchmarks: [...st.pricingBenchmarks, created] }));
      },
      updatePricingBenchmark: async (id, patch) => {
        const current = get().pricingBenchmarks.find((b) => b.id === id);
        if (!current) return;
        const updated = { ...current, ...patch };
        set((st) => ({
          pricingBenchmarks: st.pricingBenchmarks.map((b) => (b.id === id ? updated : b)),
        }));
        await fetch(`/api/pricing-benchmarks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      },
      removePricingBenchmark: async (id) => {
        set((st) => ({
          pricingBenchmarks: st.pricingBenchmarks.filter((b) => b.id !== id),
        }));
        await fetch(`/api/pricing-benchmarks/${id}`, { method: "DELETE" });
      },

      loadAreaTypes: (list) => set({ areaTypes: list }),
      addAreaType: async (data) => {
        const res = await fetch("/api/area-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error || "Could not add area type.");
        set((st) => ({ areaTypes: [...st.areaTypes, created] }));
      },
      updateAreaType: async (id, patch) => {
        const current = get().areaTypes.find((a) => a.id === id);
        if (!current) return;
        const updated = { ...current, ...patch };
        set((st) => ({
          areaTypes: st.areaTypes.map((a) => (a.id === id ? updated : a)),
        }));
        await fetch(`/api/area-types/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      },
      removeAreaType: async (id) => {
        set((st) => ({ areaTypes: st.areaTypes.filter((a) => a.id !== id) }));
        await fetch(`/api/area-types/${id}`, { method: "DELETE" });
      },

      loadSpecialtyServices: (list) => set({ specialtyServices: list }),
      addSpecialtyService: async (data) => {
        const res = await fetch("/api/specialty-services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created.error || "Could not add service.");
        set((st) => ({ specialtyServices: [...st.specialtyServices, created] }));
      },
      updateSpecialtyService: async (id, patch) => {
        const current = get().specialtyServices.find((s) => s.id === id);
        if (!current) return;
        const updated = { ...current, ...patch };
        set((st) => ({
          specialtyServices: st.specialtyServices.map((s) => (s.id === id ? updated : s)),
        }));
        await fetch(`/api/specialty-services/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      },
      removeSpecialtyService: async (id) => {
        set((st) => ({ specialtyServices: st.specialtyServices.filter((s) => s.id !== id) }));
        await fetch(`/api/specialty-services/${id}`, { method: "DELETE" });
      },

      loadTeamUsers: (list) => set({ teamUsers: list }),
      addTeamUser: async (email, name, password) => {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not create user.");
        set((st) => ({ teamUsers: [...st.teamUsers, data] }));
      },
      updateTeamUser: async (id, patch) => {
        const res = await fetch(`/api/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not update user.");
        set((st) => ({ teamUsers: st.teamUsers.map((u) => (u.id === id ? data : u)) }));
      },
      removeTeamUser: async (id) => {
        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Could not delete user.");
        }
        set((st) => ({ teamUsers: st.teamUsers.filter((u) => u.id !== id) }));
      },

      setCompany: (patch) =>
        set((st) => ({ company: { ...st.company, ...patch } })),
      setClient: (patch) =>
        set((st) => ({ client: { ...st.client, ...patch } })),

      setEstimate: (patch) =>
        set((st) => ({ estimate: { ...st.estimate, ...patch } })),
      addArea: () =>
        set((st) => ({
          estimate: {
            ...st.estimate,
            areas: [
              ...st.estimate.areas,
              { id: uid(), name: "", areaTypeId: "office", sqft: 0 },
            ],
          },
        })),
      updateArea: (id, patch) =>
        set((st) => ({
          estimate: {
            ...st.estimate,
            areas: st.estimate.areas.map((a) =>
              a.id === id ? { ...a, ...patch } : a
            ),
          },
        })),
      removeArea: (id) =>
        set((st) => ({
          estimate: {
            ...st.estimate,
            areas: st.estimate.areas.filter((a) => a.id !== id),
          },
        })),

      addExtraLine: (serviceId) =>
        set((st) => {
          const svc = st.specialtyServices.find((s) => s.id === serviceId);
          if (!svc) return {};
          const line: ExtraServiceLine = {
            id: uid(),
            serviceId: svc.id,
            label: svc.label,
            method: svc.method,
            quantity: svc.method === "time" ? 4 : 1000,
            rate: svc.defaultRate,
            minCharge: svc.minCharge,
            productionRate: svc.productionRate ?? 1,
            materialsCost: 0,
            equipmentCost: 0,
            tripCharge: 0,
            pricingMode: "calculated",
            fixedSalePrice: 0,
            workers: [{ id: uid(), name: "", payType: "hourly", rate: st.settings.baseWage }],
            helpers: [],
            salespersonId: "",
            salespersonName: "",
            commissionPct: 0,
          };
          return { extraLines: [...st.extraLines, line] };
        }),
      updateExtraLine: (id, patch) =>
        set((st) => ({
          extraLines: st.extraLines.map((l) =>
            l.id === id ? { ...l, ...patch } : l
          ),
        })),
      removeExtraLine: (id) =>
        set((st) => ({
          extraLines: st.extraLines.filter((l) => l.id !== id),
        })),
      addCrewMember: (lineId, role) =>
        set((st) => ({
          extraLines: st.extraLines.map((l) =>
            l.id === lineId
              ? {
                  ...l,
                  [role]: [
                    ...l[role],
                    { id: uid(), name: "", payType: "hourly" as PayType, rate: 0 },
                  ],
                }
              : l
          ),
        })),
      updateCrewMember: (lineId, role, memberId, patch) =>
        set((st) => ({
          extraLines: st.extraLines.map((l) =>
            l.id === lineId
              ? {
                  ...l,
                  [role]: l[role].map((m) => (m.id === memberId ? { ...m, ...patch } : m)),
                }
              : l
          ),
        })),
      removeCrewMember: (lineId, role, memberId) =>
        set((st) => ({
          extraLines: st.extraLines.map((l) =>
            l.id === lineId ? { ...l, [role]: l[role].filter((m) => m.id !== memberId) } : l
          ),
        })),

      setScope: (patch) => set((st) => ({ scope: { ...st.scope, ...patch } })),
      addScopeArea: (name) =>
        set((st) => ({
          scope: {
            ...st.scope,
            areas: [...st.scope.areas, { id: uid(), name, tasks: [] }],
          },
        })),
      updateScopeArea: (id, patch) =>
        set((st) => ({
          scope: {
            ...st.scope,
            areas: st.scope.areas.map((a) =>
              a.id === id ? { ...a, ...patch } : a
            ),
          },
        })),
      removeScopeArea: (id) =>
        set((st) => ({
          scope: {
            ...st.scope,
            areas: st.scope.areas.filter((a) => a.id !== id),
          },
        })),
      addScopeTask: (areaId, description) =>
        set((st) => ({
          scope: {
            ...st.scope,
            areas: st.scope.areas.map((a) =>
              a.id === areaId
                ? {
                    ...a,
                    tasks: [
                      ...a.tasks,
                      { id: uid(), description, frequency: "Daily" },
                    ],
                  }
                : a
            ),
          },
        })),
      updateScopeTask: (areaId, taskId, patch) =>
        set((st) => ({
          scope: {
            ...st.scope,
            areas: st.scope.areas.map((a) =>
              a.id === areaId
                ? {
                    ...a,
                    tasks: a.tasks.map((t) =>
                      t.id === taskId ? { ...t, ...patch } : t
                    ),
                  }
                : a
            ),
          },
        })),
      removeScopeTask: (areaId, taskId) =>
        set((st) => ({
          scope: {
            ...st.scope,
            areas: st.scope.areas.map((a) =>
              a.id === areaId
                ? { ...a, tasks: a.tasks.filter((t) => t.id !== taskId) }
                : a
            ),
          },
        })),

      setBid: (patch) => set((st) => ({ bid: { ...st.bid, ...patch } })),
    })
);
