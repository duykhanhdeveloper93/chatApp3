
// ... import tất cả entity khác

import { ChatRoom } from "./chat-room.entity";
import { MessageAttachment } from "./message-attachment.entity";
import { Message } from "./message.entity";
import { Permission } from "./permission.entity";
import { Role } from "./role.entity";
import { User } from "./user.entity";

export const entities = [User,Role,Permission,MessageAttachment,Message,ChatRoom];
