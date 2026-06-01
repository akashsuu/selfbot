#!/data/data/com.termux/files/usr/bin/sh

printf "\n==========================================\n"
printf "          akashsuu SELFBOT JS\n"
printf "==========================================\n\n"

if ! command -v node >/dev/null 2>&1; then
  printf "[!] Node.js is not installed.\n"
  printf "[!] Run: pkg install nodejs\n"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf "[!] npm is not installed.\n"
  printf "[!] Run: pkg install nodejs\n"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  printf "[+] Installing Node dependencies...\n"
  npm install || exit 1
fi

printf "[+] Starting client...\n"
printf "==========================================\n"
node ./index.js

printf "\n==========================================\n"
printf "[!] Client stopped.\n"
