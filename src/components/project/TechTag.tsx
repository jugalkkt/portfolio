export function TechTag({ name }: { name: string }) {
  return (
    <li className="rounded-chip border border-line px-2.5 py-1 font-mono text-label text-muted">
      {name}
    </li>
  );
}
