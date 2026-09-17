"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  Card,
  Field,
  TextInput,
  Select,
  Button,
  TextArea,
} from "@/components/ui/primitives";
import { useApp } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import SaveProposalButton from "@/components/SaveProposalButton";
import { SCOPE_TASK_LIBRARY } from "@/lib/rates";
import type { TaskFrequency } from "@/lib/types";

const FREQUENCIES: TaskFrequency[] = [
  "Daily",
  "3x / week",
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "Quarterly",
  "As needed",
];

const LIBRARY_LABELS: Record<string, string> = {
  office: "Office",
  restroom: "Restroom",
  lobby: "Lobby / Entrance",
  breakroom: "Break room / Kitchen",
  floors: "Floor care",
  general: "General",
};

export default function ScopeOfWorkPage() {
  const hydrated = useHydrated();
  const {
    scope,
    setScope,
    addScopeArea,
    updateScopeArea,
    removeScopeArea,
    addScopeTask,
    updateScopeTask,
    removeScopeTask,
  } = useApp();
  const [newArea, setNewArea] = useState("");
  const [templateKey, setTemplateKey] = useState("office");

  if (!hydrated) return <PageHeader title="Scope of Work" />;

  const addFromTemplate = () => {
    const name = LIBRARY_LABELS[templateKey] ?? "Area";
    addScopeArea(name);
    // find the newly added area (last) after state settles isn't possible sync;
    // instead we add tasks by re-reading store via a microtask.
    setTimeout(() => {
      const st = useApp.getState();
      const area = st.scope.areas[st.scope.areas.length - 1];
      if (area) {
        SCOPE_TASK_LIBRARY[templateKey]?.forEach((t) =>
          st.addScopeTask(area.id, t)
        );
      }
    }, 0);
  };

  return (
    <>
      <PageHeader
        title="Scope of Work Builder"
        subtitle="Define exactly what's included, by area and frequency — ready to attach to a BID"
        actions={
          <>
            <SaveProposalButton />
            <Link href="/bid">
              <Button>Continue to BID →</Button>
            </Link>
          </>
        }
      />
      <div className="space-y-6 p-4 sm:p-8">
        <Card title="Add an area">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Start from a template" className="w-56">
              <Select value={templateKey} onChange={setTemplateKey}>
                {Object.keys(SCOPE_TASK_LIBRARY).map((k) => (
                  <option key={k} value={k}>
                    {LIBRARY_LABELS[k] ?? k}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={addFromTemplate}>+ Add templated area</Button>
            <span className="text-slate-300">|</span>
            <Field label="Or a custom area" className="w-56">
              <TextInput
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="e.g. Loading dock"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newArea.trim()) {
                    addScopeArea(newArea.trim());
                    setNewArea("");
                  }
                }}
              />
            </Field>
            <Button
              variant="secondary"
              onClick={() => {
                if (newArea.trim()) {
                  addScopeArea(newArea.trim());
                  setNewArea("");
                }
              }}
            >
              Add custom
            </Button>
          </div>
        </Card>

        {scope.areas.length === 0 && (
          <Card>
            <p className="py-8 text-center text-sm text-slate-400">
              No areas yet. Add a templated area to get a full task list in one
              click.
            </p>
          </Card>
        )}

        {scope.areas.map((area) => (
          <Card
            key={area.id}
            title={area.name}
            right={
              <button
                onClick={() => removeScopeArea(area.id)}
                className="rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50"
              >
                Remove area
              </button>
            }
          >
            <div className="mb-3">
              <Field label="Area name">
                <TextInput
                  value={area.name}
                  onChange={(e) =>
                    updateScopeArea(area.id, { name: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="space-y-2">
              {area.tasks.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_auto] sm:items-center"
                >
                  <TextInput
                    value={task.description}
                    onChange={(e) =>
                      updateScopeTask(area.id, task.id, {
                        description: e.target.value,
                      })
                    }
                  />
                  <Select
                    value={task.frequency}
                    onChange={(v) =>
                      updateScopeTask(area.id, task.id, {
                        frequency: v as TaskFrequency,
                      })
                    }
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Select>
                  <button
                    onClick={() => removeScopeTask(area.id, task.id)}
                    className="justify-self-start rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50 sm:justify-self-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Button
                variant="ghost"
                onClick={() => addScopeTask(area.id, "New task")}
              >
                + Add task
              </Button>
            </div>
          </Card>
        ))}

        <Card title="General notes / exclusions">
          <TextArea
            value={scope.notes}
            onChange={(e) => setScope({ notes: e.target.value })}
            placeholder="e.g. Consumable supplies (paper, soap) billed at cost. Carpet extraction quoted separately."
            className="min-h-[120px]"
          />
        </Card>
      </div>
    </>
  );
}
