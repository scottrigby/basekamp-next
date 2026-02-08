import { Metadata } from "next";
import Image from "next/image";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Basekamp",
};

export default function Page() {
  return (
    <>
      <h1>Contact</h1>
      <div className="sm:grid sm:grid-cols-8">
        <div className="sm:col-span-5 sm:mr-4">
          <ContactForm className="mb-4" />
        </div>
        <div className="sm:col-span-3">
          <Image
            src="/questionnaire.jpg"
            alt="Portfolio Day installation and performance by Basekamp group, UArts 1999. Pictured David Dempewolf (left) and Scott Rigby (right)"
            width={600}
            height={450}
            className="float-right ml-4 mb-4 max-w-s"
          ></Image>
        </div>
      </div>
    </>
  );
}
