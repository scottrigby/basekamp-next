import { Metadata } from "next";
import Navbar from "../components/Navbar";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Basekamp",
  description:
    "Basekamp is a non-commercial organization of people who research and co-developing interdisciplinary, self-organized art projects with other individuals and groups in various authorship-blurring configurations",
  keywords:
    "Basekamp,kamp,basecamp,art,artists,work,collaboration,groups,projects,events,underground,alternative,space,critical,discussions,action,public,participation,community,meetings,organizational,self-organization,artworlds,residency",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col h-screen">
        <header>
          <Navbar />
        </header>
        <main className="m-4 mt-0 mb-8 grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
