import { Router } from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import auth from "../../middlewares/auth";
import { chatController } from "./chat.controller";

const router = Router();

router.get("/conversion-list", auth(), chatController.getConversationList);
router.get(
  "/get-single-message/:conversationId",
  auth(),
  chatController.getSingleMessageList
);
router.post(
  "/chat-image-upload",
  auth(),
  fileUploader.chatImage,
  chatController.chatImageUpload
);
router.post(
  "/audio-upload",
  auth(),
  fileUploader.audio,
  chatController.chatAudioUrlUpload
);
router.patch(
  "/read-message/:conversationId",
  auth(),
  chatController.markMessagesAsRead
);

export const chatRoute = router;
