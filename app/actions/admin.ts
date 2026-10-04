"use server";

import { revalidatePath } from "next/cache";
import { messageStatusSchema, settingsSchema } from "@/lib/validation/content";
import { changePasswordSchema } from "@/lib/validation/auth";
import {
  dbError,
  err,
  fieldErrors,
  ok,
  revalidateFor,
  withOwner,
} from "@/lib/admin/crud";
import type { ActionResult } from "@/lib/types/action";
import type { Json } from "@/lib/types/database";

/** Messages, Settings, password and media (API.md 4.7, 4.8, 4.9). */

/* ----------------------------------------------------------------- messages */

export async function updateMessageStatus(
  id: string,
  status: string,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const parsed = messageStatusSchema.safeParse(status);
    if (!parsed.success) return err("VALIDATION", "Unknown status.");

    const { error } = await supabase
      .from("messages")
      .update({ status: parsed.data })
      .eq("id", id);

    if (error) return dbError(error);
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
    return ok(null);
  });
}

export async function deleteMessage(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) return dbError(error);
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
    return ok(null);
  });
}

/* ----------------------------------------------------------------- settings */

export async function updateSettings(
  formData: FormData,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const raw = Object.fromEntries(formData.entries());

    /* Socials and trust stats arrive as JSON strings from their repeatable
       sub-forms, so they are parsed before Zod sees them. */
    let socials: unknown = {};
    let trustStats: unknown = [];

    try {
      const rawSocials = formData.get("socials");
      if (typeof rawSocials === "string" && rawSocials.trim()) {
        socials = JSON.parse(rawSocials);
      }
      const rawStats = formData.get("trust_stats");
      if (typeof rawStats === "string" && rawStats.trim()) {
        trustStats = JSON.parse(rawStats);
      }
    } catch {
      return err("VALIDATION", "Those settings could not be read.");
    }

    const parsed = settingsSchema.safeParse({
      ...raw,
      socials,
      trust_stats: trustStats,
    });

    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const { error } = await supabase
      .from("settings")
      .update({
        ...parsed.data,
        /* The columns are `jsonb not null`, so the generated type excludes
           null. Zod defaults both to {} and [], so neither can be null here. */
        socials: parsed.data.socials as NonNullable<Json>,
        trust_stats: parsed.data.trust_stats as NonNullable<Json>,
      })
      .eq("id", true);

    if (error) return dbError(error);

    /* Settings feed the header, footer and FAB on every public page, so the
       whole public surface is rebuilt. */
    revalidateFor("settings", ["/admin/settings"]);
    return ok(null);
  });
}

/* ----------------------------------------------------------------- password */

export async function changePassword(
  formData: FormData,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const parsed = changePasswordSchema.safeParse({
      password: formData.get("password") ?? "",
      confirm: formData.get("confirm") ?? "",
    });

    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    /* Supabase applies this to the currently authenticated user, so there is
       no user id to pass and no way for this to target someone else. */
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      console.warn("changePassword failed", { reason: error.message });
      return err("SERVER_ERROR", "That password could not be set.");
    }

    return ok(null);
  });
}

/* -------------------------------------------------------------------- media */

/** What each bucket will accept (API.md 4.9). */
const MEDIA_RULES = {
  "public-media": {
    maxBytes: 5 * 1024 * 1024,
    mime: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/avif",
      "image/svg+xml",
    ],
  },
  "private-media": {
    maxBytes: 10 * 1024 * 1024,
    mime: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/avif",
      "application/pdf",
    ],
  },
} as const;

type Bucket = keyof typeof MEDIA_RULES;

export async function uploadMedia(
  formData: FormData,
): Promise<ActionResult<{ path: string }>> {
  return withOwner(async ({ supabase }) => {
    const file = formData.get("file");
    const bucket = String(formData.get("bucket") ?? "public-media") as Bucket;

    if (!(file instanceof File) || file.size === 0) {
      return err("VALIDATION", "Choose a file to upload.", {
        file: "No file selected.",
      });
    }

    const rules = MEDIA_RULES[bucket];
    if (!rules) return err("VALIDATION", "Unknown destination.");

    /* Type and size are checked here as well as on the bucket. The bucket's
       limits are the real boundary — a client could call the Storage API
       directly — but failing here gives a usable message instead of a raw
       storage error (security.md 4). */
    if (!(rules.mime as readonly string[]).includes(file.type)) {
      return err(
        "VALIDATION",
        `That file type (${file.type}) is not allowed.`,
        {
          file: "Unsupported file type.",
        },
      );
    }

    if (file.size > rules.maxBytes) {
      const mb = Math.round(rules.maxBytes / (1024 * 1024));
      return err("VALIDATION", `Files must be under ${mb}MB.`, {
        file: `Too large — the limit is ${mb}MB.`,
      });
    }

    /* Generated name, never the uploaded one. A user-supplied filename can
       collide, can carry a misleading double extension, and can contain path
       separators (security.md 4). The extension is derived from the MIME
       type we already validated, not from the name. */
    const ext = file.type.split("/")[1]?.replace("+xml", "") ?? "bin";
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      console.error("uploadMedia failed", error);
      return err("SERVER_ERROR", "That file could not be uploaded.");
    }

    revalidatePath("/admin/media");
    return ok({ path });
  });
}

/** Short-lived signed URL for a private file (API.md 4.9, security.md 8). */
export async function getSignedMediaUrl(
  path: string,
): Promise<ActionResult<{ url: string }>> {
  return withOwner(async ({ supabase }) => {
    /* 60 seconds: long enough to open, short enough that a leaked URL is
       worthless almost immediately. */
    const { data, error } = await supabase.storage
      .from("private-media")
      .createSignedUrl(path, 60);

    if (error || !data) {
      return err("NOT_FOUND", "That file could not be found.");
    }

    return ok({ url: data.signedUrl });
  });
}
