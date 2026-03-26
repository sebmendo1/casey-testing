import Link from "next/link";
import { notFound } from "next/navigation";
import { extractListingImageUrls, type PropertyListing } from "@/lib/propertyListing";
import { getListingByZpid, zillowRowToPropertyListing } from "@/lib/zillowListings";

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function formatAddress(listing: PropertyListing): string {
  return (
    listing.formattedAddress ??
    [listing.addressLine1, listing.city, listing.state, listing.zipCode]
      .filter(Boolean)
      .join(", ")
  );
}

function mapHref(listing: PropertyListing): string | null {
  if (listing.latitude != null && listing.longitude != null) {
    return `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`;
  }
  const addr = formatAddress(listing);
  if (addr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }
  return null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw).trim();
  if (!id) notFound();

  const row = getListingByZpid(id);
  if (!row) notFound();

  const listing = zillowRowToPropertyListing(row);
  const photos = extractListingImageUrls(listing);
  const address = formatAddress(listing);
  const mapUrl = mapHref(listing);
  const zillowUrl = typeof listing.listingUrl === "string" ? listing.listingUrl : null;

  const specs: { label: string; value: string }[] = [];
  if (listing.bedrooms != null) specs.push({ label: "Bedrooms", value: String(listing.bedrooms) });
  if (listing.bathrooms != null) specs.push({ label: "Bathrooms", value: String(listing.bathrooms) });
  if (listing.squareFootage != null) {
    specs.push({ label: "Living area", value: `${listing.squareFootage.toLocaleString()} sq ft` });
  }
  if (listing.lotSize != null) {
    specs.push({ label: "Lot size", value: `${listing.lotSize.toLocaleString()} sq ft` });
  }
  if (listing.yearBuilt != null) specs.push({ label: "Year built", value: String(listing.yearBuilt) });
  if (listing.propertyType) specs.push({ label: "Property type", value: listing.propertyType });
  if (listing.daysOnMarket != null) {
    specs.push({ label: "Days on market", value: String(listing.daysOnMarket) });
  }
  if (listing.mlsNumber) specs.push({ label: "MLS #", value: listing.mlsNumber });
  if (listing.hoa?.fee != null) {
    specs.push({ label: "HOA (monthly)", value: formatUsd(listing.hoa.fee) });
  }
  if (listing.price != null) specs.push({ label: "List price", value: formatUsd(listing.price) });

  return (
    <div className="min-h-screen bg-[#f6f8fb] pb-16 pt-6">
      <div className="mx-auto max-w-3xl px-4">
        <BackLink />

        <div className="mt-4 overflow-hidden rounded-[1.6rem] bg-white shadow-[0_6px_18px_rgba(0,40,85,0.07)]">
          <div className="aspect-[16/10] w-full bg-[linear-gradient(160deg,#002855_0%,#00285599_45%,#00285514_100%)]">
            {photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[0]}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          {photos.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-[#00285514] p-3">
              {photos.slice(1, 9).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-20 w-28 shrink-0 rounded-lg object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="space-y-2 p-6">
            <h1 className="text-[32px] font-semibold leading-tight text-[#002855]">
              {listing.price != null ? formatUsd(listing.price) : "Price not listed"}
            </h1>
            <p className="text-[18px] text-[#002855]">{address || "Address not available"}</p>
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[15px] font-semibold text-[#0052cc]"
              >
                Open in Google Maps →
              </a>
            ) : null}
            {zillowUrl ? (
              <a
                href={zillowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 inline-block text-[15px] font-semibold text-[#0052cc]"
              >
                View on Zillow →
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-8 rounded-[1.6rem] bg-white p-6 shadow-[0_6px_18px_rgba(0,40,85,0.07)]">
          <h2 className="text-[20px] font-semibold text-[#002855]">Details</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {specs.map((row) => (
              <div key={row.label}>
                <dt className="text-[13px] font-medium uppercase tracking-wide text-[#00285599]">
                  {row.label}
                </dt>
                <dd className="mt-1 text-[16px] text-[#002855]">{row.value}</dd>
              </div>
            ))}
          </dl>

          {listing.listingAgent?.name || listing.listingOffice?.name ? (
            <div className="mt-8 border-t border-[#00285514] pt-6">
              <h3 className="text-[16px] font-semibold text-[#002855]">Listing</h3>
              {listing.listingOffice?.name ? (
                <p className="mt-2 text-[15px] text-[#002855]">{listing.listingOffice.name}</p>
              ) : null}
              {listing.listingAgent?.name ? (
                <p className="text-[15px] text-[#002855b3]">{listing.listingAgent.name}</p>
              ) : null}
              {listing.listingAgent?.phone ? (
                <p className="text-[15px] text-[#002855b3]">{listing.listingAgent.phone}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex text-[15px] font-semibold text-[#0052cc] hover:underline"
    >
      ← Back to chat
    </Link>
  );
}
