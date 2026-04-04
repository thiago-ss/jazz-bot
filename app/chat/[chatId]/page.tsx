import { ChatPageLoader } from "@/components/chat-page-loader";

export default async function ChatIdPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  return <ChatPageLoader chatId={chatId} />;
}
