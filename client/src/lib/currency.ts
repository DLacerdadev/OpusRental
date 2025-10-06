export interface CurrencyConversion {
  code: string;
  symbol: string;
  rate: number;
}

export const CURRENCY_RATES: Record<string, CurrencyConversion> = {
  US: {
    code: 'USD',
    symbol: '$',
    rate: 1,
  },
  BR: {
    code: 'BRL',
    symbol: 'R$',
    rate: 5.85,
  },
};

export function getCurrencyForCountry(country: string | null | undefined): CurrencyConversion {
  const countryCode = country?.toUpperCase() || 'US';
  return CURRENCY_RATES[countryCode] || CURRENCY_RATES.US;
}

export function convertCurrency(
  amountUSD: number | string,
  targetCountry: string | null | undefined
): number {
  const amount = typeof amountUSD === 'string' ? parseFloat(amountUSD) : amountUSD;
  const currency = getCurrencyForCountry(targetCountry);
  return amount * currency.rate;
}

export function formatCurrency(
  value: number | string,
  userCountry?: string | null
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const currency = getCurrencyForCountry(userCountry);
  const convertedValue = numValue * currency.rate;
  
  if (currency.code === 'BRL') {
    return `${currency.symbol} ${convertedValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  
  return `${currency.symbol}${convertedValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
