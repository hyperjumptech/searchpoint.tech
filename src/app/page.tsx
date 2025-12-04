import Hero from "@/components/hero";
import SearchBar from "@/components/searchbar";

export default async function HomePage() {
  return (
    <main className="mx-auto flex flex-col items-center justify-center max-w-7xl min-h-[calc(100vh-16rem)] px-6">
      <Hero />
      <div className="mt-8 flex justify-center w-full">
        <SearchBar autoFocus={true} className="max-w-4xl" />
      </div>
    </main>
  );
}
