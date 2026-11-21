import { FileTextIcon, LightbulbIcon, MessageCircleQuestionIcon, WrenchIcon, type LucideIcon } from "lucide-react"

import type { Topic } from "./logic"

export const TOPICS: { id: Topic; label: string; Icon: LucideIcon }[] = [
  { id: "billing", label: "Invoices & documents", Icon: FileTextIcon },
  { id: "broken", label: "Something's broken", Icon: WrenchIcon },
  { id: "question", label: "Ask a question", Icon: MessageCircleQuestionIcon },
  { id: "improvement", label: "Suggest an improvement", Icon: LightbulbIcon },
]
