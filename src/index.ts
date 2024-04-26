export interface ClientOptions {
  apiKey?: string;
  baseURL?: string;
}

export type GeppettoSpeakers = "semaine" | "ryan";
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
  public async speak(
    opts: SpeakOptions & { stream: true }
  ): Promise<ReadableStream<Uint8Array>>;
  public async speak(opts: SpeakOptions & { stream?: false }): Promise<Buffer>;

  public async speak(
    params: SpeakOptions
  ): Promise<Buffer | ReadableStream<Uint8Array>> {
    const { stream, ...opts } = params;
    const response = await fetch(`${this.baseURL}/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(opts),
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Error ${r.status}: ${r.statusText}`);
        }
        return r;
      })
      .catch((err) => {
        throw err;
      });

    if (!response.body) throw new Error("Response body is empty");
    if (stream) return response.body!;

    return Buffer.from(await response.arrayBuffer());
  }
}
