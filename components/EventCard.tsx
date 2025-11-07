import Image from "next/image";
import Link from "next/link";
import { formatEventDateRange } from "@/lib/utils";

interface CardProps {
  title: string;
  images: [{ src: string; alt: string }];
  dateRange: { from: string; to: string }; // ISO strings
  // location: string;
  // attribution?: string;
  slug: string;
}

export default function EventCard({
  title,
  images,
  dateRange,
  slug,
}: // location,
// attribution,
CardProps) {
  const href = "/events/" + slug; // TODO: refine this
  const image = images && images.length > 0 ? images[0] : null;

  return (
    <div className="w-50">
      <div className="size-50 aspect-square">
        {image && (
          <Link href={href}>
            <Image
              src={`/${image.src}`}
              alt={image.alt}
              width={200}
              height={200}
              className="object-cover w-full h-full"
            />
          </Link>
        )}
      </div>
      <Link href={href}>{title}</Link>
      {dateRange && (
        <small className="block">{formatEventDateRange(dateRange)}</small>
      )}
      {/* {location && <small className="block">{location}</small>}
      {attribution && <small className="block">{attribution}</small>} */}
    </div>
  );
}
