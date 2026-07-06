import { randomBytes } from "crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ROOM_ID_LENGTH = 6;

export const generateRoomId = (): string => {
  const bytes = randomBytes(ROOM_ID_LENGTH);
  const chars: string[] = [];

  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    const byte = bytes[i] ?? 0;
    chars.push(ALPHABET[byte % ALPHABET.length] ?? "");
  }

  return `room-${chars.join("")}`;
};