import { cn } from "@/lib/utils";

export function FormMessage({
  children,
  className,
  tone = "danger",
}: {
  children?: React.ReactNode;
  className?: string;
  tone?: "danger" | "muted" | "success";
}) {
  if (!children) return null;

  const tones = {
    danger: "text-danger",
    muted: "text-muted-foreground",
    success: "text-success",
  };

  return (
    <p className={cn("text-sm", tones[tone], className)} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </p>
  );
}
