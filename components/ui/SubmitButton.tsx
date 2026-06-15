'use client'
import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: React.ReactNode;
  formAction?: string | ((formData: FormData) => void); 
  className?: string;
}

export function SubmitButton({ 
  children, 
  formAction, 
  className = "" 
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      formAction={formAction}
      className={className}
    >
      {pending ? "Memproses..." : children}
    </button>
  );
}
