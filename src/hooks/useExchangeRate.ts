import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXCHANGE_RATE_KEY = 'TOOK_EXCHANGE_RATE';
const EXCHANGE_RATE_TIMESTAMP_KEY = 'TOOK_EXCHANGE_RATE_TIMESTAMP';
const CACHE_DURATION = 60 * 60 * 1000; // 1시간
const FALLBACK_RATE = 1450; // API 실패 시 기본값

interface ExchangeRateData {
  rate: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

// 환율 API에서 USD -> KRW 환율 가져오기
async function fetchExchangeRate(): Promise<number> {
  // open.er-api.com 무료 API 사용 (API 키 불필요)
  const response = await fetch('https://open.er-api.com/v6/latest/USD');

  if (!response.ok) {
    throw new Error('Failed to fetch exchange rate');
  }

  const data = await response.json();

  if (data.result !== 'success' || !data.rates?.KRW) {
    throw new Error('Invalid exchange rate response');
  }

  return data.rates.KRW;
}

// 캐시된 환율 불러오기
async function getCachedRate(): Promise<{ rate: number; timestamp: number } | null> {
  try {
    const rateStr = await AsyncStorage.getItem(EXCHANGE_RATE_KEY);
    const timestampStr = await AsyncStorage.getItem(EXCHANGE_RATE_TIMESTAMP_KEY);

    if (rateStr && timestampStr) {
      return {
        rate: parseFloat(rateStr),
        timestamp: parseInt(timestampStr, 10),
      };
    }
  } catch (e) {
    console.error('Failed to get cached exchange rate:', e);
  }
  return null;
}

// 환율 캐시에 저장
async function setCachedRate(rate: number): Promise<void> {
  try {
    await AsyncStorage.setItem(EXCHANGE_RATE_KEY, rate.toString());
    await AsyncStorage.setItem(EXCHANGE_RATE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.error('Failed to cache exchange rate:', e);
  }
}

export function useExchangeRate(): ExchangeRateData {
  const [rate, setRate] = useState<number>(FALLBACK_RATE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadRate = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // 캐시 확인
      if (!forceRefresh) {
        const cached = await getCachedRate();

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setRate(cached.rate);
          setLastUpdated(new Date(cached.timestamp));
          setIsLoading(false);
          return;
        }
      }

      // API에서 새 환율 가져오기
      const newRate = await fetchExchangeRate();
      setRate(newRate);
      setLastUpdated(new Date());
      await setCachedRate(newRate);
    } catch (e) {
      console.error('Exchange rate fetch error:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch exchange rate');

      // 에러 시 캐시된 값 사용 시도
      const cached = await getCachedRate();
      if (cached) {
        setRate(cached.rate);
        setLastUpdated(new Date(cached.timestamp));
      } else {
        // 캐시도 없으면 기본값 사용
        setRate(FALLBACK_RATE);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadRate(true);
  }, [loadRate]);

  useEffect(() => {
    loadRate();
  }, [loadRate]);

  return { rate, isLoading, error, lastUpdated, refresh };
}

// 앱 전역에서 환율을 공유하기 위한 단순 모듈 레벨 상태
let globalRate = FALLBACK_RATE;
let globalRatePromise: Promise<number> | null = null;

export async function getExchangeRate(): Promise<number> {
  // 이미 진행 중인 요청이 있으면 기다림
  if (globalRatePromise) {
    return globalRatePromise;
  }

  // 캐시 확인
  const cached = await getCachedRate();
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    globalRate = cached.rate;
    return cached.rate;
  }

  // 새로 가져오기
  globalRatePromise = fetchExchangeRate()
    .then(async (rate) => {
      globalRate = rate;
      await setCachedRate(rate);
      globalRatePromise = null;
      return rate;
    })
    .catch((e) => {
      console.error('Global exchange rate fetch error:', e);
      globalRatePromise = null;
      return globalRate;
    });

  return globalRatePromise;
}

export function getCurrentRate(): number {
  return globalRate;
}

export const FALLBACK_USD_TO_KRW = FALLBACK_RATE;
