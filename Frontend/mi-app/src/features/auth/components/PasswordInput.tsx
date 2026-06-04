import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type PasswordInputProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  autoComplete?: string;
};

export function PasswordInput({
  id = "auth-password",
  label = "Contraseña",
  value,
  onChange,
  placeholder = "Contraseña",
  error,
  autoComplete = "current-password",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const hasError = Boolean(error);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`h-12 w-full rounded-xl border bg-white pl-11 pr-11 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
            hasError
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-slate-200 focus:border-violet-400 focus:ring-violet-100"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {hasError && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
