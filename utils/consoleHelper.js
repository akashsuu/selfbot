import { exec } from 'child_process';

// ANSI terminal colors
export const colors = {
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
  pink: "\x1b[38;2;255;192;203m",
  lightGreen: "\x1b[92m",
  lightYellow: "\x1b[93m",
  lightMagenta: "\x1b[95m",
  lightCyan: "\x1b[96m",
  lightRed: "\x1b[91m",
  lightBlue: "\x1b[94m"
};

/**
 * Sets terminal window transparency using a PowerShell script to invoke User32 APIs.
 * @param {number} transparency - Opacity level between 0.0 (completely transparent) and 1.0 (opaque)
 */
export function makeConsoleTransparent(transparency = 0.3) {
  if (process.platform !== 'win32') return;

  const alpha = Math.floor(255 * (1 - transparency));
  const psScript = `
    $definition = @'
    [DllImport("user32.dll")]
    public static extern IntPtr GetConsoleWindow();
    [DllImport("user32.dll")]
    public static extern int GetWindowLong(IntPtr hWnd, int nIndex);
    [DllImport("user32.dll")]
    public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
    [DllImport("user32.dll")]
    public static extern bool SetLayeredWindowAttributes(IntPtr hWnd, uint crKey, byte bAlpha, uint dwFlags);
    '@
    $type = Add-Type -MemberDefinition $definition -Name "ConsoleTransparency" -Namespace "WinAPI" -PassThru
    $hwnd = $type::GetConsoleWindow()
    $style = $type::GetWindowLong($hwnd, -20) # GWL_EXSTYLE
    $style = $style -bor 0x80000 # WS_EX_LAYERED
    $null = $type::SetWindowLong($hwnd, -20, $style)
    $null = $type::SetLayeredWindowAttributes($hwnd, 0, ${alpha}, 2) # LWA_ALPHA
  `;

  // Run the PowerShell script silently
  const b64 = Buffer.from(psScript, 'utf16le').toString('base64');
  exec(`powershell -NoProfile -NonInteractive -EncodedCommand ${b64}`, (err) => {
    if (err) console.error("Failed to set console transparency via PowerShell:", err.message);
  });
}

/**
 * Sets the terminal title.
 * @param {string} title 
 */
export function setConsoleTitle(title) {
  process.stdout.write(`\x1b]0;${title}\x07`);
}

// Renders the akashsuu loading/startup animation.
export async function showStartupAnimation() {
  const qqq = colors.magenta;
  const white = colors.white;
  const p1 = colors.lightMagenta;

  const asciiArt = `${qqq}
                         akashsuu
                         selfbot loading
${white}                         cmd + termux ready${qqq}`;
  const snow = ['*', '.', '+', ':'];
  const titles = ["akashsuu", "purple-white", "akashsuu", "purple-white"];
  const barLength = 20;
  const totalIterations = 50;

  for (let i = 0; i < totalIterations; i++) {
    console.clear();
    setConsoleTitle(titles[i % 4]);

    for (let j = 0; j < 40; j++) {
      const x = Math.floor(Math.random() * 80) + 1;
      const y = Math.floor(Math.random() * 20) + 1;
      process.stdout.write(`\x1b[${y};${x}H${snow[Math.floor(Math.random() * snow.length)]}`);
    }

    process.stdout.write(`\x1b[H${asciiArt}`);

    const percentage = ((i + 1) / totalIterations) * 100;
    const progress = Math.floor((percentage / 100) * barLength);
    const bar = '#'.repeat(progress) + '-'.repeat(barLength - progress);

    console.log(`\n${white}Loading: ${p1}[${bar}] ${percentage.toFixed(0)}%${white}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  setConsoleTitle("akashsuu | Selfbot V.1 JS Edition");
  console.clear();
}
