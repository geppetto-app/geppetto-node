# geppetto

[![NPM version](https://img.shields.io/npm/v/@geppetto-app/geppetto.svg)](https://www.npmjs.com/package/@geppetto-app/geppetto)

This library is a simple wrapper of the [geppetto.app](https://geppetto.app) API.

Currently it only supports speaking (text to speech) but more modalities will be added in the future.

## Installation

```sh
npm install @geppetto-app/geppetto
```

## Usage

* [Speak](#speak)
    * [Examples](#speech-examples)
    * [Params](#speech-params)
* [See](#see)
    * [Examples](#see-examples)
    * [Params](#see-params)
    * [Return Types](#see-return-types)


## Speak

There are two primary ways to use the library for speech. Sync and Streaming. 
Sync will return the entire audio file as a buffer, while streaming will return a readable stream of the audio file. 
Streaming is useful in applications where you want the lowest possible latency from generation to speaking time.

### Speech Examples

**Writing to a file**

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

**Streaming Speech**

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

### Speech Params

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

## See

See let's you send an image to the geppetto API and get back a description of the image. 
It can also answer questions about images.

The responses can be streamed.

### See Examples

**Getting a description of an image**

```typescript
const geppetto = new Geppetto();

const response = await geppetto.see({
    image: "<base64 encoded image>",
});

console.log(response);
```

**Getting a description with details about generation**

```typescript
const geppetto = new Geppetto();

const response = await geppetto.see({
    image: "<base64 encoded image>",
verbose: true
});

console.log(response);
```

**Streaming response**

```typescript
const geppetto = new Geppetto();

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
```

### See Params

```typescript
type SeeOptions = {
    // REQUIRED: the base64 encoded image. 
    image: string;

    // the question to ask about the image (default is 'describe this image')
    prompt?: string | undefined;

    // the system prompt to use (default is "")
    system_prompt?: string | undefined;

    // if the response should be streamed or sync
    stream?: boolean | undefined;

    // the temperature of the models generation
    temperature?: number | undefined;

    // the maximum number of tokens to generate
    max_tokens?: number | undefined;

    presence_penalty?: number | undefined;

    frequency_penalty?: number | undefined;

    // the cumulative probability of tokens to generate
    top_p?: number | undefined;

    // if the response should give more verbose information
    verbose?: boolean | undefined;
}
```

### See Return Types

**Default**
```typescript
type SeeResponse = {
    // the generated content
    content: string;
}
```

**Verbose**

```typescript
type SeeResponseVerbose = {
    // the generated content
    content: string;

    // the model used to generate the content
    model: string;

    // timings about the generation
    timings: {
        // how long it took to generate the content
        predicted_ms: number;

        // how many tokens were predicted
        predicted_n: number;

        // how many tokens were predicted per second
        predicted_per_second: number;

        // how long it took to process the prompt
        prompt_ms: number;
    };
    // how many tokens were cached
    tokens_cached: number;

    // how many tokens were evaluated
    tokens_evaluated: number;

    // how many tokens were predicted
    tokens_predicted: number;
}
```

**Streaming**
```typescript
type SeeStreamingResponse = {
    // the generated content
    content: string;

    // if the generation is complete
    stop: boolean;
}
```