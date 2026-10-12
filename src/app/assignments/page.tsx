import { PageHeader } from "@/components/ui";
import { HomeworkList } from "@/components/worksheet-homework";
export default function Assignments() {
  return (
    <>
      <PageHeader
        title="Assignments"
        description="Open your worksheet, submit your answers, and review your results."
      />
      <HomeworkList />
    </>
  );
}
