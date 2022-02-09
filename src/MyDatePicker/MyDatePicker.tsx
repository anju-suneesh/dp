import React, {
  useState,
  useEffect,
  useRef,
  createRef,
  useReducer,
  RefObject,
} from "react";
import {
  getDateStringFromTimestamp,
  getMonthDetails,
  monthMap,
} from "./dates/dates";
import PropTypes from "prop-types";

// /**
//  * We wont show stylesheet in this refactor example.
//  * @see https://medium.com/swlh/build-a-date-picker-in-15mins-using-javascript-react-from-scratch-f6932c77db09
//  */
import "./MyDatePicker.css";

/** We'll use useReducer to manage our state **/
const date = new Date();
const oneDay = 60 * 60 * 24 * 1000;
const todayTimestamp =
  date.getTime() -
  (date.getTime() % oneDay) +
  date.getTimezoneOffset() * 1000 * 60;

const initialState = {
  todayTimestamp: todayTimestamp, // or todayTimestamp, for short
  year: date.getFullYear(),
  month: date.getMonth(),
  selectedDay: todayTimestamp,
  monthDetails: getMonthDetails(date.getFullYear(), date.getMonth()),
};

function DatePicker(props : any) {
  const el = useRef(null);
  const inputRef : RefObject<HTMLInputElement> = React.createRef()
  const [state, dispatch] = useReducer(reducer, initialState);
  /** Maybe you could add this to initialState 🤷🏽‍♂️ */
  const [showDatePicker, setShowDatePicker] = useState(false);

  const addBackDrop = (e: { target: any; }) => {
    if (showDatePicker && el && !el.current.contains(e.target)) {
      setShowDatePicker(false);
    }
  };

  const setDateToInput = (timestamp: any) => {
    const dateString = getDateStringFromTimestamp(timestamp);
    inputRef.current.value = dateString;
  };

  useEffect(() => {
    /**
     * Only needed when using SSR ie Next.js
     * Uncomment if you're using SSR:
     * if (!process.browser) { return }
     */

    window.addEventListener("click", addBackDrop);
    setDateToInput(state.selectedDay);

    // returned function will be called on component unmount
    return () => {
      window.removeEventListener("click", addBackDrop);
    };
  }, [showDatePicker]);

  const isCurrentDay = (day : any) => day.timestamp === todayTimestamp;
  const isSelectedDay = (day : any) => day.timestamp === state.selectedDay;
  const getMonthStr = (month : any) =>
    monthMap[Math.max(Math.min(11, month), 0)] || "Month";

  const onDateClick = (day : any) => {
    dispatch({ type: "selectedDay", value: day.timestamp });
    setDateToInput(day.timestamp);

    /** Pass data to parent */
    props.onChange(day.timestamp);
  };

  const setYear = (offset : any) => {
    const year = state.year + offset;
    dispatch({ type: "year", value: year });
    dispatch({
      type: "monthDetails",
      value: getMonthDetails(year, state.month),
    });
  };

  const setMonth = (offset : any) => {
    let year = state.year;
    let month = state.month + offset;
    if (month === -1) {
      month = 11;
      year--;
    } else if (month === 12) {
      month = 0;
      year++;
    }

    dispatch({ type: "year", value: year });
    dispatch({ type: "month", value: month });
    dispatch({ type: "monthDetails", value: getMonthDetails(year, month) });
  };

  const setDate = (dateData : any) => {
    const selectedDay = new Date(
      dateData.year,
      dateData.month - 1,
      dateData.date
    ).getTime();
    dispatch({ type: "selectedDay", value: selectedDay });

    /** Pass data to parent */
    props.onChange(selectedDay);
  };

  const getDateFromDateString = (dateValue : any) => {
    const dateData = dateValue.split("-").map((d : any) => parseInt(d, 10));

    if (dateData.length < 3) {
      return null;
    }

    const year = dateData[0];
    const month = dateData[1];
    const date = dateData[2];
    return { year, month, date };
  };

  const updateDateFromInput = () => {
    const dateValue = inputRef.current.value;
    const dateData = getDateFromDateString(dateValue);

    if (dateData !== null) {
      setDate(dateData);
      dispatch({ type: "year", value: dateData.year });
      dispatch({ type: "month", value: dateData.month - 1 });
      dispatch({
        type: "monthDetails",
        value: getMonthDetails(dateData.year, dateData.month - 1),
      });
    }
  };

  const daysMarkup = state.monthDetails.map((day : any, index : any) => (
    <div
      className={
        "c-day-container " +
        (day.month !== 0 ? " disabled" : "") +
        (isCurrentDay(day) ? " highlight" : "") +
        (isSelectedDay(day) ? " highlight-green" : "")
      }
      key={index}
    >
      <div className="cdc-day">
        <span onClick={() => onDateClick(day)}>{day.date}</span>
      </div>
    </div>
  ));

  const calendarMarkup = (
    <div className="c-container">
      <div className="cc-head">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d, i) => (
          <div key={i} className="cch-name">
            {d}
          </div>
        ))}
      </div>
      <div className="cc-body">{daysMarkup}</div>
    </div>
  );

  return (
    <div ref={el} className="MyDatePicker">
      <div className="mdp-input" onClick={() => setShowDatePicker(true)}>
        <input type="date" ref={inputRef} onChange={updateDateFromInput} />
      </div>
      {showDatePicker ? (
        <div className="mdp-container">
          <div className="mdpc-head">
            <div className="mdpch-button">
              <div className="mdpchb-inner" onClick={() => setYear(-1)}>
                <span className="mdpchbi-left-arrows"></span>
              </div>
            </div>
            <div className="mdpch-button">
              <div className="mdpchb-inner" onClick={() => setMonth(-1)}>
                <span className="mdpchbi-left-arrow"></span>
              </div>
            </div>
            <div className="mdpch-container">
              <div className="mdpchc-year">{state.year}</div>
              <div className="mdpchc-month">{getMonthStr(state.month)}</div>
            </div>
            <div className="mdpch-button">
              <div className="mdpchb-inner" onClick={() => setMonth(1)}>
                <span className="mdpchbi-right-arrow"></span>
              </div>
            </div>
            <div className="mdpch-button" onClick={() => setYear(1)}>
              <div className="mdpchb-inner">
                <span className="mdpchbi-right-arrows"></span>
              </div>
            </div>
          </div>
          <div className="mdpc-body">{calendarMarkup}</div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

/** Fancy using switch statement? Go ahead */
function reducer(state : any, action : any) {
  if (state.hasOwnProperty(action.type)) {
    return {
      ...state,
      [`${action.type}`]: action.value,
    };
  }

  console.log(`Unknown key in state: ${action.type}`);
}

DatePicker.propTypes = {
  onChange: PropTypes.func.isRequired,
};

export default DatePicker;
