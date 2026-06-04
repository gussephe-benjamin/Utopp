import { Mail } from "lucide-react";

type EmailInputProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  autoComplete?: string;
};

export function EmailInput({
  id = "auth-email",
  label = "Correo institucional",
  value,
  onChange,
  placeholder = "alumno@universidad.edu.pe",
  error,
  autoComplete = "username",
}: EmailInputProps) {
  const hasError = Boolean(error);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Mail className="h-5 w-5" aria-hidden />
        </span>
        <input
          id={id}
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
            hasError
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
          }`}
        />
      </div>
      {hasError && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
