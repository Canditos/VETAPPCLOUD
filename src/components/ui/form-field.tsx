import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const formFieldVariants = cva(
  "inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
  {
    variants: {
      size: {
        default: "h-11",
        sm: "h-9",
        lg: "h-12",
      },
      state: {
        default: "",
        error: "border-red-500 focus-visible:ring-red-500",
      },
    },
    defaultVariants: {
      size: "default",
      state: "default",
    },
  }
);

export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof formFieldVariants> {
  label?: string;
  hint?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ className, label, hint, error, size, state, id, rightElement, type = "text", ...props }, ref) => {
    const inputId = id || `field-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className={cn("space-y-1.5", className)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="text-[11px] font-bold uppercase tracking-wider text-slate-500"
          >
            {label}
          </label>
        ) : null}

        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={type}
            aria-invalid={Boolean(error)}
            className={cn(
              formFieldVariants({ size, state: error ? "error" : state }),
              "w-full",
              rightElement ? "pr-10" : undefined
            )}
            {...props}
          />
          {rightElement ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightElement}
            </div>
          ) : null}
        </div>

        {hint && !error ? (
          <p className="text-[11px] font-medium text-slate-400">{hint}</p>
        ) : null}
        {error ? <p className="text-[11px] font-bold text-red-600">{error}</p> : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";
