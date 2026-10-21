export const MODEL_RENDERER_MESSAGES = {
  GET_MATERIALS_NO_MODEL:
    '[ModelRenderer] getModelMaterials failed: No model set on ModelRenderer.',
  GET_MATERIALS_NO_MESH:
    '[ModelRenderer] getModelMaterials warning: No mesh found in model hierarchy to retrieve material from.',
  ADD_ATTACHMENT_NO_MODEL: '[ModelRenderer] addAttachment failed: No model set on ModelRenderer.',
  ADD_ATTACHMENT_NO_PARENT: '[ModelRenderer] addAttachment failed: No valid parent provided.',
  ADD_ATTACHMENT_INVALID_PARENT:
    '[ModelRenderer] addAttachment failed: Provided parent is not part of the model hierarchy.',
  REMOVE_ATTACHMENT_NO_MODEL:
    '[ModelRenderer] removeAttachment failed: No model set on ModelRenderer.',
  REMOVE_ATTACHMENT_NOT_IN_HIERARCHY:
    '[ModelRenderer] removeAttachment failed: Provided object is not part of the model hierarchy.',
  REMOVE_ATTACHMENT_NO_PARENT:
    '[ModelRenderer] removeAttachment failed: Provided object has no parent.',
} as const;
