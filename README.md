# puppeteer-pool
###### based on [phantom-pool](https://github.com/binded/phantom-pool)

[![Build Status](https://travis-ci.org/andantonyan/puppeteer-pool.svg?branch=master)](https://travis-ci.org/andantonyan/puppeteer-pool)

Resource pool based on [generic-pool](https://github.com/coopernurse/node-pool) for [Puppeteer](https://github.com/GoogleChrome/puppeteer).

Creating new puppeteer instances with `puppeteer.launch()` can be slow. If
you are frequently creating new instances and destroying them, as a
result of HTTP requests for example, this module can help by keeping a
pool of puppeteer instances alive and making it easy to re-use them across
requests.

Here's an artificial [benchmark](./lib/benchmark.ts) to illustrate:

`npm run benchmark`

```
Starting benchmark without pool

noPool-0: 588.924ms
noPool-1: 528.814ms
noPool-2: 548.708ms
noPool-3: 593.373ms
noPool-4: 610.983ms
noPool-5: 564.439ms
noPool-6: 588.484ms
noPool-7: 578.740ms
noPool-8: 543.544ms
noPool-9: 646.081ms

Starting benchmark with pool

pool-0: 264.196ms
pool-1: 270.901ms
pool-2: 61.173ms
pool-3: 74.940ms
pool-4: 85.452ms
pool-5: 108.626ms
pool-6: 93.190ms
pool-7: 71.267ms
pool-8: 98.922ms
pool-9: 114.524ms

Done
```

Using pool in this benchmark results in an average >8x speed increase.

Requires Node v6+

## Usage

See [./test](./test) directory for usage examples.

```javascript
import puppeteerPool, { IBrowser } from './index';

// Returns a generic-pool instance
const pool = puppeteerPool({
  max: 10, // default
  min: 2, // default
  // how long a resource can stay idle in pool before being removed
  idleTimeoutMillis: 30000, // default.
  // maximum number of times an individual resource can be reused before being destroyed; set to 0 to disable
  maxUses: 50, // default
  // function to validate an instance prior to use; see https://github.com/coopernurse/node-pool#createpool
  validator: () => Promise.resolve(true), // defaults to always resolving true
  // validate resource before borrowing; required for `maxUses and `validator`
  testOnBorrow: true, // default
  // For all opts, see opts at https://github.com/coopernurse/node-pool#createpool
  puppeteerPoolArgs: [{ headless: false }], // arguments passed to puppeteer directly, default is `[]`. For all opts, see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions
})

// Automatically acquires a puppeteer instance and releases it back to the
// pool when the function resolves or throws
pool.use(async (instance) => {
  const page = await instance.newPage()
  await page.open('http://google.com')
  return await page.$eval('title', title => title.textContent);
}).then((title) => {
  console.log(title)
})

// Destroying the pool:
pool.drain().then(() => pool.clear())

// For more API doc, see https://github.com/coopernurse/node-pool#generic-pool
```

## Security

When using puppeteer-pool, you should be aware that the puppeteer instance
you are getting might not be in a completely clean state. It could have
browser history, cookies or other persistent data from a previous use.

If that is an issue for you, make sure you clean up any sensitive data
on the puppeteer instance before returning it to the pool.
