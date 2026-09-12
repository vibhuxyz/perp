import { PositionsTable } from "@/features/positions/components/PositionsTable";

export default function PositionsPage() {
  return (
    <section className="rounded border border-border-subtle bg-bg-card">
      <h1 className="border-b border-border-subtle px-3 py-2 text-sm">Positions</h1>
      <PositionsTable />
    </section>
  );
}
