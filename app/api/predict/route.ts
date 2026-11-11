import { NextResponse } from "next/server"

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
const REQUEST_TIMEOUT_MS = 30_000

type TumorPrediction = {
  tumor: boolean
  type: string
  confidence: number
}

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

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse("Send a multipart form with an image file.", 400)
  }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return errorResponse("Choose an image before starting the analysis.", 400)
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return errorResponse("Upload a PNG, JPG, or WEBP image.", 415)
  }
  if (file.size > MAX_FILE_SIZE) {
    return errorResponse("This image is larger than the 20 MB limit.", 413)
  }

  const serviceUrl = process.env.AI_SERVICE_URL
  if (!serviceUrl) {
    return errorResponse("The AI service is not configured. Set AI_SERVICE_URL and try again.", 503)
  }

  let endpoint: URL
  try {
    endpoint = new URL(`${serviceUrl.trim().replace(/\/+$/, "")}/predict`)
    if (endpoint.protocol !== "http:" && endpoint.protocol !== "https:") {
      return errorResponse("The AI service configuration is invalid.", 500)
    }
  } catch {
    return errorResponse("The AI service configuration is invalid.", 500)
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
      return errorResponse("The AI service could not analyze this image. Please try again.", 502)
    }

    let prediction: unknown
    try {
      prediction = await response.json()
    } catch {
      return errorResponse("The AI service returned an unreadable response. Please try again.", 502)
    }

    if (!isTumorPrediction(prediction)) {
      return errorResponse("The AI service returned an unexpected result. Please try again.", 502)
    }

    return NextResponse.json(prediction, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return errorResponse(
      controller.signal.aborted
        ? "The analysis took too long. Please try again."
        : "Unable to reach the AI service. Check that it is running and try again.",
      controller.signal.aborted ? 504 : 502,
    )
  } finally {
    clearTimeout(timeout)
  }
}
