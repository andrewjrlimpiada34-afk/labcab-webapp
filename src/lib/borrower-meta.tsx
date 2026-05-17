import { BriefcaseBusiness, GraduationCap } from "lucide-react";
import { User } from "@/lib/types";

export function getBorrowerType(user: User | null | undefined) {
  return user?.borrowerType === "teacher" ? "teacher" : "student";
}

export function getBorrowerTypeLabel(user: User | null | undefined) {
  return getBorrowerType(user) === "teacher" ? "Teacher" : "Student";
}

export function getBorrowerTypeIcon(user: User | null | undefined) {
  return getBorrowerType(user) === "teacher" ? BriefcaseBusiness : GraduationCap;
}
