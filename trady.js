const arrayShuffle = require('array-shuffle')
const beeper = require('beeper')
const Binance = require('node-binance-api')
const chalk = require('chalk')
const dotenv = require('dotenv')
const tulind = require('tulind')
const { arrowRight, cross, line, tick } = require('figures')
const { format, formatDistance } = require('date-fns')
const { interval } = require('rxjs')
const { program } = require('commander')
const { repeat, take, tap } = require('rxjs/operators')

const strategies = require('./strategies')
const { version } = require('./package.json')

dotenv.config()

const binance = new Binance().options({ APIKEY: process.env.APIKEY, APISECRET: process.env.APISECRET })
const isWindows = process.platform === 'win32'

const getCandlesticks = async (pair, timeframe, limit) => {
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
      { limit }
    )
  })
  return candlesticks
}

const getChart = (candlesticks, configIndicators) => {
  const indicators = {}
  Object.keys(configIndicators).forEach(indicatorName => {
    const configIndicator = configIndicators[indicatorName]
    const indicator = tulind.indicators[configIndicator.identifier]
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
      indicators[indicatorName] = outputs
    })
  })
  return candlesticks.map((candle, index) => ({
    ...candle,
    indicators: sliceIndicators(indicators, index)
  }))
}

const log = message => {
  console.log(`${chalk[isWindows ? 'white' : 'gray'](format(new Date(), 'HH:mm'))} ${message}`)
}

const run = async options => {
  try {
    console.log(`${chalk.green(`Trady v${version}`)} ${chalk[isWindows ? 'white' : 'gray'](`${line} run with -h to output usage information`)}`)
    console.log(chalk.yellow(`Like it? Buy me a ${isWindows ? 'beer' : '🍺'} :) 1B7owVfYhLjWLh9NWivQAKJHBcf8Doq54i (BTC)`))
    const baseSymbols = Object.values(strategies).reduce((baseSymbols, strategy) => [...new Set(baseSymbols.concat(strategy.baseSymbols))], [])
    const prices = await binance.prices()
    const pairs = Object.keys(prices)
      .filter(pair => {
        let valid = false
        baseSymbols.forEach(symbol => {
          if (pair.endsWith(symbol)) {
            const instrument = pair.slice(0, symbol.length * -1)
            valid = !instrument.endsWith('DOWN') && !instrument.endsWith('UP') // skip Binance's leveraged tokens
          }
        })
        return valid
      })
      .sort()
    const strategyNames = Object.keys(strategies)
    const pings = (options.shuffle ? arrayShuffle(pairs) : pairs).reduce((pings, pair) => {
      const temps = []
      strategyNames.forEach(strategyName => {
        const strategy = strategies[strategyName]
        if (!(strategy.skipPairs ?? []).includes(pair) && strategy.baseSymbols.some(symbol => pair.endsWith(symbol))) {
          strategy.timeframes.forEach(timeframe => temps.push(`${timeframe}-${strategyName}`))
        }
      })
      temps.sort().forEach(temp => {
        const [timeframe, strategyName] = temp.split('-')
        if (!pings[`${pair}-${timeframe}`]) {
          pings[`${pair}-${timeframe}`] = []
        }
        pings[`${pair}-${timeframe}`].push(strategyName)
      })
      return pings
    }, {})
    const keys = Object.keys(pings)
    console.log(chalk.cyan(`Scanning ${pairs.length} pairs${keys.length > pairs.length ? ` (${keys.length} pings)` : ''}, running strateg${strategyNames.length > 1 ? 'ies' : 'y'} ${strategyNames.join(' and ')}, ${options.repeat !== 1 ? 'repeating ' : 'completing '}${formatDistance(options.delay * 1000 * keys.length, 0, { addSuffix: true })}`))
    let count = 0
    let divider = false
    interval(options.delay * 1000)
      .pipe(
        take(keys.length),
        tap(() => count++),
        repeat(options.repeat > 0 && options.repeat)
      )
      .subscribe(async index => {
        try {
          const key = keys[index]
          const [pair, timeframe] = key.split('-')
          const strategyNames = pings[key]
          const limit = Math.max(...strategyNames.map(strategyName => strategies[strategyName].limit))
          const candlesticks = await getCandlesticks(pair, timeframe, limit)
          const triggers = []
          await Promise.all(
            strategyNames.map(async strategyName => {
              const strategy = strategies[strategyName]
              const chart = await getChart(candlesticks, strategy.configIndicators)
              if (strategy.trigger(chart)) {
                triggers.push(strategyName)
              }
            })
          )
          if (triggers.length) {
            divider && console.log('')
            divider = false
            options.beep && beeper(3)
            log(`${chalk.green(tick)} ${chalk.cyan(pair)}${chalk.magenta(arrowRight)}${chalk.cyan(timeframe)} ${chalk.green(triggers.join(' and '))}`)
          } else {
            process.stdout.write(options.info ? `${divider ? chalk.yellow('|') : ''}${chalk[isWindows ? 'white' : 'gray'](pair)}${chalk.magenta(arrowRight)}${chalk[isWindows ? 'white' : 'gray'](timeframe)}` : chalk.blue('.'))
            divider = true
          }
        } catch (error) {
          divider && console.log('')
          divider = false
          log(`${chalk.red(cross)} ${error.toString()}`)
        } finally {
          if (index === keys.length - 1) {
            divider && console.log('')
            divider = false
            options.beep && beeper()
            if (options.repeat === 0 || count < keys.length * options.repeat) {
              log('Repeating...')
            }
          }
        }
      })
  } catch (error) {
    log(`${chalk.red(cross)} ${error.toString()}`)
    process.exit(0)
  }
}

const sliceIndicators = (indicators, index) => {
  return Object.keys(indicators).reduce((indicatorsSliced, indicatorName) => {
    const indicator = indicators[indicatorName]
    indicatorsSliced[indicatorName] = Object.keys(indicator).reduce((indexed, outputName) => {
      indexed[outputName] = indicator[outputName][index] ?? null
      return indexed
    }, {})
    return indicatorsSliced
  }, {})
}

program
  .option('-b, --beep', 'sound alerts (default false)')
  .option('-d, --delay <seconds>', 'interval time in seconds (default 10)')
  .option('-i, --info', 'show info (default false)')
  .option('-r, --repeat <times>', '0 repeats forever (default 1)')
  .option('-s, --shuffle', 'shuffle pairs (default false)')
  .parse(process.argv)

const options = program.opts()

run({
  beep: !!options.beep,
  delay: parseInt(options.delay, 10) || 10,
  info: !!options.info,
  repeat: parseInt(options.repeat, 10) === 0 ? 0 : parseInt(options.repeat, 10) || 1,
  shuffle: !!options.shuffle
})
