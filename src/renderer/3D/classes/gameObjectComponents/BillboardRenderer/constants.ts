export const BILLBOARD_RENDERER_MESSAGES = {
  ELEMENT_ALREADY_ADDED: (id: string) => `[BillboardRenderer] Element "${id}" was already added`,
  ELEMENT_NOT_FOUND: (id: string) => `[BillboardRenderer] Element "${id}" not found`,
  REGISTRY_NOT_FOUND: (id: string) =>
    `[BillboardRenderer] Scene has no billboard registry, element "${id}" was not added`,
};
