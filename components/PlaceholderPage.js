export default function PlaceholderPage({ title, description }) {
  return (
    <section className="rounded-2xl border border-dashed border-vendora/20 bg-surface px-6 py-10">
      <h2 className="text-lg font-semibold text-vendora-text">{title}</h2>
      <p className="mt-2 max-w-2xl text-vendora-text/75">{description}</p>
    </section>
  );
}
