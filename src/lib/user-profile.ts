import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@/lib/types";

type UserRecord = Partial<User> & Record<string, unknown>;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getDisplayName(
  userData?: UserRecord | null,
  authUser?: Pick<FirebaseUser, "displayName" | "email"> | null
): string {
  const candidates = [
    userData?.name,
    userData?.firstName && userData?.lastName
      ? `${String(userData.firstName)} ${String(userData.lastName)}`
      : "",
    userData?.firstName,
    authUser?.displayName,
    authUser?.email ? authUser.email.split("@")[0].replace(/[._-]+/g, " ") : "",
  ];

  for (const candidate of candidates) {
    const value = cleanString(candidate);
    if (value) return value;
  }

  return "Scholar";
}

export function getFirstName(
  userData?: UserRecord | null,
  authUser?: Pick<FirebaseUser, "displayName" | "email"> | null
): string {
  const fullName = getDisplayName(userData, authUser);
  return fullName.split(/\s+/)[0] || "Scholar";
}

export function normalizeUserProfile(
  userData: UserRecord | undefined,
  authUser: Pick<FirebaseUser, "uid" | "displayName" | "email">
): User {
  const name = getDisplayName(userData, authUser);

  return {
    uid: cleanString(userData?.uid) || authUser.uid,
    name,
    email: cleanString(userData?.email) || authUser.email || "",
    role: userData?.role === "admin" ? "admin" : "borrower",
    qrCode: cleanString(userData?.qrCode) || undefined,
    studentId: cleanString(userData?.studentId) || undefined,
    profilePic: cleanString(userData?.profilePic) || undefined,
    course: cleanString(userData?.course) || undefined,
  };
}
