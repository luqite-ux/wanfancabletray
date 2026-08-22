const prohibited = [
  ["warranty", /\bwarranty\b/i],
  ["warranties", /\bwarranties\b/i],
  ["guarantee", /\bguarantee\b/i],
  ["guaranteed", /\bguaranteed\b/i],
  ["质保", /质保/],
  ["保修", /保修/],
  ["质保期", /质保期/],
  ["保修期", /保修期/],
  ["质量保证", /质量保证/],
] as const;

export function scanProhibitedTerms(input: string) {
  return prohibited
    .filter(([, pattern]) => pattern.test(input))
    .map(([term]) => term)
    .filter((term, index, terms) => !terms.some((other, otherIndex) => otherIndex < index && term.includes(other)));
}
