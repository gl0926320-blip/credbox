import {
  Inbox,
  type LucideIcon,
} from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
};

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={27} />
      </div>

      <strong>{title}</strong>

      <p>{description}</p>
    </div>
  );
}