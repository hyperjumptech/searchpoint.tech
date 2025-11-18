export default async function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto px-4 py-8">
      <div className="md:grid md:grid-cols-[160px_1fr_80px] md:gap-4">
        {/* Empty column for logo space */}
        <div className="hidden md:block" />

        {/* Content column - aligned with search bar */}
        <div className="w-full">{children}</div>

        {/* Empty column for avatar space */}
        <div className="hidden md:block" />
      </div>
    </div>
  );
}
