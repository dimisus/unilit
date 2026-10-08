import React, { ReactNode, useCallback, useContext, useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { CoinPrice } from '@unisat/wallet-shared'
import { useWallet } from './WalletContext'

import { useChain } from '../hooks/settings'

interface PriceContextType {
  isLoadingCoinPrice: boolean
  coinPrice: CoinPrice
  refreshCoinPrice: () => void
}

const PriceContext = React.createContext<PriceContextType>({} as PriceContextType)

const EMPTY_PRICE: CoinPrice = {
  btc: 0,
  fb: 0,
}

/** Shared by every price label. One request per minute while the wallet is open. */
const COIN_PRICE_INTERVAL = 60 * 1000

export function usePrice() {
  const context = useContext(PriceContext)
  if (!context) {
    throw Error('Feature flag hooks can only be used by children of BridgeProvider.')
  } else {
    return context
  }
}

export function PriceProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet()
  const chain = useChain()
  const showPrice = chain?.showPrice === true

  const query = useQuery({
    queryKey: ['coinPrice', chain?.enum],
    queryFn: () => wallet.getCoinPrice(),
    enabled: showPrice,
    staleTime: COIN_PRICE_INTERVAL,
    refetchInterval: showPrice ? COIN_PRICE_INTERVAL : false,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const refreshCoinPrice = useCallback(() => {
    if (!showPrice) return
    void query.refetch()
  }, [query.refetch, showPrice])

  const value = useMemo(
    () => ({
      isLoadingCoinPrice: showPrice && query.isLoading,
      coinPrice: query.data ?? EMPTY_PRICE,
      refreshCoinPrice,
    }),
    [query.data, query.isLoading, refreshCoinPrice, showPrice]
  )

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>
}
