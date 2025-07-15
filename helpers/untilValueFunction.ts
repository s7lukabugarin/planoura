import moment from "moment";

export const untilValueFunction = (
  selectedPattern: "daily" | "weekly" | "monthly",
  selectedDate: "default" | Date = "default"
) => {
  if (selectedPattern === "daily") {
    if (selectedDate === "default") {
        return "Default (3 Months)";
    } else {
        return moment(selectedDate).format("ddd, MMM D, YYYY");
    }
  }
  if (selectedPattern === "weekly") {
    return "Default (6 Months)";
  }
  if (selectedPattern === "monthly") {
    return "Default (12 Months)";
  }
};
