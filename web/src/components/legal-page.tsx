import { Badge } from "@/components/ui/badge";

export type LegalSection = { heading: string; body: string[] };

/** The look shared by the Privacy and Terms pages. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Badge variant="warning">Draft. To be reviewed before launch.</Badge>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {updated}</p>
      <p className="mt-6 text-lg text-muted">{intro}</p>

      <nav aria-label="On this page" className="mt-8 rounded-2xl border border-border bg-surface/80 p-5">
        <p className="text-xs font-bold tracking-widest text-muted uppercase">On this page</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {sections.map((section, index) => (
            <li key={section.heading}>
              <a href={`#s${index + 1}`} className="text-primary-text hover:underline">
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((section, index) => (
          <section key={section.heading} id={`s${index + 1}`} className="scroll-mt-24">
            <h2 className="text-2xl font-extrabold tracking-tight">
              {index + 1}. {section.heading}
            </h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
