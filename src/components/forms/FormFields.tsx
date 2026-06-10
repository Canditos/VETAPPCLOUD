"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, hint, error, className, id, rightElement, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className={cn("space-y-1.5", className)}>
        {label ? (
          <Label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </Label>
        ) : null}
        <div className="relative">
          <Input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            className={cn(
              "h-11 rounded-xl border-slate-200 bg-white dark:bg-slate-900 dark:text-slate-100",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            {...props}
          />
          {rightElement ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{rightElement}</div>
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

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const fieldId = id || React.useId();
    return (
      <div className={cn("space-y-1.5", className)}>
        {label ? (
          <Label htmlFor={fieldId} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </Label>
        ) : null}
        <Textarea
          id={fieldId}
          ref={ref}
          aria-invalid={!!error}
          className={cn(
            "rounded-xl border-slate-200 bg-white dark:bg-slate-900 dark:text-slate-100",
            error && "border-red-500 focus-visible:ring-red-500"
          )}
          {...props}
        />
        {hint && !error ? (
          <p className="text-[11px] font-medium text-slate-400">{hint}</p>
        ) : null}
        {error ? <p className="text-[11px] font-bold text-red-600">{error}</p> : null}
      </div>
    );
  }
);

TextareaField.displayName = "TextareaField";

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, hint, error, className, id, options, placeholder, ...props }, ref) => {
    const fieldId = id || React.useId();
    return (
      <div className={cn("space-y-1.5", className)}>
        {label ? (
          <Label htmlFor={fieldId} className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </Label>
        ) : null}
        <select
          id={fieldId}
          ref={ref}
          aria-invalid={!!error}
          className={cn(
            "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:bg-slate-900 dark:text-slate-100",
            error && "border-red-500 focus-visible:ring-red-500"
          )}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error ? (
          <p className="text-[11px] font-medium text-slate-400">{hint}</p>
        ) : null}
        {error ? <p className="text-[11px] font-bold text-red-600">{error}</p> : null}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";

export interface FormErrorSummaryProps {
  errors: Record<string, string | undefined>;
  className?: string;
}

export const FormErrorSummary = ({ errors, className }: FormErrorSummaryProps) => {
  const entries = Object.entries(errors).filter(([, v]) => v);
  if (!entries.length) return null;
  return (
    <div className={cn("rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300", className)}>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider">Corrija os campos em erro</p>
      <ul className="list-disc pl-5 space-y-0.5">
        {entries.map(([field, message]) => (
          <li key={field}>{field}: {message}</li>
        ))}
      </ul>
    </div>
  );
};
