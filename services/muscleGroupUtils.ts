/**
 * Helper to parse muscle_group string from DB which can be:
 * 1. A simple string like "Peito" (builtin exercises)
 * 2. A JSON string like '{"primary": [...], "secondary": [...], "primaryString": "..."}' (custom exercises)
 */
export function parseMuscleGroup(muscleGroup: string | null): {
  primaryString: string;
  primaryIds: string[];
  secondaryIds: string[];
} {
  if (!muscleGroup) {
    return { primaryString: '', primaryIds: [], secondaryIds: [] };
  }

  if (muscleGroup.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(muscleGroup);
      return {
        primaryString: parsed.primaryString || '',
        primaryIds: parsed.primary || [],
        secondaryIds: parsed.secondary || [],
      };
    } catch (e) {
      console.error('Failed to parse muscle_group JSON:', e);
    }
  }

  return {
    primaryString: muscleGroup,
    primaryIds: [],
    secondaryIds: [],
  };
}
