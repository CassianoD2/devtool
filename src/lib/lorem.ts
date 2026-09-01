const WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(
    " ",
  );

export type LoremUnit = "words" | "sentences" | "paragraphs";

export interface LoremOptions {
  unit: LoremUnit;
  count: number;
  startWithLorem?: boolean;
}

function rand(max: number): number {
  return Math.floor(Math.random() * max);
}

function makeSentence(): string {
  const len = 6 + rand(10);
  const words: string[] = [];
  for (let i = 0; i < len; i++) words.push(WORDS[rand(WORDS.length)]);
  const text = words.join(" ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

function makeParagraph(): string {
  const count = 3 + rand(4);
  return Array.from({ length: count }, makeSentence).join(" ");
}

export function generateLorem(opts: LoremOptions): string {
  const n = Math.max(1, Math.min(500, Math.floor(opts.count)));
  let out: string;
  if (opts.unit === "words") {
    const words = Array.from({ length: n }, () => WORDS[rand(WORDS.length)]);
    out = words.join(" ");
  } else if (opts.unit === "sentences") {
    out = Array.from({ length: n }, makeSentence).join(" ");
  } else {
    out = Array.from({ length: n }, makeParagraph).join("\n\n");
  }
  if (opts.startWithLorem !== false) {
    out = "Lorem ipsum " + out.charAt(0).toLowerCase() + out.slice(1);
  }
  return out;
}
