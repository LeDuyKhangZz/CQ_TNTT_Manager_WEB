import "server-only";

import { randomInt } from "node:crypto";

const LETTERS = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const ALPHABET = `${LETTERS}${DIGITS}`;

export function generateTemporaryPassword(): string {
  const characters = [
    LETTERS[randomInt(LETTERS.length)],
    DIGITS[randomInt(DIGITS.length)],
    ...Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]),
  ];
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join("");
}
