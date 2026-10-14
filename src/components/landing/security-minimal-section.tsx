"use client";

export default function SecurityMinimalSection() {
  return (
    <section
      id="security"
      className="w-full py-28 border-t border-border/50 relative scroll-mt-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-16">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-3xl">
          Your files stay where they are.{" "}
          <span className="text-primary block sm:inline">
            Permissions intact.
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-10 border-t border-border/60">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              Zero Central Storage
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Raw documents are never uploaded to our servers. Only keywords and
              metadata are processed securely within your private enterprise
              backend.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              ACL &amp; Permission Enforced
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Queries adhere to strict SharePoint and Microsoft 365 access
              controls. If an employee cannot open a file in Office, it will
              never surface in SearchPoint.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              On-Premise Deployment
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Deploy SearchPoint fully within your corporate network and
              infrastructure with your organization&apos;s own compliance and
              retention policies.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
