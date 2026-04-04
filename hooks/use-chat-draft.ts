"use client";

const PENDING_CHAT_DRAFT_KEY = "jazzbot.pending-chat-draft";

export interface PendingChatDraft {
  chatId: string;
  text: string;
}

export const readPendingDraft = (): PendingChatDraft | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PENDING_CHAT_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PendingChatDraft;
    return typeof parsed?.chatId === "string" ? parsed : null;
  } catch {
    return null;
  }
};

export const writePendingDraft = (draft: PendingChatDraft) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_CHAT_DRAFT_KEY, JSON.stringify(draft));
};

export const clearPendingDraft = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PENDING_CHAT_DRAFT_KEY);
};
