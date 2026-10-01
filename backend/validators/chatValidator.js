import { body, param, query } from "express-validator";

export const chatIdParamRule = [param("chatId").isMongoId().withMessage("Invalid chat id")];

export const listChatsRules = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
];

export const createChatRules = [
  body("title").optional().isString().trim().isLength({ max: 200 }),
  body("topic").optional().isString().trim().isLength({ max: 200 }),
  body("roleId").optional({ nullable: true, values: "falsy" }).isMongoId().withMessage("Invalid role id"),
];

export const updateChatRules = [
  ...chatIdParamRule,
  body("title").optional().isString().trim().isLength({ min: 1, max: 200 }),
  body("topic").optional().isString().trim().isLength({ max: 200 }),
  body().custom((_, { req }) => {
    if (req.body.title === undefined && req.body.topic === undefined) {
      throw new Error("At least one of title or topic is required");
    }
    return true;
  }),
];

export const sendMessageRules = [
  ...chatIdParamRule,
  body("message").isString().trim().notEmpty().withMessage("Message is required").isLength({ max: 4000 }).withMessage("Message is too long (max 4000 characters)"),
];
