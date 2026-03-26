export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-10">
      <div className="mx-auto max-w-3xl animate-pulse space-y-4">
        <div className="h-5 w-32 rounded bg-[#0028551a]" />
        <div className="h-56 rounded-[1.6rem] bg-[#0028551a]" />
        <div className="h-40 rounded-[1.6rem] bg-white shadow-[0_6px_18px_rgba(0,40,85,0.07)]" />
      </div>
    </div>
  );
}
