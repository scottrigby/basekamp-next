import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Basekamp",
};

export default function Page() {
  return (
    <div>
      <h1>About</h1>
      <div className="sm:grid sm:grid-cols-8">
        <div className="sm:col-span-5 sm:mr-4">
          <p>
            BASEKAMP is an artist-group researching and co-developing
            interdisciplinary, self-organized art projects with other
            individuals and groups in various authorship-blurring
            configurations. BASEKAMP is not concerned with who initiates a
            project or idea, but rather how they can plug-in to each others’
            efforts. From 1998-2011 the BASEKAMP group ran a collaborative art
            research center, residency program, and exhibition program by the
            same name in Philadelphia. The group has since gone mobile, making
            temporary camps in various locations to invite anyone interested in
            a joint experiment to develop new models of relations within
            overlapping art communities. The goal is Organization Without
            Hierarchy, Attribution Without Ownership, and Value Without Capital.
            Resulting collaborations appear in non-art contexts, online, in
            artist-run spaces, institutional venues–or any channel to help
            further our collective efforts.
          </p>
          <p>
            <Link href="/contact">Let us know</Link> if you’d like to join us.
          </p>
        </div>
        <div className="sm:col-span-3">
          <Image
            width={600}
            height={450}
            style={{ width: "600px", height: "auto" }}
            src="/EAM_600.jpg"
            alt="East Art Map, installation by Irwin, at Basekamp space, 2006."
          />
        </div>
      </div>
    </div>
  );
}
