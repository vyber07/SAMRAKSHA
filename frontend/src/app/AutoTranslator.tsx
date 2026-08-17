import React, { useEffect, useRef } from 'react';

export function AutoTranslator({ language, getCsrfToken }: { language: string, getCsrfToken: () => string }) {
  const cache = useRef<Record<string, Record<string, string>>>({});
  const queue = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (language === 'en') return;

    let timeoutId: any = null;
    let pendingNodes: { node: Text, original: string }[] = [];

    const processQueue = () => {
      if (pendingNodes.length === 0) return;
      
      const uniqueTexts = [...new Set(pendingNodes.map(p => p.original))].filter(t => !cache.current[language]?.[t] && !queue.current.has(t));
      
      if (uniqueTexts.length > 0) {
        uniqueTexts.forEach(t => queue.current.add(t));
        
        // Use the new batch endpoint
        fetch("/api/v1/translate/batch", {
          method: "POST",
          credentials: "include",
          headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken()
          },
          body: JSON.stringify({ texts: uniqueTexts, target_lang: language, source_lang: "en" })
        })
        .then(res => res.json())
        .then(data => {
          if (!cache.current[language]) cache.current[language] = {};
          
          if (data.translations && Array.isArray(data.translations)) {
            uniqueTexts.forEach((text, i) => {
              const translated = data.translations[i];
              if (translated) {
                cache.current[language][text] = translated;
              }
              queue.current.delete(text);
            });
          }
          
          // Apply translations to nodes
          pendingNodes.forEach(({ node, original }) => {
            const trans = cache.current[language][original];
            if (trans && node.nodeValue !== trans) {
               node.nodeValue = trans;
            }
          });
          pendingNodes = [];
        })
        .catch(err => {
          console.error("Batch translation failed", err);
          uniqueTexts.forEach(t => queue.current.delete(t));
          pendingNodes = [];
        });
      } else {
         // All texts already in cache
         pendingNodes.forEach(({ node, original }) => {
            const trans = cache.current[language]?.[original];
            if (trans && node.nodeValue !== trans) {
               node.nodeValue = trans;
            }
          });
          pendingNodes = [];
      }
    };

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue?.trim();
        // Ignore empty strings, numbers, or single characters
        if (text && text.length > 1 && /[A-Za-z]/.test(text)) {
          // Skip if we already translated it
          const isAlreadyTranslated = Object.values(cache.current[language] || {}).includes(text);
          if (!isAlreadyTranslated) {
            // Save original text if not already saved
            const original = (node as any).__originalText || text;
            (node as any).__originalText = original;
            
            pendingNodes.push({ node: node as Text, original });
            clearTimeout(timeoutId);
            timeoutId = setTimeout(processQueue, 300);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'TEXTAREA' || el.hasAttribute('data-notranslate')) {
          return;
        }
        el.childNodes.forEach(translateNode);
      }
    };

    // Initial pass
    translateNode(document.body);

    // Observe changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(translateNode);
        } else if (mutation.type === 'characterData') {
           translateNode(mutation.target);
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [language, getCsrfToken]);

  return null;
}
