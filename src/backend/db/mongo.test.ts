import { suite, test } from '@testdeck/mocha';
import * as assert from 'assert';
import { Collection, Db } from 'mongodb';
import { getClient } from '../db';

const date1 = new Date(2020, 1, 1);
const date2 = new Date(2021, 1, 1);
const isin1 = 'US45256BAD36';
const isin2 = 'US45256BAD37';

const testDb = 'test';
const testCollection = 'test';

async function reset(): Promise<{ db: Db, coll: Collection<any> }> {
  const client = await getClient();
  const db = client.db(testDb);
  await db.dropDatabase();
  const coll = await db.createCollection(testCollection);
  return { db, coll };
}

@suite
class Mongodb {
  @test
  async startup() {
    const client = await getClient();
    assert.ok(client.isConnected());
  }

  @test
  async basics() {
    const { coll } = await reset();

    // insert
    assert.strictEqual(await coll.countDocuments(), 0);
    await coll.insertOne({ hello: 1, world: 2 });
    assert.strictEqual(await coll.countDocuments(), 1);
    assert.strictEqual((await coll.findOne({ hello: 1 })).world, 2);
    assert.strictEqual((await coll.find({ hello: 1 }).toArray()).length, 1);
  }

  @test
  async validation() {
    const { coll, db } = await reset();

    // add validator
    await db.command({
      collMod: testCollection,
      validator: {
        $jsonSchema: {
          required: ["isin"],
          properties: {
            isin: {
              type: "string",
              pattern: "([A-Z]{2})([A-Z0-9]{9})([0-9]{1})",
              description: "do descriptions matter? probably not"
            },
            any: {},
            number1: {
              type: "number"
            },
            number2: {
              bsonType: "double"
            },
            number3: {
              bsonType: "decimal"
            },
          }
        },
      },
      validationLevel: 'strict',
      validationAction: 'error',
    });

    // ISIN
    // - none
    await assert.rejects(() => coll.insertOne({}));
    // - bad
    await assert.rejects(() => coll.insertOne({ isin: 'abc' }));
    // - good
    await coll.insertOne({ isin: isin1 });

    // otherwise bad format
    await assert.rejects(() => coll.insertOne({ isin: isin1, number1: 'no number' }));
    await assert.rejects(() => coll.insertOne({ isin: isin1, number2: 'no number' }));
    await assert.rejects(() => coll.insertOne({ isin: isin1, number3: 'no number' }));
    await coll.insertOne({ isin: isin1, any: 'no number' }); // reference

    // numbers => some number types reject NaN
    await coll.insertOne({ isin: isin1, number1: NaN });
    await coll.insertOne({ isin: isin1, number2: NaN });
    await assert.rejects(() => coll.insertOne({ isin: isin1, number3: NaN }));
    await coll.insertOne({ isin: isin1, any: NaN }); // reference
  }

  @test
  async uniqueIndex() {
    const { coll } = await reset();
    await coll.createIndex({ isin: 1, date: 1 }, { unique: true });

    // no duplicates
    await coll.insertOne({ isin: isin1, date: date1 });
    await coll.insertOne({ isin: isin1, date: date2 });
    await coll.insertOne({ isin: isin2, date: date1 });
    await coll.insertOne({ isin: isin2, date: date2 });

    // duplicates
    await assert.rejects(() => coll.insertOne({ isin: isin1, date: date1 }));
    await assert.rejects(() => coll.insertOne({ isin: isin1, date: date2 }));
    await assert.rejects(() => coll.insertOne({ isin: isin2, date: date1 }));
    await assert.rejects(() => coll.insertOne({ isin: isin2, date: date2 }));

    // impact on inserts without these fields: it's as if value was null/undefined
    await coll.insertOne({ isin: isin1 });
    await assert.rejects(() => coll.insertOne({ isin: isin1 }));
    await assert.rejects(() => coll.insertOne({ isin: isin1, date: null }));
    await assert.rejects(() => coll.insertOne({ isin: isin1, date: undefined }));
  }

  @test
  async upsert() {
    const { coll } = await reset();
    await coll.createIndex({ isin: 1, date: 1 }, { unique: true });

    const key = (entry: any) => ({ isin: entry.isin, date: entry.date });
    const insertOrUpdate = async (entry: any): Promise<void> => {
      await coll.replaceOne(key(entry), entry, { upsert: true });
    }

    // Effectively an insertion
    await insertOrUpdate({ isin: isin1, date: date1, extraInfo: 1 });
    await insertOrUpdate({ isin: isin1, date: date2, extraInfo: 2 });

    // All as expected?
    assert.strictEqual((await coll.findOne({ isin: isin1, date: date1 })).extraInfo, 1);
    assert.strictEqual((await coll.findOne({ isin: isin1, date: date2 })).extraInfo, 2);

    // Effectively an update
    await insertOrUpdate({ isin: isin1, date: date1, extraInfo: 3 });
    await insertOrUpdate({ isin: isin1, date: date2, extraInfo: 4 });

    // All as expected?
    assert.strictEqual((await coll.findOne({ isin: isin1, date: date1 })).extraInfo, 3);
    assert.strictEqual((await coll.findOne({ isin: isin1, date: date2 })).extraInfo, 4);
  }
}