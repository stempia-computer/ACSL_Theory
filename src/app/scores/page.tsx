import { PageHeader } from "@/components/ui";
import { HomeworkList } from "@/components/worksheet-homework";
export default function Scores() {
  return (
    <>
      <PageHeader
        title="Scores"
        description="Review saved worksheet attempts and return to your incorrect answers."
      />
      <HomeworkList scoresOnly />
    </>
  );
}
