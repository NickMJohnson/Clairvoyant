export interface Camera {
  id: string;
  name: string;
  groupId: string;
  locationLabel: string;
  status: "online" | "offline" | "maintenance";
  streamUrl: string;
}

export interface CameraGroup {
  id: string;
  name: string;
  cameraIds: string[];
  cameras: Camera[];
}

export interface DetectedObject {
  type: "person" | "vehicle";
  bbox: [number, number, number, number]; // [x, y, w, h]
  colorHints?: string[];
  detectionId?: string;
  relevanceScore?: number; // 0–1, how closely this bbox matches the search query
}

export interface EntityCandidate {
  entityId: string;
  score: number;
}

export interface SegmentResult {
  id: string;
  cameraId: string;
  cameraName: string;
  startTime: string;
  endTime: string;
  confidence: number;
  thumbnailUrl: string;
  videoUrl: string;
  tags: string[];
  objects: DetectedObject[];
  entityCandidates?: EntityCandidate[];
}

export interface Sighting {
  cameraId: string;
  cameraName: string;
  time: string;
  segmentId: string;
}

export interface Entity {
  id: string;
  type: "person" | "vehicle";
  primaryThumbnailUrl: string;
  attributes: Record<string, string>;
  sightings: Sighting[];
}

export interface SavedSearch {
  id: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
  resultCount: number;
}

export interface Alert {
  id: string;
  name: string;
  query: string;
  cameras: string[];
  timeWindow: string;
  notificationChannel: string;
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
}

export interface SearchFilters {
  query?: string;
  objectType?: "person" | "vehicle" | "all";
  cameraIds?: string[];
  cameraGroupId?: string;
  confidenceMin?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: "time" | "confidence";
  sortOrder?: "asc" | "desc";
  limit?: number;
}
