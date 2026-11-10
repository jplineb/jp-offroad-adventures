import { redirect } from "next/navigation";

type StoryRedirectProps = {
  params: Promise<{ slug: string }>;
};

export default async function StoryRedirect({ params }: StoryRedirectProps) {
  const { slug } = await params;
  redirect(`/adventures/${slug}`);
}
