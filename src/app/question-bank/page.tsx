import { Badge, PageHeader } from "@/components/ui";
import { questions } from "@/lib/mock-data";

export default function QuestionBank() {
  return (
    <>
      <PageHeader
        title="Question Bank"
        description="Explore sample ACSL questions and review the answers."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {questions.map((q) => (
          <article
            key={q.id}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-indigo-700">
                {q.topic}
              </span>
              <Badge>{q.difficulty}</Badge>
            </div>
            <h2 className="font-medium leading-relaxed text-slate-900">
              {q.prompt}
            </h2>
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer font-medium text-slate-500 hover:text-indigo-700">
                Show answer
              </summary>
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-slate-700">
                {q.answer}
              </p>
            </details>
          </article>
        ))}
      </div>
    </>
  );
}
