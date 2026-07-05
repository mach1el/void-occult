import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChartDto } from "../../types/chart";

interface HistoryTurn {
  role: "user" | "model";
  text: string;
}

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  warning?: boolean;
}

interface AiChatProps {
  getContext(): {
    chartText: string;
    chart: ChartDto | null;
  };
}

const INTRO =
  "Chào bạn. Tôi có thể luận tổng quan mệnh cách, sự nghiệp, tài chính, tình duyên, sức khỏe hoặc đại vận/lưu niên của lá số đang hiển thị.";

function endpoint(): string {
  const configured =
    window.VOIDOCC_CONFIG?.BACKEND_URL ??
    import.meta.env.VITE_BACKEND_URL ??
    "";
  return String(configured).trim().replace(/\/+$/, "");
}

export function AiChat({ getContext }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "ai", text: INTRO },
  ]);
  const [history, setHistory] = useState<HistoryTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const messageBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = messageBox.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  function clear() {
    setHistory([]);
    setMessages([
      {
        id: nextId.current++,
        role: "ai",
        text: "Đã xoá hội thoại. Bạn muốn xem khía cạnh nào của lá số?",
      },
    ]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;

    const { chartText, chart } = getContext();
    if (!chartText || !chart) {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "ai",
          text: "Chưa có lá số hợp lệ để luận. Hãy kiểm tra lại dữ liệu sinh.",
          warning: true,
        },
      ]);
      return;
    }

    const requestHistory = history;
    const aiMessageId = nextId.current++;
    setInput("");
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: "user", text: question },
      { id: aiMessageId, role: "ai", text: "Đang luận giải…" },
    ]);

    try {
      const response = await fetch(`${endpoint()}/api/interpret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          chartText,
          chart,
          history: requestHistory,
        }),
      });
      if (!response.ok || !response.body) {
        let reason = `HTTP ${response.status}`;
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) reason = payload.error;
        } catch {
          // Response không phải JSON; giữ mã HTTP làm thông tin lỗi.
        }
        throw new Error(reason);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === aiMessageId
              ? { ...message, text: answer }
              : message,
          ),
        );
      }
      answer += decoder.decode();
      if (!answer.trim()) throw new Error("Backend không trả về nội dung");
      setHistory((current) => [
        ...current,
        { role: "user", text: question },
        { role: "model", text: answer },
      ]);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setMessages((current) =>
        current.map((message) =>
          message.id === aiMessageId
            ? {
                ...message,
                warning: true,
                text: `Không thể luận giải: ${reason}\n\nKiểm tra backend và route /api/interpret.`,
              }
            : message,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="chat-section">
      <div id="aiChat" className="ai-chat">
        <div className="ai-chat-panel">
          <div className="ai-chat-head">
            <div>
              <strong>Luận giải Tử Vi</strong>
            </div>
            <button
              type="button"
              className="ai-icon-btn"
              title="Xoá hội thoại"
              onClick={clear}
              disabled={busy}
            >
              🗑
            </button>
          </div>
          <div className="ai-chat-msgs" ref={messageBox} aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-msg ai-msg-${message.role}${message.warning ? " is-warn" : ""}`}
              >
                <div className="ai-msg-avatar" aria-hidden="true">
                  {message.role === "ai" ? "🔮" : "👤"}
                </div>
                <div className="ai-msg-content ai-plain-text">
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <form className="ai-chat-input" onSubmit={submit}>
            <textarea
              rows={1}
              value={input}
              disabled={busy}
              placeholder="Hỏi về sự nghiệp, tài chính, tình duyên, đại vận…"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="ai-send-btn"
              title="Gửi"
              disabled={busy || !input.trim()}
            >
              {busy ? "…" : "➤"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
