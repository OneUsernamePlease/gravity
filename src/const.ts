import { ButtonState, Mouse } from "./scripts/types";

//#region ids
export const MASS_INPUT_ID = "massInput";
export const CANVAS_ID = "theCanvas";
export const STATUS_BAR_ID = "statusBar";
//#endregion
//#region numbers
export const DEFAULT_G = 50;
export const MIN_G = -10;
export const MAX_G = 100;
//#endregion

//#region other global stuff
export const mouse: Mouse = { main: { state: ButtonState.Up, downCoordinates: null }, 
                     secondary: { state: ButtonState.Up, downCoordinates: null }, 
                     wheel: { state: ButtonState.Up, downCoordinates: null} };
//#endregion
