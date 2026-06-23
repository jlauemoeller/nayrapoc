import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SENTENCE_DELIMITERS = ".!?";

export function clipText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength);
  let index = -1;

  for (let i = truncated.length - 1; i >= 0; i--) {
    if (SENTENCE_DELIMITERS.includes(truncated[i])) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    if (truncated.length < text.length) {
      return truncated.slice(0, maxLength - 3) + "...";
    } else return truncated;
  } else {
    return truncated.slice(0, index + 1);
  }
}
