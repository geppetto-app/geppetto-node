import { z } from "zod";

export interface ClientOptions {
  apiKey?: string;
  baseURL?: string;
}

export type GeppettoSpeakers =
  | "semaine"
  | "ryan"
  | "kim"
  | "spike"
  | "obadiah"
  | "poppy";
export type GeppettoSpeakFormats = "wav" | "mp3" | "pcm" | "ogg";

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

// TODO this should just be a type, not needed to be a schema.
export const SeeOptionsSchema = z.object({
  image: z.string().url().describe("base 64 encoded data uri"),
  prompt: z
    .string()
    .default("describe this image")
    .optional()
    .describe("the question to ask about the image"),
  system_prompt: z
    .string()
    .default("")
    .optional()
    .describe("what system prompt for the model to use"),
  stream: z
    .boolean()
    .default(false)
    .optional()
    .describe("if we should have a streaming response"),
  temperature: z
    .number()
    .default(0.2)
    .optional()
    .describe("the temperature of the model"),
  max_tokens: z
    .number()
    .default(-1)
    .optional()
    .describe("the maximum number of tokens to generate"),
  presence_penalty: z.number().default(0).optional(),
  frequency_penalty: z.number().default(0).optional(),
  top_p: z
    .number()
    .default(1)
    .optional()
    .describe("the cumulative probability of tokens to generate"),
  verbose: z
    .boolean()
    .default(false)
    .optional()
    .describe("if the response should give more verbose information"),
});

export const SeeResponseSchema = z.object({
  content: z.string().describe("the generated content"),
});

const TimingsSchema = z.object({
  predicted_ms: z.number(),
  predicted_n: z.number(),
  predicted_per_second: z.number(),
  prompt_ms: z.number(),
});

export const SeeResponseVerboseSchema = SeeResponseSchema.extend({
  content: z.string(),
  model: z.string(),
  timings: TimingsSchema,
  tokens_cached: z.number(),
  tokens_evaluated: z.number(),
  tokens_predicted: z.number(),
});

export const SeeStreamingResponseSchema = z.object({
  content: z.string(),
  stop: z.boolean(),
});

export type SeeOptions = z.infer<typeof SeeOptionsSchema>;
export type SeeResponse = z.infer<typeof SeeResponseSchema>;
export type SeeResponseVerbose = z.infer<typeof SeeResponseVerboseSchema>;
export type SeeStreamingResponse = z.infer<typeof SeeStreamingResponseSchema>;

export class Geppetto {
  apiKey: string;
  baseURL: string;

  constructor({
    apiKey = process.env.GEPPETTO_API_KEY,
    baseURL = "https://api.geppetto.app",
  }: ClientOptions = {}) {
    if (!apiKey) {
      throw new Error("API Key is required");
    }

    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async _request(
    endpoint: string,
    data: any,
    responseType: "raw"
  ): Promise<Response>;

  async _request(
    endpoint: string,
    data: any,
    responseType: "json"
  ): Promise<any>;

  async _request(
    endpoint: string,
    data: any,
    responseType: "streamIterator"
  ): Promise<AsyncGenerator<Uint8Array>>;

  async _request(
    endpoint: string,
    data: any,
    responseType: "raw" | "json" | "streamIterator"
  ) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method: "POST",
      headers: {
        "User-Agent": `geppetto-nodejs`,
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      if (!response.body) throw new Error("Response body is empty");

      if (responseType === "json") return await response.json();

      if (responseType === "streamIterator") {
        const reader = response.body.getReader();

        const asyncIterator = async function* () {
          try {
            while (true) {
              // Read from the stream
              const { done, value } = await reader.read();
              // Exit if we're done
              if (done) return;
              // Else yield the chunk
              yield value;
            }
          } finally {
            reader.releaseLock();
          }
        };

        return asyncIterator();
      }

      return response;
    } catch (e) {
      console.error(`Request failed: ${e}`);
      throw e;
    }
  }

  public async speak(
    opts: SpeakOptions & { stream: true }
  ): Promise<ReadableStream<Uint8Array>>;
  public async speak(opts: SpeakOptions & { stream?: false }): Promise<Buffer>;

  public async speak(
    params: SpeakOptions
  ): Promise<Buffer | ReadableStream<Uint8Array>> {
    const { stream, ...opts } = params;
    const response = await this._request(`/speak`, opts, "raw");

    // in _request we have validated that body is not null
    if (stream) return response.body!;

    return Buffer.from(await response.arrayBuffer());
  }

  private async *seeStream(
    params: SeeOptions & { stream: true }
  ): AsyncGenerator<SeeStreamingResponse> {
    const response = await this._request(`/see`, params, "streamIterator");

    let buffer = "";
    const decoder = new TextDecoder();

    for await (const chunk of response) {
      buffer += decoder.decode(chunk, { stream: true });
      let firstNewline;

      while ((firstNewline = buffer.indexOf("\n")) !== -1) {
        const chunkLine = buffer.substring(0, firstNewline);
        buffer = buffer.substring(firstNewline + 1);

        if (chunkLine.startsWith("data:")) {
          const json = JSON.parse(chunkLine.substring(6).trim());
          const parsed = SeeStreamingResponseSchema.parse(json);
          yield parsed;
        }
      }
    }
  }

  public see(
    params: SeeOptions & { stream: true }
  ): Promise<AsyncGenerator<SeeStreamingResponse>>;
  public see(params: SeeOptions & { stream?: false }): Promise<SeeResponse>;
  public see(
    params: SeeOptions & { stream?: false; verbose: true }
  ): Promise<SeeResponseVerbose>;

  public async see(
    params: SeeOptions
  ): Promise<
    SeeResponse | SeeResponseVerbose | AsyncGenerator<SeeStreamingResponse>
  > {
    if (params.stream) {
      return this.seeStream({ ...params, stream: true });
    }
    const response = await this._request(`/see`, params, "json");

    if (params.verbose) {
      return SeeResponseVerboseSchema.parse(response);
    }
    return SeeResponseSchema.parse(response);
  }
}
