export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

// projects

export function formatProjectDateRange(
  range: { from?: string; to?: string } | undefined
): string {
  if (!range || !range.from) return "";
  const from = new Date(range.from);
  const to = range.to ? new Date(range.to) : null;

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);

  if (!to) {
    // Single date → same as formatDate
    return fmtDate(from);
  }

  // Compare calendar day (year, month, date)
  const sameDay =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate();

  if (sameDay) {
    return fmtDate(from);
  }

  return `${fmtDate(from)} - ${fmtDate(to)}`;
}

// Events

function formatUSDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

function formatUSTime(d: Date): string {
  // e.g., "7:00pm", "10:30am"
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .toLowerCase() // "7:00 PM" → "7:00 pm"
    .replace(/\s/g, ""); // "7:00 pm" → "7:00pm"
}

export function formatEventDateRange(
  range: { from?: string; to?: string } | undefined
): string {
  if (!range || !range.from) return "";
  const from = new Date(range.from);
  const to = range.to ? new Date(range.to) : null;

  const hasFromTime = !isNaN(from.getHours());
  const hasToTime = !!to && !isNaN(to.getHours());

  const sameDay =
    !!to &&
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate();

  if (!to) {
    // Only a start
    if (hasFromTime) {
      return `${formatUSDate(from)} - ${formatUSTime(from)}`;
    }
    return formatUSDate(from);
  }

  if (sameDay) {
    // Same-day event
    const datePart = formatUSDate(from);
    const startTime = hasFromTime ? formatUSTime(from) : null;
    const endTime = hasToTime ? formatUSTime(to!) : null;

    if (startTime && endTime) {
      return `${datePart} - ${startTime} - ${endTime}`;
    }
    if (startTime && !endTime) {
      return `${datePart} - ${startTime}`;
    }
    // No times: just date
    return datePart;
  }

  // Multi-day event
  const fromDate = formatUSDate(from);
  const toDate = formatUSDate(to);
  const startTime = hasFromTime ? formatUSTime(from) : null;
  const endTime = hasToTime ? formatUSTime(to) : null;

  if (startTime && endTime) {
    return `${fromDate} - ${startTime} - ${toDate} - ${endTime}`;
  }
  if (startTime && !endTime) {
    return `${fromDate} - ${startTime} - ${toDate}`;
  }
  if (!startTime && endTime) {
    return `${fromDate} - ${toDate} - ${endTime}`;
  }
  return `${fromDate} - ${toDate}`;
}
