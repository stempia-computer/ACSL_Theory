"use client";

import Link from "next/link";
import { useState } from "react";
import { T, useLanguage } from "@/components/language";
import {
  contestDivisions,
  contestLabel,
  contestNames,
  contestSeasons,
  type ContestPacket,
} from "@/lib/contest-packets";

const select = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

export function ContestLibrary({ packets }: { packets: ContestPacket[] }) {
  const { t } = useLanguage();
  const [season, setSeason] = useState("");
  const [division, setDivision] = useState("");
  const [contest, setContest] = useState("");
  const [search, setSearch] = useState("");
  const visible = packets.filter(
    (packet) =>
      (!season || packet.season === season) &&
      (!division || packet.division === division) &&
      (!contest || packet.contest === contest) &&
      `${packet.title} ${packet.questions.map((question) => question.category).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  return (
    <section className="rounded-xl border border-indigo-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600"><T>Official contest archive</T></p>
          <h2 className="mt-2 text-2xl font-bold"><T>ACSL Contest Questions</T></h2>
          <p className="mt-2 text-sm text-slate-600"><T>114 problem sets · 980 questions · 2020-2021 through 2025-2026</T></p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select className={select} aria-label="Season" value={season} onChange={(event) => setSeason(event.target.value)}>
          <option value=""><T>All seasons</T></option>
          {contestSeasons.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select className={select} aria-label="Division" value={division} onChange={(event) => setDivision(event.target.value)}>
          <option value=""><T>All divisions</T></option>
          {contestDivisions.map((value) => <option key={value}>{value}</option>)}
        </select>
        <select className={select} aria-label="Contest" value={contest} onChange={(event) => setContest(event.target.value)}>
          <option value=""><T>All contests</T></option>
          {contestNames.map((value) => <option value={value} key={value}>{contestLabel(value)}</option>)}
        </select>
        <input className={select} aria-label="Search contest questions" placeholder={t("Search topic or packet")} value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <p className="my-4 text-sm text-slate-500">{visible.length} <T>sets found</T></p>
      <div className="grid max-h-[36rem] gap-3 overflow-auto pr-1 md:grid-cols-2">
        {visible.map((packet) => {
          const categories = [...new Set(packet.questions.map((question) => question.category))];
          const fullyGraded = packet.questions.every((question) => question.correctAnswer);
          return (
            <Link href={`/question-bank/contests/${packet.id}`} key={packet.id} className="rounded-lg border border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-900">{packet.title}</h3>
                <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${fullyGraded ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                  <T>{fullyGraded ? "Auto grading" : "Answer key missing"}</T>
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{packet.questions.length} <T>questions</T> · {categories.join(" · ")}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
