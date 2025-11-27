/**
 * @file image-client.ts
 * @description Thin wrapper around Google Gemini image generation HTTP API.
 */

import { performance } from "node:perf_hooks";

export interface GeminiImageRequest {
  prompt: string;
  negativePrompt?: string;
  imageCount?: number;
  size?: "512x512" | "1024x1024" | "2048x2048";
  aspectRatio?: string;
}

export interface GeminiImageData {
  mimeType: string;
  base64Data: string;
}

export interface GeminiImageResponse {
  images: GeminiImageData[];
  latencyMs: number;
  raw: unknown;
}

const DEFAULT_MODEL = "gemini-1.5-flash";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function generateGeminiImage(request: GeminiImageRequest): Promise<GeminiImageResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please add it to your environment before generating images.");
  }

  const url = `${BASE_URL}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
  const body = buildPayload(request);
  const started = performance.now();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const latencyMs = performance.now() - started;
  const data = await safeJson(response);

  if (!response.ok) {
    const message = (data as { error?: { message?: string } })?.error?.message;
    throw new Error(`[GeminiImageClient] Request failed (${response.status}): ${message ?? response.statusText}`);
  }

  const images = extractImagesFromResponse(data);

  return {
    images,
    latencyMs,
    raw: data
  };
}

function buildPayload(request: GeminiImageRequest) {
  const parts = [{ text: request.prompt }];
  if (request.negativePrompt) {
    parts.push({ text: `Negative prompt: ${request.negativePrompt}` });
  }

  return {
    contents: [
      {
        role: "user",
        parts
      }
    ],
    generationConfig: {
      temperature: 0.3,
      candidateCount: request.imageCount ?? 1,
      responseMimeType: "image/png",
      ...(request.size ? { size: request.size } : {}),
      ...(request.aspectRatio ? { aspectRatio: request.aspectRatio } : {})
    }
  };
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function extractImagesFromResponse(data: unknown): GeminiImageData[] {
  const result: GeminiImageData[] = [];
  const candidates = (data as Record<string, unknown>)?.["candidates"];
  if (!Array.isArray(candidates)) {
    return result;
  }

  candidates.forEach(candidate => {
    const content = (candidate as Record<string, unknown>)?.["content"] as Record<string, unknown> | undefined;
    const parts = content?.["parts"];
    if (!Array.isArray(parts)) return;

    parts.forEach(part => {
      const inline = (part as Record<string, unknown>)?.["inlineData"] as Record<string, unknown> | undefined;
      if (!inline || typeof inline.data !== "string") return;
      result.push({
        mimeType: (inline.mimeType as string) ?? "image/png",
        base64Data: inline.data
      });
    });
  });

  return result;
}

