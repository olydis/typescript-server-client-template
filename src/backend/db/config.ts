import { spawn } from "child_process";
import { MongoClient, MongoClientOptions } from "mongodb";

export async function startServer(): Promise<void> {
  const server = spawn(JSON.stringify(__dirname + '/../../../start-mongo-server'), { shell: true, stdio: 'ignore' });
  server.unref();
}

interface MongodbConnectionInfo {
  connectionString: string;
  connectionOptions: MongoClientOptions;
}

interface MongodbConfig {
  connection: MongodbConnectionInfo;
  client: MongoClient;
}

function makeConfig(): MongodbConnectionInfo {
  const connectionString = `mongodb://127.0.0.1:27017`;
  const connectionOptions: MongoClientOptions = {
    socketTimeoutMS: 5000 * 10, // how long to keep connections (or remember primary as unreachable even if it no longer is!)
    connectTimeoutMS: 60000 * 10, // how long to try doing commands (so if primary is gone, writes timeout after that)
    serverSelectionTimeoutMS: 10000 * 10, // how long to try connecting to server initially
    useUnifiedTopology: true,
  };
  return {
    connectionString,
    connectionOptions,
  };
}

async function makeClient({ connectionString, connectionOptions }: MongodbConnectionInfo): Promise<MongoClient> {
  const client = new MongoClient(connectionString, connectionOptions);
  await client.connect();
  return client;
}

async function initConfig(): Promise<MongodbConfig> {
  const conn = makeConfig();

  console.group('MongoDB Initialization');
  console.log('Starting server');
  await startServer();
  
  console.log(`Connecting to server ...`);
  const client = await makeClient(conn);
  console.log(`Done`);

  console.groupEnd();
  const res = {
    connection: conn,
    client,
  };
  return res;
}

export const mongodbConfig = initConfig();