module.exports = {
  /*
  example: {
    baseSymbols: ['BTC', 'USDT'],
    configIndicators: {
      bb: {
        identifier: 'bbands',
        options: {
          period: 20,
          stddev: 2
        }
      }
    },
    skipPairs: ['BTCUSDT'],
    timeframe: '4h',
    trigger: chart => {
      const candle = chart[chart.length - 1] // live candle, use chart[chart.length - 2] for last closed candle
      return candle.low <= candle.indicators.bb.bbands_lower
    }
  }
  */
  bands: {
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
    timeframe: '4h',
    trigger: chart => chart[chart.length - 1].low <= chart[chart.length - 1].indicators.bb.bbands_lower || chart[chart.length - 2].low <= chart[chart.length - 2].indicators.bb.bbands_lower
  },
  taz: {
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
    timeframe: '4h',
    trigger: chart => chart[chart.length - 1].low > chart[chart.length - 1].indicators.fast.ema && chart[chart.length - 1].low < chart[chart.length - 1].indicators.slow.sma
  },
  vsa: {
    baseSymbols: ['BTC', 'BUSD', 'USDT'],
    configIndicators: {
      range: {
        identifier: 'atr',
        options: {
          period: 1
        }
      }
    },
    timeframe: '4h',
    trigger: chart => {
      const candle = chart[chart.length - 2]
      // check if last candle is a local low
      if (candle.low === Math.min(...chart.slice(chart.length - 11, chart.length - 1).map(candle => candle.low))) {
        // check if volume is larger than previous candles
        if (candle.volume === Math.max(...chart.slice(chart.length - 6, chart.length - 1).map(candle => candle.volume))) {
          // check if range is larger than previous candles
          if (candle.indicators.range.atr === Math.max(...chart.slice(chart.length - 4, chart.length - 1).map(candle => candle.indicators.range.atr))) {
            // check if price is rejected
            return (candle.close - candle.low) / (candle.high - candle.low) >= 0.6
          }
        }
      }
      return false
    }
  }
}
