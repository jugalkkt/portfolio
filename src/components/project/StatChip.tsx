export function StatChip({ value }: { value: string }) {
  return (
    <li className="rounded-chip border border-line bg-bg-inset px-3 py-1.5 font-mono text-small text-text">
      {value}
    </li>
  );
}
