import { z } from "zod";

const photoFrameSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zoom: z.number().min(1).max(3),
});

const devicePhotoFramesSchema = z.object({
  primary: photoFrameSchema.optional(),
  additional: z.record(z.string(), photoFrameSchema).optional(),
});

const ownedDeviceInputSchemaBase = z.object({
  deviceModelId: z.string().optional(),
  newDeviceModelName: z.string().optional(),
  familyId: z.string().optional(),
  shellId: z.string().optional().nullable(),
  newShellName: z.string().optional(),
  nickname: z.string().optional().nullable(),
  primaryPhoto: z.string().optional().nullable(),
  additionalPhotos: z.array(z.string()).optional(),
  photoFrames: devicePhotoFramesSchema.optional().nullable(),
  conditionBadge: z.enum(["NONE", "NIB", "IOB"]).optional(),
  conditionNotes: z.string().optional().nullable(),
  showMoreInfo: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().optional().nullable(),
  estimatedValue: z.number().optional().nullable(),
  purchaseCurrency: z.string().optional(),
  purchasedFrom: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  workingStatus: z.enum(["WORKING", "NOT_WORKING", "UNTESTED", "FOR_PARTS"]).optional(),
  currentlyRunning: z.boolean().optional(),
  favorite: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export const ownedDeviceInputSchema = ownedDeviceInputSchemaBase;

/** POST /api/collection — same fields as PATCH with a default condition badge. */
export const createOwnedDeviceInputSchema = ownedDeviceInputSchemaBase.extend({
  conditionBadge: z.enum(["NONE", "NIB", "IOB"]).default("NONE"),
});

export type OwnedDeviceInput = z.infer<typeof ownedDeviceInputSchema>;

export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
