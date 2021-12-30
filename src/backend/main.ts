import * as express from 'express';
import * as path from 'path';
import { quoteGet, quoteSet } from '../shared/api-paths';
import { getQuote, setQuote } from './quote';
import * as db from "./db";

//Server
export async function runServer() {
  await db.init();

  const app = express();
  app.use('/', express.static(path.join(__dirname, '..')));
  app.use(express.json({ limit: '16mb' }));
  app.use((req, res, next) => {
    console.log(`${req.method}\t${req.url}`); // log all requests to console
    next();
  });

  app.listen(3333);
  app.get('/', async (req, res) => res.redirect("/frontend/"));

  // API calls from client to server
  app.post(quoteGet, async function (req, res) {
    const date = new Date(req.body.date);
    try {
      const quote = await getQuote(date);
      res.json(quote);
    } catch (e) {
      res.status(500).send(`Internal server error: ${e}`);
    }
  });
  app.post(quoteSet, async function (req, res) {
    const quote = req.body;
    try {
      await setQuote({ ...quote, date: new Date(quote.date) });
      res.json(true);
    } catch (e) {
      res.status(500).send(`Internal server error: ${e}`);
    }
  });
}

if (require.main === module) runServer();
