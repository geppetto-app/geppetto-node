import { test, expect } from "bun:test";
import fs from "fs";
import { Geppetto } from "../src";

const geppetto = new Geppetto();

test("hear with bunfile", async () => {
  const file = Bun.file("./test/assets/realboy.mp3");
  const response = await geppetto.hear({
    file: file,
    response_format: "json",
  });

  expect(response.text).toBeDefined();
  expect(response.text.length).toBeGreaterThan(0);
});

test("hear with File", async () => {
  const bunfile = Bun.file("./test/assets/realboy.mp3");
  const file = new File([bunfile], "realboy.mp3");

  const response = await geppetto.hear({
    file: file,
  });

  expect(response.text).toBeDefined();
  expect(response.text.length).toBeGreaterThan(0);
});

test("verbose hear with File", async () => {
  const bunfile = Bun.file("./test/assets/realboy.mp3");
  const file = new File([bunfile], "realboy.mp3");

  const response = await geppetto.hear({
    file: file,
    response_format: "verbose_json",
  });

  expect(response.text).toBeDefined();
  expect(response.text.length).toBeGreaterThan(0);
  expect(response.text).toEqual(" I'm a real boy.\n");
  expect(response.duration).toBeDefined();
});

test("hear with buffer", async () => {
  const file = fs.readFileSync("test/assets/realboy.mp3");
  const response = await geppetto.hear({
    file: file,
    response_format: "json",
  });

  expect(response.text).toBeDefined();
  expect(response.text.length).toBeGreaterThan(0);
  expect(response.text).toEqual(" I'm a real boy.\n");
});

test("hear with srt", async () => {
  const file = fs.readFileSync("test/assets/realboy.mp3");
  const response = await geppetto.hear({
    file: file,
    response_format: "srt",
  });

  expect(response).toBeDefined();
  expect(response.length).toBeGreaterThan(0);
  expect(response).toEqual(
    "1\n00:00:00,000 --> 00:00:01,200\n I'm a real boy.\n\n"
  );
});

test("hear with vtt", async () => {
  const file = fs.readFileSync("test/assets/realboy.mp3");
  const response = await geppetto.hear({
    file: file,
    response_format: "vtt",
  });

  expect(response).toBeDefined();
  expect(response.length).toBeGreaterThan(0);
  expect(response).toEqual(
    "WEBVTT\n\n00:00:00.000 --> 00:00:01.200\n I'm a real boy.\n\n"
  );
});
