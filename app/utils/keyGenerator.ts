import * as bip39 from 'bip39';
import * as ethWallet from 'ethereumjs-wallet';
import { saveAs } from 'file-saver';

export const generateKeys = (mnemonic: string, saltPhrase: string) => {
  // Generate seed from mnemonic and salt phrase
  const seed = bip39.mnemonicToSeedSync(mnemonic, saltPhrase);

  // Generate Ethereum wallet from seed
  const wallet = ethWallet.hdkey.fromMasterSeed(seed).getWallet();

  // Get keys and address
  const privateKey = wallet.getPrivateKeyString();
  const publicKey = wallet.getPublicKeyString();
  const publicAddress = wallet.getAddressString();
  
  // Create text file content
  const fileContent = `Private Key: ${privateKey}\nPublic Key: ${publicKey}\nPublic Address: ${publicAddress}\n\nwords: ${mnemonic}\n\n\nDO NOT SHARE THIS FILE WITH ANYONE!`;
  // Create a Blob from the text content
  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  // Save the file
  saveAs(blob, `${publicAddress}.txt`);

  return { privateKey, publicKey, publicAddress };
};