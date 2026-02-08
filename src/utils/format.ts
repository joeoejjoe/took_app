// 지정한 소수점 자리에서 내림 처리
function floorToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.floor(amount));
}

export function formatUSD(amount: number, decimals: number = 2): string {
  const floored = floorToDecimals(amount, decimals);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(floored);
}

export function formatPercentage(value: number, showSign = true, decimals: number = 2): string {
  const floored = floorToDecimals(value, decimals);
  const sign = showSign && floored > 0 ? '+' : '';
  return `${sign}${floored.toFixed(decimals)}%`;
}

// 간단한 숫자 포맷 (천단위 콤마 없이)
export function formatNumber(value: number, decimals: number = 2): string {
  const floored = floorToDecimals(value, decimals);
  return floored.toFixed(decimals);
}
