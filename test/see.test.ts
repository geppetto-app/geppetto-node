import { expect, test } from "bun:test";
import { Geppetto } from "../src";

const geppetto = new Geppetto();
const IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAARZSURBVHgB7dy/al51HMfx7yMdxE71ClJwVdpJp7ZDl6zxAnTxFjp26NjBwSsIOBvHDClIujk1tJMgVME/dEoEhWyPffQCmuGEkOf9esE5F3DgvPn9ls9qZtYDJL03QJYAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQJgAQNiN2UKfPFlP2cvHq7kUPz+ZxT36fubgxSxq787M071Z3EePZ9s4AUCYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAECYAEDYVo6CXobTF/vzz+vjWdLN2w/m1t0vJu3zuzOf7cyifjubeXQwvJsAXNDfvxzP6cn+LGmzXZwPwKc7b187s6jNyvA3Pwzv5goAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYTYBL+jmzv1ZrWdRH9x+MHk/vp75/WwWtRkF3bszizs4mW0jABf04d0v/3tY2Hcn/494Lmnz8z/dm8VtYQBcASBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBs9fZZeOsWuC6cACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACBMACDsxmyh88N7U/b+7vO5DOuHh1O2erY728YJAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMIEAMK2chSU62P/j6M5Pns1XA0B4Eodn76a/T+PhqvhCgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhAgBhNgEv6PnLv+bXN+fDsu7f+nhmNdfCZsB022w+/Xq2zPnhvVnaV1//NN8evZmy9cPDKVs9251t4woAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYQIAYVs5CgpcjBMAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhAkAhP0LO0BTiv6Z0YsAAAAASUVORK5CYII=";

test("see streaming", async () => {
  const stream = await geppetto.see({
    image: IMAGE,
    stream: true,
  });

  let message = "";
  for await (const chunk of stream) {
    console.log(chunk);
    message += chunk.content;
  }

  console.log(message);
  expect(message.length).toBeGreaterThan(0);
});

test("see sync", async () => {
  const response = await geppetto.see({
    image: IMAGE,
  });

  expect(response).toBeDefined();
  expect(response.content).toBeDefined();
  expect(response.content?.length).toBeGreaterThan(0);

  console.log("plain response\n", response);
});

test("see sync verbose", async () => {
  const response = await geppetto.see({
    image: IMAGE,
    verbose: true,
  });

  expect(response).toBeDefined();
  expect(response.content).toBeDefined();
  expect(response.content?.length).toBeGreaterThan(0);

  console.log("verbose response\n", response);
});
