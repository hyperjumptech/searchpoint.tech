export default async function PageLayout({
  children,
  summary,
}: {
  children: React.ReactNode;
  summary?: React.ReactNode;
}) {
  return (
    <div className="mx-auto px-4 py-4">
      <div className="lg:flex lg:flex-row lg:justify-between lg:gap-8">
        {/* Empty column for logo space */}
        <div className="hidden lg:flex lg:w-32 lg:min-w-32" />

        {/* Content column - aligned with search bar */}
        <div className="w-full lg:max-w-[760px] xl:max-w-3xl">{children}</div>

        {/* Empty column for avatar space */}
        <div className="hidden lg:flex lg:w-10 lg:min-w-10 xl:flex-1 justify-end pr-12">
          {summary && summary}
        </div>
      </div>
    </div>
  );
}
