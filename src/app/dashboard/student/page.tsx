import { DashboardTabs, PageHeader } from "@/components/ui";
import { HomeworkList } from "@/components/worksheet-homework";
export default function StudentDashboard() {
  return (
    <>
      <DashboardTabs student />
      <PageHeader
        title="Student Dashboard"
        description="Your Computer Number Systems homework and latest results."
      />
      <HomeworkList scoresOnly />
    </>
  );
}
