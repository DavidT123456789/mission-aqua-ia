import React, { useState, useEffect, useMemo } from 'react';
import { Bot, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function TypewriterNode({ content, contentKey }: { content: React.ReactNode, contentKey: string }) {
  const [visibleCount, setVisibleCount] = useState(0);

  const getLen = (node: any): number => {
    if (typeof node === 'string' || typeof node === 'number') return String(node).length;
    if (Array.isArray(node)) return node.reduce((acc, n) => acc + getLen(n), 0);
    if (React.isValidElement(node)) {
      // @ts-ignore
      if (node.props && node.props.children) return getLen(node.props.children);
      return 1;
    }
    return 0;
  };

  const totalLength = useMemo(() => getLen(content), [contentKey]);

  useEffect(() => {
    setVisibleCount(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= totalLength) {
        setVisibleCount(totalLength);
        clearInterval(interval);
      } else {
        setVisibleCount(current);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [contentKey, totalLength]);

  const renderProgressive = (node: any, counter: { val: number }): React.ReactNode => {
    if (counter.val >= visibleCount) {
      if (typeof node === 'string' || typeof node === 'number') {
        const text = String(node);
        counter.val += text.length;
        return <span className="opacity-0">{text}</span>;
      }
      if (Array.isArray(node)) {
        return node.map((n, i) => <React.Fragment key={i}>{renderProgressive(n, counter)}</React.Fragment>);
      }
      if (React.isValidElement(node)) {
        // @ts-ignore
        if (node.props && node.props.children) {
          // @ts-ignore
          return React.cloneElement(node, { ...node.props, children: renderProgressive(node.props.children, counter) });
        }
        counter.val += 1;
        return <span className="opacity-0">{node}</span>;
      }
      return null;
    }

    if (typeof node === 'string' || typeof node === 'number') {
      const text = String(node);
      if (counter.val + text.length <= visibleCount) {
        counter.val += text.length;
        return text;
      } else {
        const diff = visibleCount - counter.val;
        counter.val += text.length;
        return (
          <>
            {text.slice(0, diff)}
            <span className="opacity-0">{text.slice(diff)}</span>
          </>
        );
      }
    }

    if (Array.isArray(node)) {
      return node.map((n, i) => <React.Fragment key={i}>{renderProgressive(n, counter)}</React.Fragment>);
    }

    if (React.isValidElement(node)) {
      // @ts-ignore
      if (node.props && node.props.children) {
        // @ts-ignore
        return React.cloneElement(node, { ...node.props, children: renderProgressive(node.props.children, counter) });
      }
      counter.val += 1;
      return node;
    }

    return node;
  };

  const counter = { val: 0 };
  return <span className="inline">{renderProgressive(content, counter)}</span>;
}

export default function NaiaDialogue({ message, emotion = 'neutral' }: { message: React.ReactNode; emotion?: 'neutral' | 'alert' | 'happy' }) {
  const [isMinimized, setIsMinimized] = useState(false);

  const expandedOuterWidth = window.innerWidth < 640 ? window.innerWidth - 32 : (window.innerWidth < 768 ? 288 : 320);
  const expandedInnerWidth = expandedOuterWidth - 32;

  // Derive a stable key from content text to prevent re-triggering typewriter on parent re-renders
  const contentKey = useMemo(() => {
    const extractText = (node: any): string => {
      if (typeof node === 'string' || typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(extractText).join('');
      if (React.isValidElement(node)) {
        // @ts-ignore
        if (node.props && node.props.children) return extractText(node.props.children);
      }
      return '';
    };
    return extractText(message);
  }, [message]);

  const getContainerStyles = () => {
    switch (emotion) {
      case 'alert': return 'text-red-300 border-red-500/50 bg-red-950/90 shadow-[0_0_20px_rgba(239,68,68,0.2)]';
      case 'happy': return 'text-emerald-300 border-emerald-500/50 bg-emerald-950/90 shadow-[0_0_20px_rgba(16,185,129,0.2)]';
      default: return 'text-purple-300 border-purple-500/50 bg-purple-950/90 shadow-[0_0_20px_rgba(168,85,247,0.2)]';
    }
  };

  const getIconColor = () => {
    switch (emotion) {
      case 'alert': return 'text-red-400 bg-red-900/40 border border-red-500/30';
      case 'happy': return 'text-emerald-400 bg-emerald-900/40 border border-emerald-500/30';
      default: return 'text-purple-400 bg-purple-900/40 border border-purple-500/30';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        width: isMinimized ? 56 : expandedOuterWidth,
        height: isMinimized ? 56 : 'auto',
        borderRadius: isMinimized ? 28 : 12,
        padding: isMinimized ? 0 : 16
      }}
      whileHover={isMinimized ? { scale: 1.1 } : {}}
      whileTap={isMinimized ? { scale: 0.95 } : {}}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        mass: 0.8
      }}
      className={`
        fixed top-20 right-4 md:top-24 md:right-6 z-[60] 
        flex flex-col border backdrop-blur-xl origin-top-right
        ${getContainerStyles()}
        ${isMinimized ? 'cursor-pointer hover:brightness-110 shadow-lg items-center justify-center' : ''}
      `}
      onClick={() => isMinimized && setIsMinimized(false)}
    >
      <AnimatePresence mode="wait">
        {!isMinimized ? (
          <motion.div 
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ width: expandedInnerWidth }}
            className="flex flex-col shrink-0 h-full overflow-visible"
          >
            <div className="flex items-center gap-2 mb-2 w-full pr-5 relative">
              <div className={`p-1.5 rounded-full shrink-0 flex items-center justify-center ${getIconColor()}`}>
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <span className={`font-bold not-italic tracking-widest uppercase text-xs ${emotion === 'alert' ? 'text-red-400' : emotion === 'happy' ? 'text-emerald-400' : 'text-purple-400'}`}>
                NAÏA
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                className="absolute top-0 -right-1.5 text-slate-400 hover:text-white transition-colors focus:outline-none bg-slate-900/50 hover:bg-slate-800/80 rounded-full p-1"
                title="Minimiser"
              >
                <span className="sr-only">Minimiser</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            <div className="text-xs sm:text-sm leading-normal italic w-full">
              <div key={contentKey} className="text-slate-200">
                <TypewriterNode content={message} contentKey={contentKey} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="minimized"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex items-center justify-center w-full h-full text-slate-100"
          >
            <Bot className={`w-6 h-6 animate-pulse ${emotion === 'alert' ? 'text-red-400' : emotion === 'happy' ? 'text-emerald-400' : 'text-purple-400'}`} />
            <MessageCircle className="w-4 h-4 absolute top-0 -right-1 text-white animate-bounce drop-shadow-md" fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
