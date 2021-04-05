# Trady 📡 &middot; [![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active) ![GitHub package.json version](https://img.shields.io/github/package-json/v/lropero/trady)

Crypto market scanner.

### Requires

- [Node v14.16.0](https://nodejs.org/)
- npm v7.8.0
- Node.js native addon build tool → [node-gyp](https://github.com/nodejs/node-gyp) (_required by [Tulip Node](https://www.npmjs.com/package/tulind)_)

### Download

- [trady-main.zip](https://github.com/lropero/trady/archive/main.zip) or `git clone https://github.com/lropero/trady.git`

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

- Edit `strategies.js` file with your strategies (refer to [strategies.js](https://github.com/lropero/trady/blob/master/strategies.js) and [Tulip's indicators](https://tulipindicators.org/list))

### Usage

```sh
$ npm run start # will run 'node index.js -b -s'
```

### Options

##### `-h` / `--help`

Display help for command

```sh
node index.js -h
```

##### `-b` / `--beep`

Sound alerts (default false)

```sh
node index.js -b
```

##### `-d` / `--delay`

Interval time in seconds (default 10)

```sh
node index.js -d 5
```

##### `-r` / `--repeat`

0 repeats forever (default 1)

```sh
node index.js -r 3
```

##### `-s` / `--shuffle`

Shuffle pairs (default false)

```sh
node index.js -s
```
