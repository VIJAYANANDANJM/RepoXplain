import React, { useState, useRef, useEffect } from 'react';

const Chatbot = ({ repoData, summary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    if (!repoData) return {};
    const fileList = repoData.tree
      .filter(f => f.type === 'blob')
      .map(f => f.path)
      .slice(0, 100)
      .join('\n');
    return {
      owner: repoData.owner,
      repo: repoData.repo,
      description: repoData.description,
      language: repoData.language,
      techStack: summary?.techStack,
      summary: summary?.overview,
      fileList,
    };
  };

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          repoContext: buildContext(),
          history: messages.slice(-6),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ ' + (data.error || 'Something went wrong.') }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Network error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!repoData) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        className={`chat-fab${isOpen ? ' chat-fab-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Ask AI about this repo"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-header-icon">🤖</span>
            <div>
              <div className="chat-header-title">RepoXplain AI</div>
              <div className="chat-header-sub">Ask anything about {repoData.repo}</div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p>👋 Hi! I know everything about <strong>{repoData.owner}/{repoData.repo}</strong>.</p>
                <p>Try asking:</p>
                <div className="chat-suggestions">
                  {['What does this project do?', 'How is the project structured?', 'What tech stack is used?'].map((q, i) => (
                    <button key={i} className="chat-suggestion" onClick={() => { setInput(q); }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                <div className="chat-msg-bubble">
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg chat-msg-assistant">
                <div className="chat-msg-bubble chat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this repo..."
              disabled={loading}
            />
            <button className="chat-send" onClick={sendMessage} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
