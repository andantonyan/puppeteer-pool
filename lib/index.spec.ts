import puppeteerPool, { IBrowser } from './index';
import { Pool } from 'generic-pool';

const getState = ({size, available, pending, max, min}) => {
  return {size, available, pending, max, min};
};

const inUse = ({size, available}) => size - available;

describe('PuppeteerPool', () => {
  let pool: Pool<IBrowser>;

  beforeAll(async () => {
    pool = await puppeteerPool();
  });

  describe('initialize', () => {
    it('Should acquire new instance', async () => {
      const instance = await pool.acquire();
      const page = await instance.newPage();
      const viewportSize = await page.viewport();
      expect(viewportSize.width).toBe(800);
      expect(viewportSize.height).toBe(600);
      await pool.release(instance);
    });
  });

  describe('availability', () => {
    let instances;
    let firstInstance;
    let otherInstances;

    beforeAll(async () => {
      instances = await Promise.all([
        pool.acquire(),
        pool.acquire(),
        pool.acquire(),
        pool.acquire(),
      ]);
      [firstInstance, ...otherInstances] = instances;
    });

    it('pool should have 0 available instances', async () => {
      expect(getState(pool)).toEqual({
        available: 0,
        pending: 0,
        max: 10,
        min: 2,
        size: 4
      });
    });

    it('pool should have 1 available instances', async () => {
      await pool.release(firstInstance);
      expect(getState(pool)).toEqual({
        available: 1,
        pending: 0,
        max: 10,
        min: 2,
        size: 4
      });
    });

    it('pool should have 4 available instances', async () => {
      await Promise.all(otherInstances.map(instance => pool.release(instance)));
      expect(getState(pool)).toEqual({
        available: 4,
        pending: 0,
        max: 10,
        min: 2,
        size: 4
      });
    });

  });

});
