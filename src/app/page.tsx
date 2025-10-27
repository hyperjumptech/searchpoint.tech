import { cookies } from "next/headers";

import Footer from "@/components/footer";
import Navbar from "@/components/nav";
import SearchBar from "@/components/search/searchbar";
import localData from "../../public/data.json";
import { config } from "@/config/env";
import { UserStoreInitializer } from "@/stores/UserStoreInitializer";

export const dynamic = "force-dynamic";

export async function getFiles() {
  try {
    const res = await fetch(`${config.backendBaseUrl}/v1/files`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const data = await getFiles();
  const { user } = localData;

  const cookieStore = await cookies();
  const scseId = cookieStore.get("SCSE_ID")?.value;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
        <p>Failed to load files data from server.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <UserStoreInitializer scseId={scseId} />
      <Navbar />
      <main className="flex-1 flex flex-col items-center px-6 pt-28 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#30302F] mb-5">
            Welcome, {user.name}!
          </h1>
          <p className="text-[#909090] font-normal max-w-xl leading-relaxed">
            Search across both public resources and your organization&apos;s
            private files with enterprise-grade security and role-based access
            control.
          </p>
        </div>

        <SearchBar />
      </main>
      <Footer />
    </div>
  );
}
