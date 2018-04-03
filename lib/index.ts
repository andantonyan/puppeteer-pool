import { Browser, launch } from 'puppeteer';
import { createPool, Options } from 'generic-pool';

export interface IBrowser extends Browser {
  useCount?: number;
}

export interface IOptions extends Options {
  maxUses?: number;
  puppeteerArgs?: Object[];
  validator?: () => Promise<Browser>;
}

const puppeteerPool = (
  {
    max = 10,
    min = 2,
    idleTimeoutMillis = 30000,
    maxUses = 50,
    testOnBorrow = true,
    puppeteerArgs = [],
    validator = (instance) => Promise.resolve(instance),
    ...otherConfig
  } = <IOptions>{}) => {
  const factory = {
    create: () => launch(...puppeteerArgs)
      .then((instance: IBrowser) => {
        instance['useCount'] = 0;
        return instance;
      }),
    destroy: instance => instance.close(),
    validate: instance => validator(instance)
      .then(valid => Promise.resolve(valid && (maxUses <= 0 || instance.useCount < maxUses)))
  };
  const config = {
    max,
    min,
    idleTimeoutMillis,
    testOnBorrow,
    ...otherConfig
  };

  let pool;
  try {
    pool = createPool<IBrowser>(factory, config);
  } catch (e) {
    throw e;
  }

  const genericAcquire = pool.acquire.bind(pool);

  pool.acquire = () => genericAcquire().then((respource) => {
    respource['useCount'] += 1;
    return respource;
  });

  pool.use = (fn) => {
    let resource;
    return pool.acquire()
      .then(r => {
        resource = r;
        return resource;
      })
      .then(fn)
      .then((result) => {
        pool.release(resource);
        return result;
      }, (err) => {
        pool.release(resource);
        throw err;
      });
  };

  return pool;
};

export default puppeteerPool;

