import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Palette, Delete, CornerDownLeft, Smile, Type, TerminalSquare, ArrowUp, Settings, ChevronUp, ChevronDown, Edit2, Plus, X } from 'lucide-react';

// Mock file system for autocomplete
const mockFiles = ['/sdcard/Download/script.py', '/sdcard/Documents/notes.txt', './main.cpp', './data.json', 'index.js'];

// --- Configuration & Data ---

// Chat-focused dictionaries
const dictionaries: Record<string, string[]> = {
  en: ["hello", "how", "are", "you", "what", "can", "do", "tell", "me", "about", "write", "a", "code", "for", "thanks", "good", "morning", "yes", "no", "please", "help", "explain", "this", "that", "the", "is", "to", "I", "am", "it", "in", "on", "with", "python", "script", "function", "and", "of", "as", "was", "be", "by", "not", "he", "i", "or", "his", "from", "at", "which", "but", "have", "an", "had", "they", "were", "their", "one", "all", "we", "her", "has", "there", "been", "if", "more", "when", "will", "would", "who", "so", "time", "up", "out", "get", "go", "make", "like", "know", "take", "see", "come", "think", "look", "want", "give", "use", "find", "say", "need", "work"]
};

// Chat-focused bigram dictionary for next-word prediction
const nextWordMap: Record<string, Record<string, string[]>> = {
  en: {
    "how": ["are", "to", "can", "do"],
    "are": ["you", "we", "they", "the"],
    "what": ["is", "are", "can", "do"],
    "can": ["you", "we", "I", "it"],
    "you": ["do", "help", "tell", "write"],
    "tell": ["me", "us", "him"],
    "write": ["a", "code", "an", "the"],
    "explain": ["this", "how", "the", "it"],
    "help": ["me", "with", "us"],
    "is": ["the", "a", "it", "this"],
    "do": ["you", "we", "it"],
    "for": ["me", "the", "a"],
    "a": ["python", "script", "function", "code"]
  }
};

const layouts: Record<string, string[][]> = {
  en: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['{spacer}', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '{spacer}'],
    ['{shift}', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '{backspace}'],
    ['{?123}', ',', '{space}', '.', '{enter}']
  ],
  symbols: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '_', '&', '-', '+', '(', ')', '/'],
    ['{abc}', '*', '"', '\'', ':', ';', '!', '?', '{backspace}'],
    ['{abc}', ',', '{space}', '.', '{enter}']
  ],
  emoji: [
    ['😀', '😂', '🥰', '😎', '🤔', '🙄', '😭', '😡', '👍', '👎'],
    ['🙏', '🔥', '✨', '🎉', '❤️', '💔', '💯', '🚀', '💻', '📱'],
    ['{abc}', '🐧', '🐍', '☕', '🍺', '🍕', '🍔', '{backspace}'],
    ['{abc}', ',', '{space}', '.', '{enter}']
  ]
};

// Gboard-like themes
const themes = {
  dark: {
    bg: 'bg-[#121212]', text: 'text-gray-100',
    keyboardBg: 'bg-[#1e1e1e]',
    keyBg: 'bg-[#383838]', keyText: 'text-gray-100', keyHover: 'active:bg-[#4a4a4a]',
    specialKeyBg: 'bg-[#2b2b2b]', specialKeyText: 'text-gray-300',
    accent: 'bg-blue-500', accentHover: 'active:bg-blue-400',
    termBg: 'bg-black', termText: 'text-green-400',
    suggestionBg: 'bg-[#1e1e1e]', suggestionText: 'text-gray-200'
  },
  light: {
    bg: 'bg-gray-100', text: 'text-gray-900',
    keyboardBg: 'bg-[#e0e3e7]',
    keyBg: 'bg-[#ffffff]', keyText: 'text-gray-900', keyHover: 'active:bg-[#f0f0f0]',
    specialKeyBg: 'bg-[#b4b8c1]', specialKeyText: 'text-gray-800',
    accent: 'bg-blue-500', accentHover: 'active:bg-blue-600',
    termBg: 'bg-white', termText: 'text-gray-900',
    suggestionBg: 'bg-[#e0e3e7]', suggestionText: 'text-gray-800'
  },
  hacker: {
    bg: 'bg-black', text: 'text-green-500',
    keyboardBg: 'bg-black border-t border-green-900',
    keyBg: 'bg-black border border-green-800', keyText: 'text-green-500', keyHover: 'active:bg-green-900',
    specialKeyBg: 'bg-[#0a1a0a] border border-green-800', specialKeyText: 'text-green-600',
    accent: 'bg-green-800', accentHover: 'active:bg-green-700',
    termBg: 'bg-black', termText: 'text-green-500',
    suggestionBg: 'bg-black border-b border-green-900', suggestionText: 'text-green-400'
  }
};

type Language = 'en';
type Mode = 'text' | 'symbols' | 'emoji';
type Theme = 'dark' | 'light' | 'hacker';

export default function App() {
  const [input, setInput] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [history, setHistory] = useState<string[]>(['LLM Chat Interface via Termux', 'Type a message...']);
  const [language, setLanguage] = useState<Language>('en');
  const [mode, setMode] = useState<Mode>('text');
  const [themeName, setThemeName] = useState<Theme>('dark');
  const [suggestions, setSuggestions] = useState<string[]>(['', '', '']);
  const [isShifted, setIsShifted] = useState(false);
  const [isCtrl, setIsCtrl] = useState(false);
  const [isAlt, setIsAlt] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [customCommands, setCustomCommands] = useState([
    { label: 'ls', cmd: 'ls -la\n' },
    { label: 'git', cmd: 'git status\n' },
    { label: 'clear', cmd: 'clear\n' },
    { label: 'grep', cmd: 'grep -r "" .\n' },
    { label: 'F1', cmd: '' }
  ]);
  const [editingCmdIdx, setEditingCmdIdx] = useState<number | null>(null);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const backspaceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backspaceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const inputRef = useRef(input);
  const cursorRef = useRef(cursorPos);
  
  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => { cursorRef.current = cursorPos; }, [cursorPos]);

  const theme = themes[themeName];

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history, input]);

  // Predictive text & Next-word logic
  useEffect(() => {
    if (mode !== 'text') {
      setSuggestions(['', '', '']);
      return;
    }

    const textBeforeCursor = input.slice(0, cursorPos);
    const words = textBeforeCursor.split(' ');
    const currentWord = words[words.length - 1].toLowerCase();
    const previousWord = words.length > 1 ? words[words.length - 2].toLowerCase() : '';

    let newSuggestions = ['', '', ''];

    // File autocomplete
    if (currentWord.startsWith('@') || currentWord.startsWith('/')) {
      const query = currentWord.startsWith('@') ? currentWord.slice(1) : currentWord;
      const matches = mockFiles.filter(f => f.includes(query)).slice(0, 3);
      setSuggestions([matches[0] || '', matches[1] || '', matches[2] || '']);
      return;
    }

    if (currentWord.length > 0) {
      // Suggest completions for the current word being typed
      const dict = dictionaries[language] || [];
      const matches = dict.filter(w => w.startsWith(currentWord) && w !== currentWord);
      
      newSuggestions[0] = currentWord; // Left: exact typed
      newSuggestions[1] = matches[0] || ''; // Center: best match
      newSuggestions[2] = matches[1] || ''; // Right: second best match
    } else if (previousWord.length > 0) {
      // Suggest the next word based on the previous word
      const nextWords = nextWordMap[language]?.[previousWord] || [];
      newSuggestions[0] = nextWords[1] || '';
      newSuggestions[1] = nextWords[0] || '';
      newSuggestions[2] = nextWords[2] || '';
    }

    setSuggestions(newSuggestions);
  }, [input, cursorPos, language, mode]);

  const insertText = (text: string) => {
    const newCursor = cursorRef.current + text.length;
    const newInput = inputRef.current.slice(0, cursorRef.current) + text + inputRef.current.slice(cursorRef.current);
    setInput(newInput);
    setCursorPos(newCursor);
  };

  const jumpWordBack = () => {
    const textBefore = inputRef.current.slice(0, cursorRef.current);
    const match = textBefore.match(/\S+\s*$/);
    setCursorPos(match ? cursorRef.current - match[0].length : 0);
  };

  const jumpWordForward = () => {
    const textAfter = inputRef.current.slice(cursorRef.current);
    const match = textAfter.match(/^\s*\S+/);
    setCursorPos(match ? cursorRef.current + match[0].length : inputRef.current.length);
  };

  const executeCommand = (cmdString: string) => {
    if (cmdString.endsWith('\n')) {
      const actualCmd = inputRef.current.slice(0, cursorRef.current) + cmdString.slice(0, -1) + inputRef.current.slice(cursorRef.current);
      if (actualCmd.trim()) {
        setHistory(prev => [...prev, `> ${actualCmd}`]);
        if (actualCmd.trim().toLowerCase() === 'clear') {
          setHistory([]);
        } else {
          setTimeout(() => {
            setHistory(prev => [...prev, `LLM: Executed "${actualCmd}".`]);
          }, 500);
        }
      }
      setInput('');
      setCursorPos(0);
    } else {
      insertText(cmdString);
    }
  };

  const handleKeyPress = (key: string) => {
    if (isAlt && key.toLowerCase() === 'b') { jumpWordBack(); setIsAlt(false); return; }
    if (isAlt && key.toLowerCase() === 'f') { jumpWordForward(); setIsAlt(false); return; }
    
    insertText(key);
    if (isShifted) setIsShifted(false); // Auto-unshift after one character like standard keyboards
  };

  const handleBackspace = useCallback(() => {
    if (cursorRef.current > 0) {
      const newCursor = cursorRef.current - 1;
      const newInput = inputRef.current.slice(0, newCursor) + inputRef.current.slice(cursorRef.current);
      setInput(newInput);
      setCursorPos(newCursor);
    }
  }, []);

  const startBackspace = () => {
    handleBackspace();
    backspaceTimeoutRef.current = setTimeout(() => {
      backspaceIntervalRef.current = setInterval(() => {
        handleBackspace();
      }, 50);
    }, 400);
  };

  const stopBackspace = () => {
    if (backspaceTimeoutRef.current) clearTimeout(backspaceTimeoutRef.current);
    if (backspaceIntervalRef.current) clearInterval(backspaceIntervalRef.current);
  };

  const handleEnter = () => {
    if (isShifted || isAlt) {
      insertText('\n');
      setIsShifted(false);
      setIsAlt(false);
      return;
    }

    if (input.trim()) {
      setHistory(prev => [...prev, `> ${input}`]);
      
      const cmd = input.trim().toLowerCase();
      if (cmd === 'clear') {
        setHistory([]);
      } else {
        // Mock LLM response
        setTimeout(() => {
          setHistory(prev => [...prev, `LLM: I received your message: "${input.trim()}". How can I help further?`]);
        }, 500);
      }
      
      setInput('');
      setCursorPos(0);
    }
  };

  const handleSpace = () => {
    insertText(' ');
  };

  const handleSuggestionClick = (word: string) => {
    if (!word) return;
    const textBefore = inputRef.current.slice(0, cursorRef.current);
    const textAfter = inputRef.current.slice(cursorRef.current);
    const words = textBefore.split(' ');
    const currentWord = words[words.length - 1];
    
    if (currentWord.length > 0) {
      words.pop();
      const prefix = words.length > 0 ? words.join(' ') + ' ' : '';
      const newText = prefix + word + ' ';
      setInput(newText + textAfter);
      setCursorPos(newText.length);
    } else {
      const newText = textBefore + word + ' ';
      setInput(newText + textAfter);
      setCursorPos(newText.length);
    }
  };

  const scrollTerminal = (direction: 'up' | 'down') => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop += direction === 'up' ? -150 : 150;
    }
  };

  const toggleTheme = () => {
    const themeKeys: Theme[] = ['dark', 'light', 'hacker'];
    const nextIndex = (themeKeys.indexOf(themeName) + 1) % themeKeys.length;
    setThemeName(themeKeys[nextIndex]);
  };

  const currentLayout = mode === 'text' ? layouts[language] : layouts[mode];

  const renderKey = (key: string, rowIndex: number, keyIndex: number) => {
    if (key === '{spacer}') {
      return <div key={`spacer-${rowIndex}-${keyIndex}`} className="flex-[0.5]" />;
    }

    let content: React.ReactNode = key;
    let flexClass = 'flex-[1]';
    let bgClass = theme.keyBg;
    let textClass = theme.keyText;
    let onAction = () => handleKeyPress(isShifted ? key.toUpperCase() : key);

    if (key.startsWith('{') && key.endsWith('}')) {
      bgClass = theme.specialKeyBg;
      textClass = theme.specialKeyText;
      const specialKey = key.slice(1, -1);
      
      switch (specialKey) {
        case 'shift':
          content = <ArrowUp size={20} className={isShifted ? "text-blue-500" : ""} />;
          flexClass = 'flex-[1.25]';
          onAction = () => setIsShifted(!isShifted);
          break;
        case 'backspace':
          content = <Delete size={20} />;
          flexClass = 'flex-[1.25]';
          // Action handled in pointer events for continuous delete
          break;
        case 'enter':
          content = <CornerDownLeft size={20} />;
          flexClass = 'flex-[1.5]';
          bgClass = theme.accent;
          textClass = 'text-white';
          onAction = handleEnter;
          break;
        case 'space':
          content = 'English';
          flexClass = 'flex-[4]';
          onAction = handleSpace;
          break;
        case '?123':
          content = '?123';
          flexClass = 'flex-[1.5]';
          onAction = () => setMode('symbols');
          break;
        case 'abc':
          content = 'ABC';
          flexClass = 'flex-[1.5]';
          onAction = () => setMode('text');
          break;
        case 'emoji':
          content = <Smile size={18} />;
          flexClass = 'flex-[1]';
          onAction = () => setMode('emoji');
          break;
      }
    } else {
      content = isShifted ? key.toUpperCase() : key;
    }

    const handlePointerDown = (e: React.PointerEvent) => {
      e.preventDefault(); // Prevents 300ms delay and focus loss
      if (key === '{backspace}') {
        startBackspace();
      } else {
        onAction();
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      e.preventDefault();
      if (key === '{backspace}') stopBackspace();
    };

    return (
      <button
        key={`${key}-${rowIndex}-${keyIndex}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`${flexClass} h-[42px] sm:h-[50px] rounded-[5px] flex items-center justify-center text-xl sm:text-2xl shadow-[0_1px_1px_rgba(0,0,0,0.2)] transition-colors select-none touch-manipulation ${bgClass} ${textClass} ${theme.keyHover}`}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={`flex flex-col h-screen w-full ${theme.bg} font-sans overflow-hidden transition-colors duration-300`}>
      
      {/* Header */}
      <header className={`flex justify-between items-center p-3 shadow-md z-10 ${theme.keyboardBg}`}>
        <div className={`flex items-center gap-2 ${theme.text} font-bold text-base`}>
          <TerminalSquare size={20} />
          <span>TermKey</span>
        </div>
        <div className="flex items-center gap-2">
          {showSettings && (
            <input 
              type="range" min="0.3" max="1" step="0.1" 
              value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-24 accent-blue-500"
            />
          )}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full ${theme.keyBg} ${theme.keyText} ${theme.keyHover} transition-colors`}
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme.keyBg} ${theme.keyText} ${theme.keyHover} transition-colors`}
            title="Toggle Theme"
          >
            <Palette size={18} />
          </button>
        </div>
      </header>

      {/* Terminal Display Area */}
      <div 
        ref={terminalRef}
        className={`flex-1 p-4 overflow-y-auto font-mono text-sm sm:text-base ${theme.termBg} ${theme.termText}`}
      >
        {history.map((line, i) => (
          <div key={i} className={`mb-2 whitespace-pre-wrap break-words ${line.startsWith('LLM:') ? 'opacity-80' : ''}`}>{line}</div>
        ))}
        <div className="flex items-start mt-2">
          <span className="mr-2 text-blue-400">{'>'}</span>
          <span className="break-words whitespace-pre-wrap">
            {input.slice(0, cursorPos)}
            <span className={`inline-block w-2 h-4 sm:h-5 -mb-1 animate-pulse ${themeName === 'light' ? 'bg-gray-900' : 'bg-green-500'}`} />
            {input.slice(cursorPos)}
          </span>
        </div>
      </div>

      {/* Keyboard Area */}
      <div 
        className={`w-full flex flex-col pb-safe ${theme.keyboardBg} shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]`}
        style={{ opacity: opacity }}
      >
        
        {/* Function Keys Row */}
        <div className={`flex overflow-x-auto hide-scrollbar items-center px-1 py-1 gap-1 border-b border-opacity-10 border-white ${theme.suggestionBg}`}>
          {customCommands.map((cmd, idx) => (
            <div key={idx} className="flex-shrink-0 flex items-center">
              <button
                onPointerDown={(e) => { e.preventDefault(); executeCommand(cmd.cmd); }}
                className={`min-w-[48px] px-2 h-8 ${showSettings ? 'rounded-l' : 'rounded'} text-sm font-mono flex items-center justify-center touch-manipulation select-none transition-colors ${theme.keyBg} ${theme.keyText} ${theme.keyHover}`}
              >
                {cmd.label}
              </button>
              {showSettings && (
                <button
                  onPointerDown={(e) => { e.preventDefault(); setEditingCmdIdx(idx); }}
                  className={`w-8 h-8 rounded-r flex items-center justify-center bg-gray-700 text-gray-200 active:bg-gray-600 border-l border-gray-600`}
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
          ))}
          {showSettings && (
            <button
              onPointerDown={(e) => { e.preventDefault(); setCustomCommands([...customCommands, { label: 'New', cmd: '' }]); }}
              className={`min-w-[36px] h-8 rounded text-sm font-mono flex items-center justify-center touch-manipulation select-none transition-colors ${theme.keyBg} ${theme.keyText} ${theme.keyHover}`}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Quick Access Row */}
        <div className={`flex overflow-x-auto hide-scrollbar items-center px-1 py-1 gap-1 border-b border-opacity-10 border-white ${theme.suggestionBg}`}>
          {['Tab', 'Ctrl', 'Alt', 'PgUp', 'PgDn', '|', '>', '<', '&', ';', '*', '~', '$', '#', '{', '}', '[', ']', '(', ')', '\\', '/', '-', '_', '=', '"', "'"].map(k => (
            <button
              key={k}
              onPointerDown={(e) => {
                e.preventDefault();
                if (k === 'Tab') insertText('\t');
                else if (k === 'Ctrl') setIsCtrl(!isCtrl);
                else if (k === 'Alt') setIsAlt(!isAlt);
                else if (k === 'PgUp') scrollTerminal('up');
                else if (k === 'PgDn') scrollTerminal('down');
                else insertText(k);
              }}
              className={`flex-shrink-0 min-w-[36px] h-8 rounded text-sm font-mono flex items-center justify-center touch-manipulation select-none transition-colors
                ${(k === 'Ctrl' && isCtrl) || (k === 'Alt' && isAlt) ? theme.accent + ' text-white' : theme.keyBg + ' ' + theme.keyText + ' ' + theme.keyHover}
              `}
            >
              {k === 'PgUp' ? <ChevronUp size={16}/> : k === 'PgDn' ? <ChevronDown size={16}/> : k}
            </button>
          ))}
        </div>

        {/* Predictive Text Bar */}
        <div className={`h-11 flex items-center justify-between w-full border-b border-opacity-10 border-white ${theme.suggestionBg}`}>
          {suggestions.some(s => s !== '') ? (
            <>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleSuggestionClick(suggestions[0]); }}
                className={`flex-1 h-full flex items-center justify-center text-base whitespace-nowrap overflow-hidden text-ellipsis px-2 touch-manipulation select-none ${theme.suggestionText} ${theme.keyHover} transition-colors`}
              >
                {suggestions[0]}
              </button>
              <div className="w-[1px] h-6 bg-gray-500 opacity-30"></div>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleSuggestionClick(suggestions[1]); }}
                className={`flex-1 h-full flex items-center justify-center text-base font-bold whitespace-nowrap overflow-hidden text-ellipsis px-2 touch-manipulation select-none ${theme.suggestionText} ${theme.keyHover} transition-colors`}
              >
                {suggestions[1]}
              </button>
              <div className="w-[1px] h-6 bg-gray-500 opacity-30"></div>
              <button
                onPointerDown={(e) => { e.preventDefault(); handleSuggestionClick(suggestions[2]); }}
                className={`flex-1 h-full flex items-center justify-center text-base whitespace-nowrap overflow-hidden text-ellipsis px-2 touch-manipulation select-none ${theme.suggestionText} ${theme.keyHover} transition-colors`}
              >
                {suggestions[2]}
              </button>
            </>
          ) : (
            <div className={`w-full text-center text-sm opacity-50 ${theme.text}`}>
              {mode === 'text' ? `Typing in ${language.toUpperCase()}` : mode.toUpperCase()}
            </div>
          )}
        </div>

        {/* Keys Grid */}
        <div className="p-1.5 sm:p-2 flex flex-col gap-1.5 sm:gap-2 w-full max-w-3xl mx-auto">
          {currentLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1.5 sm:gap-2 w-full">
              {row.map((key, keyIndex) => renderKey(key, rowIndex, keyIndex))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Edit Command Modal */}
      {editingCmdIdx !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className={`w-full max-w-sm p-5 rounded-lg shadow-2xl ${theme.keyboardBg} border border-gray-700`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-bold ${theme.text}`}>Edit Function Key</h3>
              <button onClick={() => setEditingCmdIdx(null)} className={theme.text}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-1 opacity-80 ${theme.text}`}>Label (e.g., 'ls')</label>
                <input 
                  type="text" 
                  value={customCommands[editingCmdIdx].label}
                  onChange={e => {
                    const newCmds = [...customCommands];
                    newCmds[editingCmdIdx].label = e.target.value;
                    setCustomCommands(newCmds);
                  }}
                  className="w-full p-2 rounded bg-black text-white border border-gray-600 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className={`block text-sm mb-1 opacity-80 ${theme.text}`}>Command (add \n to auto-enter)</label>
                <input 
                  type="text" 
                  value={customCommands[editingCmdIdx].cmd.replace(/\n/g, '\\n')}
                  onChange={e => {
                    const newCmds = [...customCommands];
                    newCmds[editingCmdIdx].cmd = e.target.value.replace(/\\n/g, '\n');
                    setCustomCommands(newCmds);
                  }}
                  className="w-full p-2 rounded bg-black text-white border border-gray-600 focus:border-blue-500 outline-none font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button 
                onClick={() => {
                  const newCmds = customCommands.filter((_, i) => i !== editingCmdIdx);
                  setCustomCommands(newCmds);
                  setEditingCmdIdx(null);
                }}
                className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={() => setEditingCmdIdx(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for hiding scrollbar in suggestion bar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
      `}} />
    </div>
  );
}
