import { LedgerSidebar } from "@/components/ledger-sidebar";
import { LedgerMainContent } from "@/components/ledger-main-content";

export default function LedgerManager() {
  return (
    <div className="flex h-screen bg-[hsl(var(--ledger-bg-main))] text-[hsl(var(--ledger-text-primary))]">
      <LedgerSidebar />
      <LedgerMainContent />
    </div>
  );
}