import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ImageSlider, { Img } from "@/components/ImageSlider";

export const metadata: Metadata = {
  title: "Allies | Basekamp",
};

const allyImages: Img[] = [
  { src: "/poster_front_2.jpg", alt: "" },
  { src: "/aa18_camp_cover_0.jpg", alt: "" },
];

export default function Page() {
  return (
    <div>
      <h1>Allies</h1>
      <div className="sm:grid sm:grid-cols-5">
        <div className="sm:col-span-3 sm:mr-4">
          <p>
            Thanks to all who've supported Basekamp projects over the years,
            directly or indirectly, financially or in other experimental and
            creative ways.
          </p>
          <p>
            This is a short list of people who've gone to bat for us, groups and
            artist-run initiatives who've helped us out, and even larger
            organizations that have (knowingly) supported projects by the
            Basekamp group or at the Basekamp space (this doesn't include
            everyone who we've ever worked with who's been involved in our
            projects - you can find out about all that{" "}
            <Link href="/projects">here</Link> instead).
          </p>
          <p>
            * If you want to (or should) be recognized on this list,{" "}
            <Link href="/contact"> let us know</Link>. Thanks!
          </p>
          <p>
            <strong>Individuals</strong>
          </p>
          <ul>
            <li>Jonathan Simpson</li>
            <li>Theresa Rose</li>
            <li>Per Hüttner </li>
            <li>Sam Gould </li>
            <li>Aharon Amir </li>
            <li>Gavin Wade </li>
            <li>Brett Bloom </li>
            <li>Nato Thompson </li>
            <li>Aharon Levy </li>
            <li>Mike Wolf </li>
            <li>Mike Salmond </li>
            <li>Noah Simblist </li>
            <li>Michelle White </li>
            <li>Jonathan Binstock </li>
            <li>Joan Smith </li>
            <li>Magdalena Tyzlik-Carver </li>
            <li>Richard Torchia </li>
            <li>Sid Sach</li>
            <li>Tim Plunkett</li>
          </ul>
          <p>
            <strong>Organizations</strong>
          </p>
          <ul>
            <li>
              <Link href="http://www.anarchitektur.com/">An Architektur</Link>
            </li>
            <li>
              <Link href="http://www.kunst.dk/english/">DaNY Arts grant</Link>{" "}
              (Danish Arts Council / New York)
            </li>
            <li>
              <Link href="http://www.pcah.us/exhibitions">
                Philadelphia Exhibitions Initiative
              </Link>
            </li>
            <li>
              <Link href="http://www.common-room.net/">common room</Link>, New
              York
            </li>
            <li>
              <Link href="http://www.grahamfoundation.org/">
                Graham Foundation for Advanced Studies in the Fine Arts
              </Link>
            </li>
            <li>
              <Link href="http://www.inliquid.com/">InLiquid</Link>,
              Philadelphia
            </li>
            <li>
              <Link href="http://www.pcah.us/fellowships/fellowships-awarded/">
                PEW Fellowships in the Arts
              </Link>
            </li>
            <li>
              <Link href="http://www.britishcouncil.org/">British Council</Link>
            </li>
            <li>
              <Link href="http://www.modernamuseet.se/">Moderna Museet</Link>,
              Stockholm
            </li>
            <li>
              <Link href="http://www.liu.se/en?l=en">Linköping University</Link>
              , Sweden
            </li>
            <li>
              <Link href="http://www.arts.vic.gov.au/">Arts Victoria</Link>,
              State of Victoria
            </li>
            <li>
              <Link href="http://www.facecouncil.org/etantdonnes/contemporaryart.html">
                étant donnés
              </Link>
              : The French-American Fund for Contemporary Art
            </li>
            <li>
              <Link href="http://www.consulfrance-newyork.org/">
                Consulate General of France in New York
              </Link>
            </li>
            <li>
              <Link href="http://www.swedenabroad.com/">
                Consulate General of Sweden in Canton
              </Link>
            </li>
            <li>
              <Link href="http://www.ecuad.ca/">
                Emily Carr Institute of Art and Design
              </Link>
              , British Columbia
            </li>
            <li>
              <Link href="http://westcollection.org/">West Collection</Link>,
              Oaks Pennsylvania
            </li>
            <li>
              <Link href="http://blog.whereapy.com/about/us">Whereapy</Link>
            </li>
            <li>
              <Link href="http://uarts.edu/">University of the Arts</Link>,
              Philadelphia
            </li>
            <li>
              <Link href="http://www.csm.arts.ac.uk/">
                Central Saint Martins College of Art &amp; Design
              </Link>
              , London
            </li>
            <li>
              <Link href="http://icaphila.org/">
                Institute of Contemporary Art
              </Link>
              , Philadelphia
            </li>
            <li>
              <Link href="http://www.ires.org.uk/">
                iRes Research in Network Art
              </Link>
              , University College Falmouth
            </li>
            <li>
              <Link href="http://www.dpu.dk/">Learning Lab Denmark</Link>
            </li>
            <li>
              <Link href="http://www.linst.ac.uk/">The London Institute</Link>
            </li>
            <li>
              <Link href="http://www.wlv.ac.uk/">
                University of Wolverhampton
              </Link>
            </li>
            <li>
              <Link href="http://slought.org/">Slought Foundation</Link>,
              Philadelphia
            </li>
            <li>
              <Link href="http://www.thegalleriesatmoore.org/">
                Moore College of Art &amp; Design
              </Link>
              , Philadelphia
            </li>
            <li>
              <Link href="http://creativetime.org/programs/archive/2010/summit/WP/2010/10/10/basekamp/">
                Creative Time
              </Link>
            </li>
          </ul>
        </div>
        <div className="sm:col-span-2">
          <ImageSlider
            images={allyImages}
            className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4"
          />
        </div>

        {/* <div className="sm:col-span-3">
          <Image
            width={600}
            height={450}
            style={{ width: "600px", height: "auto" }}
            src="/EAM_600.jpg"
            alt="East Art Map, installation by Irwin, at Basekamp space, 2006."
          />
        </div> */}
      </div>
    </div>
  );
}
