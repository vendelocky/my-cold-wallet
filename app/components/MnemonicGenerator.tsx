"use client";

import React, { useState, useEffect } from 'react';
import { Box, Autocomplete, TextField, Button, IconButton, Snackbar, InputAdornment } from '@mui/material';
import * as bip39 from 'bip39';
import { generateKeys } from '../utils/keyGenerator';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate } from 'react-router-dom';
import crypto from "crypto"; 

type keys = {
  privateKey: string,
  publicKey: string,
  publicAddress: string,
};

const MnemonicGenerator = () => {
  const [wordList, setWordList] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState(Array(12).fill(''));
  const [isConfirmed, setIsConfirmed] = useState(false);
  // const [saltPhrase, setSaltPhrase] = useState(''); not using any saltPhrase / password for now!!!
  const [keys, setKeys] = useState<keys | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get the BIP39 word list (english version)
    const words = bip39.wordlists.english;
    setWordList(words);
  }, []);

  function findLastWord(words: string[]) {
    // in case of the words submitted are more or less than 11 words
    if (words.length !== 11) {
      throw new Error('You must provide exactly 11 words.');
    }
  
    // Convert the 11 words to their 11-bit indices (121 bits total)
    let entropyBits = words
      .map((word) => {
        const index = wordList.indexOf(word);
        if (index === -1) {
          throw new Error(`Invalid word: ${word}`);
        }
        return index.toString(2).padStart(11, '0'); // 11-bit binary
      })
      .join('');
  
    // Since we need 128 bits of entropy for a 12-word mnemonic,
    // we assume the first 121 bits are provided, and we need to find the last 7 bits of entropy + 4-bit checksum
    // Total bits needed = 128 (entropy) + 4 (checksum) = 132 bits
    // 11 words = 121 bits, so we need 11 more bits for the 12th word
  
    // Convert the 121 bits to bytes (truncate to 15 bytes + 7 bits)
    const entropyBitsPadded = entropyBits.padEnd(128, '0'); // Pad to 128 bits
    const entropyBytes = Buffer.from(
      (entropyBitsPadded.match(/.{1,8}/g) || []).map((byte) => parseInt(byte, 2))
    );
  
    // Compute SHA-256 hash of the 128-bit entropy
    const hash = crypto.createHash('sha256').update(entropyBytes).digest();
    const checksum = hash[0] >>> 4; // Take the first 4 bits of the hash
  
    // Combine the 128 entropy bits with the 4-bit checksum
    const finalBits = entropyBitsPadded + checksum.toString(2).padStart(4, '0');
  
    // Extract the last 11 bits for the 12th word
    const lastWordIndex = parseInt(finalBits.slice(-11), 2);
    const lastWord = wordList[lastWordIndex];
    const finalWords = [...words, lastWord];

    setSelectedWords(finalWords);
  }

  const handleWordChange = (value: string, index: number) => {
    const newWords = [...selectedWords];
    newWords[index] = value || '';
    setSelectedWords(newWords);

    /** Automatically calculate the 12th word when the first 11 words are filled and
     *  filter out 12th empty strings (because we started with length of 12 in the selectedWords array)
    */
    const filledWords = newWords.filter(word => word !== '' && word.trim().length > 0);
    if (filledWords.length >= 11) {
      findLastWord(filledWords);
    }
  };

  const handleConfirmClick = () => {
    setIsConfirmed(!isConfirmed);
    isConfirmed && setKeys(null);
  };

  const handleCreateKeyClick = () => {
    const mnemonic = selectedWords.join(' ');
    if (!bip39.validateMnemonic(mnemonic)) {
      alert('Invalid mnemonic. Please check your words.');
      return;
    }
    const generatedKeys = generateKeys(mnemonic, ''); // no salt / password is used for now
    setKeys(generatedKeys);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const allWordsFilled = selectedWords.every(word => word !== '');

  return (
    <div style={{ textAlign: 'center' }}>
      <Box sx={{ p: 3 }}>
        <Button variant="contained" color="info" onClick={() => navigate('/')}>
          Go Back to Main Page
        </Button>
        <Box sx={{m: 4}}>Create your own Mnemonic Seed Phrase</Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 12 }, (_, index) => (
            <Box key={index} sx={{ width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' }, }} >
              <Autocomplete
                value={selectedWords[index]}
                onChange={(_, newValue) => handleWordChange(newValue, index)}
                options={wordList}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`Word ${index + 1}`}
                    variant="outlined"
                    fullWidth
                    disabled={isConfirmed || index === 11}
                  />
                )}
                filterOptions={(options, { inputValue }) =>
                  options.filter((option) =>
                    option.toLowerCase().startsWith(inputValue.toLowerCase())
                  )
                }
                disabled={isConfirmed || index === 11}
              />
            </Box>
          ))}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirmClick}
          sx={{ mt: 3 }}
          disabled={!allWordsFilled}
        >
          {isConfirmed ? 'Back' : 'Confirm'}
        </Button>
        {isConfirmed && (
          <Box sx={{ mt: 3 }}>
              {/*<TextField
                  label="Enter your salt phrase (Optional)"
                  variant="outlined"
                  fullWidth
                  value={saltPhrase}
                  onChange={(e) => setSaltPhrase(e.target.value)}
              />*/}
              <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 3 }}
                  onClick={handleCreateKeyClick}
              >
                  Generate Keys
              </Button>
              {keys && (
              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Your EVM Public Address"
                  variant="outlined"
                  fullWidth
                  value={keys.publicAddress}
                  disabled
                  sx={{ mt: 2 }}
                  slotProps={{ 
                    input: { 
                      endAdornment: 
                      <InputAdornment position="end">
                        <CopyToClipboard text={keys.publicAddress} onCopy={() => setSnackbarOpen(true)}>
                          <IconButton>
                            <ContentCopyIcon />
                          </IconButton>
                        </CopyToClipboard>
                      </InputAdornment> 
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        )}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          message="Public address copied to clipboard"
        />
      </Box>
    </div>
  );
};

export default MnemonicGenerator;
