import type { StageRecord, TimeValue, Status } from "./competition.model.js";
export const unknownTime = (): TimeValue => ({
  precision: "unknown",
  value: null,
});
export function registrationStatus(
  stage: Pick<StageRecord, "startsAt" | "deadline" | "conflict">,
  now: Date,
): Status {
  if (stage.conflict) return "conflict";
  const end = stage.deadline;
  if (
    end.value &&
    end.precision === "instant" &&
    now.getTime() >= Date.parse(end.value)
  )
    return "closed";
  if (
    end.value &&
    end.precision === "date" &&
    new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 10) >
      end.value
  )
    return "closed";
  if (
    end.precision !== "instant" ||
    stage.startsAt.precision !== "instant" ||
    !end.value ||
    !stage.startsAt.value
  )
    return "unknown";
  return now.getTime() < Date.parse(stage.startsAt.value) ? "upcoming" : "open";
}
