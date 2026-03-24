import type { Camera, CameraGroup, SegmentResult, Entity, SavedSearch, Alert } from "./types";

export const mockCameraGroups: CameraGroup[] = [
  { id: "grp-1", name: "Main Entrance", cameraIds: ["cam-1", "cam-2"] },
  { id: "grp-2", name: "Parking Lot", cameraIds: ["cam-3", "cam-4"] },
  { id: "grp-3", name: "Building Interior", cameraIds: ["cam-5", "cam-6"] },
  { id: "grp-4", name: "Perimeter", cameraIds: ["cam-7", "cam-8"] },
];

export const mockCameras: Camera[] = [
  { id: "cam-1", name: "Front Gate - North", groupId: "grp-1", locationLabel: "Building A, North Entrance", status: "online", streamUrl: "" },
  { id: "cam-2", name: "Front Gate - South", groupId: "grp-1", locationLabel: "Building A, South Entrance", status: "online", streamUrl: "" },
  { id: "cam-3", name: "Parking A - Level 1", groupId: "grp-2", locationLabel: "Parking Structure A, Level 1", status: "online", streamUrl: "" },
  { id: "cam-4", name: "Parking A - Level 2", groupId: "grp-2", locationLabel: "Parking Structure A, Level 2", status: "offline", streamUrl: "" },
  { id: "cam-5", name: "Lobby Main", groupId: "grp-3", locationLabel: "Building A, Main Lobby", status: "online", streamUrl: "" },
  { id: "cam-6", name: "Corridor B2", groupId: "grp-3", locationLabel: "Building B, 2nd Floor Corridor", status: "online", streamUrl: "" },
  { id: "cam-7", name: "East Fence", groupId: "grp-4", locationLabel: "East Perimeter Fence", status: "maintenance", streamUrl: "" },
  { id: "cam-8", name: "West Gate", groupId: "grp-4", locationLabel: "West Perimeter Gate", status: "online", streamUrl: "" },
];

const generateSegments = (): SegmentResult[] => {
  const tags = [
    ["person", "red hat", "walking"],
    ["vehicle", "white", "SUV"],
    ["person", "backpack", "running"],
    ["vehicle", "sedan", "black"],
    ["person", "uniform", "standing"],
    ["person", "glasses", "entering"],
    ["vehicle", "truck", "blue"],
    ["person", "carrying package"],
  ];

  return Array.from({ length: 24 }, (_, i) => {
    const camIndex = i % mockCameras.length;
    const cam = mockCameras[camIndex];
    const tagSet = tags[i % tags.length];
    const isPerson = tagSet.includes("person");
    const baseTime = new Date("2026-02-12T08:00:00Z");
    baseTime.setMinutes(baseTime.getMinutes() + i * 17);

    return {
      id: `seg-${i + 1}`,
      cameraId: cam.id,
      cameraName: cam.name,
      startTime: baseTime.toISOString(),
      endTime: new Date(baseTime.getTime() + 30000).toISOString(),
      confidence: Math.round((0.65 + Math.random() * 0.34) * 100) / 100,
      thumbnailUrl: "",
      tags: tagSet,
      objects: [{
        type: isPerson ? "person" : "vehicle",
        bbox: [100 + i * 10, 80, 120, 200] as [number, number, number, number],
        colorHints: tagSet.filter(t => ["red", "white", "black", "blue"].includes(t)),
      }],
      entityCandidates: isPerson ? [{ entityId: `ent-${(i % 3) + 1}`, score: 0.7 + Math.random() * 0.28 }] : undefined,
    };
  });
};

export const mockSegments: SegmentResult[] = generateSegments();

export const mockEntities: Entity[] = [
  {
    id: "ent-1",
    type: "person",
    primaryThumbnailUrl: "",
    attributes: { clothing: "Red hat, dark jacket", height: "~5'10\"", build: "Medium" },
    sightings: [
      { cameraId: "cam-1", cameraName: "Front Gate - North", time: "2026-02-12T08:15:00Z", segmentId: "seg-1" },
      { cameraId: "cam-5", cameraName: "Lobby Main", time: "2026-02-12T08:32:00Z", segmentId: "seg-5" },
      { cameraId: "cam-6", cameraName: "Corridor B2", time: "2026-02-12T09:10:00Z", segmentId: "seg-9" },
    ],
  },
  {
    id: "ent-2",
    type: "vehicle",
    primaryThumbnailUrl: "",
    attributes: { make: "Toyota", model: "RAV4", color: "White", plate: "ABC-1234" },
    sightings: [
      { cameraId: "cam-3", cameraName: "Parking A - Level 1", time: "2026-02-12T07:45:00Z", segmentId: "seg-2" },
      { cameraId: "cam-8", cameraName: "West Gate", time: "2026-02-12T17:30:00Z", segmentId: "seg-8" },
    ],
  },
  {
    id: "ent-3",
    type: "person",
    primaryThumbnailUrl: "",
    attributes: { clothing: "Dark uniform", accessory: "Badge visible", build: "Athletic" },
    sightings: [
      { cameraId: "cam-5", cameraName: "Lobby Main", time: "2026-02-12T06:00:00Z", segmentId: "seg-3" },
      { cameraId: "cam-1", cameraName: "Front Gate - North", time: "2026-02-12T06:05:00Z", segmentId: "seg-7" },
    ],
  },
];

export const mockSavedSearches: SavedSearch[] = [
  { id: "ss-1", query: "man with red hat", filters: { objectType: "person", confidenceMin: 0.8 }, createdAt: "2026-02-11T10:00:00Z", resultCount: 7 },
  { id: "ss-2", query: "white SUV", filters: { objectType: "vehicle" }, createdAt: "2026-02-10T14:30:00Z", resultCount: 3 },
  { id: "ss-3", query: "person with backpack near entrance", filters: { cameraGroupId: "grp-1" }, createdAt: "2026-02-09T09:00:00Z", resultCount: 12 },
];

export const mockAlerts: Alert[] = [
  { id: "al-1", name: "Red Hat Person Alert", query: "person with red hat", cameras: ["cam-1", "cam-2"], timeWindow: "24/7", notificationChannel: "email", active: true, createdAt: "2026-02-10T08:00:00Z", lastTriggered: "2026-02-12T08:15:00Z" },
  { id: "al-2", name: "After Hours Vehicle", query: "vehicle", cameras: ["cam-3", "cam-4"], timeWindow: "22:00-06:00", notificationChannel: "sms", active: true, createdAt: "2026-02-08T12:00:00Z" },
  { id: "al-3", name: "Perimeter Breach", query: "person near fence", cameras: ["cam-7", "cam-8"], timeWindow: "24/7", notificationChannel: "webhook", active: false, createdAt: "2026-02-07T16:00:00Z" },
];
