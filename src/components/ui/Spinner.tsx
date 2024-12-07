import { cn } from "@/lib/utils"

export const Spinner = ({
  className,
}: {
  className?: string
}) => {
  return (
    <div
      className={cn("animate-spin h-5 w-5 border-2 border-current border-t-transparent text-primary rounded-full", className)}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
