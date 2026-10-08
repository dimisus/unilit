import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n, useWallet } from '../context'
import { useChain, useFeeRateBar, useUpdateFeeRateBar } from '../hooks'

enum FeeRateType {
  SLOW,
  AVG,
  FAST,
  CUSTOM,
}

interface FeeOption {
  type?: FeeRateType
  title: string
  desc?: string
  feeRate: number
}

const MAX_FEE_RATE = 10000

/** Litecoin's standard relay rate. The wallet offers this, or a custom rate. */
const STANDARD_FEE_RATE = 1

export function useFeeRateBarLogic({ readonly }: { readonly?: boolean }) {
  const wallet = useWallet()
  const [showLowFeeModeTipsPopover, setShowLowFeeModeTipsPopover] = useState(false)
  const feeRateBarState = useFeeRateBar()
  const updateFeeRateBar = useUpdateFeeRateBar()
  const feeRateInputVal = feeRateBarState.feeRateInputVal
  const feeOptionIndex = feeRateBarState.feeOptionIndex
  const feeRate = feeRateBarState.feeRate
  const { t, isSpecialLocale } = useI18n()
  const chain = useChain()
  const fontSize = useMemo(() => (isSpecialLocale ? 'xxxs' : 'xxs'), [isSpecialLocale])
  const supportLowFeeMode = chain.enableLowFeeMode ?? false
  const isCustomSelected = feeOptionIndex === FeeRateType.CUSTOM

  const feeOptions = useMemo(() => {
    const options: FeeOption[] = [
      {
        type: FeeRateType.AVG,
        title: t('average'),
        feeRate: STANDARD_FEE_RATE,
      },
    ]
    if (!readonly) {
      options.push({ type: FeeRateType.CUSTOM, title: t('custom'), feeRate: 0 })
    }
    return options
  }, [readonly, t])

  const selectedOption = feeOptions.find(option => option.type === feeOptionIndex)

  useEffect(() => {
    const val = isCustomSelected ? parseFloat(feeRateInputVal) || 0 : STANDARD_FEE_RATE
    if (val === feeRate) {
      return
    }
    updateFeeRateBar({ feeRate: val })
  }, [isCustomSelected, feeRateInputVal, feeRate, updateFeeRateBar])

  const adjustFeeRateInput = useCallback(
    (inputVal: string) => {
      if (!isCustomSelected && selectedOption && inputVal !== selectedOption.feeRate.toString()) {
        updateFeeRateBar({
          feeRateInputVal: inputVal,
          feeOptionIndex: FeeRateType.CUSTOM,
        })
        return
      }

      if (inputVal === '') {
        updateFeeRateBar({ feeRateInputVal: '' })
        return
      }

      const val = parseFloat(inputVal)
      if (isNaN(val)) {
        updateFeeRateBar({ feeRateInputVal: '' })
        return
      }

      if (inputVal === '0' || inputVal.endsWith('.')) {
        updateFeeRateBar({ feeRateInputVal: inputVal })
        return
      }

      if (val <= 0) {
        updateFeeRateBar({ feeRateInputVal: STANDARD_FEE_RATE.toString() })
      } else if (val > MAX_FEE_RATE) {
        updateFeeRateBar({ feeRateInputVal: MAX_FEE_RATE.toString() })
      } else if (val < 1 && supportLowFeeMode == false) {
        updateFeeRateBar({ feeRateInputVal: '1' })
      } else if (val < 0.1) {
        updateFeeRateBar({ feeRateInputVal: '0.1' })
      } else {
        updateFeeRateBar({ feeRateInputVal: inputVal })
      }
    },
    [isCustomSelected, selectedOption, updateFeeRateBar, supportLowFeeMode]
  )

  const isCustomOption = useCallback((option: FeeOption) => option.type === FeeRateType.CUSTOM, [])

  const toggleLowFeeRate = useCallback(async () => {
    updateFeeRateBar({
      feeOptionIndex: FeeRateType.SLOW,
      showCustomInput: true,
      feeRateInputVal: '0.1',
    })
  }, [updateFeeRateBar])

  const setFeeOptionIndex = useCallback(
    async (index: number) => {
      const option = feeOptions.find(item => item.type === index)
      if (supportLowFeeMode && index === FeeRateType.SLOW) {
        const acceptLowFeeMode = await wallet.getAcceptLowFeeMode()
        if (acceptLowFeeMode === false) {
          setShowLowFeeModeTipsPopover(true)
          return
        }
      }

      const showInput =
        index === FeeRateType.CUSTOM || (supportLowFeeMode && index === FeeRateType.SLOW)

      if (index === FeeRateType.CUSTOM) {
        updateFeeRateBar({
          feeOptionIndex: index,
          showCustomInput: showInput,
          feeRateInputVal: feeRateInputVal === '' ? String(STANDARD_FEE_RATE) : feeRateInputVal,
        })
      } else if (option) {
        updateFeeRateBar({
          feeOptionIndex: index,
          showCustomInput: showInput,
          feeRateInputVal: option.feeRate.toString(),
        })
      }
    },
    [feeOptions, feeRateInputVal, updateFeeRateBar, supportLowFeeMode, wallet]
  )

  const toggleCustomInput = useCallback(
    (show: boolean) => {
      updateFeeRateBar({ showCustomInput: show })
    },
    [updateFeeRateBar]
  )

  const isSub1FeeOptionOn = supportLowFeeMode && feeOptionIndex === FeeRateType.SLOW

  const showCustomInput =
    !readonly &&
    (feeOptionIndex === FeeRateType.CUSTOM || (supportLowFeeMode && feeOptionIndex === FeeRateType.SLOW))

  return {
    feeOptions,
    feeOptionsLoading: false,
    feeOptionIndex,
    setFeeOptionIndex,
    feeRateInputVal,
    adjustFeeRateInput,
    isCustomOption,
    fontSize,
    isSpecialLocale,
    toggleLowFeeRate,
    showCustomInput,
    toggleCustomInput,
    supportLowFeeMode,
    showLowFeeModeTipsPopover,
    setShowLowFeeModeTipsPopover,
    isSub1FeeOptionOn,
  }
}
