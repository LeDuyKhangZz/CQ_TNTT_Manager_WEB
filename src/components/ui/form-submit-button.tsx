"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./button";

/** Local pending feedback for progressively enhanced Server Action forms. */
export function FormSubmitButton({pending, ...props}: ButtonProps) {
  const form = useFormStatus();
  return <Button {...props} type="submit" pending={pending || form.pending} />;
}
