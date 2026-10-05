import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { config } from '@/constants/config';

export interface PreparedImage {
  uri: string;
  base64: string;
}

/**
 * Downscales the photo so its longest edge is at most `config.maxImageDimension` and
 * re-encodes it as JPEG. Phone cameras produce 12MP+ images — sending them raw is slow
 * and costs far more tokens without improving identification.
 */
export async function prepareImageForAnalysis(uri: string): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(uri);

  // Measure the decoded image rather than trusting the picker/camera's reported size, which
  // can be pre-rotation (EXIF) on some Android devices.
  const original = await context.renderAsync();
  const max = config.maxImageDimension;
  const scale = Math.min(1, max / Math.max(original.width, original.height));
  if (scale < 1) {
    // Pass both dimensions: the web implementation doesn't support `null` for "auto".
    context.resize({ width: Math.round(original.width * scale), height: Math.round(original.height * scale) });
  }

  const rendered = scale < 1 ? await context.renderAsync() : original;
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true });
  if (!result.base64) throw new Error('Could not encode the image.');
  return { uri: result.uri, base64: result.base64 };
}

const COLLECTION_DIR = 'collection';

/**
 * Copies a (cache) image into the app's document directory so it survives cache eviction.
 * On web there is no persistent file system, so the original URI is returned as-is.
 */
export function persistImage(sourceUri: string, id: string): string {
  if (Platform.OS === 'web') return sourceUri;

  const dir = new Directory(Paths.document, COLLECTION_DIR);
  dir.create({ intermediates: true, idempotent: true });
  const destination = new File(dir, `${id}.jpg`);
  new File(sourceUri).copy(destination);
  return destination.uri;
}

export function deletePersistedImage(uri: string): void {
  if (Platform.OS === 'web') return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Best effort — a missing file shouldn't block removing the collection entry.
  }
}
