"use server";

import { revalidatePath } from "next/cache";
import {
  portfolioSchema,
  postSchema,
  productSchema,
  serviceSchema,
} from "@/lib/validation/content";
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

/**
 * Content mutations for Services, Products, Portfolio and Posts
 * (API.md 4.1, 4.2).
 *
 * Every one goes through `withOwner`, so the session and role are checked
 * server-side before anything is touched, and every one revalidates the
 * public routes it affects so the site reflects the change within the
 * revalidation window rather than at the next deploy (agents.md 4).
 */

/** FormData → plain object, with checkboxes normalised to booleans. */
function toObject(formData: FormData): Record<string, unknown> {
  const raw = Object.fromEntries(formData.entries());
  return {
    ...raw,
    /* An unchecked checkbox is simply absent from FormData, which Zod would
       read as "use the default" (true) rather than false. */
    visible:
      formData.get("visible") === "on" || formData.get("visible") === "true",
  };
}

/* ----------------------------------------------------------------- services */

export async function saveService(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withOwner(async ({ supabase }) => {
    const parsed = serviceSchema.safeParse(toObject(formData));
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const query = id
      ? supabase.from("services").update(parsed.data).eq("id", id).select("id")
      : supabase.from("services").insert(parsed.data).select("id");

    const { data, error } = await query.maybeSingle();
    if (error) return dbError(error);
    if (!data) return err("NOT_FOUND", "That service no longer exists.");

    revalidateFor("services", ["/admin/services"]);
    return ok({ id: data.id });
  });
}

export async function deleteService(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return dbError(error);
    revalidateFor("services", ["/admin/services"]);
    return ok(null);
  });
}

export async function toggleServiceVisible(
  id: string,
  visible: boolean,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase
      .from("services")
      .update({ visible })
      .eq("id", id);
    if (error) return dbError(error);
    revalidateFor("services", ["/admin/services"]);
    return ok(null);
  });
}

/* ----------------------------------------------------------------- products */

export async function saveProduct(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withOwner(async ({ supabase }) => {
    const parsed = productSchema.safeParse(toObject(formData));
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const query = id
      ? supabase.from("products").update(parsed.data).eq("id", id).select("id")
      : supabase.from("products").insert(parsed.data).select("id");

    const { data, error } = await query.maybeSingle();
    if (error) return dbError(error);
    if (!data) return err("NOT_FOUND", "That product no longer exists.");

    revalidateFor("products", ["/admin/products"]);
    revalidatePath(`/products/${parsed.data.slug}`);
    return ok({ id: data.id });
  });
}

export async function deleteProduct(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return dbError(error);
    revalidateFor("products", ["/admin/products"]);
    return ok(null);
  });
}

export async function toggleProductVisible(
  id: string,
  visible: boolean,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase
      .from("products")
      .update({ visible })
      .eq("id", id);
    if (error) return dbError(error);
    revalidateFor("products", ["/admin/products"]);
    return ok(null);
  });
}

/* ---------------------------------------------------------------- portfolio */

export async function savePortfolioItem(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withOwner(async ({ supabase }) => {
    const parsed = portfolioSchema.safeParse(toObject(formData));
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    const query = id
      ? supabase
          .from("portfolio_items")
          .update(parsed.data)
          .eq("id", id)
          .select("id")
      : supabase.from("portfolio_items").insert(parsed.data).select("id");

    const { data, error } = await query.maybeSingle();
    if (error) return dbError(error);
    if (!data) return err("NOT_FOUND", "That project no longer exists.");

    revalidateFor("portfolio_items", ["/admin/portfolio"]);
    revalidatePath(`/portfolio/${parsed.data.slug}`);
    return ok({ id: data.id });
  });
}

export async function deletePortfolioItem(
  id: string,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", id);
    if (error) return dbError(error);
    revalidateFor("portfolio_items", ["/admin/portfolio"]);
    return ok(null);
  });
}

export async function togglePortfolioVisible(
  id: string,
  visible: boolean,
): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase
      .from("portfolio_items")
      .update({ visible })
      .eq("id", id);
    if (error) return dbError(error);
    revalidateFor("portfolio_items", ["/admin/portfolio"]);
    return ok(null);
  });
}

/* -------------------------------------------------------------------- posts */

export async function savePost(
  id: string | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return withOwner(async ({ supabase, userId }) => {
    const raw = Object.fromEntries(formData.entries());

    /* The editor posts the Tiptap document as a JSON string. */
    let body: unknown = null;
    const rawBody = formData.get("body");
    if (typeof rawBody === "string" && rawBody.trim()) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return err("VALIDATION", "The post content could not be read.", {
          body: "Invalid content.",
        });
      }
    }

    const parsed = postSchema.safeParse({ ...raw, body });
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Please check the highlighted fields.",
        fieldErrors(parsed.error),
      );
    }

    /* Status and published_at are never taken from the form. Publishing is
       its own action with its own audit point; letting a hidden input set
       `status` would make "publish" a thing any form post could do. */
    const values = {
      ...parsed.data,
      /* The Tiptap document is an open-ended object, which is exactly what a
         jsonb column holds, but its Zod-inferred type is not structurally a
         `Json`. It has just been parsed from JSON, so it is JSON-serialisable
         by construction; this narrows it for the client's column types. */
      body: parsed.data.body as Json | null,
      author_id: userId,
    };

    const query = id
      ? supabase.from("posts").update(values).eq("id", id).select("id")
      : supabase.from("posts").insert(values).select("id");

    const { data, error } = await query.maybeSingle();
    if (error) return dbError(error);
    if (!data) return err("NOT_FOUND", "That post no longer exists.");

    revalidateFor("posts", ["/admin/posts"]);
    revalidatePath(`/blog/${parsed.data.slug}`);
    return ok({ id: data.id });
  });
}

export async function publishPost(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    /* `published_at` is only set the first time, so re-publishing an
       unpublished post keeps its original date rather than jumping it to the
       top of the blog as though it were new. */
    const { data: existing } = await supabase
      .from("posts")
      .select("slug, published_at")
      .eq("id", id)
      .maybeSingle();

    if (!existing) return err("NOT_FOUND", "That post no longer exists.");

    const { error } = await supabase
      .from("posts")
      .update({
        status: "published",
        published_at: existing.published_at ?? new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return dbError(error);

    revalidateFor("posts", ["/admin/posts"]);
    revalidatePath(`/blog/${existing.slug}`);
    return ok(null);
  });
}

export async function unpublishPost(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { data: existing } = await supabase
      .from("posts")
      .select("slug")
      .eq("id", id)
      .maybeSingle();

    if (!existing) return err("NOT_FOUND", "That post no longer exists.");

    /* published_at is kept. The check constraint only requires it when the
       status is 'published', and keeping it preserves the original date for
       when the post goes back up. */
    const { error } = await supabase
      .from("posts")
      .update({ status: "draft" })
      .eq("id", id);

    if (error) return dbError(error);

    revalidateFor("posts", ["/admin/posts"]);
    revalidatePath(`/blog/${existing.slug}`);
    return ok(null);
  });
}

export async function deletePost(id: string): Promise<ActionResult<null>> {
  return withOwner(async ({ supabase }) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return dbError(error);
    revalidateFor("posts", ["/admin/posts"]);
    return ok(null);
  });
}
