import Link from 'next/link';

import { getExamSummaries } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function ExamsListingPage() {
  const exams = (await getExamSummaries()).filter(
    (exam) => exam.status === 'published'
  );

  return (
    <main className="min-h-screen bg-white font-sans">
      <div className="bg-[#FFD700] border-b-[3px] border-[#e6c200]">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-black tracking-widest uppercase">
                Candidate Assessment Portal
              </h1>
              <p className="mt-1 text-[13px] text-[#333] font-medium">
                SECURE TESTING ENVIRONMENT • VERIFIED CANDIDATE ACCESS
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[11px] font-bold text-[#155724] uppercase bg-[#d4edda] px-3 py-1.5 border border-[#28a745]">
                Status: Connected Safely
              </div>
              <Link href="/admin" className="text-[11px] font-bold text-black uppercase bg-white px-3 py-1.5 border border-black hover:bg-gray-100 transition-colors shadow-sm">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        
        {/* Notice Pane */}
        <section className="bg-white border border-black p-5">
          <h2 className="text-[13px] font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 inline-block rounded-full"></span>
            Important Instructions
          </h2>
          <ul className="text-[13px] text-gray-600 space-y-1.5 list-disc pl-5">
            <li>Ensure you have a stable internet connection before beginning the assessment.</li>
            <li>Once started, the timer cannot be paused. You must complete the exam in one sitting.</li>
            <li>Results will not be published immediately unless specified by the evaluation authority.</li>
          </ul>
        </section>

        {/* Exams Data Grid */}
        <section>
          <div className="bg-[#f5f5f5] px-5 py-3 border border-black border-b-0">
            <h2 className="text-[14px] font-bold text-black uppercase tracking-wide">
              Active Assigned Examinations
            </h2>
          </div>
          
          <div className="grid gap-4 bg-white border border-black p-5">
            {exams.length === 0 ? (
              <div className="bg-[#fcf8e3] border border-[#faebcc] p-6 text-center text-[13px] font-bold text-[#8a6d3b] uppercase tracking-wide rounded-sm">
                No active examinations are currently assigned to your candidate profile.
              </div>
            ) : (
              exams.map((exam) => (
                <article
                  key={exam.id}
                  className="border border-black bg-white overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-black bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[18px] font-bold text-black uppercase">
                          {exam.title}
                        </h3>
                        <span className="bg-[#dff0d8] border border-[#d6e9c6] text-[#3c763d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                          Live Active
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-600 leading-relaxed max-w-2xl">
                        {exam.description || 'No additional syllabus information provided by the examination authority.'}
                      </p>
                    </div>

                    <div className="bg-[#f5f5f5] p-5 w-full md:w-64 flex flex-col justify-between shrink-0">
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[12px]">
                        <div>
                          <span className="block text-gray-500 font-bold uppercase tracking-wider text-[10px]">Time Allotted</span>
                          <span className="font-bold text-gray-900">{exam.durationMinutes} Minutes</span>
                        </div>
                        <div>
                          <span className="block text-gray-500 font-bold uppercase tracking-wider text-[10px]">Questions</span>
                          <span className="font-bold text-gray-900">{exam.questionCount} Items</span>
                        </div>
                      </div>
                      
                      <Link
                        href={`/exam/${exam.slug}`}
                        className="mt-6 block w-full text-center bg-[#333] text-white border border-black px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider hover:bg-black transition-colors"
                      >
                        Enter Assessment
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
