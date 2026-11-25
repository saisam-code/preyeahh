import { test } from "node:test";
import assert from "node:assert/strict";
import StudentGoal from "../models/StudentGoal.js";
import { protect } from "../middleware/auth.js";
import studentRoutes from "../routes/studentRoutes.js";

test("GET /goals is student-authenticated and preserves goal history for the current student", async () => {
  const route = studentRoutes.stack.find((layer) => layer.route?.path === "/goals")?.route;
  assert.ok(route?.methods.get);
  assert.equal(route.stack[0].handle, protect);
  assert.equal(route.stack.length, 3);
  let allowed = false;
  route.stack[1].handle({ user: { role: "student" } }, {}, () => {
    allowed = true;
  });
  assert.equal(allowed, true);
  assert.throws(
    () => route.stack[1].handle({ user: { role: "guide" } }, {}, () => {}),
    /permission/i
  );

  const expectedGoals = [{ goalTitle: "Researcher", type: "PRIMARY", status: "ACTIVE", origin: "DISCOVERY" }];
  const query = {
    selectFields: "",
    sortFields: null,
    select(fields) {
      this.selectFields = fields;
      return this;
    },
    sort(fields) {
      this.sortFields = fields;
      return this;
    },
    lean() {
      return Promise.resolve(expectedGoals);
    },
  };
  const originalFind = StudentGoal.find;
  let responseStatus;
  let responseBody;

  StudentGoal.find = (filter) => {
    assert.deepEqual(filter, { student: "student-123" });
    return query;
  };

  try {
    await new Promise((resolve, reject) => {
      const handler = route.stack.at(-1).handle;
      handler(
        { user: { id: "student-123" } },
        {
          status(code) {
            responseStatus = code;
            return this;
          },
          json(body) {
            responseBody = body;
            resolve();
          },
        },
        reject
      );
    });
  } finally {
    StudentGoal.find = originalFind;
  }

  assert.equal(responseStatus, 200);
  assert.deepEqual(responseBody.data, expectedGoals);
  assert.equal(query.selectFields, "goalTitle type status roleId origin previousGoalTitle changeReason createdAt updatedAt");
  assert.deepEqual(query.sortFields, { type: 1, updatedAt: -1 });
});
