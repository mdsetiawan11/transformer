'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [input, setInput] = useState('The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second tallest free-standing structure in France after the Millau Viaduct.');
  const [output, setOutput] = useState('');
  const [ready, setReady] = useState<boolean | null>(null);
  const [progressItems, setProgressItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker('/worker.js', { type: 'module' });
    }

    const onMessageReceived = (e: MessageEvent) => {
      switch (e.data.status) {
        case 'initiate':
          setReady(false);
          setProgressItems(prev => [...prev, e.data]);
          break;
        case 'progress':
          setProgressItems(prev => prev.map(item => {
            if (item.file === e.data.file) {
              return { ...item, progress: e.data.progress };
            }
            return item;
          }));
          break;
        case 'done':
          setProgressItems(prev => prev.filter(item => item.file !== e.data.file));
          break;
        case 'ready':
          setReady(true);
          break;
        case 'complete':
          setOutput(e.data.output[0].summary_text);
          setIsProcessing(false);
          break;
      }
    };

    worker.current.addEventListener('message', onMessageReceived);

    return () => worker.current?.removeEventListener('message', onMessageReceived);
  }, []);

  const summarize = () => {
    setIsProcessing(true);
    worker.current?.postMessage({ text: input });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100 font-sans selection:bg-white/20">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-light mb-2 tracking-tight text-white">
          Summarizer
        </h1>
        <p className="text-zinc-500 mb-8 text-sm">
          Client-side inference powered by Transformers.js
        </p>

        <div className="space-y-6">
          <div className="relative group">
            <textarea
              className="w-full p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:ring-0 outline-none transition-all resize-none text-zinc-300 placeholder-zinc-600 text-sm leading-relaxed"
              rows={12}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter text to summarize..."
            />
            <div className="absolute bottom-3 right-3 text-xs text-zinc-600 pointer-events-none">
              {input.length} chars
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={summarize}
              disabled={isProcessing || (ready === false)}
            >
              {isProcessing ? 'Processing...' : 'Summarize'}
            </button>
          </div>

          <div className="space-y-2">
            {progressItems.map(data => (
              <div key={data.file} className="bg-zinc-900 rounded border border-zinc-800 p-3">
                <div className="flex justify-between text-xs mb-2 text-zinc-400">
                  <span className="truncate max-w-[200px]">{data.file}</span>
                  <span>{Math.round(data.progress)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1">
                  <div
                    className="bg-white h-1 rounded-full transition-all duration-300"
                    style={{ width: `${data.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {output && (
            <div className="mt-12 pt-8 border-t border-zinc-900 animate-in fade-in duration-700">
              <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">Summary</h2>
              <p className="text-zinc-300 leading-7 text-sm">{output}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
