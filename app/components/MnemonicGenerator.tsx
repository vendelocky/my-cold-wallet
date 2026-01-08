"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as bip39 from "bip39";
import { generateKeys } from "../utils/keyGenerator";
import {
  EyeIcon,
  EyeOffIcon,
  SearchIcon,
  InfoIcon,
  CheckIcon,
  RefreshIcon,
  CopyIcon,
  DownloadIcon,
  ShuffleIcon,
  TrashIcon,
  WarningIcon,
  CloseIcon,
  ShieldIcon
} from "./Icons";

const MnemonicGenerator = () => {
  const [wordList, setWordList] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<(string | null)[]>(Array(11).fill(null));
  const [checksumWord, setChecksumWord] = useState<string | null>(null);
  const [showChecksumModal, setShowChecksumModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [randomWords, setRandomWords] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showWords, setShowWords] = useState<boolean[]>(Array(12).fill(false));
  const [showChecksumWord, setShowChecksumWord] = useState(false);

  useEffect(() => {
    setWordList(bip39.wordlists.english);
    generateRandomWords();
  }, []);

  const filteredWords = useMemo(() => {
    return wordList.filter(
      w => w.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
  }, [wordList, searchTerm]);

  const selectedCount = selectedWords.filter(Boolean).length;
  const progressPercent = (selectedCount / 11) * 100;

  // Generate random words from BIP-39 wordlist
  const generateRandomWords = () => {
    if (wordList.length === 0) return;
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    setRandomWords(shuffled.slice(0, 5));
  };

  // Add word to next available slot
  const addWord = (word: string) => {
    const idx = selectedWords.findIndex(w => w === null);
    if (idx !== -1) {
      const newWords = [...selectedWords];
      newWords[idx] = word;
      setSelectedWords(newWords);

      // Add to recently used if not already there
      if (!recentlyUsed.includes(word)) {
        setRecentlyUsed(prev => [word, ...prev].slice(0, 5));
      }
    }
  };

  // Remove word from slot
  const removeWord = (idx: number) => {
    const newWords = [...selectedWords];
    newWords[idx] = null;
    setSelectedWords(newWords);
    setChecksumWord(null);
  };

  // Shuffle selected words
  const shuffleWords = () => {
    const words = selectedWords.filter(Boolean) as string[];
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    setSelectedWords([...words, ...Array(11 - words.length).fill(null)]);
    setChecksumWord(null);
  };

  // Clear all
  const clearAll = () => {
    setSelectedWords(Array(11).fill(null));
    setChecksumWord(null);
  };

  // Calculate checksum (12th word)
  const calculateChecksum = () => {
    try {
      const words = selectedWords.filter(Boolean) as string[];
      const indices = words.map(w => wordList.indexOf(w));
      if (indices.some(i => i === -1)) throw new Error("Invalid word");

      // Convert the 11 words to their 11-bit indices (121 bits total)
      const entropyBits = indices.map(i => i.toString(2).padStart(11, "0")).join("");

      /** Since we need 128 bits of entropy for a 12-word mnemonic,
       * we assume the first 121 bits are provided, and we need to find the last 7 bits of entropy + 4-bit checksum
       * Total bits needed = 128 (entropy) + 4 (checksum) = 132 bits
       * 11 words = 121 bits, so we need 11 more bits for the 12th word
      */

      // Convert the 121 bits to bytes (truncate to 15 bytes + 7 bits)
      const entropyBitsPadded = entropyBits.padEnd(128, "0"); // Pad to 128 bits
      const entropyBytes = Buffer.from(
        (entropyBitsPadded.match(/.{1,8}/g) || []).map((byte) => parseInt(byte, 2))
      );

      // Compute SHA-256 hash of the 128-bit entropy
      const crypto = require("crypto");
      const hash = crypto.createHash("sha256").update(entropyBytes).digest();
      const checksum = hash[0] >>> 4; // Take the first 4 bits of the hash

      // Combine the 128 entropy bits with the 4-bit checksum
      const finalBits = entropyBitsPadded + checksum.toString(2).padStart(4, "0");

      // Extract the last 11 bits for the 12th word
      const lastWordIndex = parseInt(finalBits.slice(-11), 2);

      setChecksumWord(wordList[lastWordIndex]);
      setShowChecksumWord(false);
      setShowChecksumModal(true);
    } catch (e) {
      alert("Error calculating checksum: " + e);
    }
  };

  // Add checksum word to phrase
  const addChecksumToPhrase = () => {
    setShowChecksumModal(false);
    if (checksumWord) {
      setShowSuccessModal(true);
    }
  };

  // Get full phrase including checksum
  const getFullPhrase = () => {
    const words = selectedWords.filter(Boolean) as string[];
    if (checksumWord) {
      return [...words, checksumWord];
    }
    return words;
  };

  // Copy phrase to clipboard
  const copyPhrase = async () => {
    const phrase = getFullPhrase().join(" ");
    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy to clipboard");
    }
  };

  // Toggle visibility for a specific word slot
  const toggleWordVisibility = (idx: number) => {
    const newShowWords = [...showWords];
    newShowWords[idx] = !newShowWords[idx];
    setShowWords(newShowWords);
  };

  // Save keys using generateKeys function
  const saveToFiles = () => {
    const phrase = getFullPhrase().join(" ");
    try {
      generateKeys(phrase, "");
    } catch (e) {
      alert("Error generating keys: " + e);
    }
  };

  return (
    <div className="min-h-screen pb-8">

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">Create Your Mnemonic Phrase</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Select 11 words from the list below. The 12th word will be automatically calculated as a checksum.
            This phrase will be used to generate your wallet&apos;s private keys.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="sticky top-0 z-50 bg-[#1a1f2e] py-4 mb-8 -mx-6 px-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{selectedCount}/11 words selected</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Search Words Column */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Search Words</h2>
            <div className="relative mb-4">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <SearchIcon />
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  onClick={() => setSearchTerm("")}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
            <div className="h-64 overflow-y-auto space-y-2">
              {filteredWords.map(word => (
                <div
                  key={word}
                  className="word-card"
                  onClick={() => addWord(word)}
                >
                  {word}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">Click on a word to add it to your phrase.</p>
          </div>

          {/* Random Words Column */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-2">Random Words</h2>
            <p className="text-sm text-gray-400 mb-4">
              Generate random words from the BIP-39 wordlist.
            </p>
            <button
              className="btn btn-primary w-full mb-4"
              onClick={generateRandomWords}
            >
              Generate 5 Random Words
            </button>
            <div className="space-y-2">
              {randomWords.map(word => (
                <div
                  key={word}
                  className="random-word-item"
                  onClick={() => addWord(word)}
                >
                  {word}
                </div>
              ))}
            </div>
            <div className="info-alert mt-4">
              <span className="info-alert-icon"><InfoIcon /></span>
              <p className="text-sm text-blue-300">
                Using random words increases security but may be harder to remember.
              </p>
            </div>
          </div>
        </div>

        {/* Your Mnemonic Phrase Section */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Mnemonic Phrase</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {selectedWords.map((word, idx) => (
              <div
                key={idx}
                className={`word-slot relative group ${word ? "filled" : ""}`}
              >
                <div className="flex justify-between items-center w-full mb-1">
                  <span className="word-slot-number">{idx + 1}</span>
                  {word && (
                    <div className="absolute -top-2 right-2 flex items-center gap-2 bg-[#1e293b] rounded z-20 px-1">
                      <button
                        className="text-gray-400 hover:text-blue-400 transition-colors p-0.5"
                        onClick={(e) => { e.stopPropagation(); toggleWordVisibility(idx); }}
                      >
                        {showWords[idx] ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-400 transition-colors p-0.5"
                        onClick={(e) => { e.stopPropagation(); removeWord(idx); }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
                <span className={word ? "text-white" : "text-gray-500"}>
                  {word ? (showWords[idx] ? word : "••••••") : "Select word"}
                </span>
              </div>
            ))}
            {/* 12th slot for checksum */}
            <div
              className={`word-slot checksum relative group ${checksumWord ? "filled" : ""}`}
            >
              <div className="flex justify-between items-center w-full mb-1">
                <span className="word-slot-number">12</span>
                {checksumWord && (
                  <div className="absolute -top-2 right-2 flex items-center gap-1 bg-[#1e293b] rounded z-20 px-1">
                    <button
                      className="text-gray-400 hover:text-blue-400 transition-colors p-0.5"
                      onClick={(e) => { e.stopPropagation(); toggleWordVisibility(11); }}
                    >
                      {showWords[11] ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-400 transition-colors p-0.5"
                      onClick={(e) => { e.stopPropagation(); setChecksumWord(null); }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </div>
              <span className="text-blue-400 flex items-center justify-center gap-1">
                {checksumWord ? (showWords[11] ? checksumWord : "••••••") : "Checksum"}
              </span>
            </div>
          </div>

          {/* Slot actions */}
          <div className="flex justify-between items-center text-sm">
            <button
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              onClick={clearAll}
            >
              <TrashIcon /> Clear All
            </button>
            <button
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              onClick={shuffleWords}
            >
              <ShuffleIcon /> Shuffle Order
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            className="btn btn-outline"
            onClick={calculateChecksum}
            disabled={selectedCount !== 11}
            style={{ opacity: selectedCount !== 11 ? 0.5 : 1 }}
          >
            <RefreshIcon /> Calculate Checksum
          </button>
          <button
            className="btn btn-success"
            disabled={!checksumWord}
            style={{ opacity: !checksumWord ? 0.5 : 1 }}
            onClick={() => checksumWord && setShowSuccessModal(true)}
          >
            <ShieldIcon /> Verify
          </button>
        </div>

        {/* Security Warning */}
        <div className="security-warning">
          <div className="security-warning-title">
            <WarningIcon /> Security Warning
          </div>
          <div className="security-warning-item">
            <span>- Never share your mnemonic phrase with anyone.</span>
          </div>
          <div className="security-warning-item">
            <span>- Store it in a secure, offline location.</span>
          </div>
          <div className="security-warning-item">
            <span>- Anyone with access to your phrase can access your funds.</span>
          </div>
        </div>
      </main>

      {/* Checksum Modal */}
      {showChecksumModal && (
        <div className="modal-overlay" onClick={() => setShowChecksumModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowChecksumModal(false)}><CloseIcon /></button>
            <h2 className="text-xl font-bold text-white mb-4">Calculating Checksum</h2>

            <div className="info-alert mb-4">
              <span className="info-alert-icon"><InfoIcon /></span>
              <div>
                <p className="font-medium text-blue-300">Checksum Word Calculated</p>
                <p className="text-sm text-blue-200">
                  The 12th word has been calculated based on your first 11 words.
                </p>
              </div>
            </div>

            <div className="checksum-display mb-4">
              <p className="text-sm text-gray-400 mb-2">Your checksum word (12th word):</p>
              <div className="flex items-center justify-center gap-3">
                <p className="checksum-word">{showChecksumWord ? checksumWord : "••••••"}</p>
                <button
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowChecksumWord(!showChecksumWord)}
                >
                  {showChecksumWord ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              This word completes your 12-word mnemonic phrase and ensures its integrity.
              It&apos;s calculated using a mathematical algorithm based on your first 11 words.
            </p>

            <button className="btn btn-primary w-full" onClick={addChecksumToPhrase}>
              Add to My Phrase
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="success-check">
              <CheckIcon />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Mnemonic Phrase Complete!
            </h2>
            <p className="text-gray-400 text-center mb-4">
              Your 12-word mnemonic phrase has been successfully created.
            </p>

            <div className="word-grid">
              {getFullPhrase().map((word, idx) => (
                <div
                  key={idx}
                  className={`word-grid-item ${idx === 11 ? "highlighted" : ""}`}
                >
                  <div className="flex justify-between items-center w-full mb-1">
                    <div className="word-grid-number">{idx + 1}</div>
                    <button
                      className="text-gray-400 hover:text-white transition-colors"
                      onClick={(e) => { e.stopPropagation(); toggleWordVisibility(idx); }}
                      style={{ marginBottom: "0.25rem" }}
                    >
                      {showWords[idx] ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                  <div className="font-medium">{showWords[idx] ? word : "••••••"}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mb-4">
              <button className="btn btn-secondary flex-1" onClick={copyPhrase}>
                <CopyIcon /> {copied ? "Copied!" : "Copy"}
              </button>
              <button className="btn btn-success flex-1" onClick={saveToFiles}>
                <DownloadIcon /> Save
              </button>
            </div>

            <button
              className="text-gray-400 hover:text-white text-center w-full text-sm"
              onClick={() => setShowSuccessModal(false)}
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MnemonicGenerator;
