import { z } from "zod";

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
