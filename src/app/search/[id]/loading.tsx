export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 animate-pulse">
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="shrink-0 p-1.5 bg-muted rounded-full w-8 h-8" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32 md:w-48" />
              <div className="h-3 bg-muted rounded w-24 md:w-40" />
            </div>
          </div>

          <div className="h-8 md:h-10 bg-muted rounded w-64 md:w-96 mb-3" />

          <div className="space-y-2 mb-10">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="h-12 bg-muted rounded-full w-48" />
            <div className="h-6 bg-muted rounded w-full max-w-md" />
          </div>
        </div>

        <div className="flex justify-center items-center w-full lg:w-[400px] h-[200px] lg:h-[300px] bg-muted border rounded-lg shrink-0">
          <div className="text-center text-sm text-muted-foreground">
            <div className="h-6 w-6 mx-auto mb-2 bg-muted rounded-full" />
            <div className="h-3 bg-muted rounded w-24 mx-auto" />
          </div>
        </div>
      </div>

      <section>
        <div className="block lg:hidden mb-4">
          <div className="h-10 bg-muted rounded w-full" />
        </div>

        <div className="hidden lg:flex gap-2 mb-4">
          <div className="h-10 bg-muted rounded-md px-4 py-2 w-28" />
          <div className="h-10 bg-muted rounded-md px-4 py-2 w-32" />
          <div className="h-10 bg-muted rounded-md px-4 py-2 w-28" />
          <div className="h-10 bg-muted rounded-md px-4 py-2 w-28" />
        </div>

        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-32" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </section>
    </main>
  );
}
