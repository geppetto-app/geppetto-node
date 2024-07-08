import { z } from "zod";

const HEAR_SIZE_LIMIT = 25 * 1024 * 1024; // 25MB

const fileSchema = z
  .union([
    z.instanceof(Buffer),
    typeof File !== "undefined"
      ? z
          .instanceof(File)
          .refine((f) => f.size <= HEAR_SIZE_LIMIT, {
            message: "Max file size is 25MB",
          })
          .refine((f) => f.type.startsWith("audio/"), {
            message: "File must be an audio file",
          })
      : z.never(),
  ])
  .optional();

export const HearRequestSchema = z.object({
  file: fileSchema,
  model: z.enum(["whisper-tiny"]).default("whisper-tiny").optional(),
  language: z.string().optional(),
  prompt: z.string().optional(),
  response_format: z
    .enum(["json", "text", "srt", "verbose_json", "vtt"])
    .default("json")
    .optional(),
  temperature: z.number().default(0).optional(),
  temperature_inc: z.number().default(0.2).optional(),
});

export const HearResponseSchema = z.object({
  text: z.string(),
});

const HearResponseWordSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  t_dtw: z.number(),
  probability: z.number(),
});

const HearResponseSegmenntSchema = z.object({
  id: z.number(),
  text: z.string(),
  start: z.number(),
  end: z.number(),
  tokens: z.array(z.number()),
  words: z.array(HearResponseWordSchema),
  temperature: z.number(),
  avg_logprob: z.number(),
});

export const HearResponseVerboseSchema = z.object({
  task: z.enum(["transcribe", "translate"]),
  language: z.string(),
  duration: z.number(),
  text: z.string(),
  segments: z.array(HearResponseSegmenntSchema),
});

export type HearOptions = z.infer<typeof HearRequestSchema>;

export type HearResponse = z.infer<typeof HearResponseSchema>;
export type HearResponseVerbose = z.infer<typeof HearResponseVerboseSchema>;
