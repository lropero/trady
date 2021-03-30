const arrayShuffle = require('array-shuffle')
const beeper = require('beeper')
const Binance = require('node-binance-api')
const chalk = require('chalk')
const dotenv = require('dotenv')
const tulind = require('tulind')
const { cross, tick } = require('figures')
const { format } = require('date-fns')
const { interval } = require('rxjs')
const { repeat, take } = require('rxjs/operators')

const { version } = require('./package.json')

dotenv.config()

const binance = new Binance().options({
  APIKEY: process.env.APIKEY,
  APISECRET: process.env.APISECRET
})

const configIndicators = [
  {
    name: 'bbands',
    options: {
      period: 20,
      stddev: 2
    }
  }
]

const filterIndicators = (indicators, index) =>
  indicators.map(indicator =>
    Object.keys(indicator).reduce((accumulator, outputName) => {
      accumulator[outputName] = indicator[outputName][index] || null
      return accumulator
    }, {})
  )

const getCandlesticks = async (pair, timeframe) => {
  const candlesticks = await new Promise((resolve, reject) => {
    binance.candlesticks(
      pair,
      timeframe,
      (error, candlesticks) => {
        if (error) {
          return reject(error)
        }
        return resolve(
          candlesticks.map(candlestick => {
            const [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume] = candlestick
            return {
              time,
              open: parseFloat(open),
              high: parseFloat(high),
              low: parseFloat(low),
              close: parseFloat(close),
              volume: parseFloat(volume),
              closeTime,
              assetVolume: parseFloat(assetVolume),
              trades,
              buyBaseVolume: parseFloat(buyBaseVolume),
              buyAssetVolume: parseFloat(buyAssetVolume)
            }
          })
        )
      },
      { limit: 22 }
    )
  })
  return candlesticks
}

const getChart = async candlesticks => {
  const indicators = []
  configIndicators.forEach(configIndicator => {
    const indicator = tulind.indicators[configIndicator.name]
    const indicatorInputs = indicator.input_names.map(inputName => {
      const input = inputName === 'real' ? 'close' : inputName
      return candlesticks.map(candlestick => candlestick[input])
    })
    const indicatorOptions = indicator.option_names.map(optionName => configIndicator.options[optionName.replace(' ', '_')])
    indicator.indicator(indicatorInputs, indicatorOptions, (error, results) => {
      if (error) {
        throw error
      }
      const outputs = indicator.output_names.reduce((outputs, outputName, index) => {
        outputs[outputName] = new Array(candlesticks.length - results[index].length).concat(results[index])
        return outputs
      }, {})
      indicators.push(outputs)
    })
  })
  const chart = candlesticks.map((candle, index) => ({
    ...candle,
    indicators: filterIndicators(indicators, index)
  }))
  return chart
}

const log = message => {
  console.log(`${chalk.gray(format(new Date(), 'HH:mm'))} ${message}`)
}

const run = async () => {
  try {
    console.log(chalk.green(`Trady v${version}`))
    const prices = await binance.prices()
    const pairs = arrayShuffle(Object.keys(prices).filter(pair => pair.endsWith('BTC') || pair.endsWith('BUSD') || pair.endsWith('USDT')))
    console.log(chalk.cyan(`Analyzing ${pairs.length} pairs`))
    let hyphen = false
    interval(8000)
      .pipe(take(pairs.length), repeat())
      .subscribe(async index => {
        try {
          const pair = pairs[index]
          const candlesticks = await getCandlesticks(pair, '1h')
          const chart = await getChart(candlesticks)
          const trigger = chart[chart.length - 1].low <= chart[chart.length - 1].indicators.bbands_lower || chart[chart.length - 2].low <= chart[chart.length - 2].indicators.bbands_lower
          if (trigger) {
            hyphen && console.log('')
            log(`${chalk.magenta(pair)} ${chalk.green(tick)}`)
            beeper(3)
            hyphen = false
          } else {
            process.stdout.write(chalk.gray(`${hyphen ? '-' : ''}${pair}`))
            hyphen = true
          }
        } catch (error) {
          hyphen && console.log('')
          log(`${chalk.red(cross)} ${error.toString()}`)
          hyphen = false
        } finally {
          if (index === pairs.length - 1) {
            hyphen && console.log('')
            log('Repeating...')
            hyphen = false
          }
        }
      })
  } catch (error) {
    log(`${chalk.red(cross)} ${error.toString()}`)
    process.exit(0)
  }
}

run()
