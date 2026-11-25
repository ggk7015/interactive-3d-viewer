import { MathUtils, Quaternion, Vector3 } from 'three';

export const DEFAULT_DISTANCE = 7.4;
export const MIN_DISTANCE = 4.6;
export const MAX_DISTANCE = 12;

export function clampDistance(distance) {
  return MathUtils.clamp(distance, MIN_DISTANCE, MAX_DISTANCE);
}

export function rotateObject(object, dx, dy, sensitivity = 0.007) {
  const horizontal = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), dx * sensitivity);
  const vertical = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), dy * sensitivity);
  object.quaternion.premultiply(horizontal).premultiply(vertical).normalize();
}
