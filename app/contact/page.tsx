import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Contact | Basekamp",
};

export default function Page() {
  return (
    <div>
      <h1>Contact</h1>
      <Image
        src="/questionnaire.jpg"
        alt="Portfolio Day installation and performance by Basekamp group, UArts 1999. Pictured David Dempewolf (left) and Scott Rigby (right)"
        width={600}
        height={450}
        className="float-right ml-4 mb-4 max-w-s"
      ></Image>
    </div>
  );
}
