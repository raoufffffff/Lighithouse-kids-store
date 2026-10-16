export const dzd = (n: number) => `${Math.round(n).toLocaleString('en-US')} د.ج`

export const discountPercent = (price: number, compare: number | null) =>
  compare && compare > price ? Math.round((1 - price / compare) * 100) : 0
