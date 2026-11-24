import { test } from "node:test";
import assert from "node:assert/strict";
import Parent from "../models/Parent.js";
import { Institution } from "../models/Institution.js";
import { loginParent, loginInstitution } from "../controllers/extendedAuthController.js";

function invoke(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      cookie() {},
      json(body) {
        resolve({ statusCode: this.statusCode, body });
      },
    };
    handler(req, res, reject);
  });
}

async function withTokenSecrets(callback) {
  const previousAccessSecret = process.env.JWT_SECRET;
  const previousRefreshSecret = process.env.JWT_REFRESH_SECRET;
  process.env.JWT_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  try {
    await callback();
  } finally {
    if (previousAccessSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousAccessSecret;
    if (previousRefreshSecret === undefined) delete process.env.JWT_REFRESH_SECRET;
    else process.env.JWT_REFRESH_SECRET = previousRefreshSecret;
  }
}

test("parent demo credentials return 401 and create no account when none exists", async () => {
  const originalFindOne = Parent.findOne;
  const originalCreate = Parent.create;
  let created = 0;
  Parent.findOne = () => ({ select: async () => null });
  Parent.create = async () => {
    created += 1;
    throw new Error("Login must not create accounts");
  };

  try {
    await withTokenSecrets(async () => {
      await assert.rejects(
        invoke(loginParent, {
          body: { email: "parent.demo@preyeahh.com", password: "DemoParent123!" },
        }),
        (error) => error.statusCode === 401
      );
      assert.equal(created, 0);
    });
  } finally {
    Parent.findOne = originalFindOne;
    Parent.create = originalCreate;
  }
});

test("institution demo credentials return 401 and create no account when none exists", async () => {
  const originalFindOne = Institution.findOne;
  const originalSave = Institution.prototype.save;
  const originalComparePassword = Institution.prototype.comparePassword;
  let created = 0;
  Institution.findOne = () => ({ select: async () => null });
  Institution.prototype.save = async function save() {
    created += 1;
    return this;
  };
  Institution.prototype.comparePassword = async () => true;

  try {
    await withTokenSecrets(async () => {
      await assert.rejects(
        invoke(loginInstitution, {
          body: { email: "placement@nbkrist.org", password: "DemoInst123!" },
        }),
        (error) => error.statusCode === 401
      );
      assert.equal(created, 0);
    });
  } finally {
    Institution.findOne = originalFindOne;
    Institution.prototype.save = originalSave;
    Institution.prototype.comparePassword = originalComparePassword;
  }
});
