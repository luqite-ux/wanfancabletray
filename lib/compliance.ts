const prohibited = [
  ["warranty", /\bwarranty\b/i],
  ["warranties", /\bwarranties\b/i],
  ["warrantied", /\bwarrantied\b/i],
  ["warranted", /\bwarranted\b/i],
  ["guarantee", /\bguarantee\b/i],
  ["guarantees", /\bguarantees\b/i],
  ["guaranteed", /\bguaranteed\b/i],
  ["guaranteeing", /\bguaranteeing\b/i],
  ["质保", /质保/],
  ["保修", /保修/],
  ["质保期", /质保期/],
  ["保修期", /保修期/],
  ["质量保证", /质量保证/],
] as const;

export function scanProhibitedTerms(input: string) {
  const matches = prohibited.flatMap(([term, pattern], patternIndex) =>
    Array.from(input.matchAll(new RegExp(pattern.source, `${pattern.flags}g`)), (match) => ({
      term,
      index: match.index ?? -1,
      patternIndex,
    })),
  ).sort((left, right) => left.index - right.index || left.patternIndex - right.patternIndex);

  const detected = new Set<string>();
  return matches
    .filter((match, index) => !matches.slice(0, index).some((prior) => prior.index === match.index && match.term.includes(prior.term)))
    .map((match) => match.term)
    .filter((term) => {
      if (detected.has(term)) return false;
      detected.add(term);
      return true;
    });
}
