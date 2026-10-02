import Guide from "../models/Guide.js";
import Role from "../models/Role.js";
import RoleInterest from "../models/RoleInterest.js";
import MentorshipConversation from "../models/MentorshipConversation.js";
import ApiError from "../utils/ApiError.js";

function idOf(value) {
  return value?._id?.toString() || value?.toString() || "";
}

function conversationDto(conversation) {
  const latestMessage = conversation.messages.at(-1);
  return {
    id: idOf(conversation._id),
    branch: conversation.branch,
    role: conversation.roleId?._id
      ? { id: idOf(conversation.roleId._id), title: conversation.roleId.title }
      : { id: idOf(conversation.roleId), title: "Role" },
    student: conversation.studentId?._id
      ? { id: idOf(conversation.studentId._id), name: conversation.studentId.name }
      : { id: idOf(conversation.studentId), name: "Student" },
    guide: conversation.guideId?._id
      ? { id: idOf(conversation.guideId._id), name: conversation.guideId.name }
      : { id: idOf(conversation.guideId), name: "Guide" },
    messages: conversation.messages.map((message) => ({
      id: idOf(message._id),
      senderId: idOf(message.senderId),
      senderRole: message.senderRole,
      content: message.content,
      createdAt: message.createdAt,
    })),
    hasUnreadForGuide: Boolean(
      latestMessage?.senderRole === "student" &&
      (!conversation.guideReadAt || latestMessage.createdAt > conversation.guideReadAt)
    ),
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
  };
}

async function getCommittedRole(student, roleId) {
  const role = await Role.findById(roleId);
  if (!role) throw ApiError.notFound("Role not found");
  if (role.branch !== student.branch) {
    throw ApiError.forbidden("You can only contact guides for roles in your branch");
  }

  const interest = await RoleInterest.findOne({ student: student.id, role: role._id, committed: true });
  if (!interest) throw ApiError.forbidden("Commit to this role before contacting its guides");
  return role;
}

export async function listRoleMentors(student, roleId) {
  const role = await getCommittedRole(student, roleId);
  const guides = await Guide.find({ branch: role.branch, status: "approved" })
    .select("name branch roleNames bio")
    .sort({ name: 1 })
    .lean();

  return guides
    .filter((guide) => guide.roleNames.some((name) => String(name).trim().toLowerCase() === role.title.toLowerCase()))
    .map((guide) => ({ id: guide._id, name: guide.name, branch: guide.branch, roleTitle: role.title, bio: guide.bio }));
}

export async function startConversation(student, { roleId, guideId }) {
  const role = await getCommittedRole(student, roleId);
  const guide = await Guide.findOne({ _id: guideId, branch: role.branch, status: "approved" }).select("name roleNames");
  if (!guide || !guide.roleNames.some((name) => String(name).trim().toLowerCase() === role.title.toLowerCase())) {
    throw ApiError.notFound("Approved guide for this role not found");
  }

  let conversation = await MentorshipConversation.findOne({ studentId: student.id, guideId: guide._id, roleId: role._id });
  if (!conversation) {
    try {
      conversation = await MentorshipConversation.create({
        studentId: student.id,
        guideId: guide._id,
        roleId: role._id,
        branch: role.branch,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await MentorshipConversation.findOne({ studentId: student.id, guideId: guide._id, roleId: role._id });
    }
  }

  return conversationDto(await MentorshipConversation.findById(conversation._id)
    .populate("studentId", "name")
    .populate("guideId", "name")
    .populate("roleId", "title"));
}

async function findConversationForUser(conversationId, user) {
  const filter = user.role === "student"
    ? { _id: conversationId, studentId: user.id }
    : { _id: conversationId, guideId: user.id };
  const conversation = await MentorshipConversation.findOne(filter)
    .populate("studentId", "name")
    .populate("guideId", "name")
    .populate("roleId", "title");
  if (!conversation) throw ApiError.notFound("Mentor conversation not found");
  return conversation;
}

export async function listConversations(user) {
  const filter = user.role === "student" ? { studentId: user.id } : { guideId: user.id };
  const conversations = await MentorshipConversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .slice("messages", -1)
    .populate("studentId", "name")
    .populate("guideId", "name")
    .populate("roleId", "title");
  return conversations.map(conversationDto);
}

export async function getConversation(conversationId, user) {
  const conversation = await findConversationForUser(conversationId, user);
  if (user.role === "guide") {
    conversation.guideReadAt = new Date();
    await conversation.save();
  }
  return conversationDto(conversation);
}

export async function sendConversationMessage(conversationId, user, content) {
  const conversation = await findConversationForUser(conversationId, user);
  conversation.messages.push({ senderId: user.id, senderRole: user.role, content: content.trim() });
  conversation.lastMessageAt = new Date();
  await conversation.save();
  return conversationDto(conversation);
}