import { capitalize } from "@/lib/utils";

type ResultInfoBarProps = {
  total: number;
  type: string;
};

export default function ResultInfoBar({ total, type }: ResultInfoBarProps) {
  return (
    <div className="bg-[#EFF6FF] shadow-xs px-4 py-2 rounded-xl text-xs space-y-3 text-[#3593EA]">
      <div className="flex flex-row items-center gap-4">
        <p>
          Search results:{" "}
          <b className="text-[#2e7bc3] font-extrabold">
            {total.toLocaleString("id-ID")} documents
          </b>
        </p>
        <div className="rounded-full w-2 h-2 bg-[#3593EA]" />
        <p>
          Showing:{" "}
          <b className="text-[#2e7bc3] font-extrabold">{capitalize(type)}</b>
        </p>
      </div>
      <p>
        <i>
          Your activities including search queries are logged for audit purposes
        </i>
      </p>
    </div>
  );
}
