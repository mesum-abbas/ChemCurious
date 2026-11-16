import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { QuizSystem } from "@/components/quiz-system"

export default async function QuizByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 pb-12">
        <QuizSystem initialChapterId={Number(id)} />
      </main>
      <Footer />
    </div>
  )
}
