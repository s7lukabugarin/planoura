import { TimelineEventProps, CalendarUtils } from "react-native-calendars";

const EVENT_COLOR = "#eaf4f3";
const today = new Date();
export const getDate = (offset = 0) =>
  CalendarUtils.getCalendarDateString(
    new Date().setDate(today.getDate() + offset)
  );

export const timelineEvents: TimelineEventProps[] = [
  {
    start: `${getDate(-1)} 07:00:00`,
    end: `${getDate(-1)} 08:00:00`,
    title: "Morning Pilates Class",
    summary: "Intermediate level mat session to energize your day.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate()} 09:30:00`,
    end: `${getDate()} 10:30:00`,
    title: "Reformer Pilates Basics",
    summary: "Introduction to Reformer Pilates for beginners.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate()} 11:00:00`,
    end: `${getDate()} 11:45:00`,
    title: "Stretch and Flex",
    summary: "Focus on flexibility and stretching techniques.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate()} 17:00:00`,
    end: `${getDate()} 18:00:00`,
    title: "Private Pilates Session",
    summary: "One-on-one training session with a certified instructor.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(1)} 07:30:00`,
    end: `${getDate(1)} 08:30:00`,
    title: "Core Strengthening",
    summary: "A Pilates workout focusing on core stability and strength.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(1)} 12:00:00`,
    end: `${getDate(1)} 13:00:00`,
    title: "Advanced Reformer Session",
    summary: "Challenge your skills with advanced exercises.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(1)} 15:30:00`,
    end: `${getDate(1)} 16:15:00`,
    title: "Stretch & Relax",
    summary: "A calming session focusing on relaxation techniques.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(2)} 06:30:00`,
    end: `${getDate(2)} 07:15:00`,
    title: "Sunrise Pilates",
    summary: "Early morning session to start the day fresh.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(2)} 10:00:00`,
    end: `${getDate(2)} 11:00:00`,
    title: "Group Mat Pilates",
    summary: "Group class focusing on classic mat exercises.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(2)} 18:00:00`,
    end: `${getDate(2)} 19:00:00`,
    title: "Full Body Flow",
    summary: "A dynamic full-body workout using Pilates principles.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(3)} 08:00:00`,
    end: `${getDate(3)} 09:00:00`,
    title: "Pilates for Back Pain",
    summary: "Targeted exercises to alleviate and prevent back pain.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(3)} 14:00:00`,
    end: `${getDate(3)} 15:00:00`,
    title: "Prenatal Pilates",
    summary: "A safe and gentle class designed for expecting mothers.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(4)} 07:15:00`,
    end: `${getDate(4)} 08:00:00`,
    title: "Express Pilates",
    summary: "Short, high-intensity session for busy schedules.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(4)} 11:30:00`,
    end: `${getDate(4)} 12:30:00`,
    title: "Deep Stretch Class",
    summary: "Relax and unwind with deep stretching techniques.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(4)} 17:00:00`,
    end: `${getDate(4)} 18:30:00`,
    title: "Pilates Workshop",
    summary: "Learn advanced techniques in this workshop.",
    color: EVENT_COLOR,
  },
  {
    start: `${getDate(5)} 06:45:00`,
    end: `${getDate(5)} 07:30:00`,
    title: "Morning Energy Boost",
    summary: "A quick session to kickstart your day.",
    color: EVENT_COLOR,
  },
];