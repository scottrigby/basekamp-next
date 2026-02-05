import Link from "next/link";
import Image from "next/image";

const cc = ["cc", "by", "nc", "sa"];

export default function Footer() {
  return (
    <>
      <footer className="p-4 pt-8 pb-8 bg-gray-200">
        <p className="mb-0">
          This site is licensed under{" "}
          <Link className="text-gray-700" href={"https://creativecommons.org/licenses/by-nc-sa/4.0/"}>
            CC BY-NC-SA 4.0
          </Link>
          {cc.map((name) => (
            <Image
              key={name}
              src={`https://mirrors.creativecommons.org/presskit/icons/${name}.svg`}
              alt=""
              width={18}
              height={18}
              className="inline ml-1"
            />
          ))}
        </p>
      </footer>
    </>
  );
}
