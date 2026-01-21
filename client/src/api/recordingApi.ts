import { api } from "./authApi";

export type RecordingUploadResponse = {
  id: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  fileUrl: string; // /api/recordings/{id}/file
};

export async function uploadRecording(file: File, durationSec?: number): Promise<RecordingUploadResponse> {
  const form = new FormData();
  form.append("file", file);
  if (durationSec !== undefined) {
    form.append("duration", durationSec.toString());
  }

  const { data } = await api.post<RecordingUploadResponse>("/api/recordings", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}