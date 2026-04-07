'use client';

import Link from 'next/link';

import { deleteExamAction, duplicateExamAction } from '@/app/admin/actions';

const btnBase =
  'inline-flex shrink-0 items-center justify-center gap-1.5 min-h-8 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3460] focus-visible:ring-offset-1';

export default function ExamRowActions({ examId, examSlug }) {
  return (
    <div
      className="flex flex-wrap justify-end gap-2 min-w-0 ml-auto"
      role="group"
      aria-label="Exam actions"
    >
      <Link
        href={`/admin/builder/${examId}`}
        title="Exam settings, instructions, and questions"
        className={`${btnBase} border border-[#0a2540] bg-[#0f3460] text-white hover:bg-[#1a5276] shadow-sm`}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
        Questions
      </Link>

      <form
        action={duplicateExamAction}
        className="inline-flex shrink-0"
        onSubmit={(e) => {
          if (
            !confirm(
              'Create a full duplicate of this exam (all questions)? The copy is saved as Draft with results hidden; you can edit and publish it separately.'
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="examId" value={examId} />
        <button
          type="submit"
          title="Duplicate exam and all questions (submissions are not copied)"
          className={`${btnBase} cursor-pointer border border-[#7d3c98] bg-white text-[#7d3c98] hover:bg-[#f4eef8] shadow-sm`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        </button>
      </form>

      <a
        href={`/exam/${examSlug}?preview=1`}
        target="_blank"
        rel="noopener noreferrer"
        title="Student-style preview (no candidate form; no submission)"
        className={`${btnBase} border border-[#219653] bg-white text-[#219653] hover:bg-[#e8f5e9] shadow-sm`}
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Preview
      </a>

      <form
        action={deleteExamAction}
        className="inline-flex shrink-0"
        onSubmit={(e) => {
          if (!confirm('Delete this exam and all its questions & submissions?')) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="examId" value={examId} />
        <button
          type="submit"
          className={`${btnBase} cursor-pointer border border-[#c0392b] bg-[#e94560] text-white hover:bg-[#d63031] shadow-sm`}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
          Delete
        </button>
      </form>
    </div>
  );
}
