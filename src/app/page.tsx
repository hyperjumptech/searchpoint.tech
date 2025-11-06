import Hero from "@/components/hero";
import SearchBar from "@/components/searchbar";

export default async function HomePage() {
  return (
    <main className="mx-auto flex flex-col max-w-7xl py-20 px-6">
      <Hero />
      <div className="mt-8 flex justify-center">
        <SearchBar autoFocus={true} className="max-w-4xl" />
      </div>
    </main>
  );
}
