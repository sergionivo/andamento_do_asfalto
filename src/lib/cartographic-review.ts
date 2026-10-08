import { aliasesForStreet } from "@/data/street-aliases";
import type {
  CandidateReviewStatus,
  OfficialPavingAxis,
  OsmCandidateFeature,
} from "@/types/official";

export interface AxisReview {
  axis: OfficialPavingAxis;
  candidates: OsmCandidateFeature[];
  status: CandidateReviewStatus;
  aliases: string[];
  osmNames: string[];
  candidateLengthMeters: number | null;
  lengthDifferencePercent: number | null;
}

export function buildAxisReviews(
  axes: OfficialPavingAxis[],
  candidates: OsmCandidateFeature[],
): AxisReview[] {
  const streetUseCount = new Map<string, number>();
  for (const axis of axes) {
    for (const street of axis.streets) {
      streetUseCount.set(street, (streetUseCount.get(street) ?? 0) + 1);
    }
  }

  return axes.map((axis) => {
    const axisCandidates = candidates.filter((feature) => feature.properties.axisIds.includes(axis.id));
    const countsByStreet = new Map<string, number>();
    for (const candidate of axisCandidates) {
      const street = candidate.properties.matchedCanonicalName;
      countsByStreet.set(street, (countsByStreet.get(street) ?? 0) + 1);
    }

    const hasMissingStreet = axis.streets.some((street) => !countsByStreet.get(street));
    const hasMultipleCandidates = axis.streets.some((street) => (countsByStreet.get(street) ?? 0) > 1);
    const sharesStreetAcrossAxes = axis.streets.some((street) => (streetUseCount.get(street) ?? 0) > 1);

    let status: CandidateReviewStatus;
    if (axis.geometryStatus === "validated") status = "validated";
    else if (!axisCandidates.length) status = "not_found";
    else if (hasMissingStreet || hasMultipleCandidates || sharesStreetAcrossAxes) status = "ambiguous";
    else status = "candidate_found";

    const candidateLengthMeters = axisCandidates.length
      ? Number(axisCandidates.reduce((total, feature) => total + feature.properties.candidateLengthMeters, 0).toFixed(2))
      : null;
    const lengthDifferencePercent = candidateLengthMeters === null
      ? null
      : Number((((candidateLengthMeters - axis.officialLengthMeters) / axis.officialLengthMeters) * 100).toFixed(1));

    return {
      axis,
      candidates: axisCandidates,
      status,
      aliases: [...new Set(axis.streets.flatMap(aliasesForStreet))],
      osmNames: [...new Set(axisCandidates.map((feature) => feature.properties.osmName))],
      candidateLengthMeters,
      lengthDifferencePercent,
    };
  });
}
