# geppetto

[![NPM version](https://img.shields.io/npm/v/@geppetto-app/geppetto.svg)](https://www.npmjs.com/package/@geppetto-app/geppetto)

This library is a simple wrapper of the [geppetto.app](https://geppetto.app) API.

Currently it only supports speaking (text to speech) but more modalities will be added in the future.

## Installation

```sh
npm install @geppetto-app/geppetto
```

## Usage

There are two primary ways

### Sync

```typescript
import { Geppetto } from '@geppetto-app/geppetto';

const geppetto = new Geppetto();

async function main() {
    const response = await geppetto.speak({
        text: "I'm a real boy!"
    })
    .catch((err) => {
        throw err;
    });

    fs.writeFileSync('output.mp3', response);
}

main()
```

### Streaming

```typescript
import { Geppetto } from '@geppetto-app/geppetto';

const geppetto = new Geppetto();

async function main() {
    const response = await geppetto.speak({
        text: "I'm a real boy!",
        stream: true
    })
    .catch((err) => {
        throw err;
    });

    const chunks = []
    for await (const chunk of response) {
        // do something with the chunks, this example is just adding them to a file
        chunks.push(chunk);
    }

    fs.writeFileSync('output.mp3', Buffer.concat(chunks));
}

main()
```

## Params

```typescript
export interface SpeakOptions {
  // the text to speak
  text: string;

  // the voice to speak in (default is semaine)
  voice?: GeppettoSpeakers; // "semaine" | "ryan"

  // the rate of speech (default is 1)
  speed?: number;

  // the pitch of speech (default is 1)
  pitch?: number; 

  // the audio format to output in (default is mp3)
  // pcm is output in 16000hz 16bit signed little endian (s16le)
  format?: GeppettoSpeakFormats; // "mp3" | "wav" | "ogg" | "pcm"

  // how much to delay speech between punctuation (default is 150)
  sentenceSilence?: number;

  // if the response should be streamed or sync
  stream?: boolean;
}
```