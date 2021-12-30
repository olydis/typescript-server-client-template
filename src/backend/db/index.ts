import { MongoClient } from 'mongodb';
import { mongodbConfig } from './config';

export async function init() {
  await mongodbConfig;
}

export async function getClient(): Promise<MongoClient> {
  const { client } = await mongodbConfig;
  return client;
}
