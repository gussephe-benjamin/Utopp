import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { TW_AUTH } from "../constants/authTheme";

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
      <label htmlFor={id} className={`mb-1.5 block text-sm font-medium ${TW_AUTH.subtitle}`}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8A93A2]">
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
          className={`${TW_AUTH.input} pl-11 pr-11 ${TW_AUTH.focusRing} ${
            hasError
              ? "border-[#EF4444]/50 focus:border-[#EF4444]/60 focus:ring-[#EF4444]/30"
              : ""
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className={`absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8A93A2] transition-colors duration-200 hover:text-[#B8C0CC] ${TW_AUTH.focusRing}`}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {hasError && (
        <p id={`${id}-error`} className="mt-1 text-xs text-[#FCA5A5]">
          {error}
        </p>
      )}
    </div>
  );
}
