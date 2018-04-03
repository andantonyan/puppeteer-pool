/* tslint:disable */
import { launch } from 'puppeteer';
import { createServer, Server } from 'http';

import puppeteerPool from './index';

const startServer = (): Promise<Server> => new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    res.end('test');
  }).listen((err) => {
    if (err) {
      return reject(err);
    }
    resolve(server);
  });
});

const pool = puppeteerPool();

const noPool = async (url): Promise<void> => {
  const instance = await launch();
  const page = await instance.newPage();
  await page.goto(url);
  await page.close();
  await instance.close();
};

const withPool = (url) => pool.use(async (instance): Promise<void> => {
  const page = await instance.newPage();
  await page.goto(url);
  await page.close();
});

const benchmark = async (iters) => {
  const server = await startServer();
  const url = `http://localhost:${server.address().port}`;

  console.log('Starting benchmark without pool');
  for (let i = 0; i < iters; i++) {
    console.time(`noPool-${i}`);
    await noPool(`${url}/${i}`);
    console.timeEnd(`noPool-${i}`);
  }

  console.log('');

  console.log('Starting benchmark with pool');
  for (let i = 0; i < iters; i++) {
    console.time(`pool-${i}`);
    await withPool(`${url}/${i}`);
    console.timeEnd(`pool-${i}`);
  }

  console.log('\nDone');
};

benchmark(10).then(() => {
  process.exit(0);
}).catch(console.error);
