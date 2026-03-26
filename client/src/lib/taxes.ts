// Reference values for 2024

export const calculateINSS = (grossSalary: number): number => {
  let inss = 0;
  let remaining = grossSalary;

  // Bracket 1: up to 1412.00 (7.5%)
  if (grossSalary > 1412.00) {
    inss += 1412.00 * 0.075;
  } else {
    inss += grossSalary * 0.075;
    return inss;
  }

  // Bracket 2: 1412.01 to 2666.68 (9%)
  if (grossSalary > 2666.68) {
    inss += (2666.68 - 1412.00) * 0.09;
  } else {
    inss += (grossSalary - 1412.00) * 0.09;
    return inss;
  }

  // Bracket 3: 2666.69 to 4000.03 (12%)
  if (grossSalary > 4000.03) {
    inss += (4000.03 - 2666.68) * 0.12;
  } else {
    inss += (grossSalary - 2666.68) * 0.12;
    return inss;
  }

  // Bracket 4: 4000.04 to 7786.02 (14%)
  if (grossSalary > 7786.02) {
    inss += (7786.02 - 4000.03) * 0.14;
  } else {
    inss += (grossSalary - 4000.03) * 0.14;
    return inss;
  }

  return inss;
};

export const calculateIRRF = (grossSalary: number, inss: number, dependents: number = 0): number => {
  const deductionPerDependent = 189.59;
  let baseIRRF = grossSalary - inss - (dependents * deductionPerDependent);
  
  // Optional simplified deduction (2024 rule)
  const simplifiedDeduction = 564.80;
  const baseWithSimplified = grossSalary - simplifiedDeduction;
  
  // Use the one that is more beneficial to the taxpayer (lower base)
  const actualBase = Math.min(baseIRRF, baseWithSimplified);

  if (actualBase <= 2259.20) {
    return 0;
  } else if (actualBase <= 2826.65) {
    return (actualBase * 0.075) - 169.44;
  } else if (actualBase <= 3751.05) {
    return (actualBase * 0.15) - 381.44;
  } else if (actualBase <= 4664.68) {
    return (actualBase * 0.225) - 662.77;
  } else {
    return (actualBase * 0.275) - 896.00;
  }
};

export const calculateNetSalary = (grossSalary: number, discounts: number = 0) => {
  const inss = calculateINSS(grossSalary);
  const irrf = calculateIRRF(grossSalary, inss);
  
  const netSalary = grossSalary - inss - irrf - discounts;
  
  return {
    gross: grossSalary,
    inss,
    irrf,
    discounts,
    net: netSalary
  };
};