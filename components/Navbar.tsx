"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import classNames from "classnames";

const routes = [
  { href: "/", name: "Home" },
  { href: "/about", name: "About" },
  { href: "/events", name: "Events" },
  { href: "/projects", name: "Projects" },
  { href: "/contact", name: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <nav className="bg-orange-400 text-white">
        <ul className="flex p-2 pb-0">
          {routes.map(({ href, name }) => {
            // only highlight home when directly on homepage
            // because every route starts with "/"
            let isActive = false;
            if (href === "/") {
              isActive = pathname === href;
            } else {
              isActive = pathname.startsWith(href);
            }

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={classNames(
                    "block p-2 pb-3 no-underline hover:bg-white hover:text-gray-700",
                    { "text-white": !isActive },
                    { "bg-white text-gray-700": isActive }
                  )}
                >
                  {name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex flex-row-reverse">
        <Image
          loading="eager"
          src="/logo-orange.png"
          alt="Basekamp"
          width={350}
          height={85}
        />
      </div>
    </>
  );
}
