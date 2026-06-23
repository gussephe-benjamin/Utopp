import { Mail } from "lucide-react";
import { TW_AUTH } from "../constants/authTheme";

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
      <label htmlFor={id} className={`mb-1.5 block text-sm font-medium ${TW_AUTH.subtitle}`}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8A93A2]">
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
          className={`${TW_AUTH.input} pl-11 pr-4 ${TW_AUTH.focusRing} ${
            hasError
              ? "border-[#EF4444]/50 focus:border-[#EF4444]/60 focus:ring-[#EF4444]/30"
              : ""
          }`}
        />
      </div>
      {hasError && (
        <p id={`${id}-error`} className="mt-1 text-xs text-[#FCA5A5]">
          {error}
        </p>
      )}
    </div>
  );
}
