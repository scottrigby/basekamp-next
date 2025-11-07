import { getAllEvents } from "../../lib/events";
import EventCard from "@/components/EventCard";

export const dynamic = "force-static";

export default function EventsIndex() {
  const events = getAllEvents();

  return (
    <main>
      <h1>Events</h1>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] gap-4 p-4">
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
    </main>
  );
}
