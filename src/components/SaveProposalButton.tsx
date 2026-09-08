"use client";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/primitives";

export default function SaveProposalButton() {
  const { saving, currentProposalId, saveProposal } = useApp();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        saveProposal().catch((err) =>
          alert(err instanceof Error ? err.message : "Could not save proposal.")
        )
      }
    >
      {saving ? "Saving…" : currentProposalId ? "Save changes" : "Save proposal"}
    </Button>
  );
}
