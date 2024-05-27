import { SpeakOptions } from "./types/speak.js";
import {
  SeeOptions,
  SeeResponse,
  SeeResponseSchema,
  SeeResponseVerbose,
  SeeResponseVerboseSchema,
  SeeStreamingResponse,
  SeeStreamingResponseSchema,
} from "./types/see.js";
import {
  HearOptions,
  HearResponse,
  HearResponseSchema,
  HearResponseVerbose,
  HearResponseVerboseSchema,
} from "./types/hear.js";
import { fileTypeFromBuffer } from "file-type";

export interface ClientOptions {
  apiKey?: string;
  baseURL?: string;
}

type RequestOptions = {
  body?: any;
  headers?: any;
};

const getJsonOptions = (data: any): RequestOptions => ({
  body: JSON.stringify(data),
  headers: {
    "Content-Type": "application/json",
  },
});

const getMultipartOptions = async (data: any): Promise<RequestOptions> => {
  const form = new FormData();

  // TODO handle if key is a File, Blob, or Buffer

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "number") {
      form.append(key, value.toString());
    } else if (value instanceof Buffer) {
      const type = await fileTypeFromBuffer(value);
      if (!type) throw new Error("Could not determine file type");
      const filename = `${key}.${type.ext}`;
      const blob = new Blob([value], { type: type.mime });
      form.append(key, blob, filename);
    } else {
      form.append(key, value);
    }
  }

  return {
    body: form,
  };
};

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
    opts: RequestOptions,
    responseType: "raw"
  ): Promise<Response>;

  async _request(
    endpoint: string,
    opts: RequestOptions,
    responseType: "json"
  ): Promise<any>;

  async _request(
    endpoint: string,
    opts: RequestOptions,
    responseType: "text"
  ): Promise<string>;

  async _request(
    endpoint: string,
    opts: RequestOptions,
    responseType: "streamIterator"
  ): Promise<AsyncGenerator<Uint8Array>>;

  async _request(
    endpoint: string,
    opts: RequestOptions,
    responseType: "raw" | "json" | "streamIterator" | "text"
  ) {
    const url = `${this.baseURL}${endpoint}`;

    const options = {
      method: "POST",
      headers: {
        "User-Agent": `geppetto-nodejs`,
        Authorization: `Bearer ${this.apiKey}`,
        ...opts.headers,
      },
      body: opts.body,
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      if (!response.body) throw new Error("Response body is empty");

      if (responseType === "json") return await response.json();

      if (responseType === "text") return await response.text();

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
    const response = await this._request(`/speak`, getJsonOptions(opts), "raw");

    // in _request we have validated that body is not null
    if (stream) return response.body!;

    return Buffer.from(await response.arrayBuffer());
  }

  private async *seeStream(
    params: SeeOptions & { stream: true }
  ): AsyncGenerator<SeeStreamingResponse> {
    const response = await this._request(
      `/see`,
      getJsonOptions(params),
      "streamIterator"
    );

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
    const response = await this._request(
      `/see`,
      getJsonOptions(params),
      "json"
    );

    if (params.verbose) {
      return SeeResponseVerboseSchema.parse(response);
    }
    return SeeResponseSchema.parse(response);
  }

  public hear(
    params: HearOptions & { response_format: "verbose_json" }
  ): Promise<HearResponseVerbose>;
  public hear(
    params: HearOptions & { response_format: "text" }
  ): Promise<string>;
  public hear(
    params: HearOptions & { response_format: "srt" }
  ): Promise<string>;
  public hear(
    params: HearOptions & { response_format: "vtt" }
  ): Promise<string>;
  public hear(params: HearOptions): Promise<HearResponse>;

  public async hear(
    params: HearOptions
  ): Promise<HearResponse | HearResponseVerbose | string> {
    if (!params.response_format) params.response_format = "json";

    if (
      params.response_format === "verbose_json" ||
      params.response_format === "json"
    ) {
      const response = await this._request(
        `/hear`,
        await getMultipartOptions(params),
        "json"
      );
      if (params.response_format === "verbose_json") {
        return HearResponseVerboseSchema.parse(response);
      } else if (params.response_format === "json") {
        return HearResponseSchema.parse(response);
      }
    }

    const response = await this._request(
      `/hear`,
      await getMultipartOptions(params),
      "text"
    );

    return response;
  }
}
