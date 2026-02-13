import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { dirname } from "path";

async function test() {
  const stream = createWriteStream("test.log");
  await new Promise<void>((resolve) => stream.once('drain', resolve));
}
