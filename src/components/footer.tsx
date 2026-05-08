export default function Footer() {
  return (
    <footer className="flex md:flex-row flex-col items-center justify-between w-full h-[64px] border-t border-[#E3E3E3] px-4 md:py-4 py-2 bg-white">
      <div className="text-sm text-[#30302F]">
        Copyright © {new Date().getFullYear()} Sinar Mas. All Right Reserved.
      </div>

      <div className="max-w-7xl flex justify-end gap-3 text-xs text-[#30302F]">
        <a href="#" className="hover:text-gray-700">
          Privacy Policy
        </a>
        <a href="#" className="hover:text-gray-700">
          Need Help?
        </a>
      </div>
    </footer>
  );
}
