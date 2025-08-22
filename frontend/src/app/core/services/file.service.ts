import { Injectable } from "@angular/core"
import type { HttpClient } from "@angular/common/http"
import type { Observable } from "rxjs"

export interface FileUploadResult {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
}

@Injectable({
  providedIn: "root",
})
export class FileService {
  private readonly API_URL = "http://localhost:3000/api"

  constructor(private http: HttpClient) {}

  uploadFiles(files: FileList): Observable<FileUploadResult[]> {
    const formData = new FormData()

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i])
    }

    return this.http.post<FileUploadResult[]>(`${this.API_URL}/files/upload`, formData)
  }

  uploadSingleFile(file: File): Observable<FileUploadResult> {
    const formData = new FormData()
    formData.append("file", file)

    return this.http.post<FileUploadResult>(`${this.API_URL}/files/upload/single`, formData)
  }

  uploadEmoji(file: File): Observable<FileUploadResult> {
    const formData = new FormData()
    formData.append("emoji", file)

    return this.http.post<FileUploadResult>(`${this.API_URL}/files/upload/emoji`, formData)
  }

  uploadSticker(file: File): Observable<FileUploadResult> {
    const formData = new FormData()
    formData.append("sticker", file)

    return this.http.post<FileUploadResult>(`${this.API_URL}/files/upload/sticker`, formData)
  }

  deleteFile(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/files/${id}`)
  }

  getFile(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/files/${id}`)
  }
}
