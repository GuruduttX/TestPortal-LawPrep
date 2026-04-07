export function getPassageAndStem(question) {
  if (!question) return { passage: '', stem: '' };

  const fromField = String(question.passage ?? '').trim();
  if (fromField) {
    return {
      passage: fromField,
      stem: String(question.questionText ?? '').trim(),
    };
  }

  const text = String(question.questionText ?? '');
  const delim = '\n---\n';
  const i = text.indexOf(delim);
  if (i !== -1) {
    return {
      passage: text.slice(0, i).trim(),
      stem: text.slice(i + delim.length).trim(),
    };
  }

  return { passage: '', stem: text.trim() };
}
