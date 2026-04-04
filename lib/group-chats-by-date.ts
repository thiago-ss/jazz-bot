import type { ChatSummary } from "@/components/chat-api";

export interface ChatGroup {
  label: string;
  chats: ChatSummary[];
}

export function groupChatsByDate(chats: ChatSummary[]): ChatGroup[] {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - 86_400_000;
  const weekStart = todayStart - 6 * 86_400_000;

  const groups: ChatGroup[] = [
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "This week", chats: [] },
    { label: "Earlier", chats: [] },
  ];

  for (const chat of chats) {
    const ts = chat.updatedAt ?? chat.createdAt ?? 0;
    if (ts >= todayStart) groups[0].chats.push(chat);
    else if (ts >= yesterdayStart) groups[1].chats.push(chat);
    else if (ts >= weekStart) groups[2].chats.push(chat);
    else groups[3].chats.push(chat);
  }

  return groups.filter((g) => g.chats.length > 0);
}
