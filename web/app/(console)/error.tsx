"use client"

import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

// Route-level error state for the console: what failed, plus Retry.
export default function ConsoleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-4 lg:p-6">
      <Alert variant="destructive" role="alert">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>Couldn&apos;t load this page</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <span>{error.message || "The console data failed to load."}</span>
          <Button variant="outline" size="sm" onClick={reset}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
