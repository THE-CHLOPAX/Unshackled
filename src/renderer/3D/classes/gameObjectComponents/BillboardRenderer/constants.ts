// How often (in ms) tracked elements' screen positions are recomputed and written to the
// DOM. Decoupled from the render loop's own frame rate since screen-space movement doesn't
// need to be updated every single frame to read as smooth.
export const BILLBOARD_POSITION_UPDATE_INTERVAL_MS = 1000 / 60;

export const BILLBOARD_RENDERER_MESSAGES = {
  ELEMENT_ALREADY_ADDED: (id: string) => `[BillboardRenderer] Element "${id}" was already added`,
  ELEMENT_NOT_FOUND: (id: string) => `[BillboardRenderer] Element "${id}" not found`,
};
