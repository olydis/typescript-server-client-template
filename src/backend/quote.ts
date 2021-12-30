import { getClient } from "./db";
import { Quote } from "../shared/quote";
import { Collection } from "mongodb";

let first = true;
async function collection(): Promise<Collection<Quote>> {
  const coll: Collection<Quote> = (await getClient()).db('public').collection('Quotes');
  if (first) {
    first = false;
    coll.createIndex({ date: 1 }, { unique: true });
  }
  return coll;
}

export async function getQuote(endDate: Date): Promise<Quote> {
  const coll = await collection();
  const data = (await coll.find({ date: { $lte: endDate } }).sort({ date: -1 }).limit(1).toArray());
  return data[0];
}

export async function setQuote(quote: Quote): Promise<void> {
  const coll = await collection();
  const key = (entry: Quote) => ({ date: entry.date });
  await coll.replaceOne(key(quote), quote, { upsert: true });
}
