# Trady 📡 &middot; [![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active) ![GitHub package.json version](https://img.shields.io/github/package-json/v/lropero/trady)

Crypto market scanner.

### Requires

- [Node v18.15.0](https://nodejs.org/)
- npm v9.6.2
- Node.js native addon build tool → [node-gyp](https://github.com/nodejs/node-gyp) (_required by [Tulip Node](https://www.npmjs.com/package/tulind)_)

### Installation

```sh
$ npm ci
```

### Configuration

- Create `.env` file with your Binance reading-only keys (_required for chart retrieval_):

```sh
APIKEY=<YOUR_API_KEY>
APISECRET=<YOUR_API_SECRET>
```

- Edit `strategies.js` file with your strategies (refer to [strategies.js](https://github.com/lropero/trady/blob/main/strategies.js) and [Tulip's indicators](https://tulipindicators.org/list))

### Usage

```sh
$ npm run start # will run 'node trady.js -b -d 2 -i -s'
```

### Options

##### `-b` / `--beep`

Sound alerts (default false)

```sh
node trady.js -b
```

##### `-d` / `--delay <seconds>`

Interval time in seconds (default 5)

```sh
node trady.js -d 2
```

##### `-i` / `--info`

Show info (default false)

```sh
node trady.js -i
```

##### `-r` / `--repeat <times>`

0 repeats forever (default 1)

```sh
node trady.js -r 3
```

##### `-s` / `--shuffle`

Shuffle pairs (default false)

```sh
node trady.js -s
```

##### `-h` / `--help`

Display help

```sh
node trady.js -h
```
