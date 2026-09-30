import { UI_BACKGROUND_IMAGE_URLS } from '../constants';

export function preloadUiAssets(): void {
  Object.values(UI_BACKGROUND_IMAGE_URLS).forEach((url) => {
    const image = new Image();
    image.src = url;
  });
}
