type AuthDividerProps = {
  label?: string;
};

export function AuthDivider({ label = "o" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-slate-200" aria-hidden />
      <span className="whitespace-nowrap text-xs font-medium text-slate-400">{label}</span>
      <span className="h-px flex-1 bg-slate-200" aria-hidden />
    </div>
  );
}
