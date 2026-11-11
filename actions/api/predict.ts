"use server"

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
const REQUEST_TIMEOUT_MS = 30_000

export type TumorPrediction = {
  tumor: boolean
  type: string
  confidence: number
}

export type PredictionResult =
  | { ok: true; prediction: TumorPrediction; raw: unknown }
  | { ok: false; error: string }

function isTumorPrediction(value: unknown): value is TumorPrediction {
  if (typeof value !== "object" || value === null) return false

  const prediction = value as Record<string, unknown>
  return (
    typeof prediction.tumor === "boolean" &&
    typeof prediction.type === "string" &&
    prediction.type.length > 0 &&
    typeof prediction.confidence === "number" &&
    Number.isFinite(prediction.confidence) &&
    prediction.confidence >= 0 &&
    prediction.confidence <= 100
  )
}

export async function predictTumor(formData: FormData): Promise<PredictionResult> {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image before starting the analysis." }
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "Upload a PNG, JPG, or WEBP image." }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "This image is larger than the 20 MB limit." }
  }

  const serviceUrl = process.env.AI_SERVICE_URL
  if (!serviceUrl) {
    return { ok: false, error: "The AI service is not configured. Set AI_SERVICE_URL and try again." }
  }

  let endpoint: URL
  try {
    endpoint = new URL(`${serviceUrl.trim().replace(/\/+$/, "")}/predict`)
    if (endpoint.protocol !== "http:" && endpoint.protocol !== "https:") {
      return { ok: false, error: "The AI service configuration is invalid." }
    }
  } catch {
    return { ok: false, error: "The AI service configuration is invalid." }
  }

  const upstreamForm = new FormData()
  upstreamForm.append("file", file, file.name)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: upstreamForm,
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) {
      return { ok: false, error: "The AI service could not analyze this image. Please try again." }
    }

    let raw: unknown
    try {
      raw = await response.json()
    } catch {
      return { ok: false, error: "The AI service returned an unreadable response. Please try again." }
    }

    if (!isTumorPrediction(raw)) {
      return { ok: false, error: "The AI service returned an unexpected result. Please try again." }
    }

    return { ok: true, prediction: raw, raw }
  } catch {
    return {
      ok: false,
      error: controller.signal.aborted
        ? "The analysis took too long. Please try again."
        : "Unable to reach the AI service. Check that it is running and try again.",
    }
  } finally {
    clearTimeout(timeout)
  }
}
