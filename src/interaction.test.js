import test from 'node:test';
import assert from 'node:assert/strict';
import { Object3D } from 'three';
import { clampDistance, MAX_DISTANCE, MIN_DISTANCE, rotateObject } from './interaction.js';

test('zoom is bounded at both extremes', () => {
  assert.equal(clampDistance(0), MIN_DISTANCE);
  assert.equal(clampDistance(100), MAX_DISTANCE);
  assert.equal(clampDistance(7), 7);
});

test('vertical rotation can pass a pole and return after a full turn', () => {
  const object = new Object3D();
  rotateObject(object, 0, Math.PI * 0.75, 1);
  assert.ok(Math.abs(object.quaternion.x) > 0.9);
  rotateObject(object, 0, Math.PI * 1.25, 1);
  assert.ok(Math.abs(object.quaternion.x) < 1e-10);
  assert.ok(Math.abs(Math.abs(object.quaternion.w) - 1) < 1e-10);
});

test('horizontal rotation preserves normalized orientation', () => {
  const object = new Object3D();
  for (let i = 0; i < 100; i++) rotateObject(object, 10, 4);
  assert.ok(Math.abs(object.quaternion.length() - 1) < 1e-10);
});
