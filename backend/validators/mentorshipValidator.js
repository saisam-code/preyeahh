import { body, param, query } from "express-validator";

export const roleMentorsRules = [query("roleId").isMongoId().withMessage("Invalid role id")];
export const startConversationRules = [
  body("roleId").isMongoId().withMessage("Invalid role id"),
  body("guideId").isMongoId().withMessage("Invalid guide id"),
];
export const conversationIdRule = [param("id").isMongoId().withMessage("Invalid conversation id")];
export const sendMentorshipMessageRules = [
  ...conversationIdRule,
  body("content").isString().trim().notEmpty().isLength({ max: 2000 }).withMessage("Messages must be 1-2000 characters"),
];