import { describe, expect, it } from "vitest";
import { categoryFor, resultSchema, resultFromRecord } from "./contracts.js";
import { fixture } from "../test/fixtures.js";
describe("authoritative screening contract", () => {
  it("never presents an unknown stored category as a Typical result", () => {
    expect(() =>
      resultFromRecord({
        ...fixture,
        category: "Reversal",
      }),
    ).toThrow();
  });
  it("keeps the Elevated/Typical mapping independent from legacy compatibility classes", () => {
    expect(categoryFor(resultSchema.parse(fixture))).toBe("Elevated");
    expect(
      categoryFor(
        resultSchema.parse({
          ...fixture,
          risk_score: 0,
          risk_percentage: 0,
          risk_category: "Typical",
        }),
      ),
    ).toBe("Typical");
    expect(
      resultSchema.safeParse({ ...fixture, risk_category: "Reversal" }).success,
    ).toBe(false);
  });
  it.each([null, "", NaN, Infinity, -1, 1.1])(
    "rejects invalid score %s without coercing it to zero",
    (score) => {
      expect(
        resultSchema.safeParse({ ...fixture, risk_score: score }).success,
      ).toBe(false);
    },
  );
  it("rejects reversed uncertainty and inconsistent ensemble count", () => {
    expect(
      resultSchema.safeParse({
        ...fixture,
        uncertainty_band: { low: 0.9, high: 0.1, std: 0.1, spread: 0.1 },
      }).success,
    ).toBe(false);
    expect(
      resultSchema.safeParse({ ...fixture, models_in_ensemble: 3 }).success,
    ).toBe(false);
  });
  it("accepts absent explanations without inventing images", () => {
    const result = resultSchema.parse({
      ...fixture,
      attention_overlay_base64: undefined,
    });
    expect(result.attention_overlay_base64).toBeUndefined();
    expect(result.gradcam_overlay_base64).toBeNull();
  });
});
