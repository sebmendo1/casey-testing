import Link from "next/link";

export default function ListingNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-[24px] font-semibold text-[#002855]">Listing not found</h1>
      <p className="mt-2 text-[15px] text-[#00285599]">
        This listing may have been removed or the link is invalid.
      </p>
      <Link href="/" className="mt-6 inline-block text-[15px] font-semibold text-[#0052cc]">
        ← Back to chat
      </Link>
    </div>
  );
}
