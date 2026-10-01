import { Plus } from "lucide-react";
import Link from "next/link";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {eyebrow && (
          <span className="page-eyebrow">
            {eyebrow}
          </span>
        )}

        <h1>{title}</h1>

        {description && <p>{description}</p>}
      </div>

      {actionLabel &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="primary-button"
          >
            <Plus size={18} />
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            className="primary-button"
          >
            <Plus size={18} />
            {actionLabel}
          </button>
        ))}
    </header>
  );
}