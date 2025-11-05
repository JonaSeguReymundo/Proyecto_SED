import { addRoute } from "../router";
import { getCars, createCar, updateCar, deleteCar } from "../../controllers/car.controller";

addRoute("GET", "/cars", getCars);
addRoute("POST", "/cars", createCar);
addRoute("PUT", "/cars/", updateCar);      // Se evalúa con ID
addRoute("DELETE", "/cars/", deleteCar);   // Se evalúa con ID
