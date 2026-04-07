"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import CandidateDetailsStep from '@/app/test/components/CandidateDetailsStep';
import InstructionsStep from '@/app/test/components/InstructionsStep';
import PreparationStep from '@/app/test/components/PreparationStep';
import TestInterfaceStep from '@/app/test/components/TestInterfaceStep';

export default function TestClient({ exam, questions, adminPreview = false, attemptToken = '' }) {
  const router = useRouter();
  const totalDurationSeconds = exam.durationMinutes * 60;
  const [step, setStep] = useState(adminPreview ? 2 : 1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [activeQ, setActiveQ] = useState(() => questions[0]?.questionNumber ?? null);
  const [answers, setAnswers] = useState({});
  const [statuses, setStatuses] = useState({});
  const [timeLeft, setTimeLeft] = useState(totalDurationSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [, setWarnings] = useState(0);
  const warningCountRef = useRef(0);
  const autoSubmitRef = useRef(false);
  const [activeSection, setActiveSection] = useState('all');

  const hasSections = exam.sections && exam.sections.length > 0;
  const sectionNames = hasSections ? exam.sections.map((s) => s.name) : [];
  const orderedQuestionNumbers = useMemo(() => questions.map((q) => q.questionNumber), [questions]);
  const firstQuestionNumber = orderedQuestionNumbers[0] ?? null;
  const questionIndexByNumber = useMemo(
    () => new Map(orderedQuestionNumbers.map((qNum, index) => [qNum, index])),
    [orderedQuestionNumbers]
  );

  const sectionQuestionCountMap = useMemo(() => {
    const countMap = new Map();
    questions.forEach((q) => {
      const sectionName = q.section || '';
      countMap.set(sectionName, (countMap.get(sectionName) || 0) + 1);
    });
    return countMap;
  }, [questions]);

  const getSectionQuestionCount = (sectionName, configuredTotal = null) =>
    configuredTotal !== null && configuredTotal !== undefined
      ? configuredTotal
      : sectionQuestionCountMap.get(sectionName || '') || 0;

  const calculatedTotalQuestions = hasSections
    ? exam.sections.reduce(
        (sum, section) => sum + getSectionQuestionCount(section.name, section.totalQuestions),
        0
      )
    : questions.length;
  const calculatedTotalMarks = hasSections
    ? exam.sections.reduce((sum, section) => {
        const count = getSectionQuestionCount(section.name, section.totalQuestions);
        return sum + count * (section.marksPerQuestion ?? exam.marksPerQuestion ?? 1);
      }, 0)
    : questions.length * (exam.marksPerQuestion ?? 1);
  const totalMarks =
    exam.totalMarksOverride !== null && exam.totalMarksOverride !== undefined
      ? exam.totalMarksOverride
      : calculatedTotalMarks;
  const totalQuestions =
    exam.totalQuestionsOverride !== null && exam.totalQuestionsOverride !== undefined
      ? exam.totalQuestionsOverride
      : calculatedTotalQuestions;
  const totalSections =
    exam.totalSectionsOverride !== null && exam.totalSectionsOverride !== undefined
      ? exam.totalSectionsOverride
      : exam.sections
        ? exam.sections.length
        : 0;
  const showSectionHeader = hasSections || totalSections > 0;
  const currentQuestionIndex = activeQ === null ? -1 : questionIndexByNumber.get(activeQ) ?? -1;
  const isFirstQuestion = currentQuestionIndex <= 0;
  const isLastQuestion =
    currentQuestionIndex === -1 || currentQuestionIndex === orderedQuestionNumbers.length - 1;

  useEffect(() => {
    if (orderedQuestionNumbers.length === 0) {
      if (activeQ !== null) setActiveQ(null);
      return;
    }
    if (activeQ === null || !questionIndexByNumber.has(activeQ)) setActiveQ(firstQuestionNumber);
  }, [activeQ, firstQuestionNumber, orderedQuestionNumbers.length, questionIndexByNumber]);

  useEffect(() => {
    if (step === 4 && Object.keys(statuses).length === 0 && firstQuestionNumber !== null) {
      const initialStatuses = {};
      questions.forEach((q) => {
        initialStatuses[q.questionNumber] =
          q.questionNumber === firstQuestionNumber ? 'not_answered' : 'not_visited';
      });
      setStatuses(initialStatuses);
    }
  }, [firstQuestionNumber, questions, statuses, step]);

  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting) return;
    if (adminPreview) {
      setErrorMsg('Preview mode does not record attempts. Use "End preview" when finished.');
      return;
    }
    if (questions.length === 0) {
      setErrorMsg('This exam has no questions configured yet. Please contact administrator.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const formattedAnswers = Object.entries(answers).map(([qNum, opt]) => ({
      questionNumber: parseInt(qNum, 10),
      selectedOption: opt,
    }));

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          attemptToken,
          studentName: name,
          studentPhone: phone,
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit test');
        setIsSubmitting(false);
        return;
      }

      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      router.push(`/result/${data.attemptId}`);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Network error. Please try again.');
      setIsSubmitting(false);
    }
  }, [adminPreview, answers, attemptToken, exam.id, isSubmitting, name, phone, questions.length, router]);

  useEffect(() => {
    let timer;
    if (adminPreview) return undefined;
    if (step === 4 && timeLeft > 0 && !isSubmitting) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && step === 4 && !isSubmitting) {
      handleSubmitTest();
    }
    return () => clearInterval(timer);
  }, [adminPreview, handleSubmitTest, isSubmitting, step, timeLeft]);

  // Watch warningCountRef — auto-submit when 3 violations are reached
  useEffect(() => {
    if (autoSubmitRef.current) {
      autoSubmitRef.current = false;
      handleSubmitTest();
    }
  });

  useEffect(() => {
    if (adminPreview || step !== 4 || isSubmitting) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = 'Are you sure you want to leave? Your test will not be saved!';
      return event.returnValue;
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) return;
      warningCountRef.current += 1;
      if (warningCountRef.current >= 3) {
        alert('SECURITY VIOLATION: Test auto-submitted due to frequent tab switching.');
        autoSubmitRef.current = true;
        setWarnings(warningCountRef.current); // trigger re-render so the effect above fires
        return;
      }
      alert(`WARNING ${warningCountRef.current}/3: Navigating away from the test window is prohibited.`);
      setWarnings(warningCountRef.current);
    };
    const handleKeyDown = (event) => {
      if (
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && ['I', 'i', 'J', 'j'].includes(event.key)) ||
        (event.ctrlKey && ['U', 'u', 'P', 'p', 'S', 's', 'C', 'c'].includes(event.key))
      ) {
        event.preventDefault();
      }
    };
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) return;
      warningCountRef.current += 1;
      if (warningCountRef.current >= 3) {
        alert('SECURITY VIOLATION: Test auto-submitted due to exiting fullscreen mode.');
        autoSubmitRef.current = true;
        setWarnings(warningCountRef.current);
        return;
      }
      alert(`WARNING ${warningCountRef.current}/3: You exited fullscreen mode. Please return immediately.`);
      try {
        document.documentElement.requestFullscreen().catch(() => {});
      } catch {
        // ignore
      }
      setWarnings(warningCountRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [adminPreview, handleSubmitTest, isSubmitting, step]);

  const handleCandidateDetailsContinue = () => {
    // OTP is handled inside CandidateDetailsStep; this is called after OTP is verified
    setErrorMsg('');
    setStep(2);
  };

  const handleProceedToPrep = (event) => {
    event.preventDefault();
    if (!agreed) {
      setErrorMsg('Please accept the instructions and rules before proceeding.');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleStartTest = () => {
    if (questions.length === 0) {
      setErrorMsg('This exam has no questions configured yet. Please contact administrator.');
      return;
    }
    if (!adminPreview) {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {
        // ignore
      }
    }
    window.scrollTo(0, 0);
    setStep(4);
  };

  const handleEndPreview = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    router.push('/admin/exams');
  };

  const formattedTime = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionKey) => {
    if (activeQ === null) return;
    setAnswers((prev) => ({ ...prev, [activeQ]: optionKey }));
  };
  const getNextQuestionNumber = (questionNumber) => {
    const currentIndex = questionIndexByNumber.get(questionNumber);
    if (currentIndex === undefined) return null;
    return orderedQuestionNumbers[currentIndex + 1] ?? null;
  };
  const getPreviousQuestionNumber = (questionNumber) => {
    const currentIndex = questionIndexByNumber.get(questionNumber);
    if (currentIndex === undefined || currentIndex === 0) return null;
    return orderedQuestionNumbers[currentIndex - 1] ?? null;
  };
  const moveToNextQuestion = (nextStatusesBuilder) => {
    if (activeQ === null) return;
    const nextQuestionNumber = getNextQuestionNumber(activeQ);
    setStatuses((prev) => {
      const nextStatuses = nextStatusesBuilder({ ...prev });
      if (nextQuestionNumber !== null && nextStatuses[nextQuestionNumber] === 'not_visited') {
        nextStatuses[nextQuestionNumber] = 'not_answered';
      }
      return nextStatuses;
    });
    if (nextQuestionNumber !== null) setActiveQ(nextQuestionNumber);
  };
  const handleSaveAndNext = () => {
    moveToNextQuestion((nextStatuses) => {
      nextStatuses[activeQ] = answers[activeQ] ? 'answered' : 'not_answered';
      return nextStatuses;
    });
  };
  const handleClearResponse = () => {
    if (activeQ === null) return;
    setAnswers((prev) => {
      const nextAnswers = { ...prev };
      delete nextAnswers[activeQ];
      return nextAnswers;
    });
  };
  const handleMarkForReview = () => {
    moveToNextQuestion((nextStatuses) => {
      nextStatuses[activeQ] = answers[activeQ] ? 'answered_marked' : 'marked';
      return nextStatuses;
    });
  };
  const handlePrevious = () => {
    if (activeQ === null) return;
    const previousQuestionNumber = getPreviousQuestionNumber(activeQ);
    if (previousQuestionNumber === null) return;
    setStatuses((prev) => {
      const next = { ...prev };
      if (next[activeQ] === 'not_visited' || next[activeQ] === 'not_answered') {
        next[activeQ] = answers[activeQ] ? 'answered' : 'not_answered';
      }
      if (next[previousQuestionNumber] === 'not_visited') {
        next[previousQuestionNumber] = 'not_answered';
      }
      return next;
    });
    setActiveQ(previousQuestionNumber);
  };
  const handleNext = () => {
    if (!isLastQuestion) handleSaveAndNext();
  };
  const jumpToQuestion = (questionNumber) => {
    if (!questionIndexByNumber.has(questionNumber)) return;
    setStatuses((prev) => {
      const nextStatuses = { ...prev };
      if (activeQ !== null && (nextStatuses[activeQ] === 'not_visited' || nextStatuses[activeQ] === 'not_answered')) {
        nextStatuses[activeQ] = answers[activeQ] ? 'answered' : 'not_answered';
      }
      if (nextStatuses[questionNumber] === 'not_visited') {
        nextStatuses[questionNumber] = 'not_answered';
      }
      return nextStatuses;
    });
    setActiveQ(questionNumber);
  };

  const stats = useMemo(() => {
    const initial = { not_visited: 0, not_answered: 0, answered: 0, marked: 0, answered_marked: 0 };
    Object.values(statuses).forEach((value) => {
      if (value in initial) initial[value] += 1;
    });
    initial.not_visited = Math.max(0, questions.length - Object.keys(statuses).length + initial.not_visited);
    return initial;
  }, [questions.length, statuses]);

  if (step === 1) {
    return (
      <CandidateDetailsStep
        exam={exam}
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        errorMsg={errorMsg}
        onContinue={handleCandidateDetailsContinue}
      />
    );
  }

  if (step === 2) {
    return (
      <InstructionsStep
        exam={exam}
        adminPreview={adminPreview}
        hasSections={hasSections}
        showSectionHeader={showSectionHeader}
        totalQuestions={totalQuestions}
        totalMarks={totalMarks}
        totalSections={totalSections}
        getSectionQuestionCount={getSectionQuestionCount}
        errorMsg={errorMsg}
        agreed={agreed}
        setAgreed={setAgreed}
        onProceed={handleProceedToPrep}
      />
    );
  }

  if (step === 3) {
    return <PreparationStep adminPreview={adminPreview} onStartTest={handleStartTest} />;
  }

  return (
    <TestInterfaceStep
      exam={exam}
      questions={questions}
      adminPreview={adminPreview}
      name={name}
      formattedTime={formattedTime}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      hasSections={hasSections}
      sectionNames={sectionNames}
      currentQuestionNumber={activeQ}
      answers={answers}
      errorMsg={errorMsg}
      stats={stats}
      statuses={statuses}
      isFirstQuestion={isFirstQuestion}
      isLastQuestion={isLastQuestion}
      isSubmitting={isSubmitting}
      onSelectOption={handleOptionSelect}
      onMarkForReview={handleMarkForReview}
      onPrevious={handlePrevious}
      onClearResponse={handleClearResponse}
      onNext={handleNext}
      onJumpToQuestion={jumpToQuestion}
      onSubmit={handleSubmitTest}
      onEndPreview={handleEndPreview}
    />
  );
}
