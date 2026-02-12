import HomePage from "./page.client";

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  await params;
  return <HomePage />;
}
