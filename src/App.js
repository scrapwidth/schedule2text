import React, { useState } from "react";
import { DateTime } from "luxon";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import Button from '@material-ui/core/Button';
import "react-big-calendar/lib/css/react-big-calendar.css";

// Setup the localizer by providing the moment object
const localizer = momentLocalizer(moment);

const App = () => {
  const [events, setEvents] = useState([]);
  const [generatedText, setGeneratedText] = useState("");

  const handleGenerateText = () => {
    // Sort the events in chronological order
    const sortedEvents = [...events].sort((a, b) => a.start - b.start);

    const groupedEvents = groupByDay(sortedEvents);
    const textArr = [];
    for (const [day, timeSlots] of Object.entries(groupedEvents)) {
      const timeRanges = timeSlots.map(({ start, end }) => {
        const startStr = DateTime.fromJSDate(start).toFormat('t');
        const endStr = DateTime.fromJSDate(end).toFormat('t');
        return `\t${startStr} - ${endStr}`;
      });
      textArr.push(`${day}:\n${timeRanges.join('\n')}`);
    }
    setGeneratedText(textArr.join('\n\n'));
  };


  const groupByDay = (events) => {
    const groupedEvents = {};
    for (let event of events) {
      let eventStart = DateTime.fromJSDate(event.start);
      let eventEnd = DateTime.fromJSDate(event.end);
      while (eventStart < eventEnd) {
        let nextDayStart = eventStart.plus({ days: 1 }).startOf('day');
        let endOfThisDay = nextDayStart < eventEnd ? nextDayStart : eventEnd;
        let day = eventStart.toFormat('MMMM d, yyyy');
        if (!groupedEvents[day]) {
          groupedEvents[day] = [];
        }
        groupedEvents[day].push({ start: eventStart.toJSDate(), end: endOfThisDay.toJSDate() });
        eventStart = nextDayStart;
      }
    }
    return groupedEvents;
  };

  function removeDuplicates(events) {
    const uniqueEvents = [];
    const seenEvents = new Set();

    events.forEach(event => {
      const signature = `${event.start.getTime()}-${event.end.getTime()}`;
      if (!seenEvents.has(signature)) {
        seenEvents.add(signature);
        uniqueEvents.push(event);
      }
    });

    return uniqueEvents;
  }

  return (
    <div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={({ start, end }) => {
          const newEvent = {
            id: Math.random().toString(),
            title: '',
            start,
            end,
            allDay: false,
          };

          let eventExists = false;

          const newEvents = events.map((event) => {
            if (
              (newEvent.start >= event.start && newEvent.start < event.end) ||
              (newEvent.end > event.start && newEvent.end <= event.end) ||
              (newEvent.start <= event.start && newEvent.end >= event.end)
            ) {
              eventExists = true;
              return {
                ...event,
                start: new Date(Math.min(event.start.getTime(), newEvent.start.getTime())),
                end: new Date(Math.max(event.end.getTime(), newEvent.end.getTime())),
              };
            } else {
              return event;
            }
          });

          if (!eventExists) {
            newEvents.push(newEvent);
          }

          setEvents(removeDuplicates(newEvents));
        }}


        style={{ height: '80vh' }}
        defaultView={Views.WEEK}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateText}
      >
        Generate Text
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => {
          setEvents([]);
          setGeneratedText("");
        }}
      >
        Clear
      </Button>
      <div style={{ margin: "20px 0", whiteSpace: "pre-line", backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "5px" }}>
        {generatedText}
      </div>
    </div>
  );
};

export default App;