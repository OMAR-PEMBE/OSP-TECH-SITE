import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";
import { getPost } from "@/lib/db/admin";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  return (
    <>
      <PageHeader title={post.title} description="Edit this post." />
      <PostForm post={post} />
    </>
  );
}
