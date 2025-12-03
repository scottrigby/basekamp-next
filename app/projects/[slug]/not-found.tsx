import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404: Project Not Found | Basekamp",
};

export default function NotFound() {
  return (
    <div>
      <h1>404: Not Found</h1>
      <p>This project could not be found.</p>
      <p>
        <Link href="/projects">See all Projects</Link>
      </p>
    </div>
  );
}
