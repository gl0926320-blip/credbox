import type { LucideIcon } from "lucide-react";

import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";

type ModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;

  actionLabel?: string;

  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
};

export default function ModulePage({
  eyebrow,
  title,
  description,
  actionLabel,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: ModulePageProps) {
  return (
    <div className="page-container">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actionLabel={actionLabel}
      />

      <section className="content-card">
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      </section>
    </div>
  );
}