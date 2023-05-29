import React, { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import Button from '@material-ui/core/Button';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { makeStyles } from '@material-ui/core/styles';

// add import for useLocation and useNavigate from react-router-dom
import { useLocation, useNavigate } from 'react-router-dom';


// Convert a number to a base-64 string
function toBase64(num) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let base64 = '';
  while (num > 0) {
    base64 = chars[num % 64] + base64;
    num = Math.floor(num / 64);
  }
  return base64;
}

// Convert a base-64 string to a number
function fromBase64(base64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let num = 0;
  let len = base64.length;
  for (let i = 0; i < len; i++) {
    num = num * 64 + chars.indexOf(base64[i]);
  }
  return num;
}

const useStyles = makeStyles((theme) => ({
  root: {
    fontFamily: 'Arial, sans-serif',
    margin: 'auto',
    maxWidth: '800px',
    width: '90%', // take up 90% of the viewport width
    padding: theme.spacing(2),
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
    [theme.breakpoints.up('md')]: { // apply these styles for screen widths of 960px and above
      maxWidth: '1200px', // increase maximum width
      width: '80%', // take up 80% of the viewport width
    },
  },
  calendar: {
    height: '80vh',
    marginBottom: theme.spacing(2),
  },
  button: {
    marginRight: theme.spacing(1),
  },
  output: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: '#ffffff',
    borderRadius: '5px',
  },
}));
// Setup the localizer by providing the moment object
const localizer = momentLocalizer(moment);

const App = () => {
  const classes = useStyles();
  const [events, setEvents] = useState([]);
  const [generatedText, setGeneratedText] = useState("");

  // add useNavigate and useLocation hooks
  const navigate = useNavigate();
  const location = useLocation();

  // convert the query parameters back into the state when the page loads
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const base64EventsParam = params.get('events');
    if (base64EventsParam) {
      try {
        const decodedEvents = fromBase64(decodeURIComponent(base64EventsParam));
        const simplifiedEvents = JSON.parse(decodedEvents);
        const convertedEvents = simplifiedEvents.map((event, index) => ({
          id: index.toString(),
          title: '',
          start: DateTime.fromMillis(event.start).toJSDate(),
          end: DateTime.fromMillis(event.end).toJSDate(),
          allDay: false,
        }));
        setEvents(convertedEvents);
      } catch (error) {
        console.error("Failed to parse events from URL", error);
      }
    }
  }, [location.search]);

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

  const handleGenerateLink = () => {
    const simplifiedEvents = events.map(event => [
      toBase64(Math.floor(DateTime.fromJSDate(event.start).toMillis() / (30 * 60 * 1000))),
      toBase64(Math.floor(DateTime.fromJSDate(event.end).toMillis() / (30 * 60 * 1000))),
    ]);
    const encodedEvents = simplifiedEvents.map(event => event.join('-')).join(',');
    navigate(`?events=${encodedEvents}`);
    const url = `${window.location.origin}${window.location.pathname}?events=${encodedEvents}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard');
  };

  // In your `useEffect` hook
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const encodedEventsParam = params.get('events');
    if (encodedEventsParam) {
      try {
        const simplifiedEvents = encodedEventsParam.split(',').map(event => event.split('-'));
        const convertedEvents = simplifiedEvents.map((event, index) => ({
          id: index.toString(),
          title: '',
          start: DateTime.fromMillis(fromBase64(event[0]) * 30 * 60 * 1000).toJSDate(),
          end: DateTime.fromMillis(fromBase64(event[1]) * 30 * 60 * 1000).toJSDate(),
          allDay: false,
        }));
        setEvents(convertedEvents);
      } catch (error) {
        console.error("Failed to parse events from URL", error);
      }
    }
  }, [location.search]);


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
    <div className={classes.root}>
      <div>
        <h1>Schedule2Text</h1>
        <p>
          The Schedule2Text App allows you to easily select and generate time ranges for meeting availabilities. Simply click and drag on the interactive calendar to create time slots. Once you have selected your desired time ranges, click the "Generate Text" button to generate a condensed text summary of your meeting availabilities. Use this summary to quickly communicate your availability to others. Get started below!
        </p>
      </div>
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

        className={classes.calendar}
        defaultView={Views.WEEK}
      />
      <Button
        variant="contained"
        color="primary"
        className={classes.button}
        onClick={handleGenerateText}
      >
        Generate Text
      </Button>
      <Button
        variant="contained"
        color="secondary"
        className={classes.button}
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

      <Button
        variant="contained"
        color="primary"
        className={classes.button}
        onClick={handleGenerateLink}
      >
        Copy Link to Clipboard
      </Button>
    </div>
  );
};

export default App;