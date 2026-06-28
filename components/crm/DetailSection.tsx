import { ReactNode } from 'react';

interface DetailSectionProps {
  title: string;
  children: ReactNode;
  action?: {
    label: string;
    icon?: string;
    onClick: () => void;
  };
}

export function DetailSection({ title, children, action }: DetailSectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm">{title}</h3>
        {action && (
          <button
            onClick={action.onClick}
            className="notion-button text-muted-foreground text-xs"
          >
            {action.icon && (
              <span className="material-icons-outlined" style={{ fontSize: 14 }}>{action.icon}</span>
            )}
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

interface DetailFieldProps {
  label: string;
  value: string | number | ReactNode;
}

export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
