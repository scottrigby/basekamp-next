"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC, Fragment } from "react";

const Breadcrumbs: FC = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((segment) => segment);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center space-x-2 text-sm"
    >
      <Link href="/" className="hover:underline">
        Home
      </Link>
      {pathSegments.map((segment, index) => {
        const href = "/" + pathSegments.slice(0, index + 1).join("/");
        const isLast = index === pathSegments.length - 1;
        const label = segment
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return (
          <Fragment key={href}>
            <span aria-hidden="true">/</span>
            {isLast ? (
              <span className="text-gray-500">{label}</span>
            ) : (
              <Link href={href} className="hover:underline">
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
