'use client';

import Link from 'next/link';
import { useState } from 'react';
import { deleteExamAction, duplicateExamAction } from '@/app/admin/actions';

const btnBase =
  'inline-flex shrink-0 items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black';

export default function ExamRowActions({ examId, examSlug }) {
  const [copied, setCopied] = useState(false);

  const copyTestLink = () => {
    const url = `${window.location.origin}/exam/${examSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex flex-wrap justify-end gap-2 min-w-0 ml-auto"
      role="group"
      aria-label="Exam actions"
    >
      <Link
        href={`/admin/builder/${examId}`}
        title="Exam settings, instructions, and questions"
        className={`${btnBase} !text-black !border-gray-300 hover:!bg-gray-100`}
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
        </svg>
        Editor
      </Link>

      <button
        onClick={copyTestLink}
        title="Copy direct link to this exam to paste on your site"
        className={btnBase}
      >
        {copied ? (
          <svg className="w-4 h-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        )}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>

      <form
        action={duplicateExamAction}
        className="inline-flex shrink-0"
        onSubmit={(e) => {
          if (!confirm('Create a full duplicate of this exam?')) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="examId" value={examId} />
        <button type="submit" title="Duplicate exam" className={btnBase}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Duplicate
        </button>
      </form>

      <a
        href={`/exam/${examSlug}?preview=1`}
        target="_blank"
        rel="noopener noreferrer"
        title="Preview exam as candidate"
        className={btnBase}
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Preview
      </a>

      <form
        action={deleteExamAction}
        className="inline-flex shrink-0"
        onSubmit={(e) => {
          if (!confirm('Delete this exam completely?')) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="examId" value={examId} />
        <button
          type="submit"
          className={`${btnBase} hover:!text-red-700 hover:!border-red-200 hover:!bg-red-50`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          Delete
        </button>
      </form>
    </div>
  );
}
