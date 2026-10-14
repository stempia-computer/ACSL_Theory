import packets from "@/data/contest-packets.json";

export type ContestQuestion = {
  number: number;
  category: string;
  page: number;
  correctAnswer: string | null;
};
export type ContestPacket = {
  id: string;
  seasonCode: string;
  season: string;
  contest: string;
  division: string;
  title: string;
  problemPdf: string;
  solutionPdf: string | null;
  questions: ContestQuestion[];
};

export const contestPackets = packets as ContestPacket[];
export const contestSeasons = [...new Set(contestPackets.map((packet) => packet.season))].sort().reverse();
export const contestDivisions = ["Classroom", "Junior", "Intermediate", "Senior"];
export const contestNames = ["contest-1", "contest-2", "contest-3", "contest-4", "all-star"];
export function contestLabel(value: string) {
  return value === "all-star" ? "All-Star" : `Contest ${value.at(-1)}`;
}
