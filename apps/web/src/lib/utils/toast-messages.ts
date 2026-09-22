/** User-friendly toast copy — avoid `(s)` plural hacks and zero-count noise. */

export function deletedStatementsMessage(count: number): string {
  if (count === 0) return "Period deleted";
  if (count === 1) return "1 statement removed";
  return `${count} statements removed`;
}

export function dedupedStatementsMessage(count: number): string {
  if (count === 0) return "No duplicates found";
  if (count === 1) return "1 duplicate removed";
  return `${count} duplicates removed`;
}

export function manualSoaSavedMessage(
  saved: number,
  updated: number,
  cardCreated = 0,
): string {
  const statement =
    saved > 0 && updated > 0
      ? `${saved} added, ${updated} updated`
      : updated > 0
        ? updated === 1
          ? "Statement updated"
          : `${updated} statements updated`
        : saved === 1
          ? "Statement added"
          : saved > 1
            ? `${saved} statements added`
            : "Statement added";

  if (cardCreated <= 0) return statement;
  if (cardCreated === 1) return `Card added · ${statement}`;
  return `${cardCreated} cards added · ${statement}`;
}
