export const KG_TO_LBS = 2.20462;
export const CM_TO_IN = 0.393701;

export const formatWeight = (weightInKg: number, unit: 'kg' | 'lbs', showUnit: boolean = true) => {
  if (weightInKg === null || weightInKg === undefined) return '-';
  const val = unit === 'lbs' ? weightInKg * KG_TO_LBS : weightInKg;
  const formatted = parseFloat(val.toFixed(1)).toString();
  return showUnit ? `${formatted} ${unit.toUpperCase()}` : formatted;
};

export const convertToKg = (weightInCurrentUnit: number, unit: 'kg' | 'lbs') => {
  if (unit === 'kg') return weightInCurrentUnit;
  return weightInCurrentUnit / KG_TO_LBS;
};

export const formatMeasurement = (measurementInCm: number, unit: 'cm' | 'in', showUnit: boolean = true) => {
  if (measurementInCm === null || measurementInCm === undefined) return '-';
  const val = unit === 'in' ? measurementInCm * CM_TO_IN : measurementInCm;
  const formatted = parseFloat(val.toFixed(1)).toString();
  return showUnit ? `${formatted} ${unit.toUpperCase()}` : formatted;
};

export const convertToCm = (measurementInCurrentUnit: number, unit: 'cm' | 'in') => {
  if (unit === 'cm') return measurementInCurrentUnit;
  return measurementInCurrentUnit / CM_TO_IN;
};

export const getDisplayWeight = (weightInKg: number, unit: 'kg' | 'lbs') => {
  if (weightInKg === null || weightInKg === undefined) return 0;
  const val = unit === 'lbs' ? weightInKg * KG_TO_LBS : weightInKg;
  return parseFloat(val.toFixed(1));
};

export const getDisplayMeasurement = (measurementInCm: number, unit: 'cm' | 'in') => {
  if (measurementInCm === null || measurementInCm === undefined) return 0;
  const val = unit === 'in' ? measurementInCm * CM_TO_IN : measurementInCm;
  return parseFloat(val.toFixed(1));
};
