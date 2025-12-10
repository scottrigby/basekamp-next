import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface CardProps {
  title: string;
  date: string;
  slug: string;
  location: string;
  attribution?: string;
  images: [{ src: string; alt: string }];
}

export default function Card({
  title,
  date,
  slug,
  location,
  attribution,
  images,
}: CardProps) {
  const href = "/projects/" + slug; // TODO: refine this
  const formattedDate = formatDate(date);
  const image = images[0];

  return (
    <div>
      <div className="aspect-square">
        <Link href={href}>
          <Image
            src={`/${image.src}`}
            alt={image.alt}
            width={200}
            height={200}
            className="object-cover w-full h-full"
          />
        </Link>
      </div>
      <Link href={href}>{title}</Link>
      {date && <small className="block">{formattedDate}</small>}
      {location && <small className="block">{location}</small>}
      {attribution && <small className="block">{attribution}</small>}
    </div>
  );
}
