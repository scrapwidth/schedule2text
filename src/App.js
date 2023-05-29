import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Button from '@material-ui/core/Button';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const App = () => {
  const [events, setEvents] = useState([]);
  const [outputText, setOutputText] = useState("");

  const handleSelect = ({ start, end }) => {
    const title = `${DateTime.fromJSDate(start).toLocaleString(DateTime.TIME_SIMPLE)} - ${DateTime.fromJSDate(end).toLocaleString(DateTime.TIME_SIMPLE)}`;
    setEvents([...events, { start, end, title }]);
  };

  const generateText = () => {
    const text = events.map(event =>
      `${DateTime.fromJSDate(event.start).toLocaleString(DateTime.DATETIME_FULL)} to ${DateTime.fromJSDate(event.end).toLocaleString(DateTime.DATETIME_FULL)}`
    ).join('\n');
    setOutputText(text);
  };

  const clearSelection = () => {
    setEvents([]);
    setOutputText("");
  };

  return (
    <div className="App">
      <Calendar
        localizer={localizer}
        defaultDate={new Date()}
        defaultView="week"
        events={events}
        style={{ height: "70vh" }}
        selectable
        onSelectSlot={handleSelect}
      />
      <Button variant="contained" color="primary" onClick={generateText}>
        Generate Text
      </Button>
      <Button variant="contained" color="secondary" onClick={clearSelection}>
        Clear
      </Button>
      <pre>{outputText}</pre>
    </div>
  );
};

export default App;
