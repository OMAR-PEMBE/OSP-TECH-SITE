import { PageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";

export const metadata = { title: "New post" };

export default function NewPostPage() {
  return (
    <>
      <PageHeader
        title="New post"
        description="It stays a draft until you publish it."
      />
      <PostForm />
    </>
  );
}
