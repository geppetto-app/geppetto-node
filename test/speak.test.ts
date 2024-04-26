import { Geppetto } from "../src/index";
import { test, expect } from "bun:test";

const geppetto = new Geppetto();

const OUTPUT_DIR = "./test/output";
const TEST_TEXT =
  "Short first sentence. This is a longer second sentence here to see how streaming works. I hope you are having a reall nice day. I hope you are a good apple today. Do you like apples? Apples are my favorite fruit";

test("speak streaming", async () => {
  const t0 = Date.now();
  const stream = await geppetto
    .speak({
      text: TEST_TEXT,
      stream: true,
    })
    .catch((err) => {
      throw err;
    });
  console.log("Time to stream:", Date.now() - t0);

  const chunks: Uint8Array[] = [];
  // @ts-ignore
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  Bun.write(`${OUTPUT_DIR}/stream.mp3`, Buffer.concat(chunks));

  // TODO validate with whisper
});

test("speak sync", async () => {
  const t0 = Date.now();
  const buf = await geppetto
    .speak({
      text: TEST_TEXT,
    })
    .catch((err) => {
      throw err;
    });
  console.log("Time to sync:", Date.now() - t0);

  Bun.write(`${OUTPUT_DIR}/sync.mp3`, buf);

  // TODO validate with whisper
});
