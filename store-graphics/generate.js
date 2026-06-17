const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'output');
fs.mkdirSync(OUT, { recursive: true });

const logoPath = path.join(__dirname, '../web/public/assets/logo.png');
const logoB64 = fs.readFileSync(logoPath).toString('base64');
const logoSrc = `data:image/png;base64,${logoB64}`;

const heroPath = path.join(__dirname, '../web/public/assets/hero_astrology.png');
const heroB64 = fs.readFileSync(heroPath).toString('base64');
const heroSrc = `data:image/png;base64,${heroB64}`;

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const CSS_VARS = `
  :root {
    --bg:     #06061a;
    --bg2:    #0d0d2b;
    --bg3:    #111138;
    --card:   #14143a;
    --cyan:   #00e5ff;
    --purple: #a855f7;
    --pink:   #ec4899;
    --gold:   #f59e0b;
    --text:   #e2e8f0;
    --muted:  #94a3b8;
    --border: rgba(168,85,247,0.25);
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background:var(--bg); color:var(--text); overflow:hidden; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function starsBg() {
  const stars = Array.from({length:150}).map(()=>{
    const x=Math.random()*100, y=Math.random()*100, r=Math.random()*1.4+.3;
    const op = (Math.random()*0.6+0.3).toFixed(2);
    return `<circle cx="${x}%" cy="${y}%" r="${r}" fill="white" opacity="${op}"/>`;
  }).join('');
  return `<svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none" xmlns="http://www.w3.org/2000/svg">${stars}</svg>`;
}

function glowOrb(color, size, top, left, opacity=0.15) {
  return `<div style="position:absolute;top:${top};left:${left};width:${size};height:${size};border-radius:50%;background:${color};filter:blur(${parseInt(size)*0.6}px);opacity:${opacity};pointer-events:none"></div>`;
}

function statusBar(w) {
  if (w > 900) return '';
  return `<div style="height:28px;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:space-between;padding:0 20px;font-size:11px;color:#94a3b8;flex-shrink:0;z-index:20;position:relative">
    <span style="font-weight:600">9:41</span>
    <span style="display:flex;gap:6px;align-items:center">
      <svg width="15" height="11" viewBox="0 0 15 11"><rect x="0" y="3" width="3" height="8" rx="1" fill="#94a3b8"/><rect x="4" y="2" width="3" height="9" rx="1" fill="#94a3b8"/><rect x="8" y="1" width="3" height="10" rx="1" fill="#94a3b8"/><rect x="12" y="0" width="3" height="11" rx="1" fill="#00e5ff"/></svg>
      <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="0" width="14" height="11" rx="2" stroke="#94a3b8" stroke-width="1" fill="none"/><rect x="1" y="1" width="11" height="9" rx="1" fill="#00e5ff"/><rect x="14.5" y="3.5" width="1" height="4" rx=".5" fill="#94a3b8"/></svg>
    </span>
  </div>`;
}

function navBar() {
  return `<div style="height:58px;background:rgba(10,10,35,.98);border-top:1px solid rgba(168,85,247,.3);display:flex;align-items:center;justify-content:space-around;flex-shrink:0;z-index:20;position:relative">
    ${[['🏠','Home',true],['⭐','Astrologers',false],['🔮','Kundli',false],['💬','Chat',false],['👤','Profile',false]].map(([icon,label,active])=>`
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 10px;border-radius:12px;${active?'background:rgba(168,85,247,.15)':''}">
        <span style="font-size:20px">${icon}</span>
        <span style="font-size:9px;color:${active?'var(--cyan)':'var(--muted)'};">${label}</span>
      </div>`).join('')}
  </div>`;
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
function homeScreen(w, h) {
  const isTablet = w >= 900;
  const isLargeTablet = h >= 2000;
  const isLandscape = w > h;
  const heroSize = isLandscape ? 200 : isLargeTablet ? 340 : (isTablet ? 260 : 180);
  const pad = isLargeTablet ? '0 64px' : isTablet ? '0 48px' : '0 18px';

  const services = [
    {icon:'🔮',label:'Vedic\nAstrology'},
    {icon:'🃏',label:'Tarot\nReading'},
    {icon:'📿',label:'Numerology'},
    {icon:'🏠',label:'Vastu\nShastra'},
    {icon:'✋',label:'Palmistry'},
    {icon:'🌙',label:'Horoscope'},
  ];

  const astrologers = [
    {name:'Pandit Rajesh',spec:'Vedic & Kundli',rate:'₹25/min',rating:'4.9',avail:true,emoji:'🧙‍♂️'},
    {name:'Dr. Priya Sharma',spec:'Tarot & Numerology',rate:'₹20/min',rating:'4.8',avail:true,emoji:'🔮'},
    {name:'Guru Arjun',spec:'Vastu & Palmistry',rate:'₹30/min',rating:'4.7',avail:false,emoji:'🌟'},
    {name:'Acharya Mohan',spec:'Horoscope',rate:'₹18/min',rating:'4.9',avail:true,emoji:'☯️'},
  ];

  // Responsive font helper: phone / tablet / large-tablet sizes
  const t = (p, t, l=t*1.4) => `${isLargeTablet ? Math.round(l) : isTablet ? t : p}px`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${CSS_VARS}
    .cta { background:linear-gradient(135deg,var(--purple),var(--cyan));border:none;padding:${isLargeTablet?'20px 52px':isTablet?'14px 36px':'11px 28px'};border-radius:50px;color:white;font-size:${t(14,17)};font-weight:700;letter-spacing:.3px }
    .stat-card { background:var(--card);border:1px solid var(--border);border-radius:${isLargeTablet?18:14}px;padding:${isLargeTablet?'22px 28px':isTablet?'14px 20px':'10px 14px'};text-align:center;flex:1 }
    .svc-chip { background:var(--card);border:1px solid var(--border);border-radius:${isLargeTablet?18:14}px;padding:${isLargeTablet?'20px 12px':isTablet?'12px 8px':'10px 6px'};display:flex;flex-direction:column;align-items:center;gap:6px;flex:1 }
    .astro-card { background:var(--card);border:1px solid var(--border);border-radius:${isLargeTablet?18:14}px;padding:${isLargeTablet?'16px 18px':'10px 12px'};display:flex;gap:12px;align-items:center }
    .how-step { background:var(--card);border:1px solid var(--border);border-radius:${isLargeTablet?18:14}px;padding:${isLargeTablet?'24px 20px':'14px 12px'};text-align:center;flex:1;display:flex;flex-direction:column;align-items:center;gap:${isLargeTablet?10:6}px }
  </style></head>
  <body style="width:${w}px;height:${h}px;overflow:hidden">
    <div style="position:relative;width:${w}px;height:${h}px;display:flex;flex-direction:column;background:linear-gradient(180deg,#08082a 0%,#0c0c30 40%,#080820 100%)">
      ${starsBg()}
      ${glowOrb('var(--purple)', '500px', '-180px', '-120px', 0.18)}
      ${glowOrb('var(--cyan)', '350px', `${h*0.3}px`, `${w-180}px`, 0.12)}
      ${glowOrb('var(--pink)', '250px', `${h*0.65}px`, '-80px', 0.08)}

      ${statusBar(w)}

      <!-- Header -->
      <div style="padding:${isLargeTablet?'20px 64px':isTablet?'14px 48px':'10px 18px'};display:flex;align-items:center;justify-content:space-between;flex-shrink:0;z-index:10">
        <img src="${logoSrc}" style="height:${isLargeTablet?64:isTablet?44:32}px;width:auto"/>
        <div style="display:flex;gap:10px;align-items:center">
          <div style="background:rgba(0,229,255,.1);border:1px solid rgba(0,229,255,.3);border-radius:20px;padding:${isLargeTablet?'8px 18px':'5px 12px'};font-size:${t(12,13)};color:var(--cyan);font-weight:600">₹500 💰</div>
          <div style="width:${isLargeTablet?42:30}px;height:${isLargeTablet?42:30}px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:${t(13,14,18)}px;font-weight:700">V</div>
        </div>
      </div>

      <!-- Body -->
      <div style="flex:1;display:flex;flex-direction:column;padding:${pad};gap:${isLargeTablet?24:isTablet?16:12}px;overflow:hidden;z-index:10;justify-content:space-between;padding-bottom:${isLargeTablet?'32px':isTablet?'20px':'14px'}">

        <!-- Hero -->
        <div style="display:flex;flex-direction:${isLandscape?'row':'column'};align-items:center;gap:${isLandscape?'40px':isLargeTablet?'16px':'8px'};${isLandscape?'justify-content:center':'text-align:center'}">
          <img src="${heroSrc}" style="width:${heroSize}px;height:${heroSize}px;border-radius:50%;object-fit:cover;border:${isLargeTablet?4:3}px solid var(--cyan);box-shadow:0 0 ${isLargeTablet?80:50}px rgba(0,229,255,.4),0 0 ${isLargeTablet?120:80}px rgba(168,85,247,.2);flex-shrink:0"/>
          <div>
            <h1 style="font-size:${isLandscape?26:t(24,34,52)};font-weight:900;line-height:1.15;background:linear-gradient(135deg,#fff 0%,var(--cyan) 50%,var(--purple) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:${isLargeTablet?14:6}px">Chat with Expert<br>Astrologers</h1>
            <p style="color:var(--muted);font-size:${t(12,15,22)};line-height:1.55;max-width:${isLargeTablet?600:isTablet?440:260}px;${isLandscape?'':'margin:0 auto'};margin-bottom:${isLargeTablet?20:12}px">Get personalized Vedic astrology readings, Kundli analysis & spiritual guidance</p>
            <button class="cta">Consult Now →</button>
          </div>
        </div>

        <!-- Stats -->
        <div style="display:flex;gap:${isLargeTablet?12:8}px">
          ${[['500+','Astrologers','var(--cyan)'],['50K+','Consultations','var(--purple)'],['4.8★','Rating','var(--gold)'],['24/7','Support','var(--pink)']].map(([n,l,c])=>`
            <div class="stat-card">
              <div style="font-size:${t(16,20,30)};font-weight:900;color:${c}">${n}</div>
              <div style="font-size:${t(9,11,16)};color:var(--muted);margin-top:2px">${l}</div>
            </div>`).join('')}
        </div>

        <!-- Services -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${isLargeTablet?14:8}px">
            <span style="font-size:${t(13,16,22)};font-weight:700">Our Services</span>
            <span style="font-size:${t(11,13,18)};color:var(--cyan)">View All →</span>
          </div>
          <div style="display:flex;gap:${isLargeTablet?10:6}px">
            ${services.map(s=>`
              <div class="svc-chip">
                <span style="font-size:${t(18,24,36)}">${s.icon}</span>
                <span style="font-size:${t(8,11,15)};color:var(--muted);text-align:center;white-space:pre-line;line-height:1.2">${s.label}</span>
              </div>`).join('')}
          </div>
        </div>

        ${isLargeTablet ? `
        <!-- How it works (large tablet extra section) -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <span style="font-size:${t(13,16,22)};font-weight:700">How It Works</span>
          </div>
          <div style="display:flex;gap:12px">
            ${[
              {step:'1',icon:'👤',title:'Create Account',desc:'Sign up in 30 seconds, verify your phone and get ₹50 welcome bonus instantly.'},
              {step:'2',icon:'⭐',title:'Choose Astrologer',desc:'Browse 500+ verified astrologers by specialty, rating, language and price.'},
              {step:'3',icon:'💬',title:'Start Chatting',desc:'Begin a live consultation. Timer starts only when astrologer sends first message.'},
              {step:'4',icon:'🔮',title:'Get Guidance',desc:'Receive personalized Vedic insights, remedies and predictions for your life.'},
            ].map(s => `
              <div class="how-step">
                <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:26px">${s.icon}</div>
                <div style="width:28px;height:28px;border-radius:50%;background:rgba(168,85,247,.3);border:1px solid var(--purple);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:var(--cyan)">${s.step}</div>
                <div style="font-size:18px;font-weight:700;text-align:center">${s.title}</div>
                <div style="font-size:14px;color:var(--muted);text-align:center;line-height:1.4">${s.desc}</div>
              </div>`).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Top Astrologers -->
        <div style="flex:1;min-height:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${isLargeTablet?14:8}px">
            <span style="font-size:${t(13,16,22)};font-weight:700">Top Astrologers</span>
            <span style="font-size:${t(11,13,18)};color:var(--cyan)">See All →</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:${isLargeTablet?12:8}px">
            ${astrologers.map(a=>`
              <div class="astro-card">
                <div style="width:${isLargeTablet?60:isTablet?44:36}px;height:${isLargeTablet?60:isTablet?44:36}px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:${t(16,20,28)};border:2px solid ${a.avail?'var(--cyan)':'var(--border)'}">${a.emoji}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:${t(10,13,18)};font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.name}</div>
                  <div style="font-size:${t(8.5,11,15)};color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.spec}</div>
                  <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
                    <span style="font-size:${t(8.5,11,15)};color:var(--gold)">★${a.rating}</span>
                    <span style="font-size:${t(8,10,14)};color:var(--cyan)">${a.rate}</span>
                    <span style="font-size:${t(7,8,11)};padding:1px 6px;border-radius:8px;background:${a.avail?'rgba(0,229,255,.15)':'rgba(148,163,184,.1)'};color:${a.avail?'var(--cyan)':'var(--muted)'}">${a.avail?'Online':'Away'}</span>
                  </div>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Promo banner -->
        <div style="background:linear-gradient(135deg,rgba(168,85,247,.2),rgba(0,229,255,.1));border:1px solid rgba(168,85,247,.4);border-radius:${isLargeTablet?18:14}px;padding:${isLargeTablet?'22px 28px':isTablet?'14px 20px':'10px 14px'};display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div>
            <div style="font-size:${t(12,14,20)};font-weight:700;color:var(--gold)">🎁 New User Offer</div>
            <div style="font-size:${t(10,13,18)};color:var(--muted);margin-top:4px">First consultation FREE for 5 minutes</div>
          </div>
          <button style="background:linear-gradient(135deg,var(--gold),var(--pink));border:none;padding:${isLargeTablet?'12px 24px':'7px 14px'};border-radius:20px;color:white;font-size:${t(10,12,17)};font-weight:700">Claim Now</button>
        </div>

      </div>
      ${w < 900 ? navBar() : ''}
    </div>
  </body></html>`;
}

// ─── CHAT SCREEN ──────────────────────────────────────────────────────────────
function chatScreen(w, h) {
  const isTablet = w >= 900;
  const isLandscape = w > h;
  const fontSize = isTablet ? 15 : 13;
  const pad = isTablet ? '14px 40px' : '10px 16px';

  const messages = [
    {from:'in', text:'Namaste! I am Pandit Rajesh Kumar. Please share your date of birth, time, and place of birth for an accurate reading. 🙏'},
    {from:'out', text:'Namaste Panditji! I was born on March 15, 1990, at 6:30 AM in Delhi.'},
    {from:'in', text:'I have analyzed your Kundli. Your lagna is <strong style="color:var(--cyan)">Pisces</strong> with Jupiter as the ascendant lord.\n<div style="margin-top:6px;padding:8px;background:rgba(0,0,0,.2);border-radius:8px;font-size:${isTablet?13:11}px;color:var(--muted)">🔮 <strong style="color:var(--gold)">Key findings:</strong><br>• Strong Venus in 7th house → favorable for relationships<br>• Saturn transit affecting career in 2024-25<br>• Rahu-Ketu axis suggests spiritual growth ahead</div>'},
    {from:'out', text:'That\'s very accurate! What remedies do you suggest for Saturn?'},
    {from:'in', text:'For Saturn\'s malefic effects, I recommend:\n<div style="margin-top:6px;font-size:${isTablet?13:11}px;color:var(--muted)">• Chant <strong style="color:var(--purple)">Shani Mantra</strong> on Saturdays<br>• Donate black sesame seeds & mustard oil<br>• Wear blue sapphire (after proper consultation)<br>• Visit Shani temple every Saturday</div>'},
    {from:'out', text:'Thank you so much Panditji. One more thing — when is the best time for my career change?'},
    {from:'in', text:'Based on your chart, <strong style="color:var(--cyan)">June-August 2025</strong> appears very favorable for career transitions. Jupiter entering your 10th house will bring excellent opportunities. 🌟', typing: false},
    {from:'typing', text:''},
  ];

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${CSS_VARS}
    .msg { max-width:${isLandscape?'60%':'78%'};padding:${isTablet?'12px 16px':'9px 12px'};font-size:${fontSize}px;line-height:1.55;margin-bottom:6px }
    .msg-in { background:var(--card);border:1px solid var(--border);border-radius:18px 18px 18px 4px;align-self:flex-start }
    .msg-out { background:linear-gradient(135deg,rgba(168,85,247,.35),rgba(0,229,255,.2));border:1px solid rgba(168,85,247,.5);border-radius:18px 18px 4px 18px;align-self:flex-end }
    .time-badge { font-size:10px;color:var(--muted);text-align:center;margin:6px 0 }
    .avatar { width:${isTablet?36:28}px;height:${isTablet?36:28}px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:${isTablet?16:13}px }
  </style></head>
  <body style="width:${w}px;height:${h}px;overflow:hidden">
    <div style="position:relative;width:${w}px;height:${h}px;display:flex;flex-direction:column;background:linear-gradient(180deg,#06061e 0%,#080825 100%)">
      ${starsBg()}
      ${glowOrb('var(--purple)', '400px', '-100px', '-100px', 0.12)}
      ${glowOrb('var(--cyan)', '300px', `${h*0.5}px`, `${w-180}px`, 0.08)}

      ${statusBar(w)}

      <!-- Chat Header -->
      <div style="padding:${pad};display:flex;align-items:center;gap:12px;background:rgba(10,10,35,.95);border-bottom:1px solid var(--border);flex-shrink:0;z-index:20;position:relative">
        <div style="font-size:${isTablet?22:18}px;color:var(--cyan);cursor:pointer">←</div>
        <div style="width:${isTablet?48:40}px;height:${isTablet?48:40}px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:${isTablet?24:20}px;flex-shrink:0;border:2px solid var(--cyan)">🧙</div>
        <div style="flex:1">
          <div style="font-size:${isTablet?17:14}px;font-weight:700">Pandit Rajesh Kumar</div>
          <div style="font-size:${isTablet?12:10}px;display:flex;align-items:center;gap:5px;margin-top:2px">
            <span style="width:7px;height:7px;border-radius:50%;background:var(--cyan);display:inline-block"></span>
            <span style="color:var(--cyan)">Online</span>
            <span style="color:var(--muted)">• 4.9★ • ₹25/min</span>
          </div>
        </div>
        <div style="background:linear-gradient(135deg,rgba(168,85,247,.4),rgba(0,229,255,.3));border:1px solid rgba(0,229,255,.4);padding:6px 12px;border-radius:20px;font-size:${isTablet?13:11}px;font-weight:700;color:var(--cyan)">⏱ 08:42</div>
      </div>

      <!-- Timer bar -->
      <div style="background:rgba(168,85,247,.08);border-bottom:1px solid var(--border);padding:7px ${isTablet?'40px':'16px'};display:flex;align-items:center;gap:12px;flex-shrink:0;z-index:10">
        <span style="font-size:${isTablet?12:10}px;color:var(--muted);white-space:nowrap">Balance: <span style="color:var(--cyan);font-weight:700">₹281.25</span></span>
        <div style="flex:1;height:5px;background:rgba(255,255,255,.08);border-radius:3px">
          <div style="width:65%;height:100%;background:linear-gradient(90deg,var(--cyan),var(--purple));border-radius:3px;box-shadow:0 0 8px rgba(0,229,255,.4)"></div>
        </div>
        <span style="font-size:${isTablet?12:10}px;color:var(--purple);white-space:nowrap">~11 min left</span>
      </div>

      <!-- Messages area -->
      <div style="flex:1;overflow:hidden;padding:${isTablet?'16px 40px':'12px 14px'};display:flex;flex-direction:column;gap:2px;z-index:10;justify-content:flex-end">
        <div class="time-badge">Today, 2:30 PM</div>

        ${messages.map(m => {
          if (m.from === 'typing') return `
            <div style="display:flex;align-items:flex-start;gap:8px;margin-top:4px">
              <div class="avatar">🧙</div>
              <div class="msg msg-in" style="display:flex;align-items:center;gap:8px;padding:12px 16px">
                <span style="display:flex;gap:3px">
                  <span style="width:6px;height:6px;border-radius:50%;background:var(--muted);opacity:.8"></span>
                  <span style="width:6px;height:6px;border-radius:50%;background:var(--muted);opacity:.5"></span>
                  <span style="width:6px;height:6px;border-radius:50%;background:var(--muted);opacity:.3"></span>
                </span>
                <span style="color:var(--muted);font-size:12px">Typing...</span>
              </div>
            </div>`;
          if (m.from === 'in') return `
            <div style="display:flex;align-items:flex-start;gap:8px">
              <div class="avatar">🧙</div>
              <div class="msg msg-in">${m.text.replace(/\n/g,'')}</div>
            </div>`;
          return `<div style="display:flex;justify-content:flex-end"><div class="msg msg-out">${m.text}</div></div>`;
        }).join('')}
      </div>

      <!-- Quick reply chips -->
      <div style="padding:6px ${isTablet?'40px':'14px'};display:flex;gap:6px;overflow:hidden;flex-shrink:0;z-index:10">
        ${['What about my health?','Marriage prediction','Lucky gems for me'].map(t=>`
          <div style="background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.3);border-radius:20px;padding:5px 10px;font-size:${isTablet?12:10}px;color:var(--purple);white-space:nowrap">${t}</div>`).join('')}
      </div>

      <!-- Input bar -->
      <div style="padding:${isTablet?'12px 40px':'9px 14px'};background:rgba(10,10,35,.98);border-top:1px solid var(--border);display:flex;gap:10px;align-items:center;flex-shrink:0;z-index:20;position:relative">
        <div style="flex:1;background:var(--card);border:1px solid var(--border);border-radius:24px;padding:${isTablet?'11px 18px':'9px 14px'};font-size:${isTablet?14:12}px;color:var(--muted)">Ask your question...</div>
        <div style="width:${isTablet?46:40}px;height:${isTablet?46:40}px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:${isTablet?20:17}px;flex-shrink:0;box-shadow:0 0 16px rgba(0,229,255,.3)">➤</div>
      </div>
    </div>
  </body></html>`;
}

// ─── KUNDLI SCREEN ────────────────────────────────────────────────────────────
function kundliScreen(w, h) {
  const isTablet = w >= 900;
  const isPortrait = h > w;
  // For portrait phone: chart stacked above planets; landscape/tablet: side by side
  const chartSize = isPortrait ? (isTablet ? 380 : 300) : (isTablet ? 280 : 220);
  const pad = isTablet ? '0 40px' : '0 16px';

  const chartSVG = (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 260 260">
      <defs>
        <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#00e5ff;stop-opacity:1"/>
          <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="240" height="240" fill="none" stroke="url(#cg)" stroke-width="1.5" opacity=".6"/>
      <line x1="130" y1="10" x2="130" y2="90" stroke="url(#cg)" stroke-width="1" opacity=".5"/>
      <line x1="130" y1="170" x2="130" y2="250" stroke="url(#cg)" stroke-width="1" opacity=".5"/>
      <line x1="10" y1="130" x2="90" y2="130" stroke="url(#cg)" stroke-width="1" opacity=".5"/>
      <line x1="170" y1="130" x2="250" y2="130" stroke="url(#cg)" stroke-width="1" opacity=".5"/>
      <line x1="10" y1="10" x2="90" y2="90" stroke="url(#cg)" stroke-width="1" opacity=".4"/>
      <line x1="250" y1="10" x2="170" y2="90" stroke="url(#cg)" stroke-width="1" opacity=".4"/>
      <line x1="10" y1="250" x2="90" y2="170" stroke="url(#cg)" stroke-width="1" opacity=".4"/>
      <line x1="250" y1="250" x2="170" y2="170" stroke="url(#cg)" stroke-width="1" opacity=".4"/>
      <polygon points="130,90 170,130 130,170 90,130" fill="none" stroke="url(#cg)" stroke-width="1.5" opacity=".6"/>
      <text x="130" y="58" text-anchor="middle" fill="#00e5ff" font-size="12" font-weight="bold">1</text>
      <text x="130" y="73" text-anchor="middle" fill="#f59e0b" font-size="10">♓ As</text>
      <text x="55" y="130" text-anchor="middle" fill="#a855f7" font-size="11">4</text>
      <text x="205" y="130" text-anchor="middle" fill="#a855f7" font-size="11">10</text>
      <text x="130" y="210" text-anchor="middle" fill="#00e5ff" font-size="11">7</text>
      <text x="42" y="55" text-anchor="middle" fill="#94a3b8" font-size="10">12</text>
      <text x="218" y="55" text-anchor="middle" fill="#94a3b8" font-size="10">2</text>
      <text x="42" y="215" text-anchor="middle" fill="#94a3b8" font-size="10">9</text>
      <text x="218" y="215" text-anchor="middle" fill="#94a3b8" font-size="10">6</text>
      <text x="95" y="93" text-anchor="middle" fill="#94a3b8" font-size="10">11</text>
      <text x="165" y="93" text-anchor="middle" fill="#94a3b8" font-size="10">3</text>
      <text x="95" y="215" text-anchor="middle" fill="#94a3b8" font-size="10">8</text>
      <text x="165" y="215" text-anchor="middle" fill="#94a3b8" font-size="10">5</text>
      <text x="130" y="120" text-anchor="middle" fill="#f59e0b" font-size="10">☉ Sun</text>
      <text x="130" y="133" text-anchor="middle" fill="#00e5ff" font-size="10">♃ Jup</text>
      <text x="130" y="146" text-anchor="middle" fill="#ec4899" font-size="10">♀ Ven</text>
    </svg>`;

  const planets = [
    ['☉','Sun','Pisces','1st','#f59e0b'],
    ['☽','Moon','Scorpio','8th','#94a3b8'],
    ['♃','Jupiter','Capricorn','10th','#00e5ff'],
    ['♀','Venus','Aries','2nd','#ec4899'],
    ['♂','Mars','Gemini','4th','#ef4444'],
    ['♄','Saturn','Capricorn','11th','#a855f7'],
    ['☿','Mercury','Pisces','1st','#22c55e'],
    ['☊','Rahu','Virgo','7th','#f97316'],
    ['☋','Ketu','Pisces','1st','#a16207'],
  ];

  const predictions = [
    {icon:'💼',title:'Career',text:'Jupiter\'s transit in 10th house brings major growth in Jul–Sep 2025',color:'var(--cyan)'},
    {icon:'❤️',title:'Love & Marriage',text:'Strong Venus supports relationship harmony; favorable period for commitment',color:'var(--pink)'},
    {icon:'💰',title:'Finance',text:'Saturn stabilizes finances; avoid large investments before June 2025',color:'var(--gold)'},
    {icon:'🏥',title:'Health',text:'Watch digestive health; increase water intake and morning walks',color:'#22c55e'},
  ];

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${CSS_VARS}
    .planet-row { display:flex;justify-content:space-between;align-items:center;padding:${isTablet?'7px 0':'5px 0'};border-bottom:1px solid rgba(255,255,255,.05) }
    .input-field { background:var(--card);border:1px solid var(--border);border-radius:12px;padding:${isTablet?'10px 14px':'8px 12px'};font-size:${isTablet?13:11}px;color:var(--muted);flex:1 }
  </style></head>
  <body style="width:${w}px;height:${h}px;overflow:hidden">
    <div style="position:relative;width:${w}px;height:${h}px;display:flex;flex-direction:column;background:linear-gradient(180deg,#06061a,#0a0830)">
      ${starsBg()}
      ${glowOrb('var(--cyan)', '400px', '-100px', `${w/2-200}px`, 0.1)}
      ${glowOrb('var(--purple)', '300px', `${h*0.6}px`, `${w-200}px`, 0.1)}

      ${statusBar(w)}

      <!-- Header -->
      <div style="padding:${isTablet?'14px 40px':'10px 18px'};display:flex;align-items:center;gap:12px;flex-shrink:0;z-index:10">
        <div style="font-size:${isTablet?22:18}px;color:var(--cyan)">←</div>
        <div style="flex:1">
          <div style="font-size:${isTablet?20:16}px;font-weight:900;background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent">Kundli Generator</div>
          <div style="font-size:${isTablet?12:10}px;color:var(--muted)">Free Vedic Birth Chart Analysis</div>
        </div>
        <div style="font-size:${isTablet?28:22}px">🔮</div>
      </div>

      <div style="flex:1;display:flex;flex-direction:column;padding:${pad};gap:${isTablet?12:9}px;overflow:hidden;z-index:10;padding-bottom:14px;justify-content:space-between">

        <!-- Input row -->
        <div style="display:flex;gap:8px;flex-shrink:0">
          ${[['📅','15 Mar 1990'],['🕐','6:30 AM'],['📍','New Delhi']].map(([icon,val])=>`
            <div class="input-field">${icon} ${val}</div>`).join('')}
          <button style="background:linear-gradient(135deg,var(--purple),var(--cyan));border:none;padding:0 14px;border-radius:12px;color:white;font-size:${isTablet?13:11}px;font-weight:700;height:${isTablet?41:37}px;white-space:nowrap;flex-shrink:0">Generate</button>
        </div>

        ${isPortrait ? `
        <!-- Portrait: chart on top, planets below, predictions at bottom -->
        <!-- Chart centered -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:${isTablet?'16px':'10px'};display:flex;flex-direction:column;align-items:center;flex-shrink:0">
          <div style="font-size:${isTablet?12:10}px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Birth Chart (D1) • Lagna: ♓ Pisces</div>
          <div style="display:flex;gap:${isTablet?24:16}px;align-items:flex-start">
            ${chartSVG(chartSize)}
            <!-- Nakshatra & dasha beside chart -->
            <div style="display:flex;flex-direction:column;gap:8px;justify-content:center;min-width:${isTablet?160:130}px">
              <div style="background:rgba(168,85,247,.1);border:1px solid var(--border);border-radius:12px;padding:${isTablet?'12px':'8px 10px'}">
                <div style="font-size:${isTablet?11:9}px;color:var(--muted)">Moon Nakshatra</div>
                <div style="font-size:${isTablet?16:13}px;font-weight:800;color:var(--purple)">Jyeshtha</div>
                <div style="font-size:${isTablet?11:9}px;color:var(--muted)">Mercury lord</div>
              </div>
              <div style="background:rgba(0,229,255,.08);border:1px solid rgba(0,229,255,.2);border-radius:12px;padding:${isTablet?'12px':'8px 10px'}">
                <div style="font-size:${isTablet?11:9}px;color:var(--muted)">Mahadasha</div>
                <div style="font-size:${isTablet?16:13}px;font-weight:800;color:var(--cyan)">♄ Saturn</div>
                <div style="font-size:${isTablet?11:9}px;color:var(--muted)">2019–2038</div>
                <div style="margin-top:5px;height:4px;background:rgba(255,255,255,.08);border-radius:2px">
                  <div style="width:40%;height:100%;background:linear-gradient(90deg,var(--purple),var(--cyan));border-radius:2px"></div>
                </div>
              </div>
              <div style="background:rgba(168,85,247,.08);border:1px solid var(--border);border-radius:12px;padding:${isTablet?'12px':'8px 10px'}">
                <div style="font-size:${isTablet?11:9}px;color:var(--muted)">Antardasha</div>
                <div style="font-size:${isTablet?15:12}px;font-weight:700;color:var(--gold)">♃ Jupiter</div>
                <div style="font-size:${isTablet?11:9}px;color:var(--muted)">Dec 2024 – Apr 2027</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Planet table -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:${isTablet?'12px 16px':'10px 12px'};flex-shrink:0">
          <div style="font-size:${isTablet?12:10}px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Planet Positions</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0 16px">
            ${planets.map(([icon,planet,sign,house,color])=>`
              <div class="planet-row">
                <span style="color:${color};font-size:${isTablet?14:12}px;width:16px">${icon}</span>
                <span style="flex:1;margin-left:4px;font-size:${isTablet?12:10}px">${planet}</span>
                <span style="color:var(--muted);font-size:${isTablet?11:9}px">${sign}</span>
                <span style="background:rgba(168,85,247,.15);border-radius:4px;padding:1px 4px;font-size:${isTablet?10:8}px;color:var(--purple);margin-left:4px">${house}</span>
              </div>`).join('')}
          </div>
        </div>

        <!-- Predictions -->
        <div style="flex:1;min-height:0">
          <div style="font-size:${isTablet?14:12}px;font-weight:700;margin-bottom:8px">Life Predictions</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${predictions.map(p=>`
              <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:${isTablet?'12px':'10px 10px'}">
                <div style="font-size:${isTablet?18:15}px;margin-bottom:4px">${p.icon}</div>
                <div style="font-size:${isTablet?13:11}px;font-weight:700;color:${p.color};margin-bottom:3px">${p.title}</div>
                <div style="font-size:${isTablet?11:9}px;color:var(--muted);line-height:1.4">${p.text}</div>
              </div>`).join('')}
          </div>
        </div>
        ` : `
        <!-- Landscape: side by side -->
        <div style="display:flex;gap:12px;flex:1;min-height:0">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:12px;display:flex;flex-direction:column;align-items:center;flex-shrink:0">
            <div style="font-size:10px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Birth Chart (D1)</div>
            ${chartSVG(chartSize)}
            <div style="margin-top:8px;background:rgba(168,85,247,.1);border:1px solid var(--border);border-radius:10px;padding:6px 12px;text-align:center">
              <div style="font-size:10px;color:var(--muted)">Moon Nakshatra</div>
              <div style="font-size:${isTablet?13:12}px;font-weight:700;color:var(--purple)">Jyeshtha</div>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:8px;min-width:0">
            <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:10px 12px;flex:1">
              <div style="font-size:${isTablet?12:10}px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Planets</div>
              ${planets.map(([icon,planet,sign,house,color])=>`
                <div class="planet-row">
                  <span style="color:${color};font-size:${isTablet?15:12}px;width:18px">${icon}</span>
                  <span style="flex:1;margin-left:5px;font-size:${isTablet?12:10}px">${planet}</span>
                  <span style="color:var(--muted);font-size:${isTablet?11:9}px">${sign}</span>
                  <span style="background:rgba(168,85,247,.15);border-radius:5px;padding:1px 5px;font-size:${isTablet?10:8}px;color:var(--purple);margin-left:5px">${house}</span>
                </div>`).join('')}
            </div>
            <div style="background:linear-gradient(135deg,rgba(168,85,247,.15),rgba(0,229,255,.1));border:1px solid var(--border);border-radius:14px;padding:10px 12px">
              <div style="font-size:${isTablet?11:9}px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Current Mahadasha</div>
              <div style="font-size:${isTablet?16:13}px;font-weight:800;color:var(--cyan)">♄ Saturn</div>
              <div style="font-size:${isTablet?11:9}px;color:var(--muted)">2019–2038 • Antardasha: Jupiter</div>
              <div style="margin-top:6px;height:4px;background:rgba(255,255,255,.08);border-radius:2px">
                <div style="width:40%;height:100%;background:linear-gradient(90deg,var(--purple),var(--cyan));border-radius:2px"></div>
              </div>
            </div>
          </div>
        </div>
        `}

        <!-- Lagna + CTA (always at bottom) -->
        <div style="background:linear-gradient(135deg,rgba(168,85,247,.12),rgba(0,229,255,.08));border:1px solid var(--border);border-radius:14px;padding:${isTablet?'12px 16px':'10px 14px'};display:flex;align-items:center;gap:12px;flex-shrink:0">
          <span style="font-size:${isTablet?30:22}px">♓</span>
          <div style="flex:1">
            <div style="font-size:${isTablet?14:12}px;font-weight:700">Lagna: <span style="color:var(--cyan)">Pisces</span> • Rashi: <span style="color:var(--purple)">Scorpio</span></div>
            <div style="font-size:${isTablet?12:10}px;color:var(--muted);margin-top:2px">Intuitive & spiritual nature • Jupiter-ruled ascendant</div>
          </div>
          <button style="background:linear-gradient(135deg,var(--purple),var(--cyan));border:none;padding:${isTablet?'10px 18px':'8px 14px'};border-radius:20px;color:white;font-size:${isTablet?12:10}px;font-weight:700">Full Report</button>
        </div>

      </div>
      ${w < 900 ? navBar() : ''}
    </div>
  </body></html>`;
}

// ─── WALLET SCREEN ────────────────────────────────────────────────────────────
function walletScreen(w, h) {
  const isTablet = w >= 900;
  const pad = isTablet ? '0 40px' : '0 16px';

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${CSS_VARS}
    .pack { background:var(--card);border:2px solid var(--border);border-radius:14px;padding:${isTablet?'16px 12px':'12px 8px'};text-align:center;flex:1;position:relative }
    .pack.best { border-color:var(--cyan) }
    .txn-row { display:flex;align-items:center;gap:10px;padding:${isTablet?'10px 0':'8px 0'};border-bottom:1px solid rgba(255,255,255,.05) }
  </style></head>
  <body style="width:${w}px;height:${h}px;overflow:hidden">
    <div style="position:relative;width:${w}px;height:${h}px;display:flex;flex-direction:column;background:linear-gradient(180deg,#06061a,#0a0825)">
      ${starsBg()}
      ${glowOrb('var(--gold)', '400px', '-100px', `${w/2-200}px`, 0.07)}
      ${glowOrb('var(--purple)', '300px', `${h*0.5}px`, '-100px', 0.1)}

      ${statusBar(w)}

      <div style="padding:${isTablet?'14px 40px':'10px 18px'};display:flex;align-items:center;gap:12px;flex-shrink:0;z-index:10">
        <div style="font-size:${isTablet?22:18}px;color:var(--cyan)">←</div>
        <div style="font-size:${isTablet?20:16}px;font-weight:900">My Wallet</div>
        <div style="margin-left:auto;font-size:${isTablet?12:10}px;color:var(--muted)">Transaction History →</div>
      </div>

      <div style="flex:1;display:flex;flex-direction:column;padding:${pad};gap:${isTablet?14:10}px;overflow:hidden;z-index:10;padding-bottom:14px;justify-content:space-between">

        <!-- Balance card -->
        <div style="background:linear-gradient(135deg,#1a1050,#0d0a3a);border:1px solid rgba(168,85,247,.5);border-radius:20px;padding:${isTablet?'24px 28px':'18px 20px'};text-align:center;position:relative;overflow:hidden">
          <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,.35),transparent)"></div>
          <div style="position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(0,229,255,.2),transparent)"></div>
          <div style="font-size:${isTablet?13:11}px;color:var(--muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px">Available Balance</div>
          <div style="font-size:${isTablet?54:42}px;font-weight:900;background:linear-gradient(135deg,var(--gold),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1">₹500</div>
          <div style="font-size:${isTablet?13:11}px;color:var(--muted);margin-top:4px">≈ 20 minutes of consultation</div>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:14px">
            <button style="background:linear-gradient(135deg,var(--purple),var(--cyan));border:none;padding:${isTablet?'12px 32px':'10px 24px'};border-radius:50px;color:white;font-size:${isTablet?15:13}px;font-weight:700;box-shadow:0 4px 20px rgba(0,229,255,.25)">+ Add Money</button>
            <button style="background:transparent;border:1px solid var(--border);padding:${isTablet?'12px 20px':'10px 16px'};border-radius:50px;color:var(--muted);font-size:${isTablet?14:12}px">Redeem</button>
          </div>
        </div>

        <!-- Packs -->
        <div>
          <div style="font-size:${isTablet?15:13}px;font-weight:700;margin-bottom:8px">Recharge Packs</div>
          <div style="display:flex;gap:${isTablet?10:7}px">
            ${[
              {amt:'₹100',min:'4 min',bonus:'',best:false,color:'var(--muted)'},
              {amt:'₹200',min:'8 min',bonus:'',best:false,color:'var(--muted)'},
              {amt:'₹500',min:'20 min',bonus:'+₹50',best:true,color:'var(--cyan)'},
              {amt:'₹1000',min:'40 min',bonus:'+₹150',best:false,color:'var(--gold)'},
              {amt:'₹2000',min:'80 min',bonus:'+₹400',best:false,color:'var(--purple)'},
            ].map(p=>`
              <div class="pack ${p.best?'best':''}">
                ${p.best?`<div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--cyan),var(--purple));padding:1px 8px;border-radius:8px;font-size:8px;font-weight:700;white-space:nowrap;color:white">BEST</div>`:''}
                <div style="font-size:${isTablet?18:14}px;font-weight:900;color:${p.color}">${p.amt}</div>
                <div style="font-size:${isTablet?11:9}px;color:var(--muted);margin-top:2px">${p.min}</div>
                ${p.bonus?`<div style="font-size:${isTablet?10:8}px;color:var(--gold);margin-top:2px">${p.bonus}</div>`:'<div style="height:${isTablet?14:12}px"></div>'}
              </div>`).join('')}
          </div>
        </div>

        <!-- UPI / Payment methods -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:${isTablet?'12px 16px':'10px 12px'}">
          <div style="font-size:${isTablet?13:11}px;color:var(--muted);margin-bottom:8px">Payment Methods</div>
          <div style="display:flex;gap:8px">
            ${['UPI','Card','NetBanking','Wallet'].map((m,i)=>`
              <div style="background:${i===0?'linear-gradient(135deg,rgba(0,229,255,.15),rgba(168,85,247,.1))':'rgba(255,255,255,.04)'};border:1px solid ${i===0?'rgba(0,229,255,.4)':'var(--border)'};border-radius:10px;padding:7px 12px;font-size:${isTablet?12:10}px;color:${i===0?'var(--cyan)':'var(--muted)'};font-weight:${i===0?700:400}">${m}</div>`).join('')}
          </div>
        </div>

        <!-- Transactions -->
        <div style="flex:1;min-height:0">
          <div style="font-size:${isTablet?15:13}px;font-weight:700;margin-bottom:8px">Recent Transactions</div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:${isTablet?'10px 16px':'8px 12px'}">
            ${[
              {icon:'💬',desc:'Chat with Pandit Rajesh',time:'Today 2:30 PM',amt:'-₹218.75',color:'#ef4444',sub:'8 min 45 sec'},
              {icon:'💰',desc:'Wallet Recharge',time:'Today 1:15 PM',amt:'+₹500',color:'#22c55e',sub:'UPI Payment'},
              {icon:'💬',desc:'Chat with Dr. Priya Sharma',time:'Yesterday 6:20 PM',amt:'-₹140',color:'#ef4444',sub:'7 min'},
              {icon:'🎁',desc:'Welcome Bonus',time:'Apr 25',amt:'+₹50',color:'#22c55e',sub:'Promotional'},
              {icon:'💰',desc:'Wallet Recharge',time:'Apr 25',amt:'+₹200',color:'#22c55e',sub:'UPI Payment'},
            ].map(t=>`
              <div class="txn-row">
                <div style="width:${isTablet?38:32}px;height:${isTablet?38:32}px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:${isTablet?16:13}px;flex-shrink:0">${t.icon}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:${isTablet?13:11}px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.desc}</div>
                  <div style="font-size:${isTablet?11:9}px;color:var(--muted)">${t.time} • ${t.sub}</div>
                </div>
                <div style="font-size:${isTablet?13:11}px;font-weight:700;color:${t.color};flex-shrink:0">${t.amt}</div>
              </div>`).join('')}
          </div>
        </div>

      </div>
      ${w < 900 ? navBar() : ''}
    </div>
  </body></html>`;
}

// ─── ASTROLOGERS SCREEN ───────────────────────────────────────────────────────
function astrologersScreen(w, h) {
  const isTablet = w >= 900;
  const isLandscape = w > h;
  const cols = w >= 1400 ? 3 : w >= 900 ? 2 : 1;
  const pad = isTablet ? '0 40px' : '0 16px';

  const astrologers = [
    {name:'Pandit Rajesh Kumar',spec:'Vedic Astrology • Kundli',exp:'15 yrs',lang:'Hindi, English',rate:'₹25/min',rating:'4.9',reviews:'1.2K',avail:true,emoji:'🧙‍♂️',consults:'8.2K',bio:'Expert in birth chart analysis, career & marriage predictions. Trusted by 8000+ clients.',tags:['Kundli','Marriage','Career']},
    {name:'Dr. Priya Sharma',spec:'Tarot • Numerology • Vastu',exp:'10 yrs',lang:'Hindi, English, Marathi',rate:'₹20/min',rating:'4.8',reviews:'890',avail:true,emoji:'🔮',consults:'5.4K',bio:'Certified tarot reader and numerologist with deep insights into life path and destiny.',tags:['Tarot','Numerology','Vastu']},
    {name:'Guru Arjun Tiwari',spec:'Vastu Shastra • Palmistry',exp:'20 yrs',lang:'Hindi, English',rate:'₹30/min',rating:'4.7',reviews:'650',avail:false,emoji:'🌟',consults:'3.1K',bio:'Master Vastu consultant. Has transformed 3000+ homes and offices for positive energy.',tags:['Vastu','Palmistry','Feng Shui']},
    {name:'Acharya Mohan Das',spec:'Horoscope • Remedies • Gems',exp:'12 yrs',lang:'Hindi, Tamil',rate:'₹18/min',rating:'4.9',reviews:'2.1K',avail:true,emoji:'☯️',consults:'12K',bio:'Specializes in Vedic remedies, gemstone recommendations and horoscope matching.',tags:['Horoscope','Remedies','Gems']},
    {name:'Pandit Sanjay Mishra',spec:'Marriage • Career • Finance',exp:'18 yrs',lang:'Hindi, English',rate:'₹22/min',rating:'4.8',reviews:'1.5K',avail:true,emoji:'🌙',consults:'9.7K',bio:'Renowned for accurate predictions in marriage timing, career changes and financial guidance.',tags:['Marriage','Career','Finance']},
    {name:'Nisha Gupta',spec:'Crystal Healing • Tarot',exp:'8 yrs',lang:'Hindi, English',rate:'₹15/min',rating:'4.6',reviews:'430',avail:false,emoji:'💎',consults:'2.8K',bio:'Crystal healer and intuitive tarot reader focused on emotional healing and spiritual growth.',tags:['Crystal','Tarot','Healing']},
  ];

  const visible = cols === 3 ? astrologers : cols === 2 ? astrologers.slice(0, isLandscape ? 4 : 6) : astrologers.slice(0, 4);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${CSS_VARS}
    .chip { background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.25);border-radius:20px;padding:6px 14px;font-size:${isTablet?12:10}px;color:var(--purple);white-space:nowrap }
    .chip.active { background:linear-gradient(135deg,var(--purple),var(--cyan));color:white;border-color:transparent }
    .card { background:var(--card);border:1px solid var(--border);border-radius:16px;padding:${isTablet?'14px':'11px'};display:flex;flex-direction:column }
  </style></head>
  <body style="width:${w}px;height:${h}px;overflow:hidden">
    <div style="position:relative;width:${w}px;height:${h}px;display:flex;flex-direction:column;background:linear-gradient(180deg,#06061a,#090922)">
      ${starsBg()}
      ${glowOrb('var(--purple)', '500px', '-150px', '-100px', 0.1)}
      ${glowOrb('var(--cyan)', '300px', `${h*0.5}px`, `${w-150}px`, 0.08)}

      ${statusBar(w)}

      <!-- Header -->
      <div style="padding:${isTablet?'12px 40px':'10px 18px'};flex-shrink:0;z-index:10">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div>
            <div style="font-size:${isTablet?22:17}px;font-weight:900;background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent">Expert Astrologers</div>
            <div style="font-size:${isTablet?12:10}px;color:var(--muted)">500+ astrologers • ${astrologers.filter(a=>a.avail).length} online now</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:8px;font-size:18px">⚡</div>
        </div>
        <!-- Search -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:${isTablet?'10px 16px':'8px 12px'};display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="color:var(--muted)">🔍</span>
          <span style="color:var(--muted);font-size:${isTablet?13:11}px">Search astrologers by name or specialty...</span>
        </div>
        <!-- Filter chips -->
        <div style="display:flex;gap:6px;overflow:hidden">
          ${['All','Vedic','Tarot','Numerology','Vastu','Palmistry','Marriage','Career'].map((c,i)=>`<div class="chip ${i===0?'active':''}">${c}</div>`).join('')}
        </div>
      </div>

      <!-- List -->
      <div style="flex:1;overflow:hidden;padding:${pad};z-index:10;padding-bottom:14px">
        <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${isTablet?10:8}px;height:100%;align-content:start">
          ${visible.map(a=>`
            <div class="card">
              <!-- Top: avatar + name + rating -->
              <div style="display:flex;gap:10px;align-items:flex-start">
                <div style="position:relative;flex-shrink:0">
                  <div style="width:${isTablet?52:44}px;height:${isTablet?52:44}px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:${isTablet?24:20}px;border:2px solid ${a.avail?'var(--cyan)':'var(--border)'}">${a.emoji}</div>
                  ${a.avail?`<div style="position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:var(--cyan);border:2px solid var(--bg)"></div>`:''}
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:${isTablet?14:11}px;font-weight:700;margin-bottom:1px">${a.name}</div>
                  <div style="font-size:${isTablet?11:9}px;color:var(--muted);margin-bottom:3px">${a.spec}</div>
                  <div style="display:flex;align-items:center;gap:5px">
                    <span style="font-size:${isTablet?12:10}px;color:var(--gold)">★ ${a.rating}</span>
                    <span style="font-size:${isTablet?10:8.5}px;color:var(--muted)">${a.reviews} reviews</span>
                    <span style="font-size:${isTablet?10:8.5}px;color:var(--muted)">• ${a.consults} consults</span>
                  </div>
                </div>
              </div>

              <!-- Bio -->
              <div style="font-size:${isTablet?12:10}px;color:var(--muted);line-height:1.45;margin:${isTablet?'10px 0':'7px 0'};padding:${isTablet?'8px 10px':'6px 8px'};background:rgba(255,255,255,.03);border-radius:8px;border-left:2px solid rgba(168,85,247,.4)">${a.bio}</div>

              <!-- Specialty tags -->
              <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:${isTablet?'10px':'7px'}">
                ${a.tags.map(t=>`<span style="background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.2);border-radius:6px;padding:2px 7px;font-size:${isTablet?10:8}px;color:var(--purple)">${t}</span>`).join('')}
                <span style="background:rgba(0,0,0,.25);border-radius:6px;padding:2px 7px;font-size:${isTablet?10:8}px;color:var(--muted)">${a.exp} exp</span>
                <span style="background:rgba(0,0,0,.25);border-radius:6px;padding:2px 7px;font-size:${isTablet?10:8}px;color:var(--muted)">${a.lang.split(', ')[0]}${a.lang.includes(',') ? ' +' : ''}</span>
              </div>

              <!-- Rating bar -->
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:${isTablet?'10px':'7px'}">
                <div style="flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px">
                  <div style="width:${Math.round(parseFloat(a.rating)/5*100)}%;height:100%;background:linear-gradient(90deg,var(--gold),var(--cyan));border-radius:2px"></div>
                </div>
                <span style="font-size:${isTablet?11:9}px;color:var(--gold);flex-shrink:0">${a.rating}/5</span>
              </div>

              <!-- Footer: price + button -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto">
                <div>
                  <div style="font-size:${isTablet?16:13}px;font-weight:900;color:var(--cyan)">${a.rate}</div>
                  <div style="font-size:${isTablet?10:8.5}px;color:var(--muted)">${a.avail ? '● Online now' : '● Away'}</div>
                </div>
                <button style="background:${a.avail?'linear-gradient(135deg,var(--purple),var(--cyan))':'rgba(255,255,255,.05)'};border:${a.avail?'none':'1px solid var(--border)'};padding:${isTablet?'9px 18px':'7px 14px'};border-radius:20px;color:${a.avail?'white':'var(--muted)'};font-size:${isTablet?12:10}px;font-weight:600">
                  ${a.avail?'Chat Now':'Notify Me'}
                </button>
              </div>
            </div>`).join('')}
        </div>
      </div>
      ${w < 900 ? navBar() : ''}
    </div>
  </body></html>`;
}

// ─── FEATURE GRAPHIC ─────────────────────────────────────────────────────────
function featureGraphic(w, h) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>${CSS_VARS}
    body { width:${w}px;height:${h}px;overflow:hidden;background:linear-gradient(135deg,#04041a 0%,#100535 40%,#04041a 100%) }
  </style></head>
  <body>
    <div style="position:relative;width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:space-between;padding:0 70px">
      ${starsBg()}
      ${glowOrb('var(--purple)', '600px', '-250px', '-150px', 0.22)}
      ${glowOrb('var(--cyan)', '500px', '-150px', `${w-280}px`, 0.16)}
      ${glowOrb('var(--pink)', '200px', `${h-80}px`, `${w*0.4}px`, 0.08)}

      <!-- Left content -->
      <div style="z-index:10;max-width:${w*0.52}px">
        <img src="${logoSrc}" style="height:80px;width:auto;margin-bottom:20px;filter:drop-shadow(0 0 20px rgba(0,229,255,.4))"/>
        <h1 style="font-size:50px;font-weight:900;line-height:1.1;color:white;margin-bottom:14px">
          Your Trusted<br><span style="background:linear-gradient(135deg,var(--cyan),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent">Astrology Guide</span>
        </h1>
        <p style="font-size:19px;color:var(--muted);line-height:1.6;margin-bottom:24px">Chat live with expert Vedic astrologers. Kundli analysis, tarot readings & spiritual guidance — anytime, anywhere.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${[['🔮','Live Chat'],['⭐','500+ Experts'],['🌟','50K+ Users'],['🛡️','Secure'],['24/7','Available']].map(([icon,label])=>`
            <div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:25px;padding:7px 14px;font-size:14px;display:flex;align-items:center;gap:6px;color:var(--text)">
              <span>${icon}</span><span>${label}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Right: hero image in phone mockup feel -->
      <div style="z-index:10;position:relative;display:flex;align-items:center;justify-content:center">
        <div style="width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,.25) 0%,transparent 70%);display:flex;align-items:center;justify-content:center">
          <div style="width:260px;height:260px;border-radius:50%;border:3px solid rgba(0,229,255,.5);box-shadow:0 0 60px rgba(0,229,255,.35),0 0 120px rgba(168,85,247,.2);overflow:hidden">
            <img src="${heroSrc}" style="width:100%;height:100%;object-fit:cover"/>
          </div>
        </div>
        <!-- Floating badges -->
        <div style="position:absolute;top:20px;right:-20px;background:rgba(20,20,58,.95);border:1px solid rgba(0,229,255,.4);border-radius:12px;padding:8px 12px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.4)">
          <div style="font-size:20px;font-weight:900;color:var(--cyan)">4.8★</div>
          <div style="font-size:11px;color:var(--muted)">Rated</div>
        </div>
        <div style="position:absolute;bottom:30px;left:-30px;background:rgba(20,20,58,.95);border:1px solid rgba(168,85,247,.4);border-radius:12px;padding:8px 14px;box-shadow:0 4px 20px rgba(0,0,0,.4)">
          <div style="font-size:18px;font-weight:900;color:var(--purple)">50K+</div>
          <div style="font-size:11px;color:var(--muted)">Happy Users</div>
        </div>
      </div>
    </div>
  </body></html>`;
}

// ─── App Icon ─────────────────────────────────────────────────────────────────
async function makeAppIcon(page) {
  const w = 512, h = 512;
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>*{margin:0;padding:0;box-sizing:border-box}body{width:${w}px;height:${h}px;overflow:hidden;background:#06061a;display:flex;align-items:center;justify-content:center}</style></head>
    <body><img src="${logoSrc}" style="width:490px;height:490px;object-fit:contain"/></body></html>`);
  await page.screenshot({ path: path.join(OUT, 'app-icon-512.png'), type: 'png' });
  console.log('✓ App Icon (512×512)');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const CONFIGS = [
  { name: 'feature-graphic-1024x500',          w: 1024, h: 500,  fn: featureGraphic },
  // Phone (1080×1920)
  { name: 'phone-01-home-1080x1920',            w: 1080, h: 1920, fn: homeScreen },
  { name: 'phone-02-astrologers-1080x1920',     w: 1080, h: 1920, fn: astrologersScreen },
  { name: 'phone-03-chat-1080x1920',            w: 1080, h: 1920, fn: chatScreen },
  { name: 'phone-04-kundli-1080x1920',          w: 1080, h: 1920, fn: kundliScreen },
  { name: 'phone-05-wallet-1080x1920',          w: 1080, h: 1920, fn: walletScreen },
  // 7-inch tablet portrait (1200×1920)
  { name: 'tablet7-01-home-1200x1920',          w: 1200, h: 1920, fn: homeScreen },
  { name: 'tablet7-02-astrologers-1200x1920',   w: 1200, h: 1920, fn: astrologersScreen },
  { name: 'tablet7-03-chat-1200x1920',          w: 1200, h: 1920, fn: chatScreen },
  // 10-inch tablet portrait (1600×2560)
  { name: 'tablet10-01-home-1600x2560',         w: 1600, h: 2560, fn: homeScreen },
  { name: 'tablet10-02-astrologers-1600x2560',  w: 1600, h: 2560, fn: astrologersScreen },
  { name: 'tablet10-03-chat-1600x2560',         w: 1600, h: 2560, fn: chatScreen },
  // Chromebook landscape (1280×800)
  { name: 'chromebook-01-home-1280x800',        w: 1280, h: 800,  fn: homeScreen },
  { name: 'chromebook-02-astrologers-1280x800', w: 1280, h: 800,  fn: astrologersScreen },
  { name: 'chromebook-03-chat-1280x800',        w: 1280, h: 800,  fn: chatScreen },
  // Android XR landscape (1920×1080)
  { name: 'androidxr-01-home-1920x1080',        w: 1920, h: 1080, fn: homeScreen },
  { name: 'androidxr-02-astrologers-1920x1080', w: 1920, h: 1080, fn: astrologersScreen },
  { name: 'androidxr-03-chat-1920x1080',        w: 1920, h: 1080, fn: chatScreen },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await makeAppIcon(page);

  for (const cfg of CONFIGS) {
    await page.setViewportSize({ width: cfg.w, height: cfg.h });
    await page.setContent(cfg.fn(cfg.w, cfg.h));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT, `${cfg.name}.png`), type: 'png' });
    console.log(`✓ ${cfg.name} (${cfg.w}×${cfg.h})`);
  }

  await browser.close();
  console.log(`\nAll assets saved to: ${OUT}`);
})();
