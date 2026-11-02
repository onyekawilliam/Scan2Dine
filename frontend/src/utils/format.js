// One place for money formatting so a currency setting can replace the "$" later.
export const money = (amount) => `$${Number(amount || 0).toFixed(2)}`;

export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.error?.message || err?.response?.data?.message || fallback;
