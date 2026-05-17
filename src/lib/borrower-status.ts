import { Transaction, User } from "@/lib/types";

function getItemCount(tx: Transaction) {
  return tx.items.reduce((sum, item) => sum + Math.max(0, item.quantity || 0), 0);
}

export function getBorrowerStanding(user: User | null | undefined, transactions: Transaction[], now = new Date()) {
  const activeTransactions = transactions.filter((tx) => tx.status === "active");
  const overdueTransactions = activeTransactions.filter((tx) => tx.deadline && new Date(tx.deadline) < now);
  const returnedTransactions = transactions.filter((tx) => tx.status === "returned");

  const outstandingItemCount = activeTransactions.reduce((sum, tx) => sum + getItemCount(tx), 0);
  const overdueItemCount = overdueTransactions.reduce((sum, tx) => sum + getItemCount(tx), 0);
  const missingItemCount = Math.max(0, user?.missingItemCount || 0);
  const unresolvedCount = outstandingItemCount + missingItemCount;

  const restrictionReasons: string[] = [];

  if (outstandingItemCount > 3) {
    restrictionReasons.push(`You still have ${outstandingItemCount} apparatus units not yet returned.`);
  }

  if (overdueItemCount > 0) {
    restrictionReasons.push(`You have ${overdueItemCount} overdue apparatus units that must be settled first.`);
  }

  if (missingItemCount > 0) {
    restrictionReasons.push(`The system has ${missingItemCount} missing apparatus unit(s) flagged on your account.`);
  }

  const isRestricted = outstandingItemCount > 3 || overdueItemCount > 0 || missingItemCount > 0;
  const hasComplied =
    !isRestricted &&
    transactions.length > 0 &&
    returnedTransactions.length > 0 &&
    outstandingItemCount === 0 &&
    missingItemCount === 0;

  const nextSteps = isRestricted
    ? [
        outstandingItemCount > 3 ? "Return enough apparatus until you have 3 or fewer unreturned units." : null,
        overdueItemCount > 0 ? "Settle all overdue apparatus with the laboratory facilitator." : null,
        missingItemCount > 0 ? "Resolve the missing-item flag with the administrator." : null,
        user?.restrictionNote ? `Admin note: ${user.restrictionNote}` : null,
      ].filter(Boolean) as string[]
    : hasComplied
      ? [
          "Your current obligations are already settled in the system.",
          "If your access was previously limited, the administrator can now review and confirm your account.",
        ]
      : [];

  return {
    activeTransactions,
    overdueTransactions,
    returnedTransactions,
    outstandingItemCount,
    overdueItemCount,
    missingItemCount,
    unresolvedCount,
    isRestricted,
    hasComplied,
    restrictionReasons,
    nextSteps,
  };
}
