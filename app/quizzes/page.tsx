import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PageHeader } from "@/components/page-header"
import { QuizSystem } from "@/components/quiz-system"
import { ClipboardCheck } from "lucide-react"

export default function QuizzesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <PageHeader
        eyebrow="Self assessment"
        eyebrowIcon={ClipboardCheck}
        title={
          <>
            Chemistry <span className="text-primary">Quizzes</span>
          </>
        }
        description="Select your class level and chapter to practice, with instant feedback and explanations for every answer."
      />
      <main className="flex-1 pb-12">
        <QuizSystem />
      </main>
      <Footer />
    </div>
  )
}
