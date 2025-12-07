"use client";

import { useEffect, useRef, useState } from "react";
import { BiSend } from "react-icons/bi";
import EditorJS from '@editorjs/editorjs';
import UserService from "@/src/services/user-service";

const Home: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [context, setContext] = useState("");
  const accumulatedContent = useRef<string>('');
  
  useEffect(() => {
    let isMounted = true;

    const initEditor = async () => {
      if (editorRef.current || !holderRef.current) return;

      try {
        const EditorJS = (await import('@editorjs/editorjs')).default;
        const Header = (await import('@editorjs/header')).default;
        const ListTool = (await import('@editorjs/list')).default;
        const Paragraph = (await import('@editorjs/paragraph')).default;
        const CodeTool = (await import('@editorjs/code')).default;

        if (!isMounted) return;

        editorRef.current = new EditorJS({
          holder: holderRef.current,
          tools: {
            header: {
              class: Header,
              config: {
                levels: [1, 2, 3, 4],
                defaultLevel: 2
              }
            },
            list: {
              class: ListTool,
              inlineToolbar: true,
            },
            paragraph: {
              class: Paragraph,
              inlineToolbar: true,
            },
            code: CodeTool,
          },
          placeholder: 'AI responses will appear here...',
          minHeight: 0,
          readOnly: true
        });

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

  const updateEditorWithBlocks = async (jsonString: string) => {
    if (!editorRef.current) return;

    try {
      const data = JSON.parse(jsonString);
      
      if (data.blocks && Array.isArray(data.blocks)) {
        await editorRef.current.render({ blocks: data.blocks });
      }
    } catch (error) {
      console.log('Waiting for complete JSON...');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;

    setIsStreaming(true);
    accumulatedContent.current = '';

    try {
      const response = await UserService.chat(prompt, context);

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
                accumulatedContent.current += parsed.content;
                
                await updateEditorWithBlocks(accumulatedContent.current);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      await updateEditorWithBlocks(accumulatedContent.current);

    } catch (error) {
      console.error('Error:', error);
      
      if (editorRef.current) {
        await editorRef.current.render({
          blocks: [
            {
              type: 'paragraph',
              data: {
                text: 'Error: Something went wrong. Please try again.'
              }
            }
          ]
        });
      }
    } finally {
      setIsStreaming(false);
      setPrompt('');
      accumulatedContent.current = '';
    }
  };

  return (
  <main className="flex flex-col h-screen w-full p-4">
    <h1 className="text-4xl font-bold mb-4">AI ChatApp</h1>

    <div className="flex-1 overflow-y-auto mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        AI Response:
      </label>

      <div
        ref={holderRef}
        id="editorjs"
        className="border rounded-lg p-4 min-h-[400px] bg-white"
      />
    </div>

    <div className="w-full flex items-center gap-3 pb-2 pt-3 border-t bg-white">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e);
          }
        }}
        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
        className="flex-1 w-full text-black placeholder-gray-400 resize-none border border-gray-300 outline-none text-sm leading-relaxed rounded-lg p-2 min-h-[45px] max-h-[120px]"
        rows={1}
        style={{ height: 'auto' }}
      />

      <button
        onClick={(e) => handleSubmit(e)}
        className="w-11 h-11 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-900 transition shadow"
      >
        <BiSend className="w-5 h-5" />
      </button>
    </div>
  </main>

  );
};

export default Home;
