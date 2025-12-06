"use client";

import { useEffect, useRef, useState } from "react";
import { BiSend } from "react-icons/bi";
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';

const Home: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const streamingBlockRef = useRef<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [context, setContext] = useState("");
  
   useEffect(() => {
    let isMounted = true;

    const initEditor = async () => {
      if (editorRef.current || !holderRef.current) return;

      try {
        // Dynamic imports
        const EditorJS = (await import('@editorjs/editorjs')).default;
        const Header = (await import('@editorjs/header')).default;
        const ListTool = (await import('@editorjs/list')).default;
        const ParagraphTool = (await import('@editorjs/paragraph')).default;

        if (!isMounted) return;

        editorRef.current = new EditorJS({
          holder: holderRef.current,
          tools: {
            header: Header,
            list: ListTool,
            paragraph: {
              class: ParagraphTool,
              inlineToolbar: true,
            },
          },
          placeholder: 'AI responses will appear here...',
          minHeight: 0,
        });

        // Wait for editor to be ready
        await editorRef.current.isReady;
      } catch (error) {
        console.error('Failed to initialize Editor.js:', error);
      }
    };

    initEditor();

    return () => {
      isMounted = false;
      if (editorRef.current) {
        try {
          if (typeof editorRef.current.destroy === 'function') {
            editorRef.current.destroy();
          }
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
        editorRef.current = null;
      }
    };
  }, []);

  const appendToEditor = async (content: string) => {
    if (!editorRef.current) return;

    try {
      streamingBlockRef.current += content;
      
      const data = await editorRef.current.save();
      const blocks = data.blocks || [];

      // Update the last block or create new one
      if (blocks.length > 0 && blocks[blocks.length - 1].type === 'paragraph') {
        blocks[blocks.length - 1].data.text = streamingBlockRef.current;
      } else {
        blocks.push({
          type: 'paragraph',
          data: { text: streamingBlockRef.current },
        });
      }

      await editorRef.current.render({ blocks });
    } catch (error) {
      console.error('Error updating editor:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    setIsStreaming(true);
    streamingBlockRef.current = '';

    try {
      const response = await fetch('http://localhost:8080/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                await appendToEditor(parsed.content);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      await appendToEditor('\n\nError: Something went wrong. Please try again.');
    } finally {
      setIsStreaming(false);
      streamingBlockRef.current = '';
      setPrompt('');
    }
  };

  return (
    <main className="h-full">
      <h1 className="text-4xl font-bold">AI ChatApp</h1>
      <div className="h-full">
         <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">
          AI Response:
        </label>
      </div>
      <div
        ref={holderRef}
        id="editorjs"
        className="border rounded-lg p-4 min-h-[400px] bg-white"
      />
      {/* {isStreaming && (
        <div className="mt-2 text-sm text-blue-600">
          ⚡ Streaming response...
        </div>
      )} */}
        <div className="flex items-center justify-center w-full gap-3 sticky bottom-0">
          <div className="flex-1">
           <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSubmit(e);
                }
              }}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="w-full text-black placeholder-black-400 resize-none border border-[#000000] outline-none text-sm leading-relaxed rounded min-h-[50px] max-h-[120px]"
              rows={1}
              // disabled={isLoading}
              style={{ height: 'auto' }}
            />
          </div>
          <div>
            <button
              onClick={(e) => handleSubmit(e)}
              // disabled={isLoading || !value.trim()}
              className="flex-shrink-0 w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 disabled:from-gray-600 disabled:to-gray-700 rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
              {false ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <BiSend className="w-4 h-4 text-black" />
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
