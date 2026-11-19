import { describe, expect, it } from "vitest";
import { ORDER, type NoteName } from "../../src/notes";
import { ledgerSteps, staffStep } from "../../src/ui/staff";

describe("staff notation", () => {
  it("writes the eleven bars c'' to f''' as consecutive steps (C major, no accidentals)", () => {
    expect(ORDER.map(staffStep)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  it("puts the high bars an octave (seven steps) above their low twins", () => {
    for (const n of ["C", "D", "E", "F"] as const) {
      expect(staffStep(n.toLowerCase() as NoteName) - staffStep(n)).toBe(7);
    }
  });

  it("puts C in the third space and F on the top line", () => {
    expect(staffStep("C")).toBe(7); // c'': third space from the bottom
    expect(staffStep("F")).toBe(10); // f'': top line
  });

  it("needs no ledger lines up to the space above the staff", () => {
    for (const n of ["C", "D", "E", "F", "G"] as const) expect(ledgerSteps(staffStep(n))).toEqual([]);
  });

  it("adds ledger lines above the staff, one per line passed", () => {
    expect(ledgerSteps(staffStep("A"))).toEqual([12]); // a'': first ledger line
    expect(ledgerSteps(staffStep("H"))).toEqual([12]); // h'': space above it
    expect(ledgerSteps(staffStep("c"))).toEqual([12, 14]);
    expect(ledgerSteps(staffStep("d"))).toEqual([12, 14]);
    expect(ledgerSteps(staffStep("e"))).toEqual([12, 14, 16]);
    expect(ledgerSteps(staffStep("f"))).toEqual([12, 14, 16]);
  });
});
