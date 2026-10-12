import { PageHeader } from "@/components/ui";
import { QuestionBank } from "@/components/question-bank";

export default function QuestionBankPage() {
  return (
    <>
      <PageHeader
        title="Question Bank"
        description="Organize four-choice ACSL practice questions by year, contest, division, and category."
      />
      <QuestionBank />
    </>
  );
}
