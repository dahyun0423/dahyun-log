import HomeDashboard from "@/components/HomeDashboard";
import { getLessons } from "@/lib/lessons";

export default async function Home() {
  const lessons = await getLessons();
  return <HomeDashboard lessons={lessons} />;
}
