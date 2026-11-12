import { skills } from "@/content/resume";

/** Grouped list exactly as on the resume — the real content; the A5 graph enhances it. */
export function SkillList() {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((g, i) => (
        <div key={g.group} className="flex flex-col gap-3 border-t border-line pt-4">
          <h3 className="label flex items-center gap-2">
            <span className={i < 3 ? "text-signal" : "text-muted"} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={i < 3 ? "text-text" : undefined}>{g.group}</span>
          </h3>
          <ul className="flex flex-wrap gap-2">
            {g.items.map((item) => (
              <li
                key={item}
                className={
                  i < 3
                    ? "rounded-chip border border-signal/30 bg-signal/5 px-3 py-1.5 text-small text-text"
                    : "rounded-chip border border-line bg-bg-raised px-3 py-1.5 text-small text-text"
                }
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
