"use client";

import { useState } from "react";
import Link from "next/link";
import { T } from "@/components/language";
import type { ContestPacket } from "@/lib/contest-packets";

const choices = ["A", "B", "C", "D", "E"];

export function ContestPractice({ packet }: { packet: ContestPacket }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const gradable = packet.questions.every((question) => question.correctAnswer);
  const score = packet.questions.filter((question) => answers[question.number] === question.correctAnswer).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/question-bank" className="text-sm font-semibold text-indigo-700 underline"><T>Back to Question Bank</T></Link>
        <div className="flex gap-3">
          <a href={packet.problemPdf} target="_blank" rel="noreferrer" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold"><T>Open problem PDF</T></a>
          {packet.solutionPdf && <a href={packet.solutionPdf} target="_blank" rel="noreferrer" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold"><T>Open solution PDF</T></a>}
        </div>
      </div>
      <header>
        <p className="text-sm font-semibold text-indigo-600">{packet.division} · {packet.season}</p>
        <h1 className="mt-2 text-3xl font-bold">{packet.title}</h1>
      </header>
      {!gradable && <p className="rounded-lg bg-amber-50 p-4 text-amber-900"><T>The source collection does not include a solution PDF for this set, so it can be viewed but not automatically graded.</T></p>}
      <section className="overflow-hidden rounded-xl border bg-slate-200">
        <iframe title={`${packet.title} problems`} src={`${packet.problemPdf}#view=FitH`} className="h-[72vh] min-h-[640px] w-full bg-white" />
      </section>
      <section className="rounded-xl border bg-white p-5 sm:p-6">
        <h2 className="text-xl font-bold"><T>Answer sheet</T></h2>
        <div className="mt-5 space-y-3">
          {packet.questions.map((question) => {
            const correct = submitted && answers[question.number] === question.correctAnswer;
            return (
              <div key={question.number} className={`rounded-lg border p-3 ${submitted ? correct ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <a href={`${packet.problemPdf}#page=${question.page}`} target="_blank" rel="noreferrer" className="w-8 font-bold text-indigo-700 underline">{question.number}</a>
                  <span className="min-w-40 flex-1 text-sm text-slate-600">{question.category}</span>
                  <div className="flex gap-1" role="group" aria-label={`Question ${question.number}`}>
                    {choices.map((choice) => <button type="button" disabled={submitted || !gradable} aria-pressed={answers[question.number] === choice} key={choice} onClick={() => setAnswers((current) => ({ ...current, [question.number]: choice }))} className={`h-9 w-9 rounded-md border text-sm font-bold ${answers[question.number] === choice ? "border-indigo-600 bg-indigo-600 text-white" : "bg-white"}`}>{choice}</button>)}
                  </div>
                  {submitted && <span className="w-32 text-sm font-semibold"><T>{correct ? "Correct" : `Correct: ${question.correctAnswer}`}</T></span>}
                </div>
              </div>
            );
          })}
        </div>
        {submitted ? (
          <div className="mt-5 rounded-lg bg-indigo-50 p-5">
            <p className="text-2xl font-bold">{score} / {packet.questions.length} · {Math.round(score / packet.questions.length * 100)}%</p>
            <button type="button" className="mt-4 rounded-lg border bg-white px-4 py-2 font-semibold" onClick={() => { setSubmitted(false); setAnswers({}); }}><T>Try again</T></button>
          </div>
        ) : (
          <button type="button" disabled={!gradable} onClick={() => setSubmitted(true)} className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-40"><T>Submit and grade</T></button>
        )}
      </section>
    </div>
  );
}
