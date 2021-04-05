module.exports = {
  /*
  example: {
    baseSymbols: ['BTC', 'USDT'],
    configIndicators: {
      fast: {
        identifier: 'sma',
        options: {
          period: 50
        }
      },
      slow: {
        identifier: 'sma',
        options: {
          period: 200
        }
      }
    },
    limit: 200, // amount of candles required for this strategy to work
    skipPairs: ['BTCUSDT'],
    timeframes: ['4h', '1d'],
    trigger: chart => {
      const candle = chart[chart.length - 1] // live candle, use chart[chart.length - 1] for last closed candle
      return candle.indicators.fast.sma < candle.indicators.slow.sma && candle.top >= candle.indicators.fast.sma
    }
  },
  */
  bands: {
    // Triggers when price touched lower Bollinger band
    baseSymbols: ['BUSD', 'USDT'],
    configIndicators: {
      bb: {
        identifier: 'bbands',
        options: {
          period: 20,
          stddev: 2
        }
      }
    },
    limit: 20,
    timeframes: ['4h'],
    trigger: chart => chart[chart.length - 1].low <= chart[chart.length - 1].indicators.bb.bbands_lower || chart[chart.length - 2].low <= chart[chart.length - 2].indicators.bb.bbands_lower
  },
  taz: {
    // https://www.swing-trade-stocks.com/traders-action-zone.html
    baseSymbols: ['BTC'],
    configIndicators: {
      fast: {
        identifier: 'ema',
        options: {
          period: 30
        }
      },
      slow: {
        identifier: 'sma',
        options: {
          period: 10
        }
      }
    },
    limit: 30,
    timeframes: ['4h'],
    trigger: chart => chart[chart.length - 2].low > chart[chart.length - 2].indicators.fast.ema && chart[chart.length - 2].low < chart[chart.length - 2].indicators.slow.sma
  },
  vsa: {
    // VSA's stopping volume
    baseSymbols: ['BTC', 'BUSD', 'USDT'],
    configIndicators: {
      range: {
        identifier: 'atr',
        options: {
          period: 1
        }
      }
    },
    limit: 50,
    timeframes: ['4h', '1d'],
    trigger: chart => {
      const candle = chart[chart.length - 2]
      // check if candle is a local low (10 candles)
      if (candle.low === Math.min(...chart.slice(chart.length - 11, chart.length - 1).map(candle => candle.low))) {
        // check if volume is larger than previous 5 candles
        if (candle.volume === Math.max(...chart.slice(chart.length - 6, chart.length - 1).map(candle => candle.volume))) {
          // check if range is larger than previous 3 candles
          if (candle.indicators.range.atr === Math.max(...chart.slice(chart.length - 4, chart.length - 1).map(candle => candle.indicators.range.atr))) {
            // check if price is rejected (close above 60% of candle's range)
            return (candle.close - candle.low) / (candle.high - candle.low) >= 0.6
          }
        }
      }
      return false
    }
  }
}
