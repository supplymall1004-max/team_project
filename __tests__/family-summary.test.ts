import { describe, expect, it } from "vitest";
import {
  deriveIncludedMemberIds,
  type FamilyMemberTabPayload,
} from "@/lib/diet/family-summary";

const BASE_MEMBERS: FamilyMemberTabPayload[] = [
  { id: "self", name: "본인", role: "self", includeInUnified: true },
  { id: "child", name: "자녀", role: "member", includeInUnified: true },
  { id: "parent", name: "부모", role: "member", includeInUnified: false },
];

describe("deriveIncludedMemberIds", () => {
  it("returns server-provided includedMemberIds when available", () => {
    const result = deriveIncludedMemberIds({
      memberTabs: BASE_MEMBERS,
      includedMemberIds: ["child"],
    });

    expect(result).toEqual(["child"]);
  });

  it("falls back to member tabs when server includes are empty", () => {
    const result = deriveIncludedMemberIds({
      memberTabs: BASE_MEMBERS,
      includedMemberIds: [],
    });

    expect(result).toEqual(["self", "child"]);
  });
});
































