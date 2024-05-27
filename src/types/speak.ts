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
