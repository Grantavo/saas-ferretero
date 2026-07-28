export function calculateBasePrice(costPrice: number, marginPercentage: number): number {
  return Math.round(costPrice * (1 + marginPercentage / 100));
}

export function calculateFinalPrice(basePrice: number, taxPercentage: number): number {
  return basePrice * (1 + taxPercentage / 100);
}