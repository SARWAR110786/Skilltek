export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[320px] w-[620px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 text-center lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-400">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
