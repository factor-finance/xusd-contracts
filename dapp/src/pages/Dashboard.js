import React, { useEffect, useState } from 'react'
import { useStoreState } from 'pullstate'
import ethers from 'ethers'
import { get } from 'lodash'

import Connectors from '../components/Connectors'
import Redirect from '../components/Redirect'
import LoginWidget from '../components/LoginWidget'
import AccountStore from 'stores/AccountStore'

const governorAddress = '0xeAD9C93b79Ae7C1591b1FB5323BD777E86e150d4'

const Dashboard = () => {
  const allowances = useStoreState(AccountStore, s => s.allowances)
  const balances = useStoreState(AccountStore, s => s.balances)
  const account = useStoreState(AccountStore, s => s.address)

  const isGovernor = account && account === governorAddress


  const buyOusd = async () => {
    await Vault.depositAndMint(
      MockUSDT.address,
      ethers.utils.parseUnits('100.0', await MockUSDT.decimals())
    )
    //await loadBalances()
  }

  const depositYield = async () => {
    await Vault.depositYield(
      MockUSDT.address,
      ethers.utils.parseUnits('10.0', await MockUSDT.decimals())
    )
    //await loadBalances()
  }

  const tableRows = () => {
    return ['usdt', 'dai', 'tusd', 'usdc'].map((x) => (
      <tr key={x}>
        <td>{x.toUpperCase()}</td>
        <td>{get(allowances, x) > 100000000000 ? 'Unlimited' : 'None'}</td>
        <td>1</td>
        <td>{get(balances, x)}</td>
      </tr>
    ))
  }

  return (
    <div className="my-5">
      {account && (
        <>
          <h1>Balances</h1>
          <div className="card w25 mb-4">
            <div className="card-body">
              <h5 className="card-title">Current Balance</h5>
              <p className="card-text">{get(balances, 'ousd')}</p>
            </div>
          </div>
          <table className="table table-bordered">
            <thead>
              <tr>
                <td>Asset</td>
                <td>Permission</td>
                <td>Exchange Rate</td>
                <td>Your Balance</td>
              </tr>
            </thead>
            <tbody>{tableRows()}</tbody>
          </table>
          {isGovernor && (
            <div className="btn btn-primary my-4 mr-3" onClick={depositYield}>
              Deposit $10 Yield
            </div>
          )}
          <div className="btn btn-primary my-4 mr-3" onClick={buyOusd}>
            Buy OUSD
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard

require('react-styl')(``)
