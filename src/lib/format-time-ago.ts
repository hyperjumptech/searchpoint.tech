export function formatTimeAgo(
  dateInput: string | number | Date,
  locale = "en",
) {
  const date = new Date(dateInput);
  const now = new Date();

  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
  const diffInDays = diffInSeconds / 86400;

  if (diffInDays > 7) {
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffInSeconds < 60) {
    return rtf.format(-Math.floor(diffInSeconds), "second");
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  } else {
    return rtf.format(-Math.floor(diffInDays), "day");
  }
}
