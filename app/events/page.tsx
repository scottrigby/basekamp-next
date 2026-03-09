import { Metadata } from "next";
import { getAllEvents } from "../../lib/events";
import EventCard from "@/components/EventCard";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Events | Basekamp",
};

export default function EventsIndex() {
  const events = getAllEvents();

  return (
    <>
      <h1>Events</h1>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 sm:gap-6 p-4">
        {events.map(({ meta }) => (
          <EventCard
            key={meta.slug}
            title={meta.title}
            dateRange={meta.dateRange}
            slug={meta.slug}
            // location={meta.location}
            // attribution={meta.attribution}
            images={meta.images}
          />
        ))}
      </div>
    </>
  );
}
