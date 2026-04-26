import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import type { UserProfile } from "@/types";

export interface StreakResult {
  streak: number;
  longestStreak: number;
  shields: number;
  shieldUsed: boolean;
  isNewDay: boolean; // true if this is the first login of the day
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function toMonthStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // "YYYY-MM"
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  const dateA = new Date(a).getTime();
  const dateB = new Date(b).getTime();
  return Math.round(Math.abs(dateB - dateA) / msPerDay);
}

/**
 * Called when user logs in. Checks & updates streak.
 * Returns the new streak state and whether this was a new day login.
 */
export async function processLoginStreak(uid: string): Promise<StreakResult> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User not found");

  const user = snap.data() as UserProfile;
  const today = toDateStr(new Date());
  const thisMonth = toMonthStr(new Date());

  const lastLogin = user.lastLoginDate || "";
  const currentStreak = user.streak || 0;
  const longestStreak = user.longestStreak || 0;
  
  // Reset shields to 2 if we're in a new month
  const currentShieldsMonth = user.shieldsResetMonth || "";
  let shields = user.shields ?? 2;
  if (currentShieldsMonth !== thisMonth) {
    shields = 2;
  }

  // Already logged in today – return current state, no change
  if (lastLogin === today) {
    return {
      streak: currentStreak,
      longestStreak,
      shields,
      shieldUsed: false,
      isNewDay: false,
    };
  }

  // First login ever or very old login
  let newStreak = 1;
  let shieldUsed = false;

  if (lastLogin) {
    const days = daysBetween(lastLogin, today);
    if (days === 1) {
      // Consecutive day – increment streak
      newStreak = currentStreak + 1;
    } else if (days === 2 && shields > 0) {
      // Missed one day – use a shield to protect streak
      newStreak = currentStreak + 1;
      shields -= 1;
      shieldUsed = true;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  const newLongest = Math.max(newStreak, longestStreak);

  await updateDoc(userRef, {
    streak: newStreak,
    longestStreak: newLongest,
    lastLoginDate: today,
    shields,
    shieldsResetMonth: thisMonth,
  });

  return {
    streak: newStreak,
    longestStreak: newLongest,
    shields,
    shieldUsed,
    isNewDay: true,
  };
}
