"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CircuitBoard,
  Clipboard,
  Clock,
  Copy,
  Eraser,
  Languages,
  MessageSquare,
  PanelLeft,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import LoadingState from "@/components/ui/LoadingState";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/helpers";
import {
  deleteAllCircuitChats,
  deleteCircuitChat,
  getCircuitChats,
  saveCircuitChat,
} from "@/lib/firebase/circuit";
import type {
  CircuitChat,
  CircuitContext,
  CircuitMessage,
  CircuitUserProfileContext,
} from "@/types/circuit";

const RECENT_MESSAGE_LIMIT = 12;
const SUMMARY_THRESHOLD = 18;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatClock(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToInput(value: string[]) {
  return value.join(", ");
}

function buildProfile(user: ReturnType<typeof useUserStore.getState>["user"]): CircuitUserProfileContext {
  return {
    name: user?.displayName || "",
    exam: user?.targetExam || "",
    class: user?.classLevel || "",
    targetScore: "",
    preferredLanguage: user?.language || "",
    weakSubjects: [],
    strongSubjects: [],
    studyHoursPerDay: 0,
  };
}

function buildContext(
  profile: CircuitUserProfileContext,
  conversationSummary: string,
  messages: CircuitMessage[]
): CircuitContext {
  return {
    userProfile: profile,
    conversationSummary,
    recentMessages: messages.slice(-RECENT_MESSAGE_LIMIT).map((message) => ({
      role: message.role,
      content: message.content,
    })),
  };
}

function createChat(profile: CircuitUserProfileContext): CircuitChat {
  const now = new Date().toISOString();
  return {
    id: createId("chat"),
    uid: "",
    title: "New Circuit chat",
    messages: [],
    context: buildContext(profile, "", []),
    createdAt: now,
    updatedAt: now,
  };
}

function createTitle(content: string) {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > 46 ? `${clean.slice(0, 43)}...` : clean || "New Circuit chat";
}

export default function CircuitPage() {
  const { user, firebaseUid, isLoading: authLoading } = useUserStore();
  const [profile, setProfile] = useState<CircuitUserProfileContext>(() => buildProfile(null));
  const [chats, setChats] = useState<CircuitChat[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [profileDraft, setProfileDraft] = useState({
    targetScore: "",
    preferredLanguage: "",
    weakSubjects: "",
    strongSubjects: "",
    studyHoursPerDay: "0",
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatsRef = useRef<CircuitChat[]>([]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || chats[0],
    [chats, activeChatId]
  );

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    if (!user) return;

    const storageKey = firebaseUid ? `brain-circuit-profile-${firebaseUid}` : "";
    const saved = storageKey ? localStorage.getItem(storageKey) : null;
    const nextProfile = saved
      ? { ...buildProfile(user), ...JSON.parse(saved) }
      : buildProfile(user);

    setProfile(nextProfile);
    setProfileDraft({
      targetScore: nextProfile.targetScore,
      preferredLanguage: nextProfile.preferredLanguage,
      weakSubjects: listToInput(nextProfile.weakSubjects),
      strongSubjects: listToInput(nextProfile.strongSubjects),
      studyHoursPerDay: String(nextProfile.studyHoursPerDay || 0),
    });
  }, [user, firebaseUid]);

  useEffect(() => {
    if (!firebaseUid) return;

    let ignore = false;
    const storageKey = `brain-circuit-chats-${firebaseUid}`;

    async function loadChats() {
      const fallback = localStorage.getItem(storageKey);
      const fallbackChats = fallback ? (JSON.parse(fallback) as CircuitChat[]) : [];

      try {
        const remoteChats = await getCircuitChats(firebaseUid!);
        if (ignore) return;
        const nextChats = remoteChats.length > 0 ? remoteChats : fallbackChats;
        const seededChats = nextChats.length > 0 ? nextChats : [createChat(profile)];
        setChats(seededChats.map((chat) => ({ ...chat, uid: firebaseUid! })));
        setActiveChatId(seededChats[0]?.id || "");
      } catch {
        if (ignore) return;
        const seededChats = fallbackChats.length > 0 ? fallbackChats : [createChat(profile)];
        setChats(seededChats.map((chat) => ({ ...chat, uid: firebaseUid! })));
        setActiveChatId(seededChats[0]?.id || "");
      }
    }

    loadChats();

    return () => {
      ignore = true;
    };
  }, [firebaseUid]);

  useEffect(() => {
    if (!firebaseUid || chats.length === 0) return;

    const storageKey = `brain-circuit-chats-${firebaseUid}`;
    localStorage.setItem(storageKey, JSON.stringify(chats));

    const saveTimer = window.setTimeout(() => {
      chats
        .filter((chat) => chat.messages.length > 0)
        .forEach((chat) => {
          saveCircuitChat(firebaseUid, { ...chat, uid: firebaseUid }).catch(() => undefined);
        });
    }, 900);

    return () => window.clearTimeout(saveTimer);
  }, [chats, firebaseUid]);

  useEffect(() => {
    if (!firebaseUid) return;
    localStorage.setItem(`brain-circuit-profile-${firebaseUid}`, JSON.stringify(profile));
  }, [profile, firebaseUid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeChat?.messages, isThinking]);

  const updateActiveChat = (updater: (chat: CircuitChat) => CircuitChat) => {
    setChats((current) =>
      current.map((chat) => (chat.id === activeChatId ? updater(chat) : chat))
    );
  };

  const createNewChat = () => {
    if (!firebaseUid) return;
    const nextChat = { ...createChat(profile), uid: firebaseUid };
    setChats((current) => [nextChat, ...current]);
    setActiveChatId(nextChat.id);
    setInput("");
    setError("");
    setIsHistoryOpen(false);
  };

  const handleSaveProfile = () => {
    const nextProfile: CircuitUserProfileContext = {
      ...profile,
      targetScore: profileDraft.targetScore.trim(),
      preferredLanguage: profileDraft.preferredLanguage.trim(),
      weakSubjects: parseList(profileDraft.weakSubjects),
      strongSubjects: parseList(profileDraft.strongSubjects),
      studyHoursPerDay: Number(profileDraft.studyHoursPerDay) || 0,
    };

    setProfile(nextProfile);
    setChats((current) =>
      current.map((chat) => ({
        ...chat,
        context: buildContext(nextProfile, chat.context.conversationSummary, chat.messages),
      }))
    );
    setIsProfileOpen(false);
  };

  const handleCopy = async (message: CircuitMessage) => {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(""), 1200);
  };

  const applyDeleteOption = async (option: "last-message" | "last-exchange" | "clear" | "current" | "all") => {
    if (!activeChat || !firebaseUid || isStreaming) return;

    if (option === "all") {
      if (!window.confirm("Delete all Circuit chats from this device and your account?")) return;
      await deleteAllCircuitChats(firebaseUid).catch(() => undefined);
      const nextChat = { ...createChat(profile), uid: firebaseUid };
      localStorage.removeItem(`brain-circuit-chats-${firebaseUid}`);
      setChats([nextChat]);
      setActiveChatId(nextChat.id);
      return;
    }

    if (option === "current") {
      if (!window.confirm("Delete this Circuit chat?")) return;
      await deleteCircuitChat(firebaseUid, activeChat.id).catch(() => undefined);
      const remaining = chats.filter((chat) => chat.id !== activeChat.id);
      const nextChats = remaining.length > 0 ? remaining : [{ ...createChat(profile), uid: firebaseUid }];
      setChats(nextChats);
      setActiveChatId(nextChats[0].id);
      return;
    }

    updateActiveChat((chat) => {
      const nextMessages =
        option === "last-message"
          ? chat.messages.slice(0, -1)
          : option === "last-exchange"
            ? chat.messages.slice(0, -2)
            : [];

      return {
        ...chat,
        messages: nextMessages,
        context: buildContext(profile, option === "clear" ? "" : chat.context.conversationSummary, nextMessages),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const requestSummary = async (messages: CircuitMessage[], previousSummary: string) => {
    if (messages.length < SUMMARY_THRESHOLD) return previousSummary;

    const olderMessages = messages.slice(0, -RECENT_MESSAGE_LIMIT);
    if (olderMessages.length < 6) return previousSummary;

    try {
      const response = await fetch("/api/circuit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "summarize",
          previousSummary,
          messages: olderMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });
      const data = await response.json();
      return data.summary || previousSummary;
    } catch {
      return previousSummary;
    }
  };

  const streamMessage = async (messageText: string, retry = false) => {
    if (!activeChat || isStreaming || !firebaseUid) return;

    const wordCount = countWords(messageText);
    if (wordCount < 5) {
      setError("Please enter at least 5 words so Circuit can better understand your question.");
      return;
    }

    setError("");
    setIsStreaming(true);
    setIsThinking(true);

    const now = new Date().toISOString();
    const userMessage: CircuitMessage = {
      id: createId("user"),
      role: "user",
      content: messageText.trim(),
      createdAt: now,
      status: "complete",
    };
    const assistantMessage: CircuitMessage = {
      id: createId("assistant"),
      role: "assistant",
      content: "",
      createdAt: now,
      status: "streaming",
    };

    const baseMessages = retry
      ? activeChat.messages.filter((message) => message.status !== "error")
      : [...activeChat.messages, userMessage];

    const messagesWithAssistant = [...baseMessages, assistantMessage];
    const title = activeChat.messages.length === 0 && !retry ? createTitle(messageText) : activeChat.title;
    const requestContext = buildContext(profile, activeChat.context.conversationSummary, baseMessages);

    updateActiveChat((chat) => ({
      ...chat,
      title,
      messages: messagesWithAssistant,
      context: requestContext,
      updatedAt: now,
    }));

    setInput("");

    const controller = new AbortController();
    abortRef.current = controller;
    let streamedContent = "";

    try {
      const response = await fetch("/api/circuit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText.trim(),
          context: requestContext,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Circuit could not generate a response right now.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
          const event = eventBlock.match(/^event:\s*(.+)$/m)?.[1];
          const dataLine = eventBlock.match(/^data:\s*(.+)$/m)?.[1];
          if (!event || !dataLine) continue;

          const data = JSON.parse(dataLine);

          if (event === "token") {
            setIsThinking(false);
            streamedContent += data;
            setChats((current) =>
              current.map((chat) =>
                chat.id === activeChat.id
                  ? {
                      ...chat,
                      messages: chat.messages.map((message) =>
                        message.id === assistantMessage.id
                          ? { ...message, content: streamedContent, status: "streaming" }
                          : message
                      ),
                    }
                  : chat
              )
            );
          }

          if (event === "error") {
            throw new Error(String(data));
          }
        }
      }

      const currentChat = chatsRef.current.find((chat) => chat.id === activeChat.id);
      const finalMessages =
        currentChat?.messages.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, content: streamedContent, status: "complete" as const }
            : message
        ) || [];
      const summary = await requestSummary(finalMessages, activeChat.context.conversationSummary);

      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: finalMessages,
                context: buildContext(profile, summary, finalMessages),
                updatedAt: new Date().toISOString(),
              }
            : chat
        )
      );
    } catch (caught) {
      const message =
        caught instanceof Error && caught.name === "AbortError"
          ? "Circuit stopped. You can retry when ready."
          : caught instanceof Error
            ? caught.message
            : "Circuit could not generate a response right now.";

      setError(message);
      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: chat.messages.map((chatMessage) =>
                  chatMessage.id === assistantMessage.id
                    ? {
                        ...chatMessage,
                        content: streamedContent || message,
                        status: "error",
                      }
                    : chatMessage
                ),
              }
            : chat
        )
      );
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    streamMessage(input);
  };

  const lastUserMessage = useMemo(
    () => [...(activeChat?.messages || [])].reverse().find((message) => message.role === "user"),
    [activeChat?.messages]
  );

  if (authLoading || !activeChat) {
    return <LoadingState message="Opening Circuit..." />;
  }

  return (
    <main className="min-h-dvh pt-16 pb-36">
      <Header title="Circuit AI" />

      <div className="mx-auto flex w-full max-w-screen-2xl gap-4 px-4 pt-4 md:px-8">
        <div className="hidden lg:block">
          <HistoryPanel
            chats={chats}
            activeChatId={activeChat.id}
            onSelect={setActiveChatId}
            onNew={createNewChat}
            onClose={() => setIsHistoryOpen(false)}
          />
        </div>

        <AnimatePresence>
          {isHistoryOpen && (
            <HistoryPanel
              chats={chats}
              activeChatId={activeChat.id}
              onSelect={(chatId) => {
                setActiveChatId(chatId);
                setIsHistoryOpen(false);
              }}
              onNew={createNewChat}
              onClose={() => setIsHistoryOpen(false)}
            />
          )}
        </AnimatePresence>

        <section className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-gray-300 transition-default hover:bg-white/10 lg:hidden"
                aria-label="Open chat history"
              >
                <PanelLeft size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">
                  Student mentor
                </p>
                <h1 className="truncate font-display text-2xl font-black text-white">
                  {activeChat.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProfileOpen((value) => !value)}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-200 transition-default hover:bg-purple-500/20"
                aria-label="Learning profile"
              >
                <UserRound size={18} />
              </button>
              <button
                onClick={createNewChat}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand-vivid text-white shadow-glow transition-default hover:scale-105"
                aria-label="New chat"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">Learning profile</h2>
                    <p className="text-xs text-gray-400">Used to personalize Circuit across sessions.</p>
                  </div>
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-xl text-gray-400 hover:bg-white/10 hover:text-white"
                    aria-label="Close profile"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  <ProfileField
                    icon={<Target size={15} />}
                    label="Target score"
                    value={profileDraft.targetScore}
                    onChange={(value) => setProfileDraft((draft) => ({ ...draft, targetScore: value }))}
                  />
                  <ProfileField
                    icon={<Languages size={15} />}
                    label="Language"
                    value={profileDraft.preferredLanguage}
                    onChange={(value) => setProfileDraft((draft) => ({ ...draft, preferredLanguage: value }))}
                  />
                  <ProfileField
                    icon={<BookOpen size={15} />}
                    label="Weak subjects"
                    value={profileDraft.weakSubjects}
                    onChange={(value) => setProfileDraft((draft) => ({ ...draft, weakSubjects: value }))}
                  />
                  <ProfileField
                    icon={<Sparkles size={15} />}
                    label="Strong subjects"
                    value={profileDraft.strongSubjects}
                    onChange={(value) => setProfileDraft((draft) => ({ ...draft, strongSubjects: value }))}
                  />
                  <ProfileField
                    icon={<Clock size={15} />}
                    label="Hours per day"
                    type="number"
                    value={profileDraft.studyHoursPerDay}
                    onChange={(value) => setProfileDraft((draft) => ({ ...draft, studyHoursPerDay: value }))}
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition-default hover:bg-white/15"
                  >
                    Save profile
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            <DeleteAction
              icon={<Trash2 size={15} />}
              label="Last message"
              onClick={() => applyDeleteOption("last-message")}
              disabled={isStreaming || activeChat.messages.length === 0}
            />
            <DeleteAction
              icon={<RotateCcw size={15} />}
              label="Last exchange"
              onClick={() => applyDeleteOption("last-exchange")}
              disabled={isStreaming || activeChat.messages.length < 2}
            />
            <DeleteAction
              icon={<Eraser size={15} />}
              label="Clear chat"
              onClick={() => applyDeleteOption("clear")}
              disabled={isStreaming || activeChat.messages.length === 0}
            />
            <DeleteAction
              icon={<MessageSquare size={15} />}
              label="This chat"
              onClick={() => applyDeleteOption("current")}
              disabled={isStreaming}
            />
            <DeleteAction
              icon={<Clipboard size={15} />}
              label="All chats"
              onClick={() => applyDeleteOption("all")}
              disabled={isStreaming}
            />
          </div>

          <div className="min-h-[calc(100dvh-22rem)] rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-5">
            {activeChat.messages.length === 0 ? (
              <EmptyState onPrompt={(prompt) => setInput(prompt)} />
            ) : (
              <div className="space-y-4">
                {activeChat.messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    copied={copiedId === message.id}
                    onCopy={() => handleCopy(message)}
                  />
                ))}
                {isThinking && <ThinkingIndicator />}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="fixed bottom-[5.8rem] left-0 right-0 z-40 px-4 md:px-8">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-4xl items-end gap-2 rounded-3xl border border-white/10 bg-gray-950/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl"
        >
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                streamMessage(input);
              }
            }}
            rows={1}
            placeholder="Ask Circuit for concepts, quizzes, plans, or revision help..."
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white placeholder:text-gray-500"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300"
              aria-label="Stop response"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              type="submit"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand-vivid text-white shadow-glow transition-default hover:scale-105 disabled:opacity-50"
              disabled={countWords(input) < 5}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          )}
        </form>

        <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between gap-2 px-2">
          <p className={cn("text-xs", error ? "text-red-300" : "text-gray-500")}>
            {error || "Minimum 5 words. Circuit answers best with a little context."}
          </p>
          {error && lastUserMessage && !isStreaming && (
            <button
              onClick={() => streamMessage(lastUserMessage.content, true)}
              className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-purple-200"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

function HistoryPanel({
  chats,
  activeChatId,
  onSelect,
  onNew,
  onClose,
}: {
  chats: CircuitChat[];
  activeChatId: string;
  onSelect: (chatId: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="fixed inset-y-0 left-0 z-[120] w-[86vw] max-w-sm border-r border-white/10 bg-gray-950/95 p-4 pt-20 shadow-2xl backdrop-blur-2xl lg:sticky lg:top-20 lg:z-0 lg:block lg:h-[calc(100dvh-7rem)] lg:w-80 lg:rounded-3xl lg:border lg:pt-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Chats</h2>
          <p className="text-xs text-gray-500">Saved locally and to your account.</p>
        </div>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-xl text-gray-400 hover:bg-white/10 lg:hidden"
          aria-label="Close chat history"
        >
          <X size={18} />
        </button>
      </div>

      <button
        onClick={onNew}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand-vivid px-4 py-3 text-sm font-bold text-white shadow-glow"
      >
        <Plus size={17} />
        New chat
      </button>

      <div className="space-y-2 overflow-y-auto pr-1 lg:max-h-[calc(100dvh-16rem)]">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={cn(
              "w-full rounded-2xl border p-3 text-left transition-default",
              chat.id === activeChatId
                ? "border-purple-500/50 bg-purple-500/15"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            )}
          >
            <p className="truncate text-sm font-bold text-white">{chat.title}</p>
            <p className="mt-1 text-xs text-gray-500">
              {chat.messages.length} messages
            </p>
          </button>
        ))}
      </div>
    </motion.aside>
  );
}

function ProfileField({
  icon,
  label,
  value,
  type = "text",
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500">
        {icon}
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-gray-600"
        placeholder="Not set"
      />
    </label>
  );
}

function DeleteAction({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 text-xs font-bold text-gray-300 transition-default hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  const prompts = [
    "Make me a 7 day revision plan for Physics class 12 boards and JEE.",
    "Explain electrostatics potential in simple steps with one practice question.",
    "Create a NEET Biology quiz from human physiology with answers explained.",
  ];

  return (
    <div className="flex min-h-[52dvh] flex-col items-center justify-center px-2 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-5 grid h-20 w-20 place-items-center rounded-full border border-purple-300/30 bg-gradient-brand-vivid shadow-glow"
      >
        <CircuitBoard size={38} className="text-white" />
      </motion.div>
      <h2 className="font-display text-2xl font-black text-white">Ask Circuit anything</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-400">
        Get conceptual explanations, practice questions, study plans, and exam strategy in one focused chat.
      </p>

      <div className="mt-6 grid w-full max-w-3xl gap-3 md:grid-cols-3">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm font-semibold leading-6 text-gray-200 transition-default hover:border-purple-500/40 hover:bg-purple-500/10"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  copied,
  onCopy,
}: {
  message: CircuitMessage;
  copied: boolean;
  onCopy: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser && "justify-end")}
    >
      {!isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand-vivid shadow-glow">
          <CircuitBoard size={18} />
        </div>
      )}

      <div className={cn("group max-w-[88%] md:max-w-[76%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-3xl border px-4 py-3 text-sm leading-6 shadow-lg",
            isUser
              ? "rounded-br-lg border-purple-400/30 bg-purple-600/25 text-white"
              : "rounded-bl-lg border-white/10 bg-gray-950/70 text-gray-100",
            message.status === "error" && "border-red-500/30 bg-red-500/10 text-red-100"
          )}
        >
          {message.content ? (
            <MarkdownContent content={message.content} />
          ) : (
            <ThinkingIndicator compact />
          )}
        </div>

        <div className={cn("mt-1 flex items-center gap-2 px-2 text-[10px] text-gray-500", isUser && "justify-end")}>
          <span>{formatClock(message.createdAt)}</span>
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-gray-500 opacity-100 transition-default hover:bg-white/10 hover:text-gray-200 md:opacity-0 md:group-hover:opacity-100"
          >
            <Copy size={11} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
        code: ({ className, children, ...props }: any) => {
          const isBlock = /language-/.test(className || "");
          return isBlock ? (
            <code
              className="my-3 block overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-3 text-xs text-purple-100"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-purple-100" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function ThinkingIndicator({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 text-purple-200", compact ? "py-1" : "px-3 py-2")}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-300" />
      </span>
      <span className="text-sm font-semibold">Circuit is thinking...</span>
      <span className="flex gap-1">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-1.5 w-1.5 rounded-full bg-blue-300"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
          />
        ))}
      </span>
    </div>
  );
}
