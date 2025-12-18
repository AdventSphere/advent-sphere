import { nanoid } from "nanoid";

const USER_ID_KEY = "advent-sphere-user-id";

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function setUserId(id: string): void {
  localStorage.setItem(USER_ID_KEY, id);
}

export function generateUserId(): string {
  const id = nanoid();
  setUserId(id);
  return id;
}

export function getOrCreateUserId(): string {
  const existingId = getUserId();
  if (existingId) {
    return existingId;
  }
  return generateUserId();
}
