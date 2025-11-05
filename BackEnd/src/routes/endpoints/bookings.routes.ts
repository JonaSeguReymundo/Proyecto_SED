import { addRoute } from "../router";
import { createBooking, getMyBookings, getAllBookings, cancelBooking, updateBooking } from "../../controllers/booking.controller";

addRoute("POST", "/bookings", createBooking);
addRoute("GET", "/bookings", getMyBookings);
addRoute("GET", "/bookings/all", getAllBookings);
addRoute("DELETE", "/bookings/", cancelBooking); 
addRoute("PUT", "/bookings/", updateBooking);
