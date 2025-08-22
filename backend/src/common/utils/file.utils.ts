import { extname } from "path"
import { v4 as uuidv4 } from "uuid"

export const generateFileName = (originalName: string): string => {
  const extension = extname(originalName)
  const name = uuidv4()
  return `${name}${extension}`
}

export const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  if (mimeType.includes("pdf")) return "document"
  if (mimeType.includes("word") || mimeType.includes("document")) return "document"
  if (mimeType.includes("text")) return "text"
  return "other"
}

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith("image/")
}

export const isVideoFile = (mimeType: string): boolean => {
  return mimeType.startsWith("video/")
}

export const isAudioFile = (mimeType: string): boolean => {
  return mimeType.startsWith("audio/")
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export const validateFileType = (mimeType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimeType)
}

export const sanitizeFileName = (fileName: string): string => {
  // Remove special characters and spaces
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
}
