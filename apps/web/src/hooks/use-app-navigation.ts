import { useNavigate } from "react-router-dom";
import { buildChatPath, type RequestedChatSession } from "@/lib/chat-history";
import { pathForPage, type PageId } from "@/lib/navigation";

export function useAppNavigation() {
  const navigate = useNavigate();

  return {
    navigateToPage(pageId: PageId) {
      navigate(pathForPage(pageId));
    },
    navigateToChat(session: RequestedChatSession) {
      navigate(buildChatPath(session.profileId, session.sessionId));
    },
  };
}
