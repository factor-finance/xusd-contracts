import React, { useState, useEffect } from 'react'
import { useStoreState } from 'pullstate'
import { get } from 'lodash'
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import { sleep } from 'utils/utils'

import ContractStore from 'stores/ContractStore'
import StakeStore from 'stores/StakeStore'
import { formatCurrency } from 'utils/math'
import { usePrevious } from 'utils/hooks'

const useCompensation = () => {
  const xusdClaimedLocalStorageKey = (account) =>
    `xusd_claimed_${account.toLowerCase()}`
  const blockNumber = 11272254
  const [compensationData, setCompensationData] = useState(null)
  const [compensationXUSDBalance, setCompensationXUSDBalance] = useState(null)
  const { active, account } = useWeb3React()
  const prevAccount = usePrevious(account)
  const { compensation: compensationContract } = useStoreState(
    ContractStore,
    (s) => {
      if (s.contracts) {
        return s.contracts
      }
      return {}
    }
  )
  const ognClaimed = useStoreState(StakeStore, (s) => s.airDropStakeClaimed)

  const fetchCompensationInfo = async (wallet) => {
    const result = await fetch(
      `${location.origin}/api/compensation?wallet=${wallet}`
    )
    if (result.ok) {
      const jsonResult = await result.json()
      setCompensationData(jsonResult)
    } else {
      // TODO: handle error or no complensation available
      setCompensationData(null)
    }
  }

  const fetchCompensationXUSDBalance = async () => {
    const xusdBalance = parseFloat(
      formatCurrency(
        ethers.utils.formatUnits(
          await compensationContract.balanceOf(account),
          18
        ),
        2
      )
    )
    setCompensationXUSDBalance(xusdBalance)
    return xusdBalance
  }

  const fetchAllData = async (active, account, compensationContract) => {
    let xusdBalance
    if (active && account) {
      await fetchCompensationInfo(account)
    }

    if (
      compensationContract &&
      compensationContract.provider &&
      active &&
      account
    ) {
      xusdBalance = await fetchCompensationXUSDBalance()
    }
    return xusdBalance
  }

  /* Very weird workaround for Metamask provider. Turn out that Metamask uses
   * some sort of caching when it comes to ERC20 balanceOf calls. I would issue balanceOf
   * calls on local node running in fork mode and see that most of the time they are not
   * reaching the node.
   *
   * The workaround for this is to just issue balanceOf calls each second until we get the
   * expected 0 balance XUSD on the contract.
   *
   */
  const queryDataUntilAccountChange = async () => {
    let xusdBalance = compensationXUSDBalance
    while (xusdBalance !== 0) {
      xusdBalance = await fetchAllData(active, account, compensationContract)
      await sleep(1000)
    }
  }

  useEffect(() => {
    // account changed
    if (prevAccount && prevAccount !== account) {
      setCompensationData(null)
      setCompensationXUSDBalance(null)
    }

    fetchAllData(active, account, compensationContract)
  }, [active, account, compensationContract])

  const replaceAll = (string, search, replace) => {
    return string.split(search).join(replace)
  }

  const xusdCompensationAmount = parseFloat(
    replaceAll(
      get(compensationData, 'account.xusd_compensation_human', '0'),
      ',',
      ''
    )
  )
  return {
    compensationData,
    ognCompensationAmount: parseFloat(
      replaceAll(
        get(compensationData, 'account.ogn_compensation_human', '0'),
        ',',
        ''
      )
    ),
    xusdCompensationAmount,
    eligibleXusdBalance: parseFloat(
      replaceAll(
        get(compensationData, 'account.eligible_xusd_value_human', '0'),
        ',',
        ''
      )
    ),
    fetchCompensationInfo,
    fetchCompensationXUSDBalance,
    xusdClaimed: compensationXUSDBalance === 0 && xusdCompensationAmount > 0,
    ognClaimed,
    queryDataUntilAccountChange,
    remainingXUSDCompensation: compensationXUSDBalance,
    blockNumber,
  }
}

export default useCompensation
