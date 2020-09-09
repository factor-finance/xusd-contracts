import { fbt } from 'fbt-runtime'

import Closing from 'components/Closing'
import GetOUSD from 'components/GetOUSD'
import Layout from 'components/layout'
import Nav from 'components/Nav'

export default function Earn({ locale, onLocale }) {
  return (
    <Layout>
      <header>
        <Nav locale={locale} onLocale={onLocale} />
        <div className="container text-center text-lg-left">
          <div className="row">
            <div className="col-12 col-lg-7 d-flex align-items-center">
              <div className="text-container">
                <h1>{fbt('Earn highly competitive yields without lifting a finger', 'Earn highly competitive yields without lifting a finger')}</h1>
                <h2>{fbt('OUSD enables both sophisticated DeFi experts and novice users to passively earn compelling returns across three strategies.', 'OUSD enables both sophisticated DeFi experts and novice users to passively earn compelling returns across three strategies.')}</h2>
                <div className="d-none d-lg-block">
                  <GetOUSD style={{ marginTop: 60 }} primary />
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5 text-center">
              <img src="/images/yield-hero-graphic.svg" alt="Increasing yield" className="increasing" />
            </div>
          </div>
          <svg>
            <line x1="0%" y1="0" x2="100%" y2="0" />
          </svg>
          <p className="introduction">
            {
              fbt(
                'The OUSD smart contract pools capital from all stablecoin depositors then intelligently and algorithmically routes capital to a diversified set of yield-earning strategies. Earnings are automatically converted to OUSD and deposited into your wallet.',
                'The OUSD smart contract pools capital from all stablecoin depositors then intelligently and algorithmically routes capital to a diversified set of yield-earning strategies. Earnings are automatically converted to OUSD and deposited into your wallet.'
              )
            }
          </p>
          <div className="hangers">
            <svg>
              <line x1="0%" y1="0" x2="100%" y2="0" />
              <line x1="25%" y1="0" x2="25%" y2="13" />
              <line x1="50%" y1="0" x2="50%" y2="13" />
              <line x1="75%" y1="0" x2="75%" y2="13" />
            </svg>
            <div className="d-flex justify-content-center">
              <div className="source">
                <img src="/images/yield-1-icon-small.svg" alt="Lending fees" />
              </div>
              <div className="source">
                <img src="/images/yield-2-icon-small.svg" alt="Trading fees" />
              </div>
              <div className="source">
                <img src="/images/yield-3-icon-small.svg" alt="Liquidity mining rewards" />
              </div>
            </div>
            <div className="d-flex justify-content-center">
              <div className="source label">{fbt('Lending Fees', 'Lending Fees')}</div>
              <div className="source label">{fbt('AMM Trading Fees', 'AMM Trading Fees')}</div>
              <div className="source label">{fbt('Liquidity Mining Rewards', 'Liquidity Mining Rewards')}</div>
            </div>
          </div>
        </div>
      </header>
      <section className="bonus">
        <div className="container text-center">
          <img src="/images/yield-4-icon-small.svg" alt="Origin rewards tokens" className="d-block d-lg-inline mb-3 mb-lg-0 mx-auto mr-lg-3" />
          {
            fbt(
              'Plus, earn governance privileges and incentives when you contribute to the protocol.',
              'Plus, earn governance privileges and incentives when you contribute to the protocol.'
            )
          }
          <div className="label mt-2 mt-lg-0">{fbt('Coming Soon', 'Coming Soon')}</div>
        </div>
      </section>
      <section className="light">
        <div className="container text-center text-lg-left">
          <div className="row">
            <div className="col-lg-5 text-center order-lg-2">
              <img src="/images/yield-1-icon-large.svg" alt="Lending fees" className="category" />
            </div>
            <div className="col-lg-7 d-flex align-items-center order-lg-1">
              <div className="text-container">
                <h3>{fbt('Lending Fees', 'Lending Fees')}</h3>
                <div className="description">{fbt('We will route your USDT, USDC, and DAI to proven lending protocols to achieve optimal ROI on your capital.', 'We will route your USDT, USDC, and DAI to proven lending protocols to achieve optimal ROI on your capital.')}</div>
                <div className="elaboration">{fbt('Rebalancing occurs often, factoring in lending rates, rewards tokens, and diversification.', 'Rebalancing occurs often, factoring in lending rates, rewards tokens, and diversification.')}</div>
                <div className="d-flex logos">
                  <div className="d-flex flex-column logo">
                    <div className="flex-fill d-flex justify-content-center">
                      <img src="/images/compound-logo.svg" alt="Compound logo" />
                    </div>
                    <div className="label text-white">{fbt('Coming Soon', 'Coming Soon')}</div>
                  </div>
                  <div className="d-flex flex-column logo">
                    <div className="flex-fill d-flex justify-content-center">
                      <img src="/images/aave-logo.svg" alt="Aave logo" />
                    </div>
                    <div className="label">{fbt('Coming Soon', 'Coming Soon')}</div>
                  </div>
                  <div className="d-flex flex-column logo">
                    <div className="flex-fill d-flex justify-content-center">
                      <img src="/images/dydx-logo.svg" alt="dy/dx logo" />
                    </div>
                    <div className="label">{fbt('Coming Soon', 'Coming Soon')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-5 text-center">
              <img src="/images/yield-2-icon-large.svg" alt="Lending fees" className="category" />
            </div>
            <div className="col-lg-7 d-flex align-items-center">
              <div className="text-container">
                <h3>{fbt('Automated Market Maker Trading Fees', 'Automated Market Maker Trading Fees')}</h3>
                <div className="description">{fbt('Origin will supply stablecoin liquidity to Uniswap and other automated market makers to earn trading fees.', 'Origin will supply stablecoin liquidity to Uniswap and other automated market makers to earn trading fees.')}</div>
                <div className="elaboration">{fbt('Impermanent loss is minimized while LP fees and rewards are maximized.', 'Impermanent loss is minimized while LP fees and rewards are maximized.')}</div>
                <div className="d-flex logos">
                  <div className="d-flex flex-column logo">
                    <div className="flex-fill d-flex justify-content-center">
                      <img src="/images/uniswap-logo.svg" alt="Uniswap logo" />
                    </div>
                    <div className="label">{fbt('Coming Soon', 'Coming Soon')}</div>
                  </div>
                  <div className="d-flex flex-column logo">
                    <div className="flex-fill d-flex justify-content-center">
                      <img src="/images/balancer-logo.svg" alt="Balancer logo" />
                    </div>
                    <div className="label">{fbt('Coming Soon', 'Coming Soon')}</div>
                  </div>
                  <div className="d-flex flex-column logo">
                    <div className="flex-fill d-flex justify-content-center">
                      <img src="/images/curve-logo.svg" alt="Curve logo" />
                    </div>
                    <div className="label">{fbt('Coming Soon', 'Coming Soon')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-5 text-center order-lg-2">
              <img src="/images/yield-3-icon-large.svg" alt="Liquidity Mining Rewards" className="category" />
            </div>
            <div className="col-lg-7 d-flex align-items-center order-lg-1">
              <div className="text-container">
                <h3>{fbt('Liquidity Mining Rewards', 'Liquidity Mining Rewards')}</h3>
                <div className="description">{fbt('COMP, BAL, CRV, and other rewards tokens will be accrued and liquidated for additional yield.', 'COMP, BAL, CRV, and other rewards tokens will be accrued and liquidated for additional yield.')}</div>
                <div className="elaboration">{fbt('Receive all your yield in OUSD automatically. There\'s no need to manage your DeFi portfolio.', 'Receive all your yield in OUSD automatically. There\'s no need to manage your DeFi portfolio.')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="dark compounding">
        <div className="container text-center">
          <h4>{fbt('OUSD compounds continuously', 'OUSD compounds continuously')}</h4>
          <div className="compounding-summary">
            {fbt('Achieve financial security and create wealth faster than ever before.', 'Achieve financial security and create wealth faster than ever before.')}
          </div>
          <div className="image-container">
            <h5>{fbt('Growth of $10,000 over 2 years', 'Growth of $10,000 over 2 years')}</h5>
            <img src="/images/compound-graph-lg.svg" alt="Compounding graph" className="d-none d-lg-block" />
            <img src="/images/compound-graph-xs.svg" alt="Compounding graph" className="d-lg-none" />
            <div className="label">{fbt('Months', 'Months')}</div>
          </div>
        </div>
      </section>
      <section>
        <div className="container text-center">
          <Closing light />
        </div>
      </section>
      <style jsx>{`
        header {
          background-color: #183140;
        }
        
        header .container {
          color: white;
          padding-top: 80px;
          padding-bottom: 60px;
        }

        header .container p {
          max-width: 300px;
        }

        h1 {
          font-family: Poppins;
          font-size: 2.125rem;
          font-weight: 500;
        }

        h2 {
          font-family: Lato;
          font-size: 1.5rem;
          line-height: 1.25;
          margin-top: 30px;
          opacity: 0.8;
        }

        p {
          font-size: 0.8125rem;
          line-height: 1.46;
          margin-bottom: 0;
          opacity: 0.8;
        }

        .increasing {
          margin-bottom: 30px;
        }

        header .container .introduction {
          margin: auto;
          max-width: 750px;
          text-align: center;
        }

        svg {
          height: 1px;
          margin: 50px 0 15px;
          width: 100%;
        }

        .hangers svg {
          height: 13px;
          margin: 15px 0 0;
        }

        line {
          stroke: rgb(234, 243, 234);
          stroke-width: 1;
        }

        .source {
          margin-top: 45px;
          text-align: center;
          width: 25%;
          font-size: 0.8125rem;
          line-height: 1.46;
        }

        .source.label {
          opacity: 0.8;
        }

        .source img {
          max-height: 100%;
        }

        .bonus {
          background-color: #2f424e;
          font-size: 1.125rem;
          line-height: 1.06;
          padding: 30px 0;
          text-align: center;
          opacity: 0.8;
        }

        .bonus .label {
          font-size: 0.8125rem;
          line-height: 1.85;
          opacity: 0.8;
        }

        h3 {
          color: black;
          font-family: Poppins;
          font-size: 1.75rem;
          font-weight: 500;
          line-height: 1.32;
          max-width: 400px;
        }

        .description {
          color: black;
          font-size: 1.125rem;
          line-height: 1.33;
          margin-top: 30px;
        }

        .elaboration {
          color: #8293a4;
          margin-top: 10px;
        }

        .logos {
          margin-top: 50px;
        }

        .logos .logo {
          margin-right: 60px;
        }

        .logos .label {
          color: #8293a4;
          font-size: 0.625rem;
          line-height: 2.4;
          margin-top: 20px;
          text-align: center;
          opacity: 0.8;
        }

        section.light .row:not(:first-of-type) {
          margin-top: 150px;
        }

        section.light .text-container {
          max-width: 500px;
        }

        h4 {
          font-family: Poppins;
          font-size: 1.75rem;
          font-weight: 500;
          line-height: 0.86;
        }

        .compounding-summary {
          font-size: 1.125rem;
          line-height: 1.33;  
          margin: 20px auto 50px;
          opacity: 0.8;
        }

        .compounding .image-container {
          position: relative;
          margin: auto;
          max-width: 786px;
        }

        .compounding h5 {
          position: absolute;
          color: white;
          font-size: 1.125rem;
          top: 0;
          text-align: center;
          width: 100%;
          opacity: 0.8;
        }

        .compounding img {
          margin-right: 7.5%;
          max-width: 92.5%;
        }

        .compounding .label {
          position: absolute;
          bottom: 12.2%;
          color: #fafbfc;
          font-size: 0.75rem;
          text-align: center;
          width: 100%;
          opacity: 0.8;
        }

        @media (max-width: 992px) {
          header .container {
            padding-bottom: 60px;
          }

          .increasing {
            margin-top: 40px;
          }

          .source {
            margin-top: calc(15vw / 3);
          }

          .source img {
            height: 15vw;
          }

          section {
            padding: 60px 0;
          }

          .bonus .container {
            max-width: 380px;
          }

          h3 {
            max-width: 100%;
          }

          .category {
            height: 200px;
            margin-bottom: 30px;
          }

          .logos {
            justify-content: space-around;
          }

          .logos .logo {
            margin-right: 0;
          }

          section.light .text-container {
            max-width: 100%;
          }

          section.light .row:not(:first-of-type) {
            margin-top: 60px;
          }

          .compounding .image-container {
            width: 100%;
          }

          .compounding h5 {
            font-size: 0.875rem;
          }

          .compounding img {
            margin-right: 0;
            max-width: 100%;
          }

          .compounding .label {
            bottom: 20.2%;
            font-size: 0.6875rem;
          }
        }
      `}</style>
    </Layout>
  )
}
