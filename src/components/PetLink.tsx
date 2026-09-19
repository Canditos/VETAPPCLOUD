"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface PetLinkProps {
  petId?: string | null;
  className?: string;
  children: React.ReactNode;
  /** Stop click from bubbling to parent (e.g. drag cards). Default: true */
  stopPropagation?: boolean;
}

/**
 * Wraps any content and navigates to /dashboard/patients/[petId] on click.
 * If petId is missing, renders children without a link.
 */
export function PetLink({ petId, className, children, stopPropagation = true }: PetLinkProps) {
  if (!petId) return <>{children}</>;

  return (
    <Link
      href={`/dashboard/patients/${petId}`}
      className={cn(
        "hover:underline underline-offset-2 decoration-2 decoration-blue-400/60 transition-all cursor-pointer",
        className
      )}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      title="Ver ficha do animal"
    >
      {children}
    </Link>
  );
}
