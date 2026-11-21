"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import type { PipelineResult } from "./types"

export const PRESENTER_SUBMIT = "/submit?presenter=1"
export const PRESENTER_CONSOLE = "/console?presenter=1"

export type PresenterTicket = {
  id: string
  request: { subject: string; body: string }
  result: PipelineResult
}

const PresenterContext = createContext<{
  ticket: PresenterTicket | null
  setTicket: (ticket: PresenterTicket | null) => void
}>({ ticket: null, setTicket: () => {} })

// The root layout survives client navigation. Reloading or closing the tab drops this data.
export function PresenterTicketProvider({ children }: { children: ReactNode }) {
  const [ticket, setTicket] = useState<PresenterTicket | null>(null)

  useEffect(() => {
    if (!ticket) return
    const timer = setTimeout(() => setTicket((current) => current === ticket ? null : current), 5 * 60_000)
    return () => clearTimeout(timer)
  }, [ticket])

  return <PresenterContext.Provider value={{ ticket, setTicket }}>{children}</PresenterContext.Provider>
}

export function usePresenterTicket() {
  return useContext(PresenterContext)
}
