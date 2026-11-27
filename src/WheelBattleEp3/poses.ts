import type { Pose } from "../InkMan/BaseCharacter";
import { HAND } from "../InkMan/motion";

// Ep3 key poses. Arms: x = swing forward(-)/back(+), z = raise sideways,
// elbow negative bends; flex trick: x -1.57 + z ~1.47 puts the elbow axis
// vertical so a negative elbow lifts the forearm up.
export const P = {
  // Satan: heroic double-bicep flex, chest out, chin up
  flex: {
    ground: true,
    lean: -0.08,
    headPitch: -0.3,
    thighL: -0.12,
    thighR: 0.12,
    kneeL: 0.12,
    kneeR: 0.12,
    armL: { x: -1.57, z: 1.35, elbow: -1.85, ...HAND.fist },
    armR: { x: -1.57, z: 1.35, elbow: -1.85, ...HAND.fist },
    shrug: 0.3,
    breathe: 1,
  } as Pose,
  // Satan: thumb pointing at his own chest
  selfPoint: {
    ground: true,
    lean: -0.1,
    headPitch: -0.25,
    armR: { x: -0.75, z: 0.05, elbow: -1.75, twist: 1.57, ...HAND.thumbsUp },
    armL: { x: 0.05, z: 0.5, elbow: -1.6, twist: -1.57, ...HAND.fist },
    breathe: 1,
  } as Pose,
  // Satan: both fists overhead claiming the win
  victory: {
    ground: true,
    lean: -0.12,
    headPitch: -0.35,
    thighL: -0.15,
    thighR: 0.15,
    armL: { x: -2.75, z: 0.45, elbow: -0.25, ...HAND.fist },
    armR: { x: -2.75, z: 0.45, elbow: -0.25, ...HAND.fist },
    breathe: 1,
  } as Pose,
  // Satan: martial-arts ready stance
  ready: {
    ground: true,
    lean: 0.12,
    spineTwist: 0.35,
    thighL: -0.5,
    kneeL: 0.7,
    thighR: 0.35,
    kneeR: 0.45,
    footR: 0.2,
    armL: { x: -1.3, z: 0.1, elbow: -1.0, ...HAND.open },
    armR: { x: -0.6, z: 0.2, elbow: -1.9, ...HAND.fist },
    headPitch: -0.12,
  } as Pose,
  // rigid launch statue (flick frame)
  launch: {
    lean: -0.55,
    leanSide: 0.15,
    headPitch: 0.5,
    thighL: -0.75,
    kneeL: 0.7,
    thighR: 0.55,
    kneeR: 0.5,
    armL: { x: -2.5, z: 0.85, elbow: -0.3, ...HAND.open },
    armR: { x: -2.1, z: 1.1, elbow: -0.5, ...HAND.open },
  } as Pose,
  // dazed on the ground, sitting
  dazed: {
    ground: false,
    thighL: -1.45,
    thighR: -1.35,
    kneeL: 0.9,
    kneeR: 1.1,
    lean: -0.15,
    headRoll: 0.3,
    armL: { x: 0.3, z: 0.5, elbow: -0.3, ...HAND.open },
    armR: { x: 0.3, z: 0.55, elbow: -0.3, ...HAND.open },
  } as Pose,
  // crouched behind the boulder, phone to the right ear
  phoneCrouch: {
    ground: true,
    lean: 0.32,
    thighL: -0.95,
    kneeL: 1.6,
    thighR: -0.35,
    kneeR: 1.7,
    footR: -0.4,
    headPitch: -0.15,
    armR: { x: -1.25, z: 0.95, elbow: -2.35, ...HAND.claw },
    armL: { x: -0.6, z: 0.1, elbow: -1.0, ...HAND.relaxed },
    shrug: 0.5,
  } as Pose,
  // standing, phone held at arm's length
  phoneAway: {
    ground: true,
    lean: -0.05,
    armR: { x: -1.35, z: 0.55, elbow: -0.35, ...HAND.claw },
    armL: { x: 0.0, z: 0.1, elbow: -0.3, ...HAND.relaxed },
    headPitch: 0.05,
    headYaw: -0.3,
  } as Pose,
  // theatrical bow, arm sweeping toward the feast
  bow: {
    ground: true,
    lean: 0.62,
    thighL: -0.25,
    kneeL: 0.2,
    thighR: 0.25,
    headPitch: -0.35,
    armR: { x: -0.85, z: 1.0, elbow: -0.15, ...HAND.open },
    armL: { x: 0.55, z: 0.15, elbow: -1.4, ...HAND.relaxed },
  } as Pose,
  // straighten cape / adjust mustache
  mustache: {
    ground: true,
    headPitch: -0.1,
    armR: { x: -1.4, z: 0.3, elbow: -1.95, twist: -0.4, ...HAND.twoFinger },
    armL: { x: -0.1, z: 0.35, elbow: -1.2, ...HAND.fist },
    breathe: 1,
  } as Pose,
  // holding a plate up like a trophy (right hand)
  trophy: {
    ground: true,
    lean: -0.1,
    headPitch: -0.3,
    armR: { x: -2.6, z: 0.35, elbow: -0.45, ...HAND.open },
    armL: { x: 0.05, z: 0.5, elbow: -1.6, twist: -1.57, ...HAND.fist },
  } as Pose,
  // wiping sweat from the brow
  wipe: {
    ground: true,
    armR: { x: -2.0, z: 0.35, elbow: -1.9, ...HAND.open },
    armL: { x: -0.2, z: 0.2, elbow: -0.6, ...HAND.relaxed },
    headPitch: 0.05,
  } as Pose,

  // Beerus: hands clasped behind the back, upright, bored
  behind: {
    ground: true,
    headPitch: 0.14,
    armL: { x: 0.5, z: -0.02, twist: -1.3, elbow: -1.5, ...HAND.relaxed },
    armR: { x: 0.5, z: -0.02, twist: 1.3, elbow: -1.5, ...HAND.relaxed },
  } as Pose,
  // Beerus: the flick (right index finger extended forward)
  flick: {
    ground: true,
    headPitch: 0.1,
    armR: {
      x: -1.5,
      z: 0.05,
      elbow: -0.15,
      fingers: [0.15, 1, 1, 1],
      thumb: 0.85,
    },
    armL: { x: 0.5, z: -0.02, twist: -1.3, elbow: -1.5, ...HAND.relaxed },
  } as Pose,
  // Beerus floating, legs folded a little
  float: {
    ground: false,
    headPitch: 0.18,
    thighL: -0.35,
    kneeL: 0.6,
    thighR: -0.2,
    kneeR: 0.8,
    footL: -0.5,
    footR: -0.5,
    armL: { x: 0.5, z: -0.02, twist: -1.3, elbow: -1.5, ...HAND.relaxed },
    armR: { x: 0.5, z: -0.02, twist: 1.3, elbow: -1.5, ...HAND.relaxed },
  } as Pose,
  // seated at the table (place the group so the hips sit on the chair)
  seated: {
    ground: false,
    thighL: -1.5,
    thighR: -1.5,
    kneeL: 1.5,
    kneeR: 1.5,
    lean: 0.05,
    armL: { x: -1.1, z: 0.1, elbow: -0.6, ...HAND.relaxed },
    armR: { x: -1.1, z: 0.1, elbow: -0.6, ...HAND.relaxed },
  } as Pose,

  // Viewer: nervous tremble, hunched, hands clasped at the chest
  nervous: {
    ground: true,
    lean: 0.18,
    shrug: 0.7,
    headPitch: 0.12,
    kneeL: 0.12,
    kneeR: 0.12,
    armL: { x: -0.75, z: -0.12, elbow: -1.75, ...HAND.claw },
    armR: { x: -0.75, z: -0.12, elbow: -1.75, ...HAND.claw },
  } as Pose,
  // Viewer: hopeful lean, head 15deg forward
  hopeful: {
    ground: true,
    lean: 0.22,
    headPitch: 0.26,
    armL: { x: -0.85, z: -0.15, elbow: -1.65, ...HAND.fist },
    armR: { x: -0.85, z: -0.15, elbow: -1.65, ...HAND.fist },
  } as Pose,
  // Viewer: soul leaving body, head back 45deg, arms limp
  soul: {
    ground: true,
    lean: -0.12,
    headPitch: -0.8,
    kneeL: 0.2,
    kneeR: 0.25,
    armL: { x: 0.1, z: 0.12, elbow: -0.1, ...HAND.open },
    armR: { x: 0.1, z: 0.12, elbow: -0.1, ...HAND.open },
  } as Pose,
  // Viewer: betrayed, arms out, palms up
  betrayed: {
    ground: true,
    lean: 0.05,
    shrug: 0.6,
    headPitch: 0.05,
    armL: { x: -0.7, z: 0.55, elbow: -0.9, ...HAND.open },
    armR: { x: -0.7, z: 0.55, elbow: -0.9, ...HAND.open },
  } as Pose,

  // Goku: sitting, bowl in the left hand, chopsticks up to the mouth
  gokuEat: {
    ground: false,
    thighL: -1.5,
    thighR: -1.5,
    kneeL: 2.3,
    kneeR: 2.3,
    lean: 0.1,
    armL: { x: -1.2, z: 0.05, elbow: -1.1, ...HAND.claw },
    armR: { x: -1.0, z: 0.2, elbow: -2.1, ...HAND.fist },
    headPitch: 0.1,
  } as Pose,
};
