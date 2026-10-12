import data from "@/data/worksheet-homework.json";
export const worksheetAssignments = data.assignments;
export const worksheetQuestions = data.questions;
export type WorksheetAssignment = (typeof worksheetAssignments)[number];
export type WorksheetQuestion = (typeof worksheetQuestions)[number];
export function assignmentQuestions(assignment: WorksheetAssignment) {
  return assignment.questionIds.map((id) =>
    worksheetQuestions.find((q) => q.id === id)!,
  );
}
