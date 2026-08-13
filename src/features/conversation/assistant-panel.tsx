'use client';

import { useState } from 'react';
import { Bot, ClipboardList, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiError, publicApi, type PublicApi } from '@/lib/api/client';

interface ChatMessage {
  readonly role: 'user' | 'bot' | 'system';
  readonly content: string;
}

export function AssistantPanel(
  props: Readonly<{
    api?: PublicApi;
    onOpenForm?: () => void;
    onSessionExpired?: () => void;
    compact?: boolean;
  }>,
) {
  const api = props.api ?? publicApi;
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setInput('');
    setError(undefined);
    setPending(true);
    setMessages((current) => [...current, { role: 'user', content: text }]);
    try {
      const key = crypto.randomUUID();
      const id = conversationId ?? (await api.createConversation(`${key}:conversation`)).data.id;
      if (!conversationId) setConversationId(id);
      const result = await api.botReply(id, text, `${key}:bot`);
      const guidance =
        result.data.mode === 'disabled'
          ? 'Le formulaire reste disponible pour créer votre demande.'
          : result.data.mode === 'unavailable'
            ? "L’assistant est momentanément indisponible : utilisez le formulaire."
            : result.data.reply ?? 'Le formulaire reste disponible.';
      setMessages((current) => [...current, { role: result.data.mode === 'reply' ? 'bot' : 'system', content: guidance }]);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        props.onSessionExpired?.();
        return;
      }
      setError(reason instanceof ApiError ? reason.message : "L'assistant est indisponible. Utilisez le formulaire.");
    } finally {
      setPending(false);
    }
  }

  const content = (
    <>
      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          Décrivez votre problème : l’assistant peut vous orienter avant la création.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((message, index) => (
            <li
              key={`${message.role}-${index}`}
              className={`max-w-[85%] rounded-xl border px-3 py-2 text-sm leading-5 ${
                message.role === 'user'
                  ? 'ml-auto bg-blue-700 text-white'
                  : message.role === 'system'
                    ? 'bg-amber-50 text-amber-950'
                    : 'bg-slate-100 text-slate-900'
              }`}
            >
              {message.content}
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ex. Ma ligne coupe depuis hier…"
          aria-label="Message pour l’assistant"
        />
        <Button type="submit" disabled={!input.trim() || pending} className="shrink-0">
          <Send className="size-4" />{pending ? '…' : 'Envoyer'}
        </Button>
      </form>
      {props.onOpenForm ? (
        <Button variant="link" size="sm" className="h-auto px-0 text-blue-700" onClick={props.onOpenForm}>
          <ClipboardList className="size-3.5" />Créer ma demande avec le formulaire
        </Button>
      ) : (
        <a
          href="#formulaire"
          className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 hover:underline"
        >
          <ClipboardList className="size-3.5" />Créer ma demande avec le formulaire
        </a>
      )}
    </>
  );

  if (props.compact) {
    return <div className="flex min-h-0 flex-1 flex-col gap-3">{content}</div>;
  }
  return (
    <Card className="mb-6">
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
        <span className="grid size-9 place-items-center rounded-lg bg-blue-100 text-blue-800"><Bot className="size-5" /></span>
        <div>
          <CardTitle className="text-base">Assistant support</CardTitle>
          <p className="text-xs text-muted-foreground">Posez une question avant de créer votre demande.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">{content}</CardContent>
    </Card>
  );
}
