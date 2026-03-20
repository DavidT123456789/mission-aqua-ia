import React, { useState, useEffect, useMemo } from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { soundManager } from '../utils/soundManager';

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
        // Play typing sound occasionally for a better feel
        if (current % 4 === 0) {
          soundManager.playTyping();
        }
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
      case 'alert': return 'glass-red';
      case 'happy': return 'glass-emerald';
      default: return 'glass-purple';
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        mass: 0.8,
        delay: 0.15
      }}
      className={`
        relative w-full rounded-xl p-3
        flex flex-col border
        ${getContainerStyles()}
      `}
    >
      {/* Glitch effect for alert mode */}
      {emotion === 'alert' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-10">
          <div className="absolute inset-0 bg-red-500/10" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-1.5 w-full">
        <div className={`p-1.5 rounded-full shrink-0 flex items-center justify-center relative ${getIconColor()}`}>
          <Bot className="w-3.5 h-3.5" />
        </div>
        <span className={`font-bold not-italic tracking-[0.2em] uppercase text-[10px] ${emotion === 'alert' ? 'text-red-400 text-glow-purple' : emotion === 'happy' ? 'text-emerald-400 text-glow-emerald' : 'text-purple-400 text-glow-purple'}`}>
          NAÏA <span className="opacity-50 font-normal ml-1">v2.5</span>
        </span>
      </div>
      
      <div className="text-xs sm:text-sm leading-snug italic w-full">
        <div key={contentKey} className="text-slate-100/90 font-medium">
          <TypewriterNode content={message} contentKey={contentKey} />
        </div>
      </div>
    </motion.div>
  );
}
